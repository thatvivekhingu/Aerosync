"""
models/uncertainty.py
=====================
Uncertainty quantification and test-time augmentation for AeroSync inference.

Public API
----------
MCDropoutInference  : Monte Carlo Dropout — N stochastic forward passes to
                      produce mean prediction + per-pixel uncertainty map.
TTAInference        : Test-Time Augmentation — averages predictions over
                      geometric transforms (flips, 90° rotations).
"""

from __future__ import annotations

import logging
from typing import Optional

import torch
import torch.nn as nn
import torch.nn.functional as F

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _enable_dropout(model: nn.Module) -> None:
    """Set all Dropout / Dropout2d layers to training mode (active at test time)."""
    for m in model.modules():
        if isinstance(m, (nn.Dropout, nn.Dropout2d)):
            m.train()


# ---------------------------------------------------------------------------
# 1. Monte Carlo Dropout Inference
# ---------------------------------------------------------------------------

class MCDropoutInference:
    """Monte Carlo Dropout inference for epistemic uncertainty estimation.

    Keeps dropout layers active during inference and runs ``n_passes``
    stochastic forward passes. Returns the mean prediction (used as the final
    segmentation) and a per-pixel standard deviation map (used as the
    ``uncertainty_score`` in GeoJSON output).

    MC-Dropout is particularly important for SVAMITVA legal deliverables: a
    high ``uncertainty_score`` on a parcel boundary is a direct signal to the
    field surveyor that the AI-predicted boundary needs manual verification,
    rather than silently trusting a hardcoded 0.96 confidence.

    Parameters
    ----------
    model : nn.Module
        The trained AeroSync segmentation model.
    n_passes : int
        Number of stochastic forward passes (default 10). Higher = better
        uncertainty estimate but proportionally more inference time.
    """

    def __init__(self, model: nn.Module, n_passes: int = 10) -> None:
        self.model = model
        self.n_passes = n_passes

    @torch.no_grad()
    def predict(
        self, x: torch.Tensor
    ) -> tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        """Run MC-Dropout inference.

        Parameters
        ----------
        x : torch.Tensor
            Input image batch, shape (B, C, H, W).

        Returns
        -------
        mean_probs : torch.Tensor
            Mean softmax probability map, shape (B, num_classes, H, W).
        std_map : torch.Tensor
            Per-pixel predictive std (summed over classes), shape (B, H, W).
            High values = high epistemic uncertainty.
        pred_mask : torch.Tensor
            Argmax of mean_probs, shape (B, H, W) — the final segmentation.
        """
        # Put model in eval to freeze BN stats, but keep dropout active
        self.model.eval()
        _enable_dropout(self.model)

        all_probs: list[torch.Tensor] = []
        for _ in range(self.n_passes):
            logits = self.model(x)
            probs = F.softmax(logits, dim=1)  # (B, C, H, W)
            all_probs.append(probs)

        stacked = torch.stack(all_probs, dim=0)       # (N, B, C, H, W)
        mean_probs = stacked.mean(dim=0)               # (B, C, H, W)
        std_map = stacked.std(dim=0).sum(dim=1)        # (B, H, W) — summed over classes

        pred_mask = mean_probs.argmax(dim=1)           # (B, H, W)
        return mean_probs, std_map, pred_mask


# ---------------------------------------------------------------------------
# 2. Test-Time Augmentation (TTA) Inference
# ---------------------------------------------------------------------------

class TTAInference:
    """Test-Time Augmentation inference for improved segmentation accuracy.

    Averages logits over a set of geometric transforms (horizontal flip,
    vertical flip, 90°/180°/270° rotations). This is nearly free extra
    accuracy for a georeferenced cadastral deliverable: the cost is a constant
    multiplier on inference time, but the averaged prediction is typically
    2–4% more accurate in boundary IoU than a single forward pass.

    Parameters
    ----------
    model : nn.Module
        The trained AeroSync segmentation model.
    use_flips : bool
        Include horizontal and vertical flips (default True).
    use_rotations : bool
        Include 90°, 180°, 270° rotations (default True).
    """

    def __init__(
        self,
        model: nn.Module,
        use_flips: bool = True,
        use_rotations: bool = True,
    ) -> None:
        self.model = model
        self.use_flips = use_flips
        self.use_rotations = use_rotations

    def _get_augmentations(self) -> list[tuple]:
        """Build list of (forward_fn, inverse_fn) transform pairs."""
        augs: list[tuple] = [
            (lambda t: t, lambda t: t),  # identity
        ]
        if self.use_flips:
            augs += [
                (lambda t: torch.flip(t, dims=[-1]), lambda t: torch.flip(t, dims=[-1])),  # H-flip
                (lambda t: torch.flip(t, dims=[-2]), lambda t: torch.flip(t, dims=[-2])),  # V-flip
            ]
        if self.use_rotations:
            augs += [
                (lambda t: torch.rot90(t, 1, [-2, -1]), lambda t: torch.rot90(t, -1, [-2, -1])),  # 90°
                (lambda t: torch.rot90(t, 2, [-2, -1]), lambda t: torch.rot90(t, -2, [-2, -1])),  # 180°
                (lambda t: torch.rot90(t, 3, [-2, -1]), lambda t: torch.rot90(t, -3, [-2, -1])),  # 270°
            ]
        return augs

    @torch.no_grad()
    def predict(
        self,
        x: torch.Tensor,
    ) -> tuple[torch.Tensor, torch.Tensor]:
        """Run TTA inference.

        Parameters
        ----------
        x : torch.Tensor
            Input image batch, shape (B, C, H, W).

        Returns
        -------
        mean_probs : torch.Tensor
            Averaged softmax probability map, shape (B, num_classes, H, W).
        pred_mask : torch.Tensor
            Argmax segmentation, shape (B, H, W).
        """
        self.model.eval()
        augs = self._get_augmentations()
        accumulated: Optional[torch.Tensor] = None

        for fwd, inv in augs:
            x_aug = fwd(x)
            logits = self.model(x_aug)
            probs = F.softmax(logits, dim=1)
            probs_inv = inv(probs)  # un-transform back to original orientation

            if accumulated is None:
                accumulated = probs_inv
            else:
                accumulated = accumulated + probs_inv

        mean_probs = accumulated / len(augs)  # type: ignore[operator]
        pred_mask = mean_probs.argmax(dim=1)
        return mean_probs, pred_mask


# ---------------------------------------------------------------------------
# 3. Combined MC-Dropout + TTA (production inference)
# ---------------------------------------------------------------------------

class ProductionInference:
    """Full production inference combining MC-Dropout uncertainty + TTA accuracy.

    For each TTA augmentation, runs ``n_mc_passes`` stochastic forward passes.
    The final mean and uncertainty are computed over all (n_tta × n_mc) passes.

    Parameters
    ----------
    model : nn.Module
        Trained AeroSync model.
    n_mc_passes : int
        Number of MC-Dropout passes per TTA augmentation (default 5).
    use_flips : bool
        Include horizontal/vertical flips in TTA (default True).
    use_rotations : bool
        Include 90°/180°/270° rotations in TTA (default True).
    """

    def __init__(
        self,
        model: nn.Module,
        n_mc_passes: int = 5,
        use_flips: bool = True,
        use_rotations: bool = True,
    ) -> None:
        self.model = model
        self.n_mc_passes = n_mc_passes
        self._tta = TTAInference(model, use_flips=use_flips, use_rotations=use_rotations)
        self._mc = MCDropoutInference(model, n_passes=n_mc_passes)

    @torch.no_grad()
    def predict(
        self, x: torch.Tensor
    ) -> tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        """Run full production inference.

        Parameters
        ----------
        x : torch.Tensor
            Input image batch, shape (B, C, H, W).

        Returns
        -------
        mean_probs : torch.Tensor
            Mean probability map (B, C, H, W).
        uncertainty : torch.Tensor
            Per-pixel uncertainty / std map (B, H, W).
        pred_mask : torch.Tensor
            Final argmax segmentation (B, H, W).
        """
        self.model.eval()
        _enable_dropout(self.model)

        augs = self._tta._get_augmentations()
        all_probs: list[torch.Tensor] = []

        for fwd, inv in augs:
            x_aug = fwd(x)
            for _ in range(self.n_mc_passes):
                logits = self.model(x_aug)
                probs = F.softmax(logits, dim=1)
                all_probs.append(inv(probs))

        stacked = torch.stack(all_probs, dim=0)   # (N_total, B, C, H, W)
        mean_probs = stacked.mean(dim=0)            # (B, C, H, W)
        std_map = stacked.std(dim=0).sum(dim=1)     # (B, H, W)
        pred_mask = mean_probs.argmax(dim=1)        # (B, H, W)

        return mean_probs, std_map, pred_mask
