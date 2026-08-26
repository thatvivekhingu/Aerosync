"""
models/indices.py
=================
Multi-Spectral and Optical Remote Sensing Indices for Cadastral Feature Extraction.
Inspired by standard earth observation index formulas for high-resolution aerial surveys.

Provides:
- compute_vari            : Visible Atmospherically Resistant Index (Isolates green foliage).
- compute_gli             : Green Leaf Index (Vegetation vigor in RGB).
- compute_ndwi_rgb        : Water Index for surface ponds/streams.
- compute_shadow_plinth_index: Disentangles dark roof materials from ground shadow.
- generate_spectral_layer_stack: Multi-layer feature stack for segmentation models.
"""

from __future__ import annotations

import numpy as np


def compute_vari(rgb_img: np.ndarray) -> np.ndarray:
    """Compute Visible Atmospherically Resistant Index (VARI).

    Formula: (Green - Red) / (Green + Red - Blue + epsilon)
    Values range approximately in [-1, 1]. Strong positive values indicate vegetation canopy.
    """
    img = rgb_img.astype(np.float32)
    r = img[:, :, 0]
    g = img[:, :, 1]
    b = img[:, :, 2]

    num = g - r
    den = g + r - b
    den = np.where(np.abs(den) < 1e-4, 1e-4, den)
    vari = num / den
    return np.clip(vari, -1.0, 1.0)


def compute_gli(rgb_img: np.ndarray) -> np.ndarray:
    """Compute Green Leaf Index (GLI).

    Formula: (2*Green - Red - Blue) / (2*Green + Red + Blue + epsilon)
    """
    img = rgb_img.astype(np.float32)
    r = img[:, :, 0]
    g = img[:, :, 1]
    b = img[:, :, 2]

    num = 2.0 * g - r - b
    den = 2.0 * g + r + b
    den = np.where(den == 0, 1e-4, den)
    gli = num / den
    return np.clip(gli, -1.0, 1.0)


def compute_ndwi_rgb(rgb_img: np.ndarray) -> np.ndarray:
    """Compute Normalized Difference Water Index (RGB approximation).

    Formula: (Green - Blue) / (Green + Blue + epsilon)
    Helps isolate rural ponds, drainage nullahs, and village water bodies.
    """
    img = rgb_img.astype(np.float32)
    g = img[:, :, 1]
    b = img[:, :, 2]

    num = g - b
    den = g + b
    den = np.where(den == 0, 1e-4, den)
    ndwi = num / den
    return np.clip(ndwi, -1.0, 1.0)


def compute_shadow_plinth_index(rgb_img: np.ndarray) -> np.ndarray:
    """Compute Shadow-Plinth Differentiation Index.

    Separates cast shadow boundaries from dark roof materials (tin/tarpaulin).
    """
    img = rgb_img.astype(np.float32)
    # Brightness (V in HSV)
    brightness = np.mean(img, axis=2)
    # Blue-to-Red ratio (shadows in open sky have higher Rayleigh blue component)
    blue_ratio = (img[:, :, 2] + 1.0) / (img[:, :, 0] + 1.0)

    # High blue_ratio with low brightness indicates cast shadow rather than dark roof
    shadow_prob = (blue_ratio > 1.15) & (brightness < 60)
    return shadow_prob.astype(np.float32)


def generate_spectral_layer_stack(rgb_img: np.ndarray) -> np.ndarray:
    """Build a 6-channel augmented remote sensing tensor [R, G, B, VARI, GLI, NDWI]."""
    vari = ((compute_vari(rgb_img) + 1.0) * 127.5).astype(np.uint8)
    gli = ((compute_gli(rgb_img) + 1.0) * 127.5).astype(np.uint8)
    ndwi = ((compute_ndwi_rgb(rgb_img) + 1.0) * 127.5).astype(np.uint8)

    return np.dstack([rgb_img, vari, gli, ndwi])
