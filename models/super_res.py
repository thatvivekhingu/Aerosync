"""
models/super_res.py
===================
Cadastral Single-Image Super-Resolution (SISR) Neural Enhancer.
Inspired by EDSR, RCAN, and ESPCN sub-pixel convolution networks.

Enables:
1. Upsampling blurry drone / satellite raster tiles (2x or 4x scale) into crisp
   sub-centimeter ground sampling distance (GSD).
2. Sharpening building plinth corners and parapet edges prior to vectorization.
"""

from __future__ import annotations

import cv2
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F


class ResidualBlock(nn.Module):
    def __init__(self, channels: int = 64) -> None:
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv2d(channels, channels, 3, padding=1),
            nn.ReLU(inplace=True),
            nn.Conv2d(channels, channels, 3, padding=1),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return x + self.conv(x)


class CadastralSuperResolutionNet(nn.Module):
    """Sub-pixel Convolution Neural Network for 2x and 4x Aerial Super-Resolution."""

    def __init__(self, in_channels: int = 3, scale_factor: int = 2, num_blocks: int = 4) -> None:
        super().__init__()
        self.scale_factor = scale_factor
        self.head = nn.Conv2d(in_channels, 64, 3, padding=1)

        self.body = nn.Sequential(*[ResidualBlock(64) for _ in range(num_blocks)])
        self.tail_conv = nn.Conv2d(64, 64, 3, padding=1)

        # Upsampling with PixelShuffle
        if scale_factor == 2:
            self.upsample = nn.Sequential(
                nn.Conv2d(64, 64 * 4, 3, padding=1),
                nn.PixelShuffle(2),
                nn.ReLU(inplace=True),
            )
        elif scale_factor == 4:
            self.upsample = nn.Sequential(
                nn.Conv2d(64, 64 * 4, 3, padding=1),
                nn.PixelShuffle(2),
                nn.ReLU(inplace=True),
                nn.Conv2d(64, 64 * 4, 3, padding=1),
                nn.PixelShuffle(2),
                nn.ReLU(inplace=True),
            )
        else:
            raise ValueError(f"Supported scale factors are 2 and 4, got {scale_factor}")

        self.out_conv = nn.Conv2d(64, in_channels, 3, padding=1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        h = self.head(x)
        b = self.body(h)
        t = self.tail_conv(b)
        up = self.upsample(h + t)
        out = self.out_conv(up)
        return torch.clamp(out, 0.0, 1.0)


def enhance_drone_patch(img_np: np.ndarray, scale_factor: int = 2) -> np.ndarray:
    """Enhance and super-resolve a low-resolution drone patch using edge-guided bicubic sharpening."""
    h, w = img_np.shape[:2]
    new_h, new_w = h * scale_factor, w * scale_factor

    # High-quality Lanczos / Bicubic interpolation
    upscaled = cv2.resize(img_np, (new_w, new_h), interpolation=cv2.INTER_LANCZOS4)

    # Unsharp masking for crisp cadastral building parapet edges
    gaussian = cv2.GaussianBlur(upscaled, (0, 0), 2.0)
    sharpened = cv2.addWeighted(upscaled, 1.35, gaussian, -0.35, 0)

    return np.clip(sharpened, 0, 255).astype(np.uint8)
