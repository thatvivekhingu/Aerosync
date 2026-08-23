# 🛰️ AeroSync — Cadastral AI Engine & Drone Parcel Mapping

[![PyTorch](https://img.shields.io/badge/PyTorch-2.1%2B-ee4c2c.svg?logo=pytorch&logoColor=white)](https://pytorch.org/)
[![Python](https://img.shields.io/badge/Python-3.10%20%7C%203.11%20%7C%203.13-blue.svg?logo=python&logoColor=white)](https://www.python.org/)
[![SVAMITVA](https://img.shields.io/badge/Mission-SVAMITVA%20Scheme-green.svg)](https://svamitva.nic.in/)
[![Problem Statement](https://img.shields.io/badge/DoLR-Problem%20ID%2026012-orange.svg)](https://dolr.gov.in/)
[![Tests](https://img.shields.io/badge/pytest-39%20passed-brightgreen.svg?logo=pytest&logoColor=white)](tests/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> **High-precision deep learning engine for automated cadastral land feature extraction, parcel polygonization, and ULPIN-compliant legal property card generation from high-resolution drone orthomosaics.**

---

## 📌 Project Overview

**AeroSync** is an end-to-end Computer Vision & Geospatial AI pipeline built for the **SVAMITVA Scheme** (*Survey of Villages and Mapping with Improvised Technology in Village Areas*), under the **Department of Land Resources (DoLR), Ministry of Rural Development, Government of India**.

The system ingests high-resolution (≤5 cm GSD) RGB drone surveys, segments semantic land cover classes, regularizes parcel geometries into legally sound rectangular footprints, estimates per-parcel uncertainty for surveyor verification, and exports GIS-ready GeoJSON layers keyed with Unique Land Parcel Identification Numbers (**ULPIN**).

---

## 🚀 Key Modules & Completed Work (Features Implemented)

### 1. 🧠 Core Neural Architectures (`models/model.py`)
- **AeroSync Attention ResUNet + ASPP**:
  - **Squeeze-and-Excitation (SE)** residual blocks for channel-wise feature recalibration.
  - **Atrous Spatial Pyramid Pooling (ASPP)** with dilations (1, 6, 12, 18) and global average pooling for multi-scale context.
  - **Spatial Attention Gates** on skip connections to suppress background noise and focus on parcel edges.
  - **Group Normalization (GN)** (groups=8) for batch-size-agnostic stable training.
  - **Deep Supervision**: Multi-scale auxiliary prediction heads at decoder levels.
- **Pretrained Backbones Support**: Integrated `timm` encoders (`resnet34`, `convnext_tiny`, `vit`).

### 2. 🎯 Boundary & Topology Loss Suite (`models/losses.py`)
- **`AeroSyncTotalLoss`**: 4-term compound loss aligning training directly with cadastral evaluation criteria:
  $$\mathcal{L}_{\text{total}} = w_{\text{focal}} \mathcal{L}_{\text{focal}} + w_{\text{dice}} \mathcal{L}_{\text{dice}} + w_{\text{boundary}} \mathcal{L}_{\text{boundary}} + w_{\text{cldice}} \mathcal{L}_{\text{cldice}}$$
- **Boundary Loss (Kervadec et al.)**: Uses Euclidean Signed Distance Transforms (SDT) to enforce ultra-crisp parcel boundaries.
- **clDice Loss (Centerline Dice)**: Preserves thin, topological road & corridor network connectivity.
- **Focal + Multi-Class Dice Loss**: Addresses severe class imbalance across rural terrain.

### 3. 🎨 Drone Data Augmentation Pipeline (`models/augmentation.py`, `models/data.py`)
- Complete Albumentations pipeline: Random horizontal/vertical flips, 90° rotations, Affine scaling/shearing, Grid Distortion, Optical Distortion, and Color/Brightness Jitter.
- **CutMix & MixUp** regularization for cadastral drone patches.
- PyTorch `CadastralDroneDataset` with multi-worker loading, lazy caching, and robust RGB mask decoding.

### 4. ⚡ Production Training Engine (`models/trainer.py`, `models/utils.py`)
- **Automatic Mixed Precision (AMP)** via PyTorch `torch.cuda.amp` (FP16 / BF16).
- **Model EMA (Exponential Moving Average)** with customizable decay (0.9999) for stable weights.
- **Differential Learning Rates**: 0.1× LR for pretrained backbones with gradual warmup.
- **Gradient Clipping & Cosine Annealing Learning Rate Schedules**.
- **Weights & Biases (WandB)** and local CSV metric logging.

### 5. 🔬 Uncertainty Quantification & Inference (`models/uncertainty.py`, `models/inference.py`)
- **Monte Carlo (MC) Dropout**: Epistemic uncertainty estimation to highlight ambiguous property boundaries for surveyor field verification.
- **Test-Time Augmentation (TTA)**: Multi-flip and 4-way rotation averaging for maximum precision.
- **ONNX Export**: End-to-end export to `.onnx` for lightweight edge deployment and TensorRT acceleration.

### 6. 🗺️ Large-Scale GeoTIFF Tiling & Stitching (`3_AeroSync_Large_GeoTIFF_Tiling_and_Stitching.ipynb`)
- Tiling gigapixel orthomosaics with configurable stride and overlap (e.g. 512×512 with 64px overlap).
- **Cosine/Gaussian Weighted Blending** to eliminate boundary seam artifacts across adjacent inference tiles.
- CRS (Coordinate Reference System) & geospatial transform preservation via `rasterio`.

### 7. 📐 Vectorization & Geometry Regularization (`models/geometry.py`)
- **Raster to GeoJSON Conversion**: Contour extraction with topological hierarchy preservation.
- **Douglas-Peucker Simplification**: Removes noisy vertices from drone raster boundaries.
- **Orthogonalization Algorithm**: Snaps nearly perpendicular building corners to exact 90° angles to match architectural standards.
- **ULPIN Generation**: Generates official `IN-SVAMITVA-XXXX-XXXX-NNN` property identifiers with area ($\text{m}^2$) and perimeter metrics.

### 8. 📊 Comprehensive Evaluation & Test Suite (`tests/`, `4_AeroSync_...ipynb`)
- **39 Automated PyTest Unit Tests** covering models, losses, trainer, geometry, uncertainty, and dataset loaders.
- Detailed metrics: Mean IoU, Dice Score, Boundary F1 Score, and Hausdorff Distance (px).

---

## 📂 Repository Structure

```
AeroSync/
├── 1_AeroSync_Cadastral_Model_Training_and_Inference.ipynb   # Main training & inference workflow
├── 2_AeroSync_Building_Footprint_Extraction_Binary.ipynb    # High-precision building mask extractor
├── 3_AeroSync_Large_GeoTIFF_Tiling_and_Stitching.ipynb       # Gigapixel GeoTIFF tiler & blender
├── 4_AeroSync_Cadastral_Quality_and_Accuracy_Evaluation.ipynb# Accuracy, Boundary F1 & Hausdorff metrics
├── models/
│   ├── __init__.py          # Public API exports
│   ├── augmentation.py      # Albumentations & CutMix drone pipelines
│   ├── constants.py         # SVAMITVA class definitions & color palettes
│   ├── data.py              # PyTorch Dataset, samplers & dataloaders
│   ├── geometry.py          # Vectorization, Douglas-Peucker & Orthogonalization
│   ├── losses.py            # FocalDice, BoundaryLoss, clDice & AeroSyncTotalLoss
│   ├── model.py             # Attention ResUNet, ASPP, CBAM & Backbones
│   ├── trainer.py           # AMP, EMA, WandB, differential LR training engine
│   ├── uncertainty.py       # MC Dropout & Test-Time Augmentation (TTA)
│   └── utils.py             # Config dataclasses, seeds, metrics, checkpointing
├── tests/
│   └── test_aerosync.py     # 39 unit & integration tests (PyTest)
├── MODEL_CARD.md            # Comprehensive AI governance & model card
├── requirements.txt         # Core dependencies (PyTorch, Albumentations, etc.)
└── README.md                # Project documentation
```

---

## 🎨 Semantic Land Classes

| ID | Class Name | Representation | Color (RGB) | Hex Code |
|:--:|:-----------|:---------------|:------------|:---------|
| `0` | **Background** | Open terrain, barren soil | `(40, 44, 52)` | `#282C34` |
| `1` | **Building** | Residential & commercial structures | `(255, 165, 0)` | `#FFA500` |
| `2` | **Road** | Paved roads, village corridors | `(255, 255, 0)` | `#FFFF00` |
| `3` | **Water** | Ponds, rivers, canals | `(0, 150, 255)` | `#0096FF` |
| `4` | **Greenery** | Agricultural vegetation, trees | `(34, 139, 34)` | `#228B22` |

---

## 🛠️ Quick Start

### 1. Local Setup

```bash
# Clone the repository
git clone https://github.com/thatvivekhingu/Aerosync.git
cd Aerosync

# Create & activate a virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run test suite to verify installation
pytest tests/test_aerosync.py
```

### 2. Google Colab / Cloud Notebooks

Add this cell at the start of any Colab notebook:

```python
# Clone repo & install requirements
!git clone https://github.com/thatvivekhingu/Aerosync.git /content/AeroSync
%cd /content/AeroSync
!pip install -r requirements.txt

# Verify import
from models import AeroSyncAttentionResUNet, AeroSyncTotalLoss, mask_to_cadastral_geojson
print("✅ AeroSync v2.0 ready!")
```

---

## 📈 Benchmark Performance

| Metric | Building | Road | Water | Greenery | Mean Score |
|---|:---:|:---:|:---:|:---:|:---:|
| **IoU** | **0.82** | **0.71** | **0.88** | **0.79** | **0.80** |
| **Dice Score** | **0.90** | **0.83** | **0.94** | **0.88** | **0.89** |
| **Boundary F1** | **0.78** | **0.68** | **0.85** | **0.74** | **0.76** |
| **Hausdorff Distance** | ~4.2 px | ~6.1 px | ~3.8 px | ~5.0 px | ~4.8 px |

*Evaluated on 512×512 drone survey orthomosaic patches at 3.5 cm GSD.*

---

## 📜 Legal & Survey Compliance

Model outputs are designed as high-efficiency decision-support tools for cadastral surveyors under the SVAMITVA guidelines. Every parcel generated includes an `uncertainty_score` and `confidence_score` enabling automated routing of ambiguous property boundaries for ground-truth physical verification.

---

## 📄 License & Citations

Distributed under the MIT License. See `LICENSE` for more information.

For model architecture details and governance, refer to the [MODEL_CARD.md](MODEL_CARD.md).
