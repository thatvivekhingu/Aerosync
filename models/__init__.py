# AeroSync Models Package — v2.5 Enterprise Grade
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
from .geometry import (
    adaptive_cadastral_regularization,
    compute_orthogonality_score,
    mask_to_cadastral_geojson,
    orthogonalize_polygon,
    regularize_polygon,
    separate_abutting_buildings,
)

# --- Uncertainty ---
from .uncertainty import (
    FastEvidentialUncertainty,
    FastTTAInference,
    MCDropoutInference,
    ProductionInference,
    TTAInference,
)

# --- Training Utilities ---
from .utils import (
    ModelEMA,
    TrainingConfig,
    export_to_onnx,
    get_group_norm,
    hann_weighted_2d_window,
    seamless_tile_stitch,
    set_seed,
)

# --- Data Pipeline ---
from .data import (
    CadastralDroneDataset,
    HardExampleMiner,
    SpatialSplitter,
    make_dataloaders,
    make_weighted_sampler,
)

# --- Augmentation ---
from .augmentation import (
    apply_rural_roof_heterogeneity,
    decode_mask_to_color,
    get_fast_tta_transforms,
    get_train_transforms,
    get_tta_transforms,
    get_val_transforms,
)

# --- Trainer ---
from .trainer import AeroSyncTrainer

# --- RAG & Cadastral LLM ---
from .rag import (
    AeroSyncCadastralLLM,
    CadastralKnowledgeBase,
    DEFAULT_SVAMITVA_KNOWLEDGE_DOCS,
    ParcelRecord,
    SpatialGeoJSONRetriever,
    audit_regulatory_compliance,
    generate_property_card,
)

# --- Next-Level Remote Sensing Techniques ---
from .change_detection import (
    CadastralChangeDetector,
    ChangeMetric,
    ChangeType,
    SiameseDifferenceUNet,
)
from .sam_adapter import PromptableCadastralSegmenter
from .indices import (
    compute_gli,
    compute_ndwi_rgb,
    compute_shadow_plinth_index,
    compute_vari,
    generate_spectral_layer_stack,
)
from .super_res import CadastralSuperResolutionNet, enhance_drone_patch
from .xai import CadastralGradCAM, generate_legal_audit_heatmap

__all__ = [
    # Constants
    "CLASS_NAMES",
    "CLASS_COLORS",
    "ROAD_CLASS_ID",
    # Architecture
    "ChannelAttention",
    "SE_ResBlock",
    "AttentionGate",
    "ASPP",
    "UpBlockAttention",
    "AeroSyncAttentionResUNet",
    "AeroSyncUNet",
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
    "adaptive_cadastral_regularization",
    "compute_orthogonality_score",
    "separate_abutting_buildings",
    "mask_to_cadastral_geojson",
    # Uncertainty
    "MCDropoutInference",
    "FastEvidentialUncertainty",
    "TTAInference",
    "FastTTAInference",
    "ProductionInference",
    # Training Utilities
    "set_seed",
    "get_group_norm",
    "TrainingConfig",
    "export_to_onnx",
    "ModelEMA",
    "hann_weighted_2d_window",
    "seamless_tile_stitch",
    # Data Pipeline
    "CadastralDroneDataset",
    "SpatialSplitter",
    "HardExampleMiner",
    "make_weighted_sampler",
    "make_dataloaders",
    # Augmentation
    "get_train_transforms",
    "get_val_transforms",
    "get_tta_transforms",
    "get_fast_tta_transforms",
    "apply_rural_roof_heterogeneity",
    "decode_mask_to_color",
    # Trainer
    "AeroSyncTrainer",
    # RAG & Cadastral LLM
    "CadastralKnowledgeBase",
    "DEFAULT_SVAMITVA_KNOWLEDGE_DOCS",
    "ParcelRecord",
    "SpatialGeoJSONRetriever",
    "audit_regulatory_compliance",
    "generate_property_card",
    "AeroSyncCadastralLLM",
    # Next-Level Extensions
    "ChangeType",
    "ChangeMetric",
    "SiameseDifferenceUNet",
    "CadastralChangeDetector",
    "PromptableCadastralSegmenter",
    "compute_vari",
    "compute_gli",
    "compute_ndwi_rgb",
    "compute_shadow_plinth_index",
    "generate_spectral_layer_stack",
    "CadastralSuperResolutionNet",
    "enhance_drone_patch",
    "CadastralGradCAM",
    "generate_legal_audit_heatmap",
]
