"""
models/utils.py
===============
Training utilities for the AeroSync Cadastral AI Engine.

Public API
----------
set_seed            : Reproducible seed across torch / numpy / random / cudnn.
get_group_norm      : Factory that returns consistent GroupNorm for any channel count.
TrainingConfig      : Dataclass holding all training hyperparameters (JSON-serialisable).
export_to_onnx      : Export an AeroSync model to ONNX format with verification.
"""

from __future__ import annotations

import json
import logging
import random
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Optional

import numpy as np
import torch
import torch.nn as nn

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# 1. Reproducibility seed utility
# ---------------------------------------------------------------------------

def set_seed(seed: int = 42) -> None:
    """Set all random seeds for fully reproducible training runs.

    Covers ``torch``, ``torch.cuda``, ``numpy``, Python ``random``, and
    ``torch.backends.cudnn`` deterministic mode. Call this at the very top of
    your training notebook before any model or data initialisation.

    Parameters
    ----------
    seed : int
        Integer seed value (default 42).
    """
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False
    logger.info("All random seeds set to %d (cudnn.deterministic=True).", seed)


# ---------------------------------------------------------------------------
# 2. GroupNorm factory (Bug 3 fix helper)
# ---------------------------------------------------------------------------

def get_group_norm(num_channels: int, num_groups: int = 8) -> nn.GroupNorm:
    """Create a GroupNorm layer compatible with small batch sizes.

    BatchNorm2d is unstable at batch_size=1 (common during single-tile
    inference on large GeoTIFFs). GroupNorm is independent of batch size and
    is now the standard normalisation in geospatial / medical image models.

    Parameters
    ----------
    num_channels : int
        Number of channels to normalise.
    num_groups : int
        Number of groups. Automatically reduced to ``num_channels`` if
        ``num_channels < num_groups`` (ensures groups divides channels).

    Returns
    -------
    nn.GroupNorm
        Configured GroupNorm layer.
    """
    # Ensure num_groups divides num_channels
    g = min(num_groups, num_channels)
    while num_channels % g != 0 and g > 1:
        g -= 1
    return nn.GroupNorm(num_groups=g, num_channels=num_channels)


# ---------------------------------------------------------------------------
# 3. Experiment configuration dataclass
# ---------------------------------------------------------------------------

@dataclass
class TrainingConfig:
    """All training hyperparameters in one reproducible, JSON-serialisable object.

    Replace scattered hardcoded values in notebook cells with a single config
    instance. Pass it to your training loop and save it alongside each
    checkpoint so experiments are fully reproducible and comparable.

    Example
    -------
    >>> cfg = TrainingConfig(learning_rate=3e-4, num_epochs=50, seed=7)
    >>> cfg.save("run_001_config.json")
    >>> cfg2 = TrainingConfig.load("run_001_config.json")
    """

    # --- Data ---
    img_size: tuple[int, int] = (512, 512)
    num_classes: int = 5
    batch_size: int = 4
    num_workers: int = 2
    train_val_split: float = 0.85

    # --- Model ---
    in_channels: int = 3
    base_filters: int = 32
    deep_supervision: bool = True
    use_group_norm: bool = True
    # Phase 2: pretrained backbone  ('scratch' | 'resnet34' | 'convnext_tiny')
    backbone: str = "scratch"
    # Epochs to keep backbone frozen during fine-tuning warmup (0 = no freeze)
    freeze_backbone_epochs: int = 5
    pretrained: bool = True

    # --- Loss ---
    loss_type: str = "total"          # "focal_dice" | "total"
    w_focal: float = 0.35
    w_dice: float = 0.35
    w_boundary: float = 0.20
    w_cldice: float = 0.10
    focal_gamma: float = 2.0
    aux_weight: float = 0.35

    # --- Optimiser ---
    learning_rate: float = 3e-4
    weight_decay: float = 1e-4
    scheduler: str = "cosine"         # "cosine" | "step" | "none"
    warmup_epochs: int = 5

    # --- Training ---
    num_epochs: int = 100
    seed: int = 42
    mixed_precision: bool = True
    ema_decay: float = 0.9999         # 0.0 = disabled
    gradient_clip_norm: float = 1.0

    # --- Inference ---
    mc_dropout_passes: int = 10
    tta_flips: bool = True
    tta_rotations: bool = True

    # --- Geometry postprocessing ---
    min_polygon_area_sqm: float = 30.0
    pixel_scale_m: float = 0.035544
    orthogonalize_buildings: bool = True

    # --- Paths (strings for JSON compatibility) ---
    dataset_root: str = ""
    checkpoint_dir: str = "checkpoints"
    log_dir: str = "logs"

    # --- Metadata ---
    experiment_name: str = "aerosync_v1"
    notes: str = ""
    extra: dict = field(default_factory=dict)

    def save(self, path: str | Path) -> None:
        """Serialise this config to a JSON file.

        Parameters
        ----------
        path : str or Path
            Output file path.
        """
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(asdict(self), f, indent=2)
        logger.info("TrainingConfig saved to %s", path)

    @classmethod
    def load(cls, path: str | Path) -> "TrainingConfig":
        """Load a config from a previously saved JSON file.

        Parameters
        ----------
        path : str or Path
            JSON file written by :meth:`save`.

        Returns
        -------
        TrainingConfig
            Reconstructed config object.
        """
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        # Convert img_size list back to tuple
        if "img_size" in data and isinstance(data["img_size"], list):
            data["img_size"] = tuple(data["img_size"])
        return cls(**data)


# ---------------------------------------------------------------------------
# 4. EMA (Exponential Moving Average) weight tracker
# ---------------------------------------------------------------------------

class ModelEMA:
    """Exponential moving average of model weights for stable final checkpoints.

    EMA is standard in Google Brain / Microsoft Research training recipes
    (used in EfficientDet, ViT, nnU-Net). The EMA model typically generalises
    better than the last-epoch checkpoint, especially with cosine annealing
    schedules that end at a local minimum rather than the global one.

    Parameters
    ----------
    model : nn.Module
        The model whose weights are tracked.
    decay : float
        EMA decay rate (default 0.9999). Higher = more smoothing.
    """

    def __init__(self, model: nn.Module, decay: float = 0.9999) -> None:
        self.decay = decay
        # Shadow copy — not on any device yet; will mirror model's device
        self.shadow: dict[str, torch.Tensor] = {
            name: param.data.clone().detach()
            for name, param in model.named_parameters()
        }

    @torch.no_grad()
    def update(self, model: nn.Module) -> None:
        """Update EMA shadow weights after each optimiser step.

        Parameters
        ----------
        model : nn.Module
            The model after the latest gradient update.
        """
        for name, param in model.named_parameters():
            if name in self.shadow:
                self.shadow[name].mul_(self.decay).add_(
                    param.data, alpha=1.0 - self.decay
                )

    def apply_to(self, model: nn.Module) -> None:
        """Copy EMA weights into ``model`` (for evaluation / saving).

        Parameters
        ----------
        model : nn.Module
            Target model to overwrite with EMA weights.
        """
        for name, param in model.named_parameters():
            if name in self.shadow:
                param.data.copy_(self.shadow[name])


# ---------------------------------------------------------------------------
# 5. ONNX export + verification
# ---------------------------------------------------------------------------

def export_to_onnx(
    model: nn.Module,
    output_path: str | Path,
    input_size: tuple[int, int, int, int] = (1, 3, 512, 512),
    opset_version: int = 17,
    verify: bool = True,
    device: Optional[torch.device] = None,
) -> Path:
    """Export an AeroSync model to ONNX format.

    ONNX export enables deployment outside the PyTorch training environment —
    e.g. to ONNX Runtime on a lightweight field laptop, or to TensorRT on
    Nvidia Jetson for edge inference during SVAMITVA drone survey flights.

    Parameters
    ----------
    model : nn.Module
        Trained AeroSync model (should be in eval mode).
    output_path : str or Path
        Destination ``.onnx`` file path.
    input_size : tuple[int, int, int, int]
        (B, C, H, W) shape of the dummy input used for tracing.
    opset_version : int
        ONNX opset version (default 17, compatible with ORT ≥ 1.15).
    verify : bool
        If True, run a comparison between PyTorch and ONNX Runtime outputs
        and log the max absolute difference. Requires ``onnxruntime``.
    device : torch.device or None
        Device for the dummy input (default: model's first parameter device).

    Returns
    -------
    Path
        Absolute path to the written ``.onnx`` file.
    """
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

    # Validate the exported model graph
    onnx_model = onnx.load(str(output_path))
    onnx.checker.check_model(onnx_model)
    logger.info("ONNX graph check passed.")

    if verify:
        try:
            import onnxruntime as ort

            session = ort.InferenceSession(str(output_path))
            dummy_np = dummy_input.cpu().numpy()
            ort_out = session.run(None, {"image": dummy_np})[0]

            with torch.no_grad():
                pt_out = model(dummy_input).cpu().numpy()

            max_diff = float(np.abs(pt_out - ort_out).max())
            logger.info(
                "ONNX verification: max |PyTorch - ORT| = %.6f (expect < 1e-4).",
                max_diff,
            )
            if max_diff > 1e-3:
                logger.warning(
                    "ONNX output differs from PyTorch by %.6f — check for "
                    "non-deterministic ops.",
                    max_diff,
                )
        except ImportError:
            logger.warning(
                "onnxruntime not installed; skipping numerical verification. "
                "Install with: pip install onnxruntime"
            )

    logger.info("ONNX export complete: %s", output_path.resolve())
    return output_path.resolve()
