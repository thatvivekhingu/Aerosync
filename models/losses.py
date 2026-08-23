"""
models/losses.py
================
Production-grade loss functions for AeroSync cadastral segmentation.

Public API
----------
FocalDiceCadastralLoss  : Original Focal + Dice loss (unchanged, backward compat).
CombinedCadastralLoss   : Alias for FocalDiceCadastralLoss (unchanged).
BoundaryLoss            : Differentiable boundary loss via signed distance transform.
clDiceLoss              : Centerline Dice for thin Road structures.
AeroSyncTotalLoss       : Combined 4-term loss (Focal + Dice + Boundary + clDice).
"""

from __future__ import annotations

import logging
from typing import Optional

import cv2
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

from .constants import ROAD_CLASS_ID

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# 1. Original Focal + Dice loss — UNCHANGED for backward compatibility
# ---------------------------------------------------------------------------

class FocalDiceCadastralLoss(nn.Module):
    """Combined Focal Loss + multi-class Dice Loss.

    This is the original AeroSync loss, preserved byte-for-byte so existing
    training notebooks and saved experiment configs continue to work.

    Parameters
    ----------
    num_classes : int
        Number of segmentation classes (default 5).
    gamma : float
        Focal loss focusing parameter (default 2.0).
    alpha : torch.Tensor or None
        Per-class weight tensor passed to ``F.cross_entropy``.
    dice_weight : float
        Weight of the Dice term in the total loss.
    focal_weight : float
        Weight of the Focal term in the total loss.
    """

    def __init__(
        self,
        num_classes: int = 5,
        gamma: float = 2.0,
        alpha: Optional[torch.Tensor] = None,
        dice_weight: float = 0.5,
        focal_weight: float = 0.5,
        focal_gamma: Optional[float] = None,
    ) -> None:
        super().__init__()
        if focal_gamma is not None:
            gamma = focal_gamma
        self.num_classes = num_classes
        self.gamma = gamma
        self.alpha = alpha
        self.dice_weight = dice_weight
        self.focal_weight = focal_weight

    def forward(
        self, pred_logits: torch.Tensor, targets: torch.Tensor
    ) -> torch.Tensor:
        """Compute Focal + Dice loss.

        Parameters
        ----------
        pred_logits : torch.Tensor
            Raw (un-softmaxed) model output, shape (B, C, H, W).
        targets : torch.Tensor
            Integer class labels, shape (B, H, W).

        Returns
        -------
        torch.Tensor
            Scalar loss value.
        """
        # Focal Loss
        ce_loss = F.cross_entropy(
            pred_logits, targets, reduction="none", weight=self.alpha
        )
        pt = torch.exp(-ce_loss)
        focal_loss = ((1 - pt) ** self.gamma * ce_loss).mean()

        # Multi-Class Dice Loss
        probs = F.softmax(pred_logits, dim=1)
        targets_oh = (
            F.one_hot(targets, num_classes=self.num_classes)
            .permute(0, 3, 1, 2)
            .float()
        )
        dims = (0, 2, 3)
        intersection = torch.sum(probs * targets_oh, dims)
        cardinality = torch.sum(probs + targets_oh, dims)
        dice_score = (2.0 * intersection + 1e-6) / (cardinality + 1e-6)
        dice_loss = 1.0 - torch.mean(dice_score)

        return (self.focal_weight * focal_loss) + (self.dice_weight * dice_loss)


# Backward-compatibility alias
CombinedCadastralLoss = FocalDiceCadastralLoss


# ---------------------------------------------------------------------------
# 2. Boundary Loss — Kervadec et al., 2019 (MICCAI)
# ---------------------------------------------------------------------------

def _signed_distance_map(target_class_mask: np.ndarray) -> np.ndarray:
    """Compute a signed distance transform for one binary class mask.

    The signed distance map (SDT) = dist(foreground) − dist(background).
    Positive inside the object, negative outside, zero on the boundary.
    The network is penalised for assigning low probability near boundaries.

    Parameters
    ----------
    target_class_mask : np.ndarray
        Binary uint8 mask (H, W), 255 = foreground.

    Returns
    -------
    np.ndarray
        Float32 SDT, shape (H, W).
    """
    fg = (target_class_mask > 0).astype(np.uint8)
    bg = 1 - fg

    # Guard against all-foreground or all-background tiles
    if fg.sum() == 0 or bg.sum() == 0:
        return np.zeros_like(target_class_mask, dtype=np.float32)

    dist_fg = cv2.distanceTransform(fg, cv2.DIST_L2, 5).astype(np.float32)
    dist_bg = cv2.distanceTransform(bg, cv2.DIST_L2, 5).astype(np.float32)
    sdt = dist_fg - dist_bg
    return sdt


class BoundaryLoss(nn.Module):
    """Differentiable boundary loss using signed distance transforms.

    Reference: Kervadec et al., "Boundary loss for highly unbalanced
    segmentation", MIDL 2019 / Medical Image Analysis 2021.

    For SVAMITVA cadastral maps, accurate parcel boundary delineation is a
    legal requirement — adjacent parcels share a single boundary edge.
    Training with this loss directly penalises spatially fuzzy boundaries
    instead of only pixel-wise class overlap, leading to sharper, more
    legally precise polygon outlines.

    Parameters
    ----------
    num_classes : int
        Number of segmentation classes (default 5).
    """

    def __init__(self, num_classes: int = 5) -> None:
        super().__init__()
        self.num_classes = num_classes

    def forward(
        self, pred_logits: torch.Tensor, targets: torch.Tensor
    ) -> torch.Tensor:
        """Compute boundary loss.

        Parameters
        ----------
        pred_logits : torch.Tensor
            Raw model output, shape (B, C, H, W).
        targets : torch.Tensor
            Integer class labels, shape (B, H, W).

        Returns
        -------
        torch.Tensor
            Scalar boundary loss.
        """
        probs = F.softmax(pred_logits, dim=1)  # (B, C, H, W)
        B, C, H, W = probs.shape

        boundary_loss = torch.tensor(0.0, device=pred_logits.device)

        for b in range(B):
            for c in range(C):
                # Binary mask for class c in sample b
                gt_mask = (targets[b] == c).cpu().numpy().astype(np.uint8) * 255
                sdt = _signed_distance_map(gt_mask)
                sdt_tensor = torch.from_numpy(sdt).to(pred_logits.device)

                # Loss = sum(prob_c * SDT); penalises high prob far from boundary
                boundary_loss = boundary_loss + (probs[b, c] * sdt_tensor).mean()

        return boundary_loss / (B * C)


# ---------------------------------------------------------------------------
# 3. Centerline Dice Loss (clDice) — Road class only
# ---------------------------------------------------------------------------

def _soft_skeletonize(x: torch.Tensor, iters: int = 5) -> torch.Tensor:
    """Differentiable morphological skeletonisation via repeated erosion.

    Uses max-pooling as a proxy for binary erosion, making the skeleton
    operation differentiable end-to-end. This avoids numpy/skimage inside the
    loss and keeps gradients flowing.

    Parameters
    ----------
    x : torch.Tensor
        Probability map, shape (B, 1, H, W), values in [0, 1].
    iters : int
        Number of erosion iterations (more = thinner skeleton).

    Returns
    -------
    torch.Tensor
        Approximate skeleton, shape (B, 1, H, W).
    """
    min_pool = lambda t: -F.max_pool2d(-t, kernel_size=3, stride=1, padding=1)
    skeleton = x.clone()
    for _ in range(iters):
        eroded = min_pool(skeleton)
        skeleton = torch.max(skeleton - eroded, torch.zeros_like(skeleton))
    return skeleton


class clDiceLoss(nn.Module):
    """Centerline Dice loss for Road/corridor class preservation.

    Standard Dice rewards broad blob-shaped predictions; clDice specifically
    penalises broken or disconnected road centerlines by computing Dice on the
    morphological skeletons of the prediction and ground truth. Applied only
    to the Road class (class index 2 by default) to preserve thin, linear
    village road structures in SVAMITVA drone imagery.

    Parameters
    ----------
    road_class_id : int
        Class index for Road/Corridor (default 2).
    skeleton_iters : int
        Erosion iterations for soft skeletonisation (default 5).
    """

    def __init__(
        self,
        road_class_id: int = ROAD_CLASS_ID,
        skeleton_iters: int = 5,
    ) -> None:
        super().__init__()
        self.road_class_id = road_class_id
        self.skeleton_iters = skeleton_iters

    def forward(
        self, pred_logits: torch.Tensor, targets: torch.Tensor
    ) -> torch.Tensor:
        """Compute clDice loss for the road class.

        Parameters
        ----------
        pred_logits : torch.Tensor
            Raw model output, shape (B, C, H, W).
        targets : torch.Tensor
            Integer class labels, shape (B, H, W).

        Returns
        -------
        torch.Tensor
            Scalar clDice loss (0 if road class absent from targets).
        """
        probs = F.softmax(pred_logits, dim=1)
        road_prob = probs[:, self.road_class_id : self.road_class_id + 1]  # (B,1,H,W)
        road_gt = (targets == self.road_class_id).float().unsqueeze(1)     # (B,1,H,W)

        if road_gt.sum() == 0:
            return torch.tensor(0.0, device=pred_logits.device)

        skel_pred = _soft_skeletonize(road_prob, self.skeleton_iters)
        skel_gt = _soft_skeletonize(road_gt, self.skeleton_iters)

        # clDice = 2 * |skel_pred ∩ gt| / (|skel_pred| + |skel_gt|)
        # Combined with standard Dice for stability
        tprec = (torch.sum(skel_pred * road_gt) + 1e-6) / (torch.sum(skel_pred) + 1e-6)
        tsens = (torch.sum(road_prob * skel_gt) + 1e-6) / (torch.sum(skel_gt) + 1e-6)
        cl_dice = 1.0 - 2.0 * (tprec * tsens) / (tprec + tsens + 1e-6)
        return cl_dice


# ---------------------------------------------------------------------------
# 4. AeroSyncTotalLoss — 4-term combined loss (Part 2 deliverable)
# ---------------------------------------------------------------------------

class AeroSyncTotalLoss(nn.Module):
    """Production-grade combined loss that aligns training with evaluation metrics.

    Loss = w_focal * Focal + w_dice * Dice + w_boundary * BoundaryLoss
           + w_cldice * clDice(road_only)

    The evaluation notebook (notebook 4) measures IoU, Dice, Boundary
    Precision/Recall/F1, and Hausdorff Distance — but the original training
    loss (Focal + Dice) never directly optimised for boundary quality. This
    combined loss closes that gap:

    - BoundaryLoss pushes the network to place high probability mass near
      parcel edges, directly improving Boundary F1 and Hausdorff scores.
    - clDice preserves thin road centerline connectivity, which Dice alone
      cannot enforce (wide blobs score the same Dice as thin correct lines).

    Backward Compatibility
    ----------------------
    ``FocalDiceCadastralLoss`` and ``CombinedCadastralLoss`` are completely
    unchanged.  This is a new class, not a replacement.

    Parameters
    ----------
    num_classes : int
        Number of segmentation classes (default 5).
    gamma : float
        Focal loss gamma parameter (default 2.0).
    alpha : torch.Tensor or None
        Per-class weight tensor for Focal loss.
    w_focal : float
        Weight for Focal loss term (default 0.35).
    w_dice : float
        Weight for Dice loss term (default 0.35).
    w_boundary : float
        Weight for Boundary loss term (default 0.20).
    w_cldice : float
        Weight for clDice loss term (default 0.10).
    road_class_id : int
        Class index for Road/Corridor used by clDice (default 2).
    """

    def __init__(
        self,
        num_classes: int = 5,
        gamma: float = 2.0,
        alpha: Optional[torch.Tensor] = None,
        w_focal: float = 0.35,
        w_dice: float = 0.35,
        w_boundary: float = 0.20,
        w_cldice: float = 0.10,
        road_class_id: int = ROAD_CLASS_ID,
        focal_gamma: Optional[float] = None,
    ) -> None:
        super().__init__()
        if focal_gamma is not None:
            gamma = focal_gamma
        self.num_classes = num_classes
        self.gamma = gamma
        self.alpha = alpha
        self.w_focal = w_focal
        self.w_dice = w_dice
        self.w_boundary = w_boundary
        self.w_cldice = w_cldice

        self._focal_dice = FocalDiceCadastralLoss(
            num_classes=num_classes,
            gamma=gamma,
            alpha=alpha,
            focal_weight=w_focal / (w_focal + w_dice) if (w_focal + w_dice) > 0 else 0.5,
            dice_weight=w_dice / (w_focal + w_dice) if (w_focal + w_dice) > 0 else 0.5,
        )
        self._boundary = BoundaryLoss(num_classes=num_classes)
        self._cldice = clDiceLoss(road_class_id=road_class_id)

    def forward(
        self,
        pred_logits: torch.Tensor,
        targets: torch.Tensor,
        aux_logits: Optional[list[torch.Tensor]] = None,
        aux_weight: float = 0.35,
    ) -> dict[str, torch.Tensor]:
        """Compute the 4-term total loss, optionally with deep supervision.

        Parameters
        ----------
        pred_logits : torch.Tensor
            Main decoder output logits, shape (B, C, H, W).
        targets : torch.Tensor
            Integer class labels, shape (B, H, W).
        aux_logits : list[torch.Tensor] or None
            Optional list of auxiliary decoder logits (from deep supervision
            heads on up3/up2). Each is upsample-matched to targets spatial size
            before computing auxiliary loss.
        aux_weight : float
            Multiplier for auxiliary loss terms (default 0.35).

        Returns
        -------
        dict[str, torch.Tensor]
            Dictionary with keys: ``'total'``, ``'focal'``, ``'dice'``,
            ``'boundary'``, ``'cldice'``, and optionally ``'aux'``.
            Use ``loss_dict['total'].backward()`` in your training loop.
        """
        # --- Main loss terms ---
        focal_dice_combined = self._focal_dice(pred_logits, targets)
        # Split back out for logging (approximate, since FocalDice combines them)
        ce = F.cross_entropy(pred_logits, targets, reduction="none", weight=self.alpha)
        pt = torch.exp(-ce)
        focal = ((1 - pt) ** self.gamma * ce).mean()

        probs = F.softmax(pred_logits, dim=1)
        targets_oh = (
            F.one_hot(targets, num_classes=self.num_classes)
            .permute(0, 3, 1, 2)
            .float()
        )
        dims = (0, 2, 3)
        intersection = torch.sum(probs * targets_oh, dims)
        cardinality = torch.sum(probs + targets_oh, dims)
        dice = 1.0 - torch.mean((2.0 * intersection + 1e-6) / (cardinality + 1e-6))

        boundary = self._boundary(pred_logits, targets)
        cldice = self._cldice(pred_logits, targets)

        total = (
            self.w_focal * focal
            + self.w_dice * dice
            + self.w_boundary * boundary
            + self.w_cldice * cldice
        )

        loss_dict = {
            "total": total,
            "focal": focal.detach(),
            "dice": dice.detach(),
            "boundary": boundary.detach(),
            "cldice": cldice.detach(),
        }

        # --- Deep supervision auxiliary loss ---
        if aux_logits:
            aux_total = torch.tensor(0.0, device=pred_logits.device)
            for aux_out in aux_logits:
                # Upsample aux to match targets spatial size if needed
                if aux_out.shape[2:] != targets.shape[1:]:
                    aux_out = F.interpolate(
                        aux_out,
                        size=targets.shape[1:],
                        mode="bilinear",
                        align_corners=True,
                    )
                aux_total = aux_total + self._focal_dice(aux_out, targets)
            aux_loss = aux_weight * (aux_total / len(aux_logits))
            total = total + aux_loss
            loss_dict["aux"] = aux_loss.detach()
            loss_dict["total"] = total  # update total with aux

        return loss_dict
