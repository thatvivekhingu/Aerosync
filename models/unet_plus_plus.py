"""
models/unet_plus_plus.py
========================
UNet++ (Nested Dense Skip Pathways Architecture) for Cadastral Feature Extraction.
Inspired by Zhou et al. (2018) "UNet++: A Nested U-Net Architecture for Medical Image Segmentation"
and adapted for high-resolution cadastral drone orthophoto segmentation (SIH 1705 / Project Vaayu).

Architecture:
- Dense convolutional blocks on skip pathways X^{i,j}
- Deep supervision heads at intermediate decoder levels
- Solves semantic gap between encoder and decoder feature maps
"""

from __future__ import annotations

import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import List, Optional, Tuple, Union


class ConvBlock(nn.Module):
    """Standard double convolution block with BatchNorm and LeakyReLU."""

    def __init__(self, in_channels: int, out_channels: int) -> None:
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv2d(in_channels, out_channels, 3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.LeakyReLU(0.1, inplace=True),
            nn.Conv2d(out_channels, out_channels, 3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.LeakyReLU(0.1, inplace=True),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.conv(x)


class AeroSyncUNetPlusPlus(nn.Module):
    """UNet++ with Nested Dense Skip Pathways and Optional Deep Supervision.

    Nodes represent X^{i,j} where i is downsampling depth (0..4) and j is skip connection level (0..4).
    """

    def __init__(
        self,
        in_channels: int = 3,
        num_classes: int = 5,
        deep_supervision: bool = True,
        nb_filter: Tuple[int, int, int, int, int] = (32, 64, 128, 256, 512),
    ) -> None:
        super().__init__()
        self.deep_supervision = deep_supervision
        self.num_classes = num_classes

        # Downsample pool and upsample layers
        self.pool = nn.MaxPool2d(2, 2)
        self.up = nn.Upsample(scale_factor=2, mode="bilinear", align_corners=True)

        # Backbone nodes (Column j = 0)
        self.conv0_0 = ConvBlock(in_channels, nb_filter[0])
        self.conv1_0 = ConvBlock(nb_filter[0], nb_filter[1])
        self.conv2_0 = ConvBlock(nb_filter[1], nb_filter[2])
        self.conv3_0 = ConvBlock(nb_filter[2], nb_filter[3])
        self.conv4_0 = ConvBlock(nb_filter[3], nb_filter[4])

        # Nested Skip Column j = 1
        self.conv0_1 = ConvBlock(nb_filter[0] + nb_filter[1], nb_filter[0])
        self.conv1_1 = ConvBlock(nb_filter[1] + nb_filter[2], nb_filter[1])
        self.conv2_1 = ConvBlock(nb_filter[2] + nb_filter[3], nb_filter[2])
        self.conv3_1 = ConvBlock(nb_filter[3] + nb_filter[4], nb_filter[3])

        # Nested Skip Column j = 2
        self.conv0_2 = ConvBlock(nb_filter[0] * 2 + nb_filter[1], nb_filter[0])
        self.conv1_2 = ConvBlock(nb_filter[1] * 2 + nb_filter[2], nb_filter[1])
        self.conv2_2 = ConvBlock(nb_filter[2] * 2 + nb_filter[3], nb_filter[2])

        # Nested Skip Column j = 3
        self.conv0_3 = ConvBlock(nb_filter[0] * 3 + nb_filter[1], nb_filter[0])
        self.conv1_3 = ConvBlock(nb_filter[1] * 3 + nb_filter[2], nb_filter[1])

        # Nested Skip Column j = 4
        self.conv0_4 = ConvBlock(nb_filter[0] * 4 + nb_filter[1], nb_filter[0])

        # Output Heads (for Deep Supervision)
        if self.deep_supervision:
            self.final1 = nn.Conv2d(nb_filter[0], num_classes, 1)
            self.final2 = nn.Conv2d(nb_filter[0], num_classes, 1)
            self.final3 = nn.Conv2d(nb_filter[0], num_classes, 1)
            self.final4 = nn.Conv2d(nb_filter[0], num_classes, 1)
        else:
            self.final = nn.Conv2d(nb_filter[0], num_classes, 1)

    def forward(
        self, x: torch.Tensor
    ) -> Union[torch.Tensor, Tuple[torch.Tensor, torch.Tensor, torch.Tensor, torch.Tensor]]:
        # Column j = 0 (Encoder)
        x0_0 = self.conv0_0(x)
        x1_0 = self.conv1_0(self.pool(x0_0))
        x2_0 = self.conv2_0(self.pool(x1_0))
        x3_0 = self.conv3_0(self.pool(x2_0))
        x4_0 = self.conv4_0(self.pool(x3_0))

        # Column j = 1
        x0_1 = self.conv0_1(torch.cat([x0_0, self.up(x1_0)], 1))
        x1_1 = self.conv1_1(torch.cat([x1_0, self.up(x2_0)], 1))
        x2_1 = self.conv2_1(torch.cat([x2_0, self.up(x3_0)], 1))
        x3_1 = self.conv3_1(torch.cat([x3_0, self.up(x4_0)], 1))

        # Column j = 2
        x0_2 = self.conv0_2(torch.cat([x0_0, x0_1, self.up(x1_1)], 1))
        x1_2 = self.conv1_2(torch.cat([x1_0, x1_1, self.up(x2_1)], 1))
        x2_2 = self.conv2_2(torch.cat([x2_0, x2_1, self.up(x3_1)], 1))

        # Column j = 3
        x0_3 = self.conv0_3(torch.cat([x0_0, x0_1, x0_2, self.up(x1_2)], 1))
        x1_3 = self.conv1_3(torch.cat([x1_0, x1_1, x1_2, self.up(x2_2)], 1))

        # Column j = 4
        x0_4 = self.conv0_4(torch.cat([x0_0, x0_1, x0_2, x0_3, self.up(x1_3)], 1))

        if self.deep_supervision and self.training:
            output1 = self.final1(x0_1)
            output2 = self.final2(x0_2)
            output3 = self.final3(x0_3)
            output4 = self.final4(x0_4)
            return output4, output3, output2, output1
        elif self.deep_supervision:
            return self.final4(x0_4)
        else:
            return self.final(x0_4)
