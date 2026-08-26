"""
models/roof_material.py
=======================
Rural Rooftop Material Classification & Plinth Characterization Engine.
Inspired by SIH Problem Statement 1705 & Project Vaayu requirements for SVAMITVA.

Enables:
1. Classification of building rooftop materials:
   - RCC_CONCRETE (Reinforced Cement Concrete - Flat / Pakka)
   - TILED_TERRACOTTA (Khaprail / Mangalore Clay Tiles - Sloped Red)
   - TIN_CORRUGATED_SHEET (Galvanized Iron / Metal Roof - High Specular Reflectance)
   - THATCH_KACHHA (Grass, Straw, Mud, Bamboo - Organic / Kachha)
2. Confidence score and material probability distribution for cadastral property records.
"""

from __future__ import annotations

from enum import Enum
from typing import Dict, Tuple, Union
import numpy as np


class RoofMaterial(str, Enum):
    RCC_CONCRETE = "RCC_CONCRETE"
    TILED_TERRACOTTA = "TILED_TERRACOTTA"
    TIN_CORRUGATED_SHEET = "TIN_CORRUGATED_SHEET"
    THATCH_KACHHA = "THATCH_KACHHA"


class RooftopClassifier:
    """Classifies rooftop materials using spectral signature, variance, and texture cues."""

    def __init__(self) -> None:
        pass

    def classify_rooftop_patch(self, rgb_patch: np.ndarray) -> Dict[str, Union[str, float, Dict[str, float]]]:
        """Classify the primary material of a cropped building rooftop patch.

        Parameters
        ----------
        rgb_patch : np.ndarray
            RGB image patch (H, W, 3) with values in [0, 255].

        Returns
        -------
        Dict[str, Union[str, float, Dict[str, float]]]
            Predicted material, confidence, and probability distribution.
        """
        assert rgb_patch.ndim == 3 and rgb_patch.shape[2] == 3, "Patch must be RGB (H, W, 3)"

        r = rgb_patch[:, :, 0].astype(np.float32)
        g = rgb_patch[:, :, 1].astype(np.float32)
        b = rgb_patch[:, :, 2].astype(np.float32)

        mean_r, std_r = float(np.mean(r)), float(np.std(r))
        mean_g, std_g = float(np.mean(g)), float(np.std(g))
        mean_b, std_b = float(np.mean(b)), float(np.std(b))

        brightness = (mean_r + mean_g + mean_b) / 3.0
        saturation = max(1e-4, float(np.max([mean_r, mean_g, mean_b]) - np.min([mean_r, mean_g, mean_b])))

        # 1. Tin / Galvanized Metal: High brightness, high variance / glint, low color saturation (silver/white/metallic)
        if brightness > 180 and saturation < 35:
            pred = RoofMaterial.TIN_CORRUGATED_SHEET
            conf = min(0.98, 0.75 + (brightness - 180) / 150)
            probs = {
                RoofMaterial.TIN_CORRUGATED_SHEET.value: round(conf, 3),
                RoofMaterial.RCC_CONCRETE.value: round(1.0 - conf, 3),
                RoofMaterial.TILED_TERRACOTTA.value: 0.01,
                RoofMaterial.THATCH_KACHHA.value: 0.01,
            }
        # 2. Tiled / Terracotta: Strong Red/Orange dominant hue (R >> G and R >> B)
        elif mean_r > 1.25 * mean_g and mean_r > 1.35 * mean_b:
            pred = RoofMaterial.TILED_TERRACOTTA
            conf = min(0.97, 0.70 + (mean_r / (mean_g + 1e-4) - 1.25) * 0.5)
            probs = {
                RoofMaterial.TILED_TERRACOTTA.value: round(conf, 3),
                RoofMaterial.THATCH_KACHHA.value: round((1.0 - conf) * 0.7, 3),
                RoofMaterial.RCC_CONCRETE.value: round((1.0 - conf) * 0.3, 3),
                RoofMaterial.TIN_CORRUGATED_SHEET.value: 0.01,
            }
        # 3. Thatch / Kachha / Mud: Brownish-yellow hue, high texture variance
        elif mean_r > 1.05 * mean_g and mean_g > mean_b and brightness < 140 and (std_r + std_g) > 45:
            pred = RoofMaterial.THATCH_KACHHA
            conf = 0.88
            probs = {
                RoofMaterial.THATCH_KACHHA.value: 0.88,
                RoofMaterial.TILED_TERRACOTTA.value: 0.08,
                RoofMaterial.RCC_CONCRETE.value: 0.03,
                RoofMaterial.TIN_CORRUGATED_SHEET.value: 0.01,
            }
        # 4. RCC Concrete (Default standard flat gray roof)
        else:
            pred = RoofMaterial.RCC_CONCRETE
            conf = 0.92
            probs = {
                RoofMaterial.RCC_CONCRETE.value: 0.92,
                RoofMaterial.TIN_CORRUGATED_SHEET.value: 0.04,
                RoofMaterial.TILED_TERRACOTTA.value: 0.03,
                RoofMaterial.THATCH_KACHHA.value: 0.01,
            }

        return {
            "roof_material": pred.value,
            "confidence": round(conf, 2),
            "probabilities": probs,
            "brightness_index": round(brightness, 1),
        }
