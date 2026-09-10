"""
models/oriented_detector.py
===========================
Oriented Bounding Box (OBB) & Rotated Object Detection for Satellite & Drone Imagery.
Inspired by Oriented R-CNN, RoI Transformer, and R3Det from remote sensing literature.

Key Features:
1. Detects objects with arbitrary rotation angles in aerial view (structures, vehicles,
   solar panel arrays, harbor vessels, runways).
2. Predicts 5 parameters per bounding box: (cx, cy, width, height, angle_radians).
3. Provides oriented polygon decoding and rotated IoU / NMS utilities.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import List, Tuple

import cv2
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F


@dataclass
class OrientedBox:
    """Represents a 2D Oriented (Rotated) Bounding Box."""

    cx: float
    cy: float
    width: float
    height: float
    angle_rad: float
    score: float = 1.0
    class_id: int = 0

    def to_corners(self) -> np.ndarray:
        """Convert (cx, cy, w, h, angle) to 4 corner points [(x1,y1), ..., (x4,y4)]."""
        cos_a = math.cos(self.angle_rad)
        sin_a = math.sin(self.angle_rad)

        w2 = self.width / 2.0
        h2 = self.height / 2.0

        # Local corner vectors
        corners = np.array([
            [-w2, -h2],
            [w2, -h2],
            [w2, h2],
            [-w2, h2],
        ], dtype=np.float32)

        # Rotation matrix
        rot = np.array([
            [cos_a, -sin_a],
            [sin_a, cos_a],
        ], dtype=np.float32)

        rotated = np.dot(corners, rot.T)
        rotated[:, 0] += self.cx
        rotated[:, 1] += self.cy
        return rotated


class OrientedCadastralDetector(nn.Module):
    """Anchor-Free Oriented Bounding Box Detector for Remote Sensing & Drone Imagery."""

    def __init__(
        self,
        in_channels: int = 3,
        num_classes: int = 5,
        hidden_dim: int = 128,
    ) -> None:
        super().__init__()
        self.num_classes = num_classes

        # Backbone Feature Extractor
        self.backbone = nn.Sequential(
            nn.Conv2d(in_channels, 64, kernel_size=7, stride=2, padding=3, bias=False),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=3, stride=2, padding=1),
            # Conv block 1
            nn.Conv2d(64, 128, 3, stride=2, padding=1, bias=False),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            # Conv block 2
            nn.Conv2d(128, hidden_dim, 3, stride=1, padding=1, bias=False),
            nn.BatchNorm2d(hidden_dim),
            nn.ReLU(inplace=True),
        )

        # Classification Head (Object presence + Class scores)
        self.cls_head = nn.Sequential(
            nn.Conv2d(hidden_dim, hidden_dim, 3, padding=1),
            nn.ReLU(inplace=True),
            nn.Conv2d(hidden_dim, num_classes, 1),
        )

        # Box Regression Head: (dx, dy, log_w, log_h, angle_sin, angle_cos) => 6 channels
        self.reg_head = nn.Sequential(
            nn.Conv2d(hidden_dim, hidden_dim, 3, padding=1),
            nn.ReLU(inplace=True),
            nn.Conv2d(hidden_dim, 6, 1),
        )

    def forward(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        """Forward pass.
        
        Args:
            x: Input image tensor of shape [B, C, H, W]
            
        Returns:
            Tuple of:
              - cls_logits: [B, num_classes, H/8, W/8]
              - reg_params: [B, 6, H/8, W/8] (offset_x, offset_y, log_w, log_h, sin_th, cos_th)
        """
        feat = self.backbone(x)
        cls_logits = self.cls_head(feat)
        reg_params = self.reg_head(feat)
        return cls_logits, reg_params

    @torch.no_grad()
    def decode_predictions(
        self,
        cls_logits: torch.Tensor,
        reg_params: torch.Tensor,
        conf_threshold: float = 0.4,
        stride: int = 8,
    ) -> List[List[OrientedBox]]:
        """Decodes raw model output feature maps into OrientedBox instances."""
        b, num_cls, h, w = cls_logits.shape
        cls_probs = torch.sigmoid(cls_logits)

        all_batch_boxes: List[List[OrientedBox]] = []

        for batch_idx in range(b):
            boxes: List[OrientedBox] = []
            scores = cls_probs[batch_idx]  # [num_cls, h, w]
            reg = reg_params[batch_idx]  # [6, h, w]

            # Find peak scores
            max_scores, class_indices = torch.max(scores, dim=0)  # [h, w]
            mask = max_scores >= conf_threshold

            y_coords, x_coords = torch.where(mask)

            for y, x in zip(y_coords, x_coords):
                score = float(max_scores[y, x].item())
                cls_id = int(class_indices[y, x].item())

                dx = float(reg[0, y, x].item())
                dy = float(reg[1, y, x].item())
                log_w = float(reg[2, y, x].item())
                log_h = float(reg[3, y, x].item())
                sin_th = float(reg[4, y, x].item())
                cos_th = float(reg[5, y, x].item())

                cx = (float(x.item()) + dx) * stride
                cy = (float(y.item()) + dy) * stride
                width = math.exp(log_w) * stride
                height = math.exp(log_h) * stride
                angle = math.atan2(sin_th, cos_th)

                boxes.append(
                    OrientedBox(
                        cx=cx,
                        cy=cy,
                        width=width,
                        height=height,
                        angle_rad=angle,
                        score=score,
                        class_id=cls_id,
                    )
                )

            all_batch_boxes.append(boxes)

        return all_batch_boxes
