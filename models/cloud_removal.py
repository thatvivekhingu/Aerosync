"""
models/cloud_removal.py
=======================
Cloud, Cirrus Haze, and Shadow Detection Neural Network (CloudShadowNet).
Inspired by CloudNet and RS-Net architectures from remote sensing deep learning.

Key Features:
1. Multi-class atmospheric segmentation:
   - Class 0: Clear Land / Ground
   - Class 1: Thick Opaque Cloud
   - Class 2: Semi-transparent Thin Cloud / Cirrus Haze
   - Class 3: Cloud Shadow
2. Generates quality assurance (QA) cloud masks for satellite & aerial orthomosaics.
3. Automated cloud-free composite confidence map generator.
"""

from __future__ import annotations

from enum import IntEnum
from typing import Dict, Tuple

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F


class CloudClass(IntEnum):
    CLEAR = 0
    THICK_CLOUD = 1
    THIN_CLOUD = 2
    CLOUD_SHADOW = 3


class CloudShadowNet(nn.Module):
    """Deep Atmospheric and Cloud/Shadow Segmentation Network."""

    def __init__(
        self,
        in_channels: int = 3,  # RGB (or multispectral RGB+NIR)
        num_classes: int = 4,
        base_filters: int = 32,
    ) -> None:
        super().__init__()
        self.num_classes = num_classes

        # Encoder
        self.enc1 = nn.Sequential(
            nn.Conv2d(in_channels, base_filters, 3, padding=1),
            nn.BatchNorm2d(base_filters),
            nn.ReLU(inplace=True),
            nn.Conv2d(base_filters, base_filters, 3, padding=1),
            nn.BatchNorm2d(base_filters),
            nn.ReLU(inplace=True),
        )

        self.enc2 = nn.Sequential(
            nn.MaxPool2d(2),
            nn.Conv2d(base_filters, base_filters * 2, 3, padding=1),
            nn.BatchNorm2d(base_filters * 2),
            nn.ReLU(inplace=True),
            nn.Conv2d(base_filters * 2, base_filters * 2, 3, padding=1),
            nn.BatchNorm2d(base_filters * 2),
            nn.ReLU(inplace=True),
        )

        self.enc3 = nn.Sequential(
            nn.MaxPool2d(2),
            nn.Conv2d(base_filters * 2, base_filters * 4, 3, padding=1),
            nn.BatchNorm2d(base_filters * 4),
            nn.ReLU(inplace=True),
            nn.Conv2d(base_filters * 4, base_filters * 4, 3, padding=1),
            nn.BatchNorm2d(base_filters * 4),
            nn.ReLU(inplace=True),
        )

        # Multi-scale Dilated Bottleneck for atmospheric haze context
        self.bottleneck = nn.Sequential(
            nn.MaxPool2d(2),
            nn.Conv2d(base_filters * 4, base_filters * 8, 3, padding=2, dilation=2),
            nn.BatchNorm2d(base_filters * 8),
            nn.ReLU(inplace=True),
            nn.Conv2d(base_filters * 8, base_filters * 4, 3, padding=1),
            nn.BatchNorm2d(base_filters * 4),
            nn.ReLU(inplace=True),
        )

        # Decoder
        self.up3 = nn.ConvTranspose2d(base_filters * 4, base_filters * 4, 2, stride=2)
        self.dec3 = nn.Sequential(
            nn.Conv2d(base_filters * 8, base_filters * 4, 3, padding=1),
            nn.BatchNorm2d(base_filters * 4),
            nn.ReLU(inplace=True),
        )

        self.up2 = nn.ConvTranspose2d(base_filters * 4, base_filters * 2, 2, stride=2)
        self.dec2 = nn.Sequential(
            nn.Conv2d(base_filters * 4, base_filters * 2, 3, padding=1),
            nn.BatchNorm2d(base_filters * 2),
            nn.ReLU(inplace=True),
        )

        self.up1 = nn.ConvTranspose2d(base_filters * 2, base_filters, 2, stride=2)
        self.dec1 = nn.Sequential(
            nn.Conv2d(base_filters * 2, base_filters, 3, padding=1),
            nn.BatchNorm2d(base_filters),
            nn.ReLU(inplace=True),
            nn.Conv2d(base_filters, num_classes, 1),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        e1 = self.enc1(x)
        e2 = self.enc2(e1)
        e3 = self.enc3(e2)

        b = self.bottleneck(e3)

        d3 = self.dec3(torch.cat([self.up3(b), e3], dim=1))
        d2 = self.dec2(torch.cat([self.up2(d3), e2], dim=1))
        logits = self.dec1(torch.cat([self.up1(d2), e1], dim=1))

        return logits

    @torch.no_grad()
    def segment_clouds_and_shadows(
        self,
        image_tensor: torch.Tensor,
    ) -> Dict[str, np.ndarray]:
        """Perform inference on input image and return clean numpy masks."""
        self.eval()
        logits = self.forward(image_tensor)
        probs = F.softmax(logits, dim=1)
        pred_mask = torch.argmax(probs, dim=1).squeeze(0).cpu().numpy().astype(np.uint8)

        clear_mask = (pred_mask == CloudClass.CLEAR).astype(np.uint8)
        cloud_mask = ((pred_mask == CloudClass.THICK_CLOUD) | (pred_mask == CloudClass.THIN_CLOUD)).astype(np.uint8)
        shadow_mask = (pred_mask == CloudClass.CLOUD_SHADOW).astype(np.uint8)

        # Clear sky confidence (probability of clear ground)
        clear_confidence = probs[0, CloudClass.CLEAR].cpu().numpy().astype(np.float32)

        return {
            "prediction_mask": pred_mask,
            "clear_ground_mask": clear_mask,
            "cloud_mask": cloud_mask,
            "shadow_mask": shadow_mask,
            "clear_confidence": clear_confidence,
            "cloud_coverage_fraction": float(np.mean(cloud_mask)),
        }
