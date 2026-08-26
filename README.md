# 🛰️ AeroSync — Drone Se Digital Zameen Ke Kagaz (SVAMITVA AI)

[![Python](https://img.shields.io/badge/Python-3.10%2B%20%7C%203.13-blue.svg)](https://www.python.org/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.1%2B-EE4C2C.svg)](https://pytorch.org/)
[![Tests](https://img.shields.io/badge/Tests-44%2F44%20Passing-brightgreen.svg)](tests/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Problem Statement](https://img.shields.io/badge/DoLR%20%7C%20MoRD-PS%2026012-orange.svg)](https://www.dolr.gov.in/)

> **AeroSync** ek end-to-end AI-powered Cadastral Land Intelligence Platform hai jo drone dwara li gayi high-resolution rural orthomosaic images ko scan karta hai, usme se **makaan (buildings), sadak (roads), talab (water), aur khet/ped (greenery)** ko segment karta hai, geometric boundaries ko legally 90° par seedha karta hai, legal **ULPIN (Bhu-Aadhaar)** assign karta hai, aur **RAG / LLM Assistant** ke sath direct **SVAMITVA Property Card (Gharoni)** generate karta hai.

---

## 🎯 Asal Problem Kya Hai? (Why AeroSync?)

Bharat sarkar ki **SVAMITVA Scheme (Ministry of Panchayati Raj & DoLR)** ke tahat pure desh ke gaon me drone survey se aabaadi zameen ke digital records banaye ja rahe hain. 

Lekin bade drone orthomosaics se manually gharon aur boundaries ko trace karna:
- **Bohot slow aur mehenga** hai (ek gaon me kai hafte lagte hain).
- **Human errors aur border disputes** create karta hai.
- Pedon ki chhaon aur abutting walls ke karan kone tedhe-medhe ho jate hain.

### 💡 AeroSync Ka Solution:
1. **Drone Image Input**: Gigapixel GeoTIFF ya drone patches dalo.
2. **Attention ResUNet + ASPP AI**: Pixel-by-pixel multi-class segmentation karta hai.
3. **Geometry Regularization**: Tedhi AI lines ko clean 90° rectangular legal boundaries me convert karta hai.
4. **ULPIN Auto-Generation**: Har property ko unique 14-digit **Bhu-Aadhaar ID** aur exact area ($m^2$ / $ft^2$) deta hai.
5. **Uncertainty Quantification**: Monte Carlo Dropout se low-confidence parcels par automatic **"Surveyor Verification Needed"** flag lagata hai.
6. **Geo-Cadastral RAG & LLM Engine**: Natural language me sawal poochho, legal buffer encroachment check karo, aur turant **SVAMITVA Property Card** draft pao.

---

## 🛠️ Complete System Architecture (9 Core Modules)

AeroSync ko 9 production-grade modular components me design kiya gaya hai:

```
AeroSync/
│
├── 📁 dataset/                         # SVAMITVA Drone Imagery & Checkpoints
│   └── Svamitva/
│       ├── FilteredData/               # 690 Patches (Images, Masks, BinaryMasks)
│       ├── Full Data/                  # Complete raw drone tiles
│       ├── TestGeoTiff/                # Village-scale orthomosaics (.tif)
│       └── PreTrainedModels/           # Pretrained 512/1024 Keras Model Weights
│
├── 📁 notebooks/                       # 5 Interactive Jupyter Pipelines
│   ├── 1_AeroSync_Cadastral_Model_Training_and_Inference.ipynb
│   ├── 2_AeroSync_Building_Footprint_Extraction_Binary.ipynb
│   ├── 3_AeroSync_Large_GeoTIFF_Tiling_and_Stitching.ipynb
│   ├── 4_AeroSync_Cadastral_Quality_and_Accuracy_Evaluation.ipynb
│   └── 5_AeroSync_Cadastral_RAG_and_LLM_Assistant.ipynb
│
├── 📁 models/                          # Core Python Engine
│   ├── rag.py                          # Cadastral RAG, LLM Chat, Buffer Audit & Property Cards
│   ├── model.py                        # Attention ResUNet, ASPP, CBAM, ConvNeXt, ResNet34
│   ├── losses.py                       # Focal, Dice, Boundary Loss, clDice (thin-structure)
│   ├── trainer.py                      # Mixed-Precision (AMP), Model EMA, WandB
│   ├── data.py                         # Dataset Loader, Hard Example Mining, Spatial Split
│   ├── augmentation.py                 # Albumentations, CutMix, Drone Lighting Filters
│   ├── geometry.py                     # 90° Orthogonalization, ULPIN & Legal GeoJSON Export
│   ├── uncertainty.py                  # Monte Carlo Dropout & Test-Time Augmentation (TTA)
│   ├── constants.py                    # Cadastral Class Names, Colors & IDs
│   └── utils.py                        # Configs, Seed, ONNX Export
│
├── 📁 tests/                           # Automated PyTest Test Suite
│   ├── test_aerosync.py                # CV, Loss, Geometry & Uncertainty Tests (39 tests)
│   └── test_rag.py                     # RAG, GeoJSON Query, LLM & Property Card Tests (5 tests)
│
├── requirements.txt                    # Project Dependencies
├── MODEL_CARD.md                       # Technical Model Specifications
└── README.md                           # Documentation
```

---

## 🔬 Core AI Modules Explained

### 1. 🧠 Custom Vision Architectures (`models/model.py`)
- **Attention ResUNet + ASPP**: Multi-scale atrous spatial pooling aur attention gates jo drone imagery me chote ghar aur lambi patli sadakon ko focus me rakhte hain.
- **Backbone Flexibility**: Scratch encoder ke sath-sath pretrained **ResNet-34**, **ConvNeXt**, aur **ViT** support.
- **Attention Modules**: Channel Attention, Spatial Attention, aur **CBAM** feature refinement.

### 2. 🎯 Multi-Loss Optimization (`models/losses.py`)
- **Focal + Dice Loss**: Extreme class imbalance (e.g., choti sadak vs bada background) ko balance karta hai.
- **Boundary Loss**: Parcel boundaries ke sharp edges preserve karta hai taaki kone gol na hon.
- **clDice Loss (Skeleton Loss)**: Thin structures jaise gaon ki patli galiyon aur raste ki connectivity tootne nahi deta.

### 3. 📸 Drone Data Augmentation (`models/augmentation.py`)
- Drone survey ke alag-alag flight altitude, sun shadows, brightness variations, rotation, aur **CutMix** regularizations.

### 4. ⚡ High-Speed Training Engine (`models/trainer.py`)
- **Automatic Mixed Precision (AMP)**: GPU memory bacha kar 2x fast training karta hai.
- **Model EMA (Exponential Moving Average)**: Stable aur smooth weights maintain karta hai.
- **Hard Example Mining**: Jin areas me AI confuse hota hai unhe training me zyada weight deta hai.

### 5. 🔍 Uncertainty & Surveyor Doubt Checker (`models/uncertainty.py`)
- **Monte Carlo (MC) Dropout**: Model 10+ forward passes chalakar pixel-level variance calculate karta hai.
- **Test-Time Augmentation (TTA)**: 8-transform rotation/flip averaging se robust prediction milti hai.
- **Flagging**: Jis parcel ka confidence < 0.70 ho, use automatically **"Surveyor Physical Verification Needed"** mark kar diya jata hai.

### 6. 🗺️ Gigapixel GeoTIFF Tiling & Stitching (`notebooks/3_...ipynb`)
- Badi drone maps (10,000×10,000+ pixels) ko 512×512 tiles me overlap ke sath slice karta hai aur bina boundary seams ke smooth stitch karta hai.

### 7. 📐 Legal Geometry & 90° Orthogonalization (`models/geometry.py`)
- AI ke rough pixel masks ko clean vector **GeoJSON polygons** me convert karta hai.
- Ghar ke kono ko 90 degree par seedha karta hai aur international bounding box coordinates se legal **14-digit ULPIN ID** assign karta hai.

### 8. 📊 Cadastral Quality & Accuracy Audit (`notebooks/4_...ipynb`)
- **mIoU, Dice, Boundary-F1, Precision, Recall** calculation.
- **Reliability Calibration Diagram (ECE)** aur **K-Fold Cross Validation**.
- **Environmental Robustness Stress Testing** (Gaussian Noise, Blur, Shadow, Occlusion degradation curves).

### 9. 🧠 Geo-Cadastral RAG & LLM Land Assistant (`models/rag.py` & `notebooks/5_...ipynb`)
- **SVAMITVA Legal Knowledge Base**: DoLR PS 26012 SOPs, ULPIN norms, boundary dispute handling rules ka semantic store.
- **Natural Language Spatial Queries**: GeoJSON survey output se direct Hindi/English me sawal pooch sakte hain.
- **Buffer & Encroachment Auditing**: Talab/Water Body ($\ge 15\text{m}$) aur Sadak/Road ($\ge 3\text{m}$) ke pass illegal building construction ko detect karta hai.
- **SVAMITVA Property Card Generator**: Kisi bhi ULPIN ka official Form 1 Gharoni Property Card draft turant generate karta hai.
- **Multi-Backend**: Google Gemini API, OpenAI, local LLMs, ya built-in **Offline Reasoner** (zero API key needed).

---

## 📓 The 5 Interactive Jupyter Notebooks

| # | Notebook | Kaam (Purpose) |
|---|---|---|
| **1** | [1_AeroSync_Cadastral_Model_Training_and_Inference.ipynb](file:///c:/AeroSync/notebooks/1_AeroSync_Cadastral_Model_Training_and_Inference.ipynb) | Multi-Class Attention ResUNet model training, validation, aur GeoJSON parcel generation. |
| **2** | [2_AeroSync_Building_Footprint_Extraction_Binary.ipynb](file:///c:/AeroSync/notebooks/2_AeroSync_Building_Footprint_Extraction_Binary.ipynb) | Dedicated Ultra-High Precision Binary Building Footprint extractor aur area estimator. |
| **3** | [3_AeroSync_Large_GeoTIFF_Tiling_and_Stitching.ipynb](file:///c:/AeroSync/notebooks/3_AeroSync_Large_GeoTIFF_Tiling_and_Stitching.ipynb) | Village-scale large GeoTIFF drone maps ko tile, batch infer aur stitch karne ka pipeline. |
| **4** | [4_AeroSync_Cadastral_Quality_and_Accuracy_Evaluation.ipynb](file:///c:/AeroSync/notebooks/4_AeroSync_Cadastral_Quality_and_Accuracy_Evaluation.ipynb) | mIoU, Boundary-F1, Confusion Matrix, ECE Calibration, K-Fold CV aur Stress Testing. |
| **5** | [5_AeroSync_Cadastral_RAG_and_LLM_Assistant.ipynb](file:///c:/AeroSync/notebooks/5_AeroSync_Cadastral_RAG_and_LLM_Assistant.ipynb) | Cadastral RAG & AI Chat Assistant for legal guidelines, encroachment audit, aur Property Cards. |

---

## 🎨 Cadastral Classes (Model Kya-Kya Pehchanta Hai)

| Class ID | Class Name | Description | Color Palette |
|---|---|---|---|
| **0** | **Background** | Khali zameen, open soil, unclassified | Dark Charcoal `(40, 44, 52)` |
| **1** | **Building** | Ghar, dukan, kachha/pakka rural structure | Bright Orange `(255, 165, 0)` |
| **2** | **Road** | Sadak, pakki sadak, gaon ki galiyan, raste | Yellow `(255, 255, 0)` |
| **3** | **Water** | Talab, nala, pokhar, water channels | Deep Cyan/Blue `(0, 150, 255)` |
| **4** | **Greenery** | Khet, fasal, ped-paudhe, open grass | Forest Green `(34, 139, 34)` |

---

## 🧪 Testing & Verification (44/44 Tests Passing)

Hamare paas complete automated test coverage hai jo models, losses, geometry, uncertainty aur RAG modules ko verify karti hai:

```bash
# Run all unit tests
python -m pytest tests/ -v
```

```
============================= test session starts =============================
platform win32 -- Python 3.13.2, pytest-8.4.2
collected 44 items

tests/test_aerosync.py .......................................           [ 88%]
tests/test_rag.py .....                                                  [100%]

============================= 44 passed in 7.99s ==============================
```

---

## 🚀 Quick Start Guide

### 💻 1. Local Machine Par Setup:
```bash
# Clone the repository
git clone https://github.com/thatvivekhingu/AeroSync.git
cd AeroSync

# Virtual environment setup
python -m venv .venv
.venv\Scripts\activate      # On Windows
# source .venv/bin/activate # On Linux/macOS

# Install dependencies
pip install -r requirements.txt

# Run tests
python -m pytest tests/ -v
```

### ☁️ 2. Google Colab Par Setup:
Google Colab notebook ke pehle cell me sirf yeh run karein:
```python
!git clone --depth 1 https://github.com/thatvivekhingu/AeroSync.git /content/AeroSync
%cd /content/AeroSync
!pip install -r requirements.txt
```

---

## 📜 License & Acknowledgments
- **License**: MIT Open Source License.
- **Initiative**: Developed under **DoLR (Department of Land Resources), Ministry of Rural Development**, Problem Statement ID: **26012**.
