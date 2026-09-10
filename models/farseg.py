"""
models/farseg.py
================
Foreground-Aware Relation Network (FarSeg) for Geospatial Object Segmentation.
Originating from research on high-spatial-resolution satellite & aerial imagery:
"Foreground-Aware Relation Network for Geospatial Object Segmentation in High
Spatial Resolution Remote Sensing Imagery" (CVPR / Remote Sensing DL Techniques).

Key Innovations:
1. FSRelation (Foreground-Scene Relation Module): Mitigates severe foreground-background
   imbalance and false alarms in VHR satellite imagery by correlating global scene context
   with local object features.
2. Feature Pyramid Network (FPN) neck for multi-scale aerial feature aggregation.
3. Light-weight, high-throughput geospatial segmentation head.
"""

from __future__ import annotations

import torch
import torch.nn as nn
import torch.nn.functional as F


class ConvBNReLU(nn.Module):
    """Standard Conv2d + BatchNorm2d + ReLU block."""

    def __init__(
        self,
        in_channels: int,
        out_channels: int,
        kernel_size: int = 3,
        stride: int = 1,
        padding: int = 1,
        dilation: int = 1,
    ) -> None:
        super().__init__()
        self.block = nn.Sequential(
            nn.Conv2d(
                in_channels,
                out_channels,
                kernel_size,
                stride=stride,
                padding=padding,
                dilation=dilation,
                bias=False,
            ),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.block(x)


class SimpleBackboneEncoder(nn.Module):
    """Lightweight 4-stage multi-scale convolutional encoder for FarSeg."""

    def __init__(self, in_channels: int = 3, base_channels: int = 64) -> None:
        super().__init__()
        # Stage 1: 1/2 resolution
        self.stage1 = nn.Sequential(
            ConvBNReLU(in_channels, base_channels, kernel_size=3, stride=2, padding=1),
            ConvBNReLU(base_channels, base_channels, kernel_size=3, stride=1, padding=1),
        )
        # Stage 2: 1/4 resolution
        self.stage2 = nn.Sequential(
            ConvBNReLU(base_channels, base_channels * 2, kernel_size=3, stride=2, padding=1),
            ConvBNReLU(base_channels * 2, base_channels * 2, kernel_size=3, stride=1, padding=1),
        )
        # Stage 3: 1/8 resolution
        self.stage3 = nn.Sequential(
            ConvBNReLU(base_channels * 2, base_channels * 4, kernel_size=3, stride=2, padding=1),
            ConvBNReLU(base_channels * 4, base_channels * 4, kernel_size=3, stride=1, padding=1),
        )
        # Stage 4: 1/16 resolution
        self.stage4 = nn.Sequential(
            ConvBNReLU(base_channels * 4, base_channels * 8, kernel_size=3, stride=2, padding=1),
            ConvBNReLU(base_channels * 8, base_channels * 8, kernel_size=3, stride=1, padding=1),
        )

    def forward(self, x: torch.Tensor) -> list[torch.Tensor]:
        c1 = self.stage1(x)  # H/2
        c2 = self.stage2(c1)  # H/4
        c3 = self.stage3(c2)  # H/8
        c4 = self.stage4(c3)  # H/16
        return [c1, c2, c3, c4]


class FSRelationModule(nn.Module):
    """Foreground-Scene Relation (FSRelation) Module.
    
    Models the semantic dependency between global scene representation (from deep stage)
    and multi-scale geospatial foreground features.
    """

    def __init__(self, scene_channels: int, feature_channels: int, out_channels: int = 128) -> None:
        super().__init__()
        # Global scene encoder pooling
        self.scene_pool = nn.AdaptiveAvgPool2d(1)
        self.scene_project = nn.Sequential(
            nn.Linear(scene_channels, out_channels),
            nn.ReLU(inplace=True),
            nn.Linear(out_channels, feature_channels),
            nn.Sigmoid(),
        )

        # Scale transform
        self.scale_conv = ConvBNReLU(feature_channels, out_channels, kernel_size=1, padding=0)

    def forward(self, feat: torch.Tensor, scene_feat: torch.Tensor) -> torch.Tensor:
        b, c, _, _ = scene_feat.shape
        scene_vec = self.scene_pool(scene_feat).view(b, c)
        attention_weights = self.scene_project(scene_vec).unsqueeze(-1).unsqueeze(-1)  # [B, C, 1, 1]

        enhanced = feat * attention_weights + feat
        return self.scale_conv(enhanced)


class FarSeg(nn.Module):
    """Foreground-Aware Relation Network for Satellite & Aerial Semantic Segmentation."""

    def __init__(
        self,
        in_channels: int = 3,
        num_classes: int = 5,
        base_channels: int = 64,
        fpn_channels: int = 128,
    ) -> None:
        super().__init__()
        self.in_channels = in_channels
        self.num_classes = num_classes

        # 1. Multi-scale Encoder
        self.encoder = SimpleBackboneEncoder(in_channels=in_channels, base_channels=base_channels)

        # Encoder channel dimensions: [64, 128, 256, 512]
        c1_dim, c2_dim, c3_dim, c4_dim = (
            base_channels,
            base_channels * 2,
            base_channels * 4,
            base_channels * 8,
        )

        # 2. Feature Pyramid Network (FPN) lateral connections
        self.lat_c4 = nn.Conv2d(c4_dim, fpn_channels, 1)
        self.lat_c3 = nn.Conv2d(c3_dim, fpn_channels, 1)
        self.lat_c2 = nn.Conv2d(c2_dim, fpn_channels, 1)

        self.smooth_p3 = nn.Conv2d(fpn_channels, fpn_channels, 3, padding=1)
        self.smooth_p2 = nn.Conv2d(fpn_channels, fpn_channels, 3, padding=1)

        # 3. Foreground-Scene Relation Module on P2
        self.fs_relation = FSRelationModule(
            scene_channels=c4_dim,
            feature_channels=fpn_channels,
            out_channels=fpn_channels,
        )

        # 4. Geospatial Object Classification Head
        self.head = nn.Sequential(
            ConvBNReLU(fpn_channels, fpn_channels, 3, padding=1),
            nn.Dropout2d(0.1),
            nn.Conv2d(fpn_channels, num_classes, 1),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        input_size = x.shape[-2:]
        c1, c2, c3, c4 = self.encoder(x)

        # Top-down FPN pathway
        p4 = self.lat_c4(c4)
        p3 = self.lat_c3(c3) + F.interpolate(p4, size=c3.shape[-2:], mode="bilinear", align_corners=False)
        p3 = self.smooth_p3(p3)

        p2 = self.lat_c2(c2) + F.interpolate(p3, size=c2.shape[-2:], mode="bilinear", align_corners=False)
        p2 = self.smooth_p2(p2)

        # Enhance P2 with global scene relation
        enhanced_feat = self.fs_relation(p2, c4)

        # Predict logits and interpolate back to original resolution
        logits = self.head(enhanced_feat)
        out = F.interpolate(logits, size=input_size, mode="bilinear", align_corners=False)
        return out
