"""
models/uncertainty.py
=====================
Uncertainty quantification and test-time augmentation for AeroSync inference.

Public API
----------
MCDropoutInference        : Monte Carlo Dropout — N stochastic forward passes to
                            produce mean prediction + per-pixel uncertainty map.
FastEvidentialUncertainty : Single-Pass Calibrated Entropy & Margin Uncertainty
                            (10x faster for field surveyor laptops).
ProductionInference       : Alias for FastEvidentialUncertainty.
TTAInference              : Test-Time Augmentation — averages predictions over
                            geometric transforms (flips, 90° rotations).
FastTTAInference          : Lightweight 3-transform TTA optimized for edge devices.
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
    """Monte Carlo Dropout inference for epistemic uncertainty estimation."""

    def __init__(self, model: nn.Module, n_passes: int = 10) -> None:
        self.model = model
        self.n_passes = n_passes

    @torch.no_grad()
    def predict(
        self, x: torch.Tensor
    ) -> tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        """Run MC-Dropout inference."""
        self.model.eval()
        _enable_dropout(self.model)

        all_probs: list[torch.Tensor] = []
        for _ in range(self.n_passes):
            logits = self.model(x)
            probs = F.softmax(logits, dim=1)
            all_probs.append(probs)

        stacked = torch.stack(all_probs, dim=0)       # (N, B, C, H, W)
        mean_probs = stacked.mean(dim=0)               # (B, C, H, W)
        std_map = stacked.std(dim=0).sum(dim=1)        # (B, H, W)
        pred_mask = mean_probs.argmax(dim=1)           # (B, H, W)

        self.model.eval()
        return mean_probs, std_map, pred_mask


# ---------------------------------------------------------------------------
# 2. Fast Single-Pass Evidential Uncertainty (Field Surveyor Laptop Mode)
# ---------------------------------------------------------------------------

class FastEvidentialUncertainty:
    """Single-Pass Calibrated Evidential Uncertainty estimator.

    Computes normalized Shannon Entropy and Margin Confidence from a single
    forward pass. Runs in 1x inference time (10x faster than 10-pass MC Dropout),
    providing immediate parcel boundary uncertainty scores on edge hardware.

    Parameters
    ----------
    model : nn.Module
        Trained AeroSync segmentation model.
    temperature : float
        Softmax temperature scaling factor for probability calibration (default 1.0).
    """

    def __init__(self, model: nn.Module, temperature: float = 1.0) -> None:
        self.model = model
        self.temperature = temperature

    @torch.no_grad()
    def predict(
        self, x: torch.Tensor
    ) -> tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        """Run single-pass evidential uncertainty inference.

        Parameters
        ----------
        x : torch.Tensor
            Input batch (B, C, H, W).

        Returns
        -------
        probs : torch.Tensor
            Calibrated softmax probability map (B, num_classes, H, W).
        uncertainty_map : torch.Tensor
            Normalized Shannon entropy [0, 1] per pixel (B, H, W).
        pred_mask : torch.Tensor
            Argmax prediction (B, H, W).
        """
        self.model.eval()
        logits = self.model(x) / self.temperature
        probs = F.softmax(logits, dim=1)  # (B, C, H, W)

        # 1. Normalized Shannon Entropy: H = -sum(p * log(p)) / log(num_classes)
        num_classes = probs.shape[1]
        eps = 1e-8
        entropy = -torch.sum(probs * torch.log(probs + eps), dim=1)  # (B, H, W)
        max_entropy = torch.log(torch.tensor(num_classes, dtype=torch.float32, device=probs.device))
        norm_entropy = torch.clamp(entropy / (max_entropy + eps), 0.0, 1.0)

        # 2. Margin confidence = 1.0 - (top1_prob - top2_prob)
        top2_vals, _ = torch.topk(probs, k=min(2, num_classes), dim=1)
        if num_classes >= 2:
            margin = top2_vals[:, 0] - top2_vals[:, 1]
            margin_uncertainty = 1.0 - margin
        else:
            margin_uncertainty = norm_entropy

        # Combined evidential uncertainty metric
        combined_uncertainty = 0.6 * norm_entropy + 0.4 * margin_uncertainty

        pred_mask = probs.argmax(dim=1)
        return probs, combined_uncertainty, pred_mask


class ProductionInference(FastEvidentialUncertainty):
    """Backward-compatible alias for FastEvidentialUncertainty."""
    pass


# ---------------------------------------------------------------------------
# 3. Test-Time Augmentation (TTA) Inference
# ---------------------------------------------------------------------------

class TTAInference:
    """Test-Time Augmentation (TTA) inference using cardinal transforms."""

    def __init__(
        self,
        model: nn.Module,
        use_flips: bool = True,
        use_rotations: bool = True,
    ) -> None:
        self.model = model
        self.use_flips = use_flips
        self.use_rotations = use_rotations

    @torch.no_grad()
    def predict(
        self, x: torch.Tensor, return_disagreement: bool = False
    ) -> tuple[torch.Tensor, torch.Tensor] | tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        """Run TTA inference."""
        self.model.eval()
        preds = []

        # 1. Identity
        preds.append(F.softmax(self.model(x), dim=1))

        # 2. Flips
        if self.use_flips:
            x_hflip = torch.flip(x, dims=[3])
            preds.append(torch.flip(F.softmax(self.model(x_hflip), dim=1), dims=[3]))
            x_vflip = torch.flip(x, dims=[2])
            preds.append(torch.flip(F.softmax(self.model(x_vflip), dim=1), dims=[2]))

        # 3. Rotations
        if self.use_rotations:
            x_rot90 = torch.rot90(x, k=1, dims=[2, 3])
            preds.append(torch.rot90(F.softmax(self.model(x_rot90), dim=1), k=-1, dims=[2, 3]))

        stacked = torch.stack(preds, dim=0)
        mean_probs = stacked.mean(dim=0)
        pred_mask = mean_probs.argmax(dim=1)

        if return_disagreement:
            tta_disagreement = stacked.std(dim=0).sum(dim=1) if len(preds) > 1 else torch.zeros_like(mean_probs[:, 0])
            return mean_probs, tta_disagreement, pred_mask

        return mean_probs, pred_mask


class FastTTAInference:
    """Lightweight 2-transform TTA (Identity + HFlip) for ultra-fast inference."""

    def __init__(self, model: nn.Module) -> None:
        self.model = model

    @torch.no_grad()
    def predict(
        self, x: torch.Tensor
    ) -> tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        self.model.eval()
        p_orig = F.softmax(self.model(x), dim=1)
        x_hflip = torch.flip(x, dims=[3])
        p_hflip = torch.flip(F.softmax(self.model(x_hflip), dim=1), dims=[3])

        mean_probs = (p_orig + p_hflip) * 0.5
        tta_disagreement = torch.abs(p_orig - p_hflip).sum(dim=1)
        pred_mask = mean_probs.argmax(dim=1)

        return mean_probs, tta_disagreement, pred_mask
