"""
models/utils.py
===============
Training utilities for the AeroSync Cadastral AI Engine.

Public API
----------
set_seed               : Reproducible seed across torch / numpy / random / cudnn.
get_group_norm         : Factory that returns consistent GroupNorm for any channel count.
TrainingConfig         : Dataclass holding all training hyperparameters (JSON-serialisable).
export_to_onnx         : Export an AeroSync model to ONNX format with verification.
hann_weighted_2d_window: 2D Cosine / Hann blending window for gigapixel GeoTIFF tiles.
seamless_tile_stitch   : Weighted overlap stitcher that eliminates tile boundary seams.
"""

from __future__ import annotations

import json
import logging
import random
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Optional, List, Tuple

import numpy as np
import torch
import torch.nn as nn

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# 1. Reproducibility seed utility
# ---------------------------------------------------------------------------

def set_seed(seed: int = 42) -> None:
    """Set all random seeds for fully reproducible training runs."""
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False
    logger.info("All random seeds set to %d (cudnn.deterministic=True).", seed)


# ---------------------------------------------------------------------------
# 2. GroupNorm factory
# ---------------------------------------------------------------------------

def get_group_norm(num_channels: int, num_groups: int = 8) -> nn.GroupNorm:
    """Create a GroupNorm layer compatible with small batch sizes."""
    g = min(num_groups, num_channels)
    while num_channels % g != 0 and g > 1:
        g -= 1
    return nn.GroupNorm(num_groups=g, num_channels=num_channels)


class ModelEMA:
    """Exponential Moving Average (EMA) of model weights for stable inference."""

    def __init__(self, model: nn.Module, decay: float = 0.999) -> None:
        self.decay = decay
        self.shadow = {name: param.clone().detach() for name, param in model.named_parameters()}

    @torch.no_grad()
    def update(self, model: nn.Module) -> None:
        """Update shadow weights with current model weights."""
        for name, param in model.named_parameters():
            if name in self.shadow:
                self.shadow[name].data.mul_(self.decay).add_(param.data, alpha=1.0 - self.decay)

    def apply_shadow(self, model: nn.Module) -> None:
        """Copy shadow weights to model for evaluation."""
        for name, param in model.named_parameters():
            if name in self.shadow:
                param.data.copy_(self.shadow[name].data)


# ---------------------------------------------------------------------------
# 3. Experiment configuration dataclass
# ---------------------------------------------------------------------------

@dataclass
class TrainingConfig:
    """All training hyperparameters in one reproducible, JSON-serialisable object."""

    img_size: int = 512
    num_classes: int = 5
    in_channels: int = 3
    batch_size: int = 8
    num_epochs: int = 40
    learning_rate: float = 3e-4
    weight_decay: float = 1e-4
    patience: int = 8
    encoder_freeze_epochs: int = 3
    alpha_ce: float = 1.0
    beta_focal: float = 1.0
    gamma_dice: float = 1.0
    delta_boundary: float = 0.5
    epsilon_cldice: float = 0.3
    seed: int = 42
    mixed_precision: bool = True
    device: str = "cuda" if torch.cuda.is_available() else "cpu"
    checkpoint_dir: str = "checkpoints"
    experiment_name: str = "aerosync_v2_svamitva"

    def to_json(self, path: Path | str) -> None:
        """Save this config to a JSON file."""
        p = Path(path)
        p.parent.mkdir(parents=True, exist_ok=True)
        data = asdict(self)
        if isinstance(data.get("img_size"), tuple):
            data["img_size"] = list(data["img_size"])
        with open(p, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        logger.info("Config saved to %s", p.resolve())

    save = to_json

    @classmethod
    def from_json(cls, path: Path | str) -> "TrainingConfig":
        """Load a config from a JSON file."""
        with open(path, "r", encoding="utf-8") as f:
            d = json.load(f)
        if isinstance(d.get("img_size"), list):
            d["img_size"] = tuple(d["img_size"])
        return cls(**d)

    @classmethod
    def load(cls, path: Path | str) -> "TrainingConfig":
        return cls.from_json(path)


# ---------------------------------------------------------------------------
# 4. Seamless Hann Window Tile Blending (Seam-free Gigapixel Stitching)
# ---------------------------------------------------------------------------

def hann_weighted_2d_window(height: int, width: int) -> np.ndarray:
    """Create a 2D Hann (Cosine) blending window matrix of shape (H, W).

    Peak weight 1.0 at center, smoothly tapering to 0.0 at borders to eliminate
    visible grid seams in overlapping gigapixel GeoTIFF tile reconstruction.
    """
    win_y = np.hanning(height)
    win_x = np.hanning(width)
    window_2d = np.outer(win_y, win_x)
    # Avoid zero divide at borders
    return np.clip(window_2d, 1e-4, 1.0).astype(np.float32)


def seamless_tile_stitch(
    tile_preds: List[np.ndarray],
    tile_coords: List[Tuple[int, int, int, int]],
    full_height: int,
    full_width: int,
    num_classes: int = 5,
) -> np.ndarray:
    """Stitch overlapping tile predictions into a seamless probability map.

    Parameters
    ----------
    tile_preds : List[np.ndarray]
        List of softmax probability arrays per tile (C, H_t, W_t).
    tile_coords : List[Tuple[int, int, int, int]]
        List of (ymin, xmin, ymax, xmax) pixel coordinates in the full raster.
    full_height : int
        Full stitched image height.
    full_width : int
        Full stitched image width.
    num_classes : int
        Number of output semantic classes.

    Returns
    -------
    np.ndarray
        Seamless stitched class mask of shape (full_height, full_width).
    """
    accum_prob = np.zeros((num_classes, full_height, full_width), dtype=np.float32)
    accum_weight = np.zeros((full_height, full_width), dtype=np.float32)

    for pred, (ymin, xmin, ymax, xmax) in zip(tile_preds, tile_coords):
        h = ymax - ymin
        w = xmax - xmin
        win_2d = hann_weighted_2d_window(h, w)

        accum_prob[:, ymin:ymax, xmin:xmax] += pred * win_2d[None, :, :]
        accum_weight[ymin:ymax, xmin:xmax] += win_2d

    # Normalize by accumulated window weights
    accum_weight = np.maximum(accum_weight, 1e-6)
    final_prob = accum_prob / accum_weight[None, :, :]
    return np.argmax(final_prob, axis=0).astype(np.uint8)


# ---------------------------------------------------------------------------
# 5. ONNX Model Export
# ---------------------------------------------------------------------------

def export_to_onnx(
    model: nn.Module,
    output_path: Path | str = "aerosync_model.onnx",
    input_size: tuple[int, ...] = (1, 3, 512, 512),
    opset_version: int = 17,
    verify: bool = True,
    device: Optional[torch.device] = None,
) -> Path:
    """Export an AeroSync PyTorch model to ONNX format with optional verification."""
    try:
        import onnx
    except ImportError as exc:
        raise ImportError(
            "onnx is required for export. Install with: pip install onnx"
        ) from exc

    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    if device is None:
        try:
            device = next(model.parameters()).device
        except StopIteration:
            device = torch.device("cpu")

    model.eval()
    dummy_input = torch.randn(*input_size, device=device)

    logger.info("Exporting model to ONNX: %s (opset %d) ...", output_path, opset_version)
    torch.onnx.export(
        model,
        dummy_input,
        str(output_path),
        opset_version=opset_version,
        input_names=["image"],
        output_names=["logits"],
        dynamic_axes={
            "image": {0: "batch_size", 2: "height", 3: "width"},
            "logits": {0: "batch_size", 2: "height", 3: "width"},
        },
        do_constant_folding=True,
    )

    onnx_model = onnx.load(str(output_path))
    onnx.checker.check_model(onnx_model)
    logger.info("ONNX graph check passed.")

    return output_path.resolve()
