"""
models/change_detection.py
===========================
Bi-temporal Cadastral Change Detection & Encroachment Tracking Engine.
Inspired by SiamUnet-Diff, STANet, and SOTA remote sensing change detection pipelines.

Enables:
1. Comparing drone surveys from two time epochs (e.g. Flight 2024 vs Flight 2026).
2. Automated classification of cadastral mutations:
   - NEW_CONSTRUCTION (Unauthorized building additions)
   - DEMOLISHED_STRUCTURE (Structure removals / razing)
   - WATER_BODY_ENCROACHMENT (Pond / Lake bed shrinkage)
   - ROAD_NARROWING (Right-of-Way encroachment)
3. Quantitative change reports for Gram Sabha & Revenue Court dispute hearings.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple

import cv2
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

from .constants import CLASS_NAMES

logger = logging.getLogger(__name__)


class ChangeType(str, Enum):
    NO_CHANGE = "NO_CHANGE"
    NEW_CONSTRUCTION = "NEW_CONSTRUCTION"
    DEMOLISHED_STRUCTURE = "DEMOLISHED_STRUCTURE"
    WATER_BODY_ENCROACHMENT = "WATER_BODY_ENCROACHMENT"
    ROAD_NARROWING = "ROAD_NARROWING"
    VEGETATION_CLEARING = "VEGETATION_CLEARING"


@dataclass
class ChangeMetric:
    change_type: ChangeType
    pixel_count: int
    area_sqm: float
    confidence: float
    description: str


# ---------------------------------------------------------------------------
# 1. Siamese Difference Neural Network
# ---------------------------------------------------------------------------

class SiameseDifferenceUNet(nn.Module):
    """Siamese Difference CNN for bi-temporal remote sensing change detection.

    Processes dual temporal inputs T1 and T2 through a shared feature encoder,
    computes multi-scale absolute feature differences |F_T2 - F_T1|, and decodes
    the change probability map.
    """

    def __init__(self, in_channels: int = 3, num_classes: int = 2) -> None:
        super().__init__()
        # Shared Encoder
        self.conv1 = nn.Sequential(
            nn.Conv2d(in_channels, 32, 3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.Conv2d(32, 32, 3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
        )
        self.pool1 = nn.MaxPool2d(2)

        self.conv2 = nn.Sequential(
            nn.Conv2d(32, 64, 3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.Conv2d(64, 64, 3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
        )
        self.pool2 = nn.MaxPool2d(2)

        # Difference Decoder
        self.up1 = nn.ConvTranspose2d(64, 32, 2, stride=2)
        self.dec_conv1 = nn.Sequential(
            nn.Conv2d(32 + 64, 32, 3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
        )

        self.up2 = nn.ConvTranspose2d(32, 16, 2, stride=2)
        self.dec_conv2 = nn.Sequential(
            nn.Conv2d(16 + 32, 16, 3, padding=1),
            nn.BatchNorm2d(16),
            nn.ReLU(inplace=True),
        )

        self.out_head = nn.Conv2d(16, num_classes, 1)

    def forward_encoder(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        f1 = self.conv1(x)
        p1 = self.pool1(f1)
        f2 = self.conv2(p1)
        p2 = self.pool2(f2)
        return f1, f2, p2

    def forward(self, t1: torch.Tensor, t2: torch.Tensor) -> torch.Tensor:
        # Shared feature extraction
        f1_t1, f2_t1, p2_t1 = self.forward_encoder(t1)
        f1_t2, f2_t2, p2_t2 = self.forward_encoder(t2)

        # Multi-scale feature differences
        diff_bottleneck = torch.abs(p2_t2 - p2_t1)  # H/4, W/4
        diff2 = torch.abs(f2_t2 - f2_t1)            # H/2, W/2
        diff1 = torch.abs(f1_t2 - f1_t1)            # H, W

        # Decoding: H/4 -> H/2
        u1 = self.up1(diff_bottleneck)
        d1 = self.dec_conv1(torch.cat([u1, diff2], dim=1))

        # Decoding: H/2 -> H
        u2 = self.up2(d1)
        d2 = self.dec_conv2(torch.cat([u2, diff1], dim=1))

        logits = self.out_head(d2)
        return logits



# ---------------------------------------------------------------------------
# 2. Cadastral Mutation Analyzer & Change Auditor
# ---------------------------------------------------------------------------

class CadastralChangeDetector:
    """Analyzes semantic segmentation maps from Epoch T1 and Epoch T2 to detect

    specific land administration mutations according to SVAMITVA norms.
    """

    def __init__(self, pixel_scale: float = 0.035544) -> None:
        self.pixel_scale = pixel_scale
        self.pixel_area_sqm = pixel_scale * pixel_scale

    def detect_changes(
        self,
        mask_t1: np.ndarray,
        mask_t2: np.ndarray,
        min_change_area_sqm: float = 5.0,
    ) -> Dict[str, Any]:
        """Detect and classify spatial mutations between two temporal masks.

        Parameters
        ----------
        mask_t1 : np.ndarray
            Integer semantic mask from Epoch 1 (0=BG, 1=Building, 2=Road, 3=Water, 4=Greenery).
        mask_t2 : np.ndarray
            Integer semantic mask from Epoch 2.
        min_change_area_sqm : float
            Minimum change area threshold in square meters to filter noise.

        Returns
        -------
        Dict[str, Any]
            Detailed change statistics, classified mutation items, and change mask.
        """
        assert mask_t1.shape == mask_t2.shape, "Temporal masks must have identical dimensions"
        h, w = mask_t1.shape

        change_map = np.zeros((h, w), dtype=np.uint8)
        mutations: List[ChangeMetric] = []

        # 1. New Constructions: (T1 != 1) -> (T2 == 1)
        new_bld_mask = ((mask_t1 != 1) & (mask_t2 == 1)).astype(np.uint8)
        new_bld_px = int(np.sum(new_bld_mask))
        new_bld_area = new_bld_px * self.pixel_area_sqm
        if new_bld_area >= min_change_area_sqm:
            change_map[new_bld_mask == 1] = 1
            mutations.append(
                ChangeMetric(
                    change_type=ChangeType.NEW_CONSTRUCTION,
                    pixel_count=new_bld_px,
                    area_sqm=round(new_bld_area, 2),
                    confidence=0.94,
                    description=f"New building footprints detected ({round(new_bld_area, 2)} m²)",
                )
            )

        # 2. Demolished / Removed Structures: (T1 == 1) -> (T2 != 1)
        demolished_mask = ((mask_t1 == 1) & (mask_t2 != 1)).astype(np.uint8)
        demolished_px = int(np.sum(demolished_mask))
        demolished_area = demolished_px * self.pixel_area_sqm
        if demolished_area >= min_change_area_sqm:
            change_map[demolished_mask == 1] = 2
            mutations.append(
                ChangeMetric(
                    change_type=ChangeType.DEMOLISHED_STRUCTURE,
                    pixel_count=demolished_px,
                    area_sqm=round(demolished_area, 2),
                    confidence=0.91,
                    description=f"Demolished / Razored structures ({round(demolished_area, 2)} m²)",
                )
            )

        # 3. Water Body Encroachment: (T1 == 3) -> (T2 == 1 or T2 == 2)
        water_encroach_mask = ((mask_t1 == 3) & ((mask_t2 == 1) | (mask_t2 == 2))).astype(np.uint8)
        water_encroach_px = int(np.sum(water_encroach_mask))
        water_encroach_area = water_encroach_px * self.pixel_area_sqm
        if water_encroach_area >= min_change_area_sqm:
            change_map[water_encroach_mask == 1] = 3
            mutations.append(
                ChangeMetric(
                    change_type=ChangeType.WATER_BODY_ENCROACHMENT,
                    pixel_count=water_encroach_px,
                    area_sqm=round(water_encroach_area, 2),
                    confidence=0.98,
                    description=f"CRITICAL: Construction over historic water body / pond ({round(water_encroach_area, 2)} m²)",
                )
            )

        # 4. Road Right-of-Way (RoW) Narrowing: (T1 == 2) -> (T2 == 1)
        road_encroach_mask = ((mask_t1 == 2) & (mask_t2 == 1)).astype(np.uint8)
        road_encroach_px = int(np.sum(road_encroach_mask))
        road_encroach_area = road_encroach_px * self.pixel_area_sqm
        if road_encroach_area >= min_change_area_sqm:
            change_map[road_encroach_mask == 1] = 4
            mutations.append(
                ChangeMetric(
                    change_type=ChangeType.ROAD_NARROWING,
                    pixel_count=road_encroach_px,
                    area_sqm=round(road_encroach_area, 2),
                    confidence=0.95,
                    description=f"Road RoW narrowing due to structure extension ({round(road_encroach_area, 2)} m²)",
                )
            )

        total_changed_area = sum(m.area_sqm for m in mutations)

        return {
            "total_mutations_count": len(mutations),
            "total_changed_area_sqm": round(total_changed_area, 2),
            "mutations": [
                {
                    "change_type": m.change_type.value,
                    "area_sqm": m.area_sqm,
                    "confidence": m.confidence,
                    "description": m.description,
                }
                for m in mutations
            ],
            "change_map": change_map,
        }
