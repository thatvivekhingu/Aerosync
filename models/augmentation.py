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
- Shadow simulation: RandomShadow specifically addresses tree/building cast
  shadows that misclassify Road and Greenery pixels.

Usage
-----
>>> from models.augmentation import get_train_transforms, get_val_transforms
>>> transform = get_train_transforms(img_size=512)
>>> result = transform(image=img_np, mask=mask_np)
>>> img_aug, mask_aug = result['image'], result['mask']
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
    """Build the training augmentation pipeline.

    Parameters
    ----------
    img_size : int
        Target image size (square crop/resize, default 512).
    brightness_limit : float
        ±brightness change range (default 0.3).
    contrast_limit : float
        ±contrast change range (default 0.3).
    hue_shift_limit : int
        Hue shift in degrees (default ±15 — mild, avoids vegetation→building confusion).
    sat_shift_limit : int
        Saturation shift (default ±20).
    val_shift_limit : int
        HSV value shift (default ±20).
    blur_limit : int
        Max blur kernel size (default 3 — subtle, simulates mild motion artifact).
    shadow_num_shadows_lower : int
        Min shadows per image in RandomShadow (default 1).
    shadow_num_shadows_upper : int
        Max shadows per image in RandomShadow (default 3).
    coarse_dropout_max_holes : int
        Max dropout rectangles (default 8).
    coarse_dropout_max_height : int
        Max hole height in pixels (default 32).
    coarse_dropout_max_width : int
        Max hole width in pixels (default 32).
    p_flip : float
        Probability of horizontal/vertical flip (default 0.5).
    p_rotate90 : float
        Probability of 90°-multiple rotation (default 0.5).
    p_lighting : float
        Probability of brightness/contrast augmentation (default 0.7).
    p_blur : float
        Probability of Gaussian blur (default 0.3).
    p_shadow : float
        Probability of shadow simulation (default 0.4).
    p_dropout : float
        Probability of coarse dropout (default 0.2).

    Returns
    -------
    A.Compose
        Albumentations composed transform applied to both image and mask.
    """
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

        # --- Colour augmentation (mild — vegetaion/road colour variation) ---
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
    """Build the validation/test transform (resize only, no augmentation).

    Parameters
    ----------
    img_size : int
        Target image size (default 512).

    Returns
    -------
    A.Compose
        Albumentations resize-only transform.
    """
    _check_albumentations()
    return A.Compose([A.Resize(img_size, img_size)])


def get_tta_transforms() -> list["A.Compose"]:
    """Return a list of test-time augmentation transforms for TTA inference.

    Each transform in the list is applied independently to the input image.
    Predictions are averaged back in the original orientation.

    Returns
    -------
    list[A.Compose]
        List of [identity, hflip, vflip, rot90, rot180, rot270] transforms.
    """
    _check_albumentations()
    return [
        A.Compose([]),                                         # Identity
        A.Compose([A.HorizontalFlip(p=1.0)]),                  # H-flip
        A.Compose([A.VerticalFlip(p=1.0)]),                    # V-flip
        A.Compose([A.RandomRotate90(p=1.0)]),                  # 90°
        A.Compose([A.Rotate(limit=(180, 180), p=1.0)]),        # 180°
        A.Compose([A.Rotate(limit=(270, 270), p=1.0)]),        # 270°
    ]


# ---------------------------------------------------------------------------
# Colour-mask decoder (used by all notebooks for visualisation)
# ---------------------------------------------------------------------------

# Integer class index → RGB colour (for visualisation overlays)
_CLASS_COLOR_MAP: dict[int, tuple[int, int, int]] = {
    0: (30, 30, 30),       # Background
    1: (255, 165, 0),      # Building
    2: (255, 255, 0),      # Road
    3: (0, 150, 255),      # Water
    4: (34, 139, 34),      # Greenery
}


def decode_mask_to_color(mask_2d: np.ndarray) -> np.ndarray:
    """Convert an integer class mask to an RGB colour image.

    Parameters
    ----------
    mask_2d : np.ndarray
        Integer array of shape (H, W) with class indices 0–4.

    Returns
    -------
    np.ndarray
        RGB uint8 array of shape (H, W, 3).
    """
    h, w = mask_2d.shape
    color_img = np.zeros((h, w, 3), dtype=np.uint8)
    for cls_idx, color in _CLASS_COLOR_MAP.items():
        color_img[mask_2d == cls_idx] = color
    return color_img
