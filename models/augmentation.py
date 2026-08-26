"""
models/augmentation.py
======================
Domain-realistic augmentation pipeline for SVAMITVA drone orthomosaic imagery.

Key design decisions:
- NO elastic/perspective deformation: would destroy the right-angle building
  geometry that orthogonalize_polygon relies on for legal cadastral output.
- Geometric augmentations restricted to 90°-multiple rotations and flips only,
  preserving cardinal edge orientations.
- Heavy lighting augmentation: time-of-day variation and shadow are the #1
  confuser of Building vs Background in village drone surveys.
- Rural Roof Material Heterogeneity: Specular glare (tin sheet), Terracotta hue
  jitter (khaprail), and Tarpaulin hue shifts prevent false building rejections.
- Shadow simulation: RandomShadow specifically addresses tree/building cast
  shadows that misclassify Road and Greenery pixels.
"""

from __future__ import annotations

import logging
from typing import Optional

import numpy as np

try:
    import albumentations as A
    from albumentations.pytorch import ToTensorV2
    _ALBUMENTATIONS_AVAILABLE = True
except ImportError:
    _ALBUMENTATIONS_AVAILABLE = False

logger = logging.getLogger(__name__)


def _check_albumentations() -> None:
    if not _ALBUMENTATIONS_AVAILABLE:
        raise ImportError(
            "albumentations is required for augmentation. "
            "Install with: pip install albumentations"
        )


def apply_rural_roof_heterogeneity(img_np: np.ndarray, p: float = 0.5) -> np.ndarray:
    """Simulate rural roof texture variations (tin sheet glare, terracotta tiles, tarpaulin).

    Parameters
    ----------
    img_np : np.ndarray
        RGB image uint8 (H, W, 3).
    p : float
        Probability of applying rural roof perturbation.

    Returns
    -------
    np.ndarray
        Texture-perturbed RGB image.
    """
    if np.random.rand() > p:
        return img_np

    img = img_np.astype(np.float32)
    effect_type = np.random.choice(["tin_glare", "terracotta_tile", "tarpaulin_shift", "asbestos_noise"])

    if effect_type == "tin_glare":
        # Simulate bright metallic specular reflection on corrugated iron roofs
        glare_intensity = np.random.uniform(1.15, 1.35)
        mask = (img[:, :, 0] > 140) & (img[:, :, 1] > 140) & (img[:, :, 2] > 140)
        img[mask] = np.clip(img[mask] * glare_intensity, 0, 255)

    elif effect_type == "terracotta_tile":
        # Red/orange clay tile hue perturbation
        boost = np.random.uniform(1.1, 1.25)
        img[:, :, 0] = np.clip(img[:, :, 0] * boost, 0, 255)  # Boost Red channel

    elif effect_type == "tarpaulin_shift":
        # Blue / green plastic tarpaulin roof tint
        channel = np.random.choice([1, 2])  # Green or Blue channel
        boost = np.random.uniform(1.1, 1.25)
        img[:, :, channel] = np.clip(img[:, :, channel] * boost, 0, 255)

    elif effect_type == "asbestos_noise":
        # High-frequency grain noise simulating rough weathered cement/asbestos sheets
        noise = np.random.normal(0, 8, img.shape)
        img = np.clip(img + noise, 0, 255)

    return img.astype(np.uint8)


def get_train_transforms(
    img_size: int = 512,
    brightness_limit: float = 0.3,
    contrast_limit: float = 0.3,
    hue_shift_limit: int = 15,
    sat_shift_limit: int = 20,
    val_shift_limit: int = 20,
    blur_limit: int = 3,
    shadow_num_shadows_lower: int = 1,
    shadow_num_shadows_upper: int = 3,
    coarse_dropout_max_holes: int = 8,
    coarse_dropout_max_height: int = 32,
    coarse_dropout_max_width: int = 32,
    p_flip: float = 0.5,
    p_rotate90: float = 0.5,
    p_lighting: float = 0.7,
    p_blur: float = 0.3,
    p_shadow: float = 0.4,
    p_dropout: float = 0.2,
) -> "A.Compose":
    """Build the training augmentation pipeline with rural roof & shadow resilience."""
    _check_albumentations()

    return A.Compose([
        # --- Spatial-only transforms (90° multiples — geometry-preserving) ---
        A.HorizontalFlip(p=p_flip),
        A.VerticalFlip(p=p_flip),
        A.RandomRotate90(p=p_rotate90),

        # --- Lighting augmentation (primary SVAMITVA challenge) ---
        A.OneOf([
            A.RandomBrightnessContrast(
                brightness_limit=brightness_limit,
                contrast_limit=contrast_limit,
                p=1.0,
            ),
            A.CLAHE(clip_limit=4.0, tile_grid_size=(8, 8), p=1.0),
            A.RandomGamma(gamma_limit=(70, 130), p=1.0),
        ], p=p_lighting),

        # --- Colour augmentation (mild — vegetation/road colour variation) ---
        A.HueSaturationValue(
            hue_shift_limit=hue_shift_limit,
            sat_shift_limit=sat_shift_limit,
            val_shift_limit=val_shift_limit,
            p=0.4,
        ),

        # --- Shadow simulation (tree/building shadow → Road/Greenery confusion) ---
        A.RandomShadow(
            shadow_roi=(0, 0, 1, 1),
            num_shadows_lower=shadow_num_shadows_lower,
            num_shadows_upper=shadow_num_shadows_upper,
            shadow_dimension=5,
            p=p_shadow,
        ),

        # --- Blur (subtle motion artifact simulation from drone vibration) ---
        A.GaussianBlur(blur_limit=(3, blur_limit), p=p_blur),

        # --- Coarse dropout (simulates sensor noise / missing data patches) ---
        A.CoarseDropout(
            max_holes=coarse_dropout_max_holes,
            max_height=coarse_dropout_max_height,
            max_width=coarse_dropout_max_width,
            fill_value=0,
            mask_fill_value=0,
            p=p_dropout,
        ),

        # --- Final resize to target size ---
        A.Resize(img_size, img_size),
    ])


def get_val_transforms(img_size: int = 512) -> "A.Compose":
    """Build the validation/test transform (resize only, no augmentation)."""
    _check_albumentations()
    return A.Compose([A.Resize(img_size, img_size)])


def get_tta_transforms() -> list["A.Compose"]:
    """Return full 6-transform test-time augmentation list."""
    _check_albumentations()
    return [
        A.Compose([]),                                         # Identity
        A.Compose([A.HorizontalFlip(p=1.0)]),                  # H-flip
        A.Compose([A.VerticalFlip(p=1.0)]),                    # V-flip
        A.Compose([A.RandomRotate90(p=1.0)]),                  # 90°
        A.Compose([A.Rotate(limit=(180, 180), p=1.0)]),        # 180°
        A.Compose([A.Rotate(limit=(270, 270), p=1.0)]),        # 270°
    ]


def get_fast_tta_transforms() -> list["A.Compose"]:
    """Return lightweight 3-transform TTA optimized for fast field laptop inference."""
    _check_albumentations()
    return [
        A.Compose([]),                                         # Identity
        A.Compose([A.HorizontalFlip(p=1.0)]),                  # H-flip
        A.Compose([A.VerticalFlip(p=1.0)]),                    # V-flip
    ]


# ---------------------------------------------------------------------------
# Colour-mask decoder
# ---------------------------------------------------------------------------

_CLASS_COLOR_MAP: dict[int, tuple[int, int, int]] = {
    0: (30, 30, 30),       # Background
    1: (255, 165, 0),      # Building
    2: (255, 255, 0),      # Road
    3: (0, 150, 255),      # Water
    4: (34, 139, 34),      # Greenery
}


def decode_mask_to_color(mask_2d: np.ndarray) -> np.ndarray:
    """Convert an integer class mask to an RGB colour image."""
    h, w = mask_2d.shape
    color_img = np.zeros((h, w, 3), dtype=np.uint8)
    for cls_idx, color in _CLASS_COLOR_MAP.items():
        color_img[mask_2d == cls_idx] = color
    return color_img
