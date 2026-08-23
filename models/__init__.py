# AeroSync Models Package — v2.0 Production Grade
# Re-exports all public APIs from sub-modules.
# Zero breaking changes — all original import paths continue to work.

# --- Constants ---
from .constants import CLASS_COLORS, CLASS_NAMES, ROAD_CLASS_ID

# --- Architecture ---
from .model import (
    ASPP,
    AeroSyncAttentionResUNet,
    AttentionGate,
    ChannelAttention,
    SE_ResBlock,
    UpBlockAttention,
    # Phase 2 additions
    SpatialAttention,
    CBAM,
    DeformableResBlock,
    TransformerBottleneck,
    TimmBackboneEncoder,
)

# Backward-compat aliases
AeroSyncUNet = AeroSyncAttentionResUNet

# --- Losses ---
from .losses import (
    AeroSyncTotalLoss,
    BoundaryLoss,
    CombinedCadastralLoss,
    FocalDiceCadastralLoss,
    clDiceLoss,
)

# --- Geometry ---
from .geometry import mask_to_cadastral_geojson, orthogonalize_polygon, regularize_polygon

# --- Uncertainty ---
from .uncertainty import MCDropoutInference, ProductionInference, TTAInference

# --- Training Utilities ---
from .utils import ModelEMA, TrainingConfig, export_to_onnx, get_group_norm, set_seed

# --- Data Pipeline ---
from .data import (
    CadastralDroneDataset,
    HardExampleMiner,
    SpatialSplitter,
    make_dataloaders,
    make_weighted_sampler,
)

# --- Augmentation ---
from .augmentation import decode_mask_to_color, get_train_transforms, get_val_transforms

# --- Trainer ---
from .trainer import AeroSyncTrainer

__all__ = [
    # Constants
    "CLASS_NAMES",
    "CLASS_COLORS",
    "ROAD_CLASS_ID",
    # Architecture — original
    "ChannelAttention",
    "SE_ResBlock",
    "AttentionGate",
    "ASPP",
    "UpBlockAttention",
    "AeroSyncAttentionResUNet",
    "AeroSyncUNet",
    # Architecture — Phase 2
    "SpatialAttention",
    "CBAM",
    "DeformableResBlock",
    "TransformerBottleneck",
    "TimmBackboneEncoder",
    # Losses
    "FocalDiceCadastralLoss",
    "CombinedCadastralLoss",
    "BoundaryLoss",
    "clDiceLoss",
    "AeroSyncTotalLoss",
    # Geometry
    "regularize_polygon",
    "orthogonalize_polygon",
    "mask_to_cadastral_geojson",
    # Uncertainty
    "MCDropoutInference",
    "TTAInference",
    "ProductionInference",
    # Utils
    "set_seed",
    "get_group_norm",
    "TrainingConfig",
    "ModelEMA",
    "export_to_onnx",
    # Data
    "CadastralDroneDataset",
    "SpatialSplitter",
    "HardExampleMiner",
    "make_weighted_sampler",
    "make_dataloaders",
    # Augmentation
    "get_train_transforms",
    "get_val_transforms",
    "decode_mask_to_color",
    # Trainer
    "AeroSyncTrainer",
]
