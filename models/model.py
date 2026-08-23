"""
models/model.py
===============
AeroSync Cadastral AI Engine — Neural Network Architecture.

Architectures
-------------
'scratch' (default, backward-compatible)
    SE-ResBlock encoder → ASPP bottleneck → UpBlockAttention decoder.
    All normalisation uses GroupNorm. No external dependencies beyond torch.

'resnet34' / 'convnext_tiny' (timm-powered, opt-in)
    Pretrained ImageNet encoder  (TimmBackboneEncoder)
    → TransformerBottleneck      (replaces ASPP)
    → CBAM-filtered skip conns   (channel + spatial self-attention)
    → DeformableResBlock projs   (deformable conv skip projections)
    → UpBlockAttention decoder   (same 3-stage decoder)
    → 4× final upsample refinement

Public API (fully backward-compatible)
---------------------------------------
ChannelAttention          : SE channel attention (Hu et al., 2018).
SE_ResBlock               : SE-Residual block with GroupNorm.
AttentionGate             : Spatial attention gate for skip connections.
ASPP                      : Atrous Spatial Pyramid Pooling bottleneck.
UpBlockAttention          : Decoder block with attention gate + SE-ResBlock.
SpatialAttention          : Spatial branch of CBAM.
CBAM                      : Full Convolutional Block Attention Module.
DeformableResBlock        : SE-ResBlock with deformable first convolution.
TransformerBottleneck     : Multi-head self-attention + FFN bottleneck.
TimmBackboneEncoder       : Pretrained timm feature extractor.
AeroSyncAttentionResUNet  : Main model; set backbone='resnet34' to activate
                            pretrained encoder.
AeroSyncUNet              : Alias for AeroSyncAttentionResUNet (compat).
"""

from __future__ import annotations

import logging
from typing import Optional, Union

import torch
import torch.nn as nn
import torch.nn.functional as F

from .constants import CLASS_COLORS, CLASS_NAMES
from .utils import get_group_norm

logger = logging.getLogger(__name__)

# Re-export constants so existing code using `from models.model import CLASS_NAMES` works
__all__ = [
    "CLASS_NAMES",
    "CLASS_COLORS",
    # Original architecture
    "ChannelAttention",
    "SE_ResBlock",
    "AttentionGate",
    "ASPP",
    "UpBlockAttention",
    # New Phase-2 components
    "SpatialAttention",
    "CBAM",
    "DeformableResBlock",
    "TransformerBottleneck",
    "TimmBackboneEncoder",
    # Models
    "AeroSyncAttentionResUNet",
    "AeroSyncUNet",
]

# ---------------------------------------------------------------------------
# 1. Squeeze-and-Excitation Channel Attention
# ---------------------------------------------------------------------------

class ChannelAttention(nn.Module):
    """Squeeze-and-Excitation channel attention (Hu et al., 2018).

    Recalibrates channel-wise feature responses by explicitly modelling
    inter-channel dependencies. Applied inside every ``SE_ResBlock`` after
    the second convolution, forcing the network to weight informative channels
    (e.g. the spectral signature of building rooftops) more strongly.

    Parameters
    ----------
    in_channels : int
        Number of input / output channels.
    reduction : int
        Channel reduction ratio for the bottleneck FC layers (default 16).
    """

    def __init__(self, in_channels: int, reduction: int = 16) -> None:
        super().__init__()
        reduced_c = max(in_channels // reduction, 8)
        self.avg_pool = nn.AdaptiveAvgPool2d(1)
        self.max_pool = nn.AdaptiveMaxPool2d(1)
        self.fc = nn.Sequential(
            nn.Conv2d(in_channels, reduced_c, 1, bias=False),
            nn.ReLU(inplace=True),
            nn.Conv2d(reduced_c, in_channels, 1, bias=False),
        )
        self.sigmoid = nn.Sigmoid()

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        avg_out = self.fc(self.avg_pool(x))
        max_out = self.fc(self.max_pool(x))
        out = self.sigmoid(avg_out + max_out)
        return x * out


# ---------------------------------------------------------------------------
# 2. SE-Residual Convolutional Block (GroupNorm)
# ---------------------------------------------------------------------------

class SE_ResBlock(nn.Module):
    """Squeeze-and-Excitation Residual Block with GroupNorm normalisation.

    Combines a standard residual shortcut with SE channel attention. Uses
    ``GroupNorm`` instead of ``BatchNorm2d`` throughout, making the block
    stable at any batch size including the common inference batch_size=1
    encountered when processing large drone GeoTIFF tiles one at a time.

    Parameters
    ----------
    in_channels : int
        Number of input channels.
    out_channels : int
        Number of output channels.
    dropout : float
        Dropout2d probability applied between the two convolutions (0 = no dropout).
    """

    def __init__(
        self,
        in_channels: int,
        out_channels: int,
        dropout: float = 0.1,
    ) -> None:
        super().__init__()
        self.conv1 = nn.Conv2d(in_channels, out_channels, 3, padding=1, bias=False)
        self.gn1 = get_group_norm(out_channels)
        self.relu = nn.ReLU(inplace=True)
        self.dropout = nn.Dropout2d(dropout) if dropout > 0 else nn.Identity()
        self.conv2 = nn.Conv2d(out_channels, out_channels, 3, padding=1, bias=False)
        self.gn2 = get_group_norm(out_channels)
        self.se = ChannelAttention(out_channels)

        self.shortcut: nn.Module = nn.Sequential()
        if in_channels != out_channels:
            self.shortcut = nn.Sequential(
                nn.Conv2d(in_channels, out_channels, 1, bias=False),
                get_group_norm(out_channels),
            )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        res = self.shortcut(x)
        out = self.relu(self.gn1(self.conv1(x)))
        out = self.dropout(out)
        out = self.gn2(self.conv2(out))
        out = self.se(out)
        out = self.relu(out + res)
        return out


# ---------------------------------------------------------------------------
# 3. Spatial Attention Gate for skip connections
# ---------------------------------------------------------------------------

class AttentionGate(nn.Module):
    """Soft spatial attention gate for U-Net skip connections (Oktay et al., 2018).

    Suppresses irrelevant activations in skip connection features by computing
    a spatial attention map from the gating signal (decoder feature) and the
    skip feature. Particularly important for cadastral segmentation where
    the decoder must focus on parcel boundary regions rather than homogeneous
    interior fill.

    Parameters
    ----------
    F_g : int
        Channels in the gating signal (from decoder).
    F_l : int
        Channels in the skip connection (from encoder).
    F_int : int
        Intermediate channel count for the attention computation.
    """

    def __init__(self, F_g: int, F_l: int, F_int: int) -> None:
        super().__init__()
        self.W_g = nn.Sequential(
            nn.Conv2d(F_g, F_int, kernel_size=1, stride=1, padding=0, bias=True),
            get_group_norm(F_int),
        )
        self.W_x = nn.Sequential(
            nn.Conv2d(F_l, F_int, kernel_size=1, stride=1, padding=0, bias=True),
            get_group_norm(F_int),
        )
        self.psi = nn.Sequential(
            nn.Conv2d(F_int, 1, kernel_size=1, stride=1, padding=0, bias=True),
            nn.GroupNorm(1, 1),  # effectively LayerNorm over spatial dims
            nn.Sigmoid(),
        )
        self.relu = nn.ReLU(inplace=True)

    def forward(self, g: torch.Tensor, x: torch.Tensor) -> torch.Tensor:
        """Apply attention gate.

        Parameters
        ----------
        g : torch.Tensor
            Gating signal from decoder, shape (B, F_g, H', W').
        x : torch.Tensor
            Skip connection feature from encoder, shape (B, F_l, H, W).

        Returns
        -------
        torch.Tensor
            Attention-weighted skip feature, same shape as ``x``.
        """
        g1 = self.W_g(g)
        x1 = self.W_x(x)
        if g1.shape[2:] != x1.shape[2:]:
            g1 = F.interpolate(g1, size=x1.shape[2:], mode="bilinear", align_corners=True)
        net = self.relu(g1 + x1)
        att = self.psi(net)
        return x * att


# ---------------------------------------------------------------------------
# 4. Atrous Spatial Pyramid Pooling (ASPP) Bottleneck
# ---------------------------------------------------------------------------

class ASPP(nn.Module):
    """Atrous Spatial Pyramid Pooling bottleneck (Chen et al., DeepLab v3).

    Captures multi-scale context with parallel dilated convolutions at rates
    [1, 6, 12, 18] plus a global average pooling branch. This is essential
    for cadastral segmentation where objects span hugely different scales:
    a narrow footpath might be 3 pixels wide while an agricultural field
    spans 400 pixels in the same tile.

    All normalisation uses ``GroupNorm`` for batch-size consistency.

    Parameters
    ----------
    in_channels : int
        Number of input channels.
    out_channels : int
        Number of output channels for each branch.
    rates : list[int]
        Dilation rates (default [1, 6, 12, 18]).
    """

    def __init__(
        self,
        in_channels: int,
        out_channels: int,
        rates: list[int] = [1, 6, 12, 18],
    ) -> None:
        super().__init__()
        self.b0 = nn.Sequential(
            nn.Conv2d(in_channels, out_channels, 1, bias=False),
            get_group_norm(out_channels),
            nn.ReLU(inplace=True),
        )
        self.b1 = nn.Sequential(
            nn.Conv2d(in_channels, out_channels, 3, padding=rates[1], dilation=rates[1], bias=False),
            get_group_norm(out_channels),
            nn.ReLU(inplace=True),
        )
        self.b2 = nn.Sequential(
            nn.Conv2d(in_channels, out_channels, 3, padding=rates[2], dilation=rates[2], bias=False),
            get_group_norm(out_channels),
            nn.ReLU(inplace=True),
        )
        self.b3 = nn.Sequential(
            nn.Conv2d(in_channels, out_channels, 3, padding=rates[3], dilation=rates[3], bias=False),
            get_group_norm(out_channels),
            nn.ReLU(inplace=True),
        )
        self.avg_pool = nn.Sequential(
            nn.AdaptiveAvgPool2d(1),
            nn.Conv2d(in_channels, out_channels, 1, bias=False),
            get_group_norm(out_channels),
            nn.ReLU(inplace=True),
        )
        self.project = nn.Sequential(
            nn.Conv2d(out_channels * 5, out_channels, 1, bias=False),
            get_group_norm(out_channels),
            nn.ReLU(inplace=True),
            nn.Dropout2d(0.2),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        h, w = x.shape[2:]
        feat0 = self.b0(x)
        feat1 = self.b1(x)
        feat2 = self.b2(x)
        feat3 = self.b3(x)
        pool = F.interpolate(self.avg_pool(x), size=(h, w), mode="bilinear", align_corners=True)
        concat = torch.cat([feat0, feat1, feat2, feat3, pool], dim=1)
        return self.project(concat)


# ---------------------------------------------------------------------------
# 5. Decoder Block with Attention Gate & SE-ResBlock
# ---------------------------------------------------------------------------

class UpBlockAttention(nn.Module):
    """Upsampling decoder block combining bilinear upsampling, attention gate, and SE-ResBlock.

    Parameters
    ----------
    in_channels : int
        Channels from the previous (deeper) decoder stage.
    skip_channels : int
        Channels from the corresponding encoder skip connection.
    out_channels : int
        Output channels after the SE-ResBlock convolution.
    """

    def __init__(self, in_channels: int, skip_channels: int, out_channels: int) -> None:
        super().__init__()
        self.up = nn.Upsample(scale_factor=2, mode="bilinear", align_corners=True)
        self.att = AttentionGate(F_g=in_channels, F_l=skip_channels, F_int=skip_channels)
        self.conv = SE_ResBlock(in_channels + skip_channels, out_channels)

    def forward(self, x: torch.Tensor, skip: torch.Tensor) -> torch.Tensor:
        x_up = self.up(x)
        if x_up.shape[2:] != skip.shape[2:]:
            x_up = F.interpolate(x_up, size=skip.shape[2:], mode="bilinear", align_corners=True)
        skip_att = self.att(g=x_up, x=skip)
        return self.conv(torch.cat([x_up, skip_att], dim=1))


# ---------------------------------------------------------------------------
# 6. CBAM — Convolutional Block Attention Module  [Phase 2]
# ---------------------------------------------------------------------------

class SpatialAttention(nn.Module):
    """Spatial attention branch of CBAM (Woo et al., 2018).

    Generates a 2-D spatial weight map from channel-pooled statistics,
    highlighting spatially discriminative regions (e.g. building edges)
    while suppressing homogeneous interior fill.

    Parameters
    ----------
    kernel_size : int
        Convolution kernel over the concatenated avg+max feature map (default 7).
    """

    def __init__(self, kernel_size: int = 7) -> None:
        super().__init__()
        self.conv = nn.Conv2d(2, 1, kernel_size, padding=kernel_size // 2, bias=False)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        avg_out = x.mean(dim=1, keepdim=True)
        max_out, _ = x.max(dim=1, keepdim=True)
        att = self.sigmoid(self.conv(torch.cat([avg_out, max_out], dim=1)))
        return x * att


class CBAM(nn.Module):
    """Convolutional Block Attention Module (Woo et al., 2018).

    Sequentially applies channel attention (SE-style) then spatial attention
    to refine feature representations. Used on timm-backbone skip connections
    instead of the context-dependent AttentionGate — CBAM performs pure
    self-attention on the skip feature before the decoder merges it with the
    gating signal.

    Parameters
    ----------
    in_channels : int
        Number of channels in the input feature map.
    reduction : int
        Channel reduction ratio for SE branch (default 16).
    spatial_kernel : int
        Kernel size for spatial attention conv (default 7).
    """

    def __init__(
        self,
        in_channels: int,
        reduction: int = 16,
        spatial_kernel: int = 7,
    ) -> None:
        super().__init__()
        self.channel_att = ChannelAttention(in_channels, reduction=reduction)
        self.spatial_att = SpatialAttention(kernel_size=spatial_kernel)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.channel_att(x)
        x = self.spatial_att(x)
        return x


# ---------------------------------------------------------------------------
# 7. DeformableResBlock  [Phase 2]
# ---------------------------------------------------------------------------

# Lazy import — deformable conv is optional; fallback to standard conv.
try:
    from torchvision.ops import DeformConv2d as _DeformConv2d
    _HAS_DEFORM_CONV = True
except ImportError:  # pragma: no cover
    _HAS_DEFORM_CONV = False
    _DeformConv2d = None  # type: ignore[assignment]


class DeformableResBlock(nn.Module):
    """SE-Residual block whose first convolution is deformable.

    Deformable convolutions (Dai et al., 2017) adaptively shift sampling
    positions based on learned offsets — critical for irregular building
    footprints and curved road edges in drone orthomosaics where rigid
    3×3 kernels misalign with diagonal boundaries.

    Falls back to a standard ``nn.Conv2d`` at runtime if
    ``torchvision.ops.DeformConv2d`` is unavailable, so the module is
    always safe to instantiate even in CPU-only environments.

    Parameters
    ----------
    in_channels : int
        Number of input channels.
    out_channels : int
        Number of output channels.
    dropout : float
        Dropout2d probability between convolutions (0 = no dropout).
    """

    def __init__(
        self,
        in_channels: int,
        out_channels: int,
        dropout: float = 0.1,
    ) -> None:
        super().__init__()
        self._use_deform = _HAS_DEFORM_CONV

        if self._use_deform:
            # Offset branch: 2 * k * k channels for x/y offsets per kernel position
            self.offset_conv = nn.Conv2d(in_channels, 2 * 3 * 3, 3, padding=1, bias=True)
            nn.init.zeros_(self.offset_conv.weight)
            nn.init.zeros_(self.offset_conv.bias)
            self.conv1 = _DeformConv2d(in_channels, out_channels, 3, padding=1, bias=False)
        else:
            logger.warning(
                "torchvision.ops.DeformConv2d unavailable — "
                "DeformableResBlock using standard nn.Conv2d fallback."
            )
            self.conv1 = nn.Conv2d(in_channels, out_channels, 3, padding=1, bias=False)

        self.gn1 = get_group_norm(out_channels)
        self.relu = nn.ReLU(inplace=True)
        self.dropout = nn.Dropout2d(dropout) if dropout > 0 else nn.Identity()
        self.conv2 = nn.Conv2d(out_channels, out_channels, 3, padding=1, bias=False)
        self.gn2 = get_group_norm(out_channels)
        self.se = ChannelAttention(out_channels)

        self.shortcut: nn.Module = nn.Sequential()
        if in_channels != out_channels:
            self.shortcut = nn.Sequential(
                nn.Conv2d(in_channels, out_channels, 1, bias=False),
                get_group_norm(out_channels),
            )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        res = self.shortcut(x)
        if self._use_deform:
            offset = self.offset_conv(x)
            out = self.conv1(x, offset)
        else:
            out = self.conv1(x)
        out = self.relu(self.gn1(out))
        out = self.dropout(out)
        out = self.gn2(self.conv2(out))
        out = self.se(out)
        return self.relu(out + res)


# ---------------------------------------------------------------------------
# 8. TransformerBottleneck  [Phase 2]
# ---------------------------------------------------------------------------

class TransformerBottleneck(nn.Module):
    """Lightweight Transformer bottleneck (Multi-Head Self-Attention + FFN).

    Replaces ASPP on the timm-backbone path. Operates on flattened spatial
    tokens at the encoder's deepest feature level (1/32 of input resolution).
    Long-range self-attention allows the model to correlate distant building
    instances and road network topology — something dilated convolutions
    at bounded receptive fields cannot achieve.

    Parameters
    ----------
    in_channels : int
        Input channel dimension (backbone bottleneck channels).
    out_channels : int
        Output channel dimension (typically ``base_filters * 16``).
    num_heads : int
        Number of multi-head attention heads (default 8).
    ffn_expansion : int
        FFN hidden-dim multiplier relative to ``out_channels`` (default 4).
    dropout : float
        Dropout in attention and FFN sub-layers (default 0.1).
    """

    def __init__(
        self,
        in_channels: int,
        out_channels: int,
        num_heads: int = 8,
        ffn_expansion: int = 4,
        dropout: float = 0.1,
    ) -> None:
        super().__init__()
        self.out_channels = out_channels

        # Channel projection (in → out) if needed
        self.input_proj = (
            nn.Conv2d(in_channels, out_channels, 1, bias=False)
            if in_channels != out_channels
            else nn.Identity()
        )

        # Ensure num_heads divides out_channels
        _heads = num_heads
        while out_channels % _heads != 0 and _heads > 1:
            _heads -= 1

        self.norm1 = nn.LayerNorm(out_channels)
        self.attn = nn.MultiheadAttention(
            embed_dim=out_channels,
            num_heads=_heads,
            dropout=dropout,
            batch_first=True,
        )
        self.norm2 = nn.LayerNorm(out_channels)
        ffn_dim = out_channels * ffn_expansion
        self.ffn = nn.Sequential(
            nn.Linear(out_channels, ffn_dim),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(ffn_dim, out_channels),
            nn.Dropout(dropout),
        )
        self.attn_drop = nn.Dropout(dropout)
        self.out_norm = get_group_norm(out_channels)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Parameters
        ----------
        x : torch.Tensor
            Shape (B, in_channels, H, W).

        Returns
        -------
        torch.Tensor
            Shape (B, out_channels, H, W) — same spatial size as input.
        """
        B, _, H, W = x.shape

        # Channel projection
        x = self.input_proj(x)                          # (B, out_ch, H, W)

        # Flatten spatial dims → sequence of tokens
        tokens = x.flatten(2).permute(0, 2, 1)         # (B, H*W, out_ch)

        # Multi-Head Self-Attention sublayer
        normed = self.norm1(tokens)
        attn_out, _ = self.attn(normed, normed, normed)
        tokens = tokens + self.attn_drop(attn_out)     # residual

        # FFN sublayer
        tokens = tokens + self.ffn(self.norm2(tokens))  # residual

        # Reshape back to spatial tensor
        out = tokens.permute(0, 2, 1).reshape(B, self.out_channels, H, W)
        return self.out_norm(out)


# ---------------------------------------------------------------------------
# 9. TimmBackboneEncoder  [Phase 2]
# ---------------------------------------------------------------------------

# Channel map: backbone name → ([skip_ch_s1,s2,s3,s4], bottleneck_ch)
# Strides:  s1=stride4, s2=stride8, s3=stride16, s4=stride32
_BACKBONE_CHANNEL_MAP: dict[str, tuple[list[int], int]] = {
    "resnet34":      ([64, 128, 256, 512], 512),
    "convnext_tiny": ([96, 192, 384, 768], 768),
}

# timm out_indices to get strides [4,8,16,32]
_BACKBONE_OUT_INDICES: dict[str, tuple[int, ...]] = {
    "resnet34":      (1, 2, 3, 4),   # skip stem (stride2) → start at layer1 (stride4)
    "convnext_tiny": (0, 1, 2, 3),   # ConvNeXt stages start at stride4
}


class TimmBackboneEncoder(nn.Module):
    """Pretrained encoder backbone using timm's ``features_only`` API.

    Extracts four intermediate feature maps at strides 4, 8, 16, and 32
    from a pretrained ImageNet model for use as U-Net skip connections and
    bottleneck input. Supports ``resnet34`` and ``convnext_tiny``.

    Parameters
    ----------
    backbone : str
        timm model identifier. Must be one of ``'resnet34'``, ``'convnext_tiny'``.
    pretrained : bool
        Load ImageNet-pretrained weights (default True).
    in_channels : int
        Input image channels (default 3).
    """

    def __init__(
        self,
        backbone: str,
        pretrained: bool = True,
        in_channels: int = 3,
    ) -> None:
        super().__init__()
        try:
            import timm  # noqa: F401
        except ImportError as exc:
            raise ImportError(
                "timm is required for pretrained backbones. "
                "Install with: pip install timm>=0.9.0"
            ) from exc

        if backbone not in _BACKBONE_CHANNEL_MAP:
            raise ValueError(
                f"Unsupported backbone '{backbone}'. "
                f"Supported: {sorted(_BACKBONE_CHANNEL_MAP.keys())}"
            )

        import timm as _timm

        self.backbone_name = backbone
        self.skip_channels, self.bottleneck_channels = _BACKBONE_CHANNEL_MAP[backbone]
        out_indices = _BACKBONE_OUT_INDICES[backbone]

        self.encoder = _timm.create_model(
            backbone,
            pretrained=pretrained,
            features_only=True,
            in_chans=in_channels,
            out_indices=out_indices,
        )

        logger.info(
            "TimmBackboneEncoder: backbone=%s pretrained=%s "
            "skip_channels=%s bottleneck_ch=%d",
            backbone, pretrained, self.skip_channels, self.bottleneck_channels,
        )

    def forward(self, x: torch.Tensor) -> list[torch.Tensor]:
        """Return four feature maps at strides [4, 8, 16, 32].

        Returns
        -------
        list[torch.Tensor]
            [s1(stride4), s2(stride8), s3(stride16), s4(stride32)]
        """
        return self.encoder(x)  # list of 4 tensors from timm


# ---------------------------------------------------------------------------
# 10. Full AeroSync Attention ResUNet + ASPP / Transformer Architecture
# ---------------------------------------------------------------------------

class AeroSyncAttentionResUNet(nn.Module):
    """AeroSync Cadastral Segmentation Model.

    **'scratch' backbone (default)**
    ---------------------------------
    Attention ResUNet with ASPP bottleneck:
    - 5-level SE-ResBlock encoder with MaxPool downsampling.
    - ASPP bottleneck for multi-scale context.
    - 4 UpBlockAttention decoder stages with spatial attention gates.
    - Optional deep supervision auxiliary heads (nnU-Net / DeepLab v3+ style).

    **Timm backbone ('resnet34', 'convnext_tiny')**
    ------------------------------------------------
    Pretrained encoder → Transformer bottleneck → CBAM-filtered skip connections:
    - TimmBackboneEncoder extracts 4 multi-scale features (strides 4–32).
    - TransformerBottleneck replaces ASPP for long-range context.
    - DeformableResBlock projections adapt backbone channels to decoder widths.
    - CBAM (channel + spatial self-attention) refines each skip connection.
    - 3 UpBlockAttention decoder stages + 4× bilinear final refinement block.

    All normalisation uses GroupNorm — batch-size agnostic for single-tile
    GeoTIFF inference.

    Parameters
    ----------
    in_channels : int
        Input image channels (default 3 for RGB).
    num_classes : int
        Number of segmentation classes (default 5).
    base_filters : int
        Base channel count ``f``; encoder uses [f, 2f, 4f, 8f, 16f].
    deep_supervision : bool
        Return auxiliary heads during training (default False).
    backbone : str
        ``'scratch'`` (default, no extra deps) or ``'resnet34'`` /
        ``'convnext_tiny'`` (requires ``timm``).
    pretrained : bool
        Load pretrained backbone weights when ``backbone != 'scratch'``
        (default True). Ignored for scratch path.
    """

    def __init__(
        self,
        in_channels: int = 3,
        num_classes: int = 5,
        base_filters: int = 32,
        deep_supervision: bool = False,
        backbone: str = "scratch",
        pretrained: bool = True,
    ) -> None:
        super().__init__()
        f = base_filters
        self.num_classes = num_classes
        self.deep_supervision = deep_supervision
        self.backbone_name = backbone

        # ------------------------------------------------------------------
        # Encoder path — scratch vs. timm
        # ------------------------------------------------------------------
        if backbone == "scratch":
            # ----- Original scratch encoder (fully backward-compatible) -----
            self.enc: Optional[TimmBackboneEncoder] = None
            self.skip_projs: Optional[nn.ModuleList] = None
            self.cbam_skips: Optional[nn.ModuleList] = None
            self.final_refine: Optional[nn.Module] = None

            self.inc    = SE_ResBlock(in_channels, f)
            self.down1  = nn.Sequential(nn.MaxPool2d(2), SE_ResBlock(f,      f * 2))
            self.down2  = nn.Sequential(nn.MaxPool2d(2), SE_ResBlock(f * 2,  f * 4))
            self.down3  = nn.Sequential(nn.MaxPool2d(2), SE_ResBlock(f * 4,  f * 8))
            self.down4  = nn.Sequential(nn.MaxPool2d(2), SE_ResBlock(f * 8,  f * 16))

            # ASPP bottleneck
            self.bottleneck: nn.Module = ASPP(f * 16, f * 16)

        else:
            # ----- Pretrained timm backbone -----
            self.inc = self.down1 = self.down2 = self.down3 = self.down4 = None  # type: ignore[assignment]

            self.enc = TimmBackboneEncoder(backbone, pretrained=pretrained, in_channels=in_channels)
            enc_skip_chs    = self.enc.skip_channels        # [s1, s2, s3, s4]
            enc_bottleneck  = self.enc.bottleneck_channels  # s4 channel count

            # Project encoder skip channels to decoder expected widths using DeformableResBlock
            # s1(stride4) → f*2  (used as skip for up2, deepest active skip)
            # s2(stride8) → f*4  (skip for up3)
            # s3(stride16)→ f*8  (skip for up4)
            # s4(stride32)→ TransformerBottleneck input (no skip proj needed)
            self.skip_projs = nn.ModuleList([
                DeformableResBlock(enc_skip_chs[0], f * 2),   # s1 → f*2
                DeformableResBlock(enc_skip_chs[1], f * 4),   # s2 → f*4
                DeformableResBlock(enc_skip_chs[2], f * 8),   # s3 → f*8
            ])

            # CBAM on each projected skip
            self.cbam_skips = nn.ModuleList([
                CBAM(f * 2),
                CBAM(f * 4),
                CBAM(f * 8),
            ])

            # TransformerBottleneck replaces ASPP
            self.bottleneck = TransformerBottleneck(enc_bottleneck, f * 16)

            # Final refinement: 4× upsample (stride4 → stride1) + feature refine
            self.final_refine = nn.Sequential(
                nn.Upsample(scale_factor=4, mode="bilinear", align_corners=True),
                SE_ResBlock(f * 2, f),
            )

        # ------------------------------------------------------------------
        # Decoder — shared across both paths (up1 only used on scratch path)
        # ------------------------------------------------------------------
        self.up4 = UpBlockAttention(in_channels=f * 16, skip_channels=f * 8,  out_channels=f * 8)
        self.up3 = UpBlockAttention(in_channels=f * 8,  skip_channels=f * 4,  out_channels=f * 4)
        self.up2 = UpBlockAttention(in_channels=f * 4,  skip_channels=f * 2,  out_channels=f * 2)
        # up1 is only used on the scratch path
        self.up1 = UpBlockAttention(in_channels=f * 2,  skip_channels=f,      out_channels=f)

        # Main output head
        self.outc = nn.Conv2d(f, num_classes, kernel_size=1)

        # Optional auxiliary deep supervision heads (scratch path)
        if deep_supervision:
            self.aux_head3 = nn.Conv2d(f * 4, num_classes, kernel_size=1)
            self.aux_head2 = nn.Conv2d(f * 2, num_classes, kernel_size=1)

        logger.info(
            "AeroSyncAttentionResUNet | backbone=%s pretrained=%s "
            "base_filters=%d num_classes=%d deep_supervision=%s GroupNorm=True",
            backbone, pretrained if backbone != "scratch" else "N/A",
            base_filters, num_classes, deep_supervision,
        )

    # ------------------------------------------------------------------
    # Forward
    # ------------------------------------------------------------------

    def forward(
        self, x: torch.Tensor
    ) -> Union[torch.Tensor, tuple[torch.Tensor, list[torch.Tensor]]]:
        """Forward pass.

        Parameters
        ----------
        x : torch.Tensor
            Input image batch, shape (B, in_channels, H, W).

        Returns
        -------
        torch.Tensor
            Logits (B, num_classes, H, W).
            *Or*, when ``deep_supervision=True`` during training:
        tuple[torch.Tensor, list[torch.Tensor]]
            ``(main_logits, [aux3_logits, aux2_logits])``
        """
        if self.backbone_name == "scratch":
            return self._forward_scratch(x)
        else:
            return self._forward_timm(x)

    def _forward_scratch(
        self, x: torch.Tensor
    ) -> Union[torch.Tensor, tuple[torch.Tensor, list[torch.Tensor]]]:
        """Original scratch encoder forward — fully backward-compatible."""
        # Encoder
        x1 = self.inc(x)
        x2 = self.down1(x1)
        x3 = self.down2(x2)
        x4 = self.down3(x3)
        x5 = self.down4(x4)

        # ASPP Bottleneck
        x5 = self.bottleneck(x5)

        # Decoder
        d4 = self.up4(x5, x4)
        d3 = self.up3(d4, x3)
        d2 = self.up2(d3, x2)
        d1 = self.up1(d2, x1)

        main_out = self.outc(d1)

        if self.deep_supervision and self.training:
            aux3 = self.aux_head3(d3)
            aux2 = self.aux_head2(d2)
            return main_out, [aux3, aux2]

        return main_out

    def _forward_timm(
        self, x: torch.Tensor
    ) -> Union[torch.Tensor, tuple[torch.Tensor, list[torch.Tensor]]]:
        """Timm-backbone forward with TransformerBottleneck + CBAM skips."""
        # Extract 4 multi-scale features: [s1(stride4), s2(8), s3(16), s4(32)]
        feats = self.enc(x)
        s1, s2, s3, s4 = feats

        # TransformerBottleneck on deepest feature (stride 32)
        bottleneck = self.bottleneck(s4)  # → (B, f*16, H/32, W/32)

        # Project + CBAM each skip
        sk3 = self.cbam_skips[2](self.skip_projs[2](s3))  # stride16 → f*8
        sk2 = self.cbam_skips[1](self.skip_projs[1](s2))  # stride8  → f*4
        sk1 = self.cbam_skips[0](self.skip_projs[0](s1))  # stride4  → f*2

        # 3-stage decoder (stride 32 → 16 → 8 → 4)
        d4 = self.up4(bottleneck, sk3)  # (B, f*8,  H/16, W/16)
        d3 = self.up3(d4, sk2)          # (B, f*4,  H/8,  W/8)
        d2 = self.up2(d3, sk1)          # (B, f*2,  H/4,  W/4)

        # 4× upsample refinement: stride4 → stride1 (full resolution)
        d1 = self.final_refine(d2)      # (B, f,    H,    W)

        main_out = self.outc(d1)

        if self.deep_supervision and self.training:
            aux3 = self.aux_head3(d3)
            aux2 = self.aux_head2(d2)
            return main_out, [aux3, aux2]

        return main_out


# Backward-compatibility alias — identical to the original
AeroSyncUNet = AeroSyncAttentionResUNet
