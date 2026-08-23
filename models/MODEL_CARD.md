# AeroSync Cadastral AI Engine — Model Card

## Model Overview

| Field | Value |
|---|---|
| **Model name** | AeroSync Attention ResUNet + ASPP |
| **Version** | 2.0 (production-grade) |
| **Task** | Multi-class semantic segmentation of cadastral land features |
| **Primary use** | SVAMITVA-scheme land-record generation from drone orthomosaics |
| **Problem Statement** | DoLR / Ministry of Rural Development, ID 26012 |
| **Architecture** | SE-Attention ResUNet + ASPP, GroupNorm, optional deep supervision |
| **Input** | RGB drone orthomosaic patches (H × W × 3, default 512 × 512) |
| **Output** | Per-pixel class probabilities (5 classes) + GeoJSON parcel polygons |

---

## Intended Use

### Primary Use Cases
- Automated extraction of **building footprints** from high-resolution (≤5 cm GSD) drone surveys for SVAMITVA property rights mapping in rural India.
- **Multi-class land cover segmentation** (Background, Building, Road, Water, Greenery) to generate digital property cards (ULPIN-keyed GeoJSON).
- **Quality screening** of AI-generated cadastral boundaries via per-polygon confidence and uncertainty scores, routing low-confidence parcels to field surveyors for manual verification.

### Out-of-Scope Uses
- **Urban high-rise environments**: The model was trained on rural village drone imagery. Dense urban areas with high building occlusion and shadow are not validated use cases.
- **Satellite imagery** (resolution > 50 cm GSD): The model expects centimetre-scale drone inputs; satellite imagery will degrade performance significantly.
- **Non-RGB inputs**: Multispectral / LiDAR channels are not supported in this version.
- **Legal adjudication**: Model outputs are AI-generated aids for surveyors, NOT legally binding cadastral records. All outputs require human review before registration.

---

## Training Data

| Field | Description |
|---|---|
| **Source** | SVAMITVA drone survey imagery — rural villages across multiple Indian states |
| **GSD** | ~3.5 cm/pixel (default `pixel_scale=0.035544 m`) |
| **Classes** | 5: Background (0), Building (1), Road (2), Water (3), Greenery (4) |
| **Annotation** | Manual pixel-level masks; colour-coded RGB (orange=Building, yellow=Road, blue=Water, green=Greenery) |
| **Splits** | ~85% train / 15% validation |
| **Augmentations** | Random horizontal/vertical flip, 90° rotation, colour jitter |

> [!NOTE]
> Training data is village-centric and skewed toward flat-roofed concrete/masonry structures. Performance on thatched/sloped roofs or dense tree canopies overhanging buildings may be degraded.

---

## Architecture Details

```
Input (3×512×512)
  │
  ├─ Encoder: SE_ResBlock × 5 (base_filters=32 → 512)
  │           MaxPool2d ×4 between levels
  │
  ├─ Bottleneck: ASPP (dilations 1, 6, 12, 18 + global pool)
  │
  ├─ Decoder: UpBlockAttention × 4
  │           (bilinear upsample + AttentionGate + SE_ResBlock)
  │           [optional: auxiliary heads on up3, up2 for deep supervision]
  │
  └─ Output: Conv2d(f, num_classes, 1×1)
             → (5×512×512) logits
```

**Normalization:** GroupNorm throughout (groups=8, batch-size agnostic).  
**Attention:** SE channel attention (CBAM-style) + spatial attention gates on skip connections.

---

## Evaluation Metrics (Reference Benchmarks)

> [!IMPORTANT]
> Metrics below are indicative benchmarks from development validation sets. Re-evaluate on your specific survey area imagery before deployment.

| Metric | Building | Road | Water | Greenery | Mean |
|---|---|---|---|---|---|
| **IoU** | ~0.82 | ~0.71 | ~0.88 | ~0.79 | ~0.80 |
| **Dice** | ~0.90 | ~0.83 | ~0.94 | ~0.88 | ~0.89 |
| **Boundary F1** | ~0.78 | ~0.68 | ~0.85 | ~0.74 | ~0.76 |
| **Hausdorff (px)** | ~4.2 | ~6.1 | ~3.8 | ~5.0 | ~4.8 |

*Evaluated on 512×512 crops at 3.5 cm GSD using notebook 4.*

---

## Known Limitations & Failure Modes

| Failure Mode | Severity | Mitigation |
|---|---|---|
| **Building–tree boundary confusion** | Medium | Greenery class absorbs mixed-canopy roof pixels; field verify parcels with `uncertainty_score > 0.15` |
| **Narrow road connectivity breaks** | Medium | clDiceLoss (v2.0) improves but doesn't eliminate; use topology validation in notebook 4 |
| **Dense village compound walls** | High | Compound walls thinner than ~20 cm (< 6 pixels) may not be detected as Road |
| **Shadow occlusion** | Medium | Predictions under tree/building shadow are less reliable; uncertainty scores will be elevated |
| **Inter-tile boundary artifacts** | Low | Addressed by overlapping tile stitching in notebook 3; blend radius = 64px |
| **Seasonal vegetation variability** | Low | Re-train or fine-tune if survey imagery is from a different season than training data |

---

## Output Fields (GeoJSON Properties)

| Field | Type | Description |
|---|---|---|
| `parcel_id` | int | Sequential ID within tile |
| `ulpin` | string | `IN-SVAMITVA-XXXX-XXXX-NNN` format unique identifier |
| `feature_type` | string | Human-readable class name |
| `area_sqm` | float | Polygon area in square metres |
| `perimeter_m` | float | Polygon perimeter in metres |
| `confidence_score` | float \| null | Mean softmax probability inside polygon (null = prob_map not provided) |
| `uncertainty_score` | float \| null | Std of per-pixel probabilities inside polygon (null = prob_map not provided) |
| `validation_status` | string | `AI_Attention_Generated_Validated` \| `DEMO_PLACEHOLDER` |

---

## Inference Recommendations

| Scenario | Recommended Mode |
|---|---|
| Fast production batch | `TTAInference(model, use_flips=True, use_rotations=False)` |
| Legal-grade deliverable | `ProductionInference(model, n_mc_passes=10, use_flips=True, use_rotations=True)` |
| Low-memory edge device | `model.eval()` single pass; set `base_filters=16` |

---

## Reproducibility

All random seeds should be set at the start of each training run:

```python
from models.utils import set_seed
set_seed(42)
```

Training configuration should be saved alongside each checkpoint:

```python
from models.utils import TrainingConfig
cfg = TrainingConfig(experiment_name="svamitva_v2", learning_rate=3e-4)
cfg.save("checkpoints/run_001/config.json")
```

---

## Citation / References

- Attention U-Net: Oktay et al., 2018 — [arXiv:1804.03999](https://arxiv.org/abs/1804.03999)
- ASPP (DeepLab v3): Chen et al., 2017 — [arXiv:1706.05587](https://arxiv.org/abs/1706.05587)
- Boundary Loss: Kervadec et al., 2019 — MIDL / Medical Image Analysis
- clDice: Shit et al., 2021 — [arXiv:2003.07311](https://arxiv.org/abs/2003.07311)
- SE Networks: Hu et al., 2018 — [arXiv:1709.01507](https://arxiv.org/abs/1709.01507)

---

## Contact & Responsible Use

This model is developed as part of the AeroSync project for the SVAMITVA scheme (DoLR, Ministry of Rural Development, Government of India). Model outputs must be reviewed by licensed surveyors before use in official land records.
