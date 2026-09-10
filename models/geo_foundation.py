"""
models/geo_foundation.py
========================
Remote Sensing Geospatial Foundation Vision Transformer (GeoFoundationViT / RemoteSensingEmbedder).
Inspired by Foundation Models & Self-Supervised Learning in remote sensing:
- SatMAE / SatViT / RemoteCLIP (Vision Transformer for Earth Observation & Aerial Imagery).

Key Capabilities:
1. Multi-scale Patch Embedding for satellite and aerial ortho-tiles.
2. Extracts robust invariant 512-D / 768-D semantic embeddings for:
   - Zero-shot land use & land cover scene classification
   - Content-Based Satellite Image Retrieval (CBIR)
   - Spatial similarity clustering across vast geographic regions.
"""

from __future__ import annotations

import math
from typing import List, Tuple

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F


class PatchEmbedding(nn.Module):
    """Splits aerial image into non-overlapping patches and projects them to embedding dimension."""

    def __init__(self, in_channels: int = 3, patch_size: int = 16, embed_dim: int = 256) -> None:
        super().__init__()
        self.patch_size = patch_size
        self.proj = nn.Conv2d(in_channels, embed_dim, kernel_size=patch_size, stride=patch_size)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: [B, C, H, W] -> proj: [B, embed_dim, H/P, W/P] -> [B, N, embed_dim]
        x = self.proj(x)
        x = x.flatten(2).transpose(1, 2)
        return x


class TransformerEncoderBlock(nn.Module):
    """Standard multi-head self-attention transformer encoder block."""

    def __init__(self, embed_dim: int = 256, num_heads: int = 4, mlp_ratio: float = 4.0, dropout: float = 0.1) -> None:
        super().__init__()
        self.norm1 = nn.LayerNorm(embed_dim)
        self.attn = nn.MultiheadAttention(embed_dim, num_heads, dropout=dropout, batch_first=True)
        self.norm2 = nn.LayerNorm(embed_dim)

        mlp_hidden_dim = int(embed_dim * mlp_ratio)
        self.mlp = nn.Sequential(
            nn.Linear(embed_dim, mlp_hidden_dim),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(mlp_hidden_dim, embed_dim),
            nn.Dropout(dropout),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        norm_x = self.norm1(x)
        attn_out, _ = self.attn(norm_x, norm_x, norm_x)
        x = x + attn_out
        x = x + self.mlp(self.norm2(x))
        return x


class GeoFoundationViT(nn.Module):
    """Geospatial Foundation Vision Transformer for Aerial & Satellite Feature Representation."""

    def __init__(
        self,
        img_size: int = 128,
        patch_size: int = 16,
        in_channels: int = 3,
        embed_dim: int = 256,
        depth: int = 4,
        num_heads: int = 4,
        num_classes: int = 10,  # e.g., EuroSAT / UC-Merced remote sensing land-cover classes
    ) -> None:
        super().__init__()
        self.img_size = img_size
        self.patch_size = patch_size
        self.num_patches = (img_size // patch_size) ** 2
        self.embed_dim = embed_dim

        # Patch Embedding
        self.patch_embed = PatchEmbedding(in_channels=in_channels, patch_size=patch_size, embed_dim=embed_dim)

        # Learnable Class Token and Positional Embeddings
        self.cls_token = nn.Parameter(torch.zeros(1, 1, embed_dim))
        self.pos_embed = nn.Parameter(torch.zeros(1, self.num_patches + 1, embed_dim))
        self.pos_drop = nn.Dropout(p=0.1)

        # Transformer Encoder Blocks
        self.blocks = nn.Sequential(*[
            TransformerEncoderBlock(embed_dim=embed_dim, num_heads=num_heads)
            for _ in range(depth)
        ])

        self.norm = nn.LayerNorm(embed_dim)

        # Classification & Retrieval Heads
        self.classifier = nn.Linear(embed_dim, num_classes)

        # Initialize weights
        nn.init.trunc_normal_(self.pos_embed, std=0.02)
        nn.init.trunc_normal_(self.cls_token, std=0.02)

    def forward_features(self, x: torch.Tensor) -> torch.Tensor:
        """Extract L2-normalized global representation vector."""
        b = x.shape[0]
        x = self.patch_embed(x)  # [B, N, embed_dim]
        n_patches = x.shape[1]

        cls_tokens = self.cls_token.expand(b, -1, -1)
        x = torch.cat((cls_tokens, x), dim=1)  # [B, N+1, embed_dim]

        # If input patch count matches pos_embed, add directly; else interpolate
        if x.shape[1] == self.pos_embed.shape[1]:
            x = x + self.pos_embed
        else:
            cls_pos = self.pos_embed[:, :1]
            patch_pos = self.pos_embed[:, 1:]
            dim = patch_pos.shape[-1]
            old_grid = int(math.isqrt(self.num_patches))
            new_grid = int(math.isqrt(n_patches))
            patch_pos = patch_pos.reshape(1, old_grid, old_grid, dim).permute(0, 3, 1, 2)
            patch_pos = F.interpolate(patch_pos, size=(new_grid, new_grid), mode="bicubic", align_corners=False)
            patch_pos = patch_pos.permute(0, 2, 3, 1).flatten(1, 2)
            interpolated_pos = torch.cat((cls_pos, patch_pos), dim=1)
            x = x + interpolated_pos

        x = self.pos_drop(x)
        x = self.blocks(x)
        x = self.norm(x)

        # Global representation token
        cls_feat = x[:, 0]
        return F.normalize(cls_feat, p=2, dim=-1)

    def forward(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        """Forward pass.
        
        Args:
            x: Input satellite/drone tile [B, C, H, W]
            
        Returns:
            Tuple of:
              - logits: [B, num_classes] (scene classification scores)
              - embeddings: [B, embed_dim] (L2 normalized feature vectors for similarity search)
        """
        embeddings = self.forward_features(x)
        logits = self.classifier(embeddings)
        return logits, embeddings


class RemoteSensingEmbedder:
    """High-level wrapper for remote sensing tile similarity search and embedding extraction."""

    def __init__(self, model: GeoFoundationViT | None = None) -> None:
        if model is None:
            self.model = GeoFoundationViT(img_size=128, patch_size=16, embed_dim=256, depth=4)
        else:
            self.model = model
        self.model.eval()

    @torch.no_grad()
    def compute_embedding(self, image_np: np.ndarray) -> np.ndarray:
        """Compute normalized feature embedding for a numpy RGB/Multi-channel tile.
        
        Args:
            image_np: [H, W, C] numpy image with values in 0-255 or 0-1
            
        Returns:
            1D numpy array of shape (embed_dim,)
        """
        if image_np.dtype == np.uint8:
            img = image_np.astype(np.float32) / 255.0
        else:
            img = image_np.astype(np.float32)

        target_size = self.model.img_size
        if img.shape[0] != target_size or img.shape[1] != target_size:
            import cv2
            img = cv2.resize(img, (target_size, target_size))

        tensor = torch.from_numpy(img).permute(2, 0, 1).unsqueeze(0).float()
        emb = self.model.forward_features(tensor).squeeze(0).cpu().numpy()
        return emb

    @staticmethod
    def compute_cosine_similarity(emb1: np.ndarray, emb2: np.ndarray) -> float:
        """Compute cosine similarity between two remote sensing tile embeddings."""
        return float(np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2) + 1e-7))
