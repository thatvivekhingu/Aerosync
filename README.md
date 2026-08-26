# 🛰️ AeroSync — Drone Drone Se Digital Zameen Ke Kagaz (SVAMITVA AI)

> **AeroSync** ek AI-powered system hai jo drone se li gayi gaon/zameen ki high-resolution photos (orthomosaics) ko scan karta hai, usme se **ghar (buildings), sadak (roads), talab (water), aur khet/ped (greenery)** ko pehchanta hai, aur seedha **legal land-record / property card (GeoJSON)** bana deta hai.

---

## 🎯 Asal Problem Kya Hai? (Why AeroSync?)

Bharat sarkar ki **SVAMITVA Scheme** ke tahat gaon ke gharon ki mapping drone se ho rahi hai. Par drone ki badi-badi images se manually har ek ghar aur boundary ko trace karna bohot slow, mehenga aur human errors se bhara kaam hai.

**AeroSync is pure process ko automate karta hai:**
1. Drone image daalo
2. AI pixel-by-pixel sab kuch segment karega
3. Tedhi-medhi AI lines ko seedhi rectangular property boundaries me convert karega
4. Har property ko ek unique **ULPIN ID** (zameen ka Aadhaar number) aur area/perimeter assign karega
5. Jis boundary me AI ko thoda doubt ho, uspar **"Surveyor Verification Needed"** flag laga dega

---

## 🛠️ Ab Tak Kya-Kya Kaam Ho Chuka Hai? (What's Built So Far)

Humne is project ko modular tarike se 8 main parts me build kiya hai:

### 1. 🧠 Custom AI Model (`models/model.py`)
- **Attention ResUNet + ASPP Architecture**: Drone images me chote ghar aur lambi patli sadakon ko dhyan se dekhne ke liye attention gates aur multi-scale zoom layers lagayi hain.
- **Pretrained Encoders**: ResNet-34 aur ConvNeXt jaise modern vision backbones bhi support karta hai.

### 2. 🎯 Smart Multi-Loss Training (`models/losses.py`)
- Normal AI segmentation models me gharon ke kone gol-matol (blurry) ho jate hain.
- Isko theek karne ke liye **Boundary Loss** (sharp edges ke liye) aur **clDice Loss** (sadak ki continuity tootne na paye) add kiya hai.

### 3. 📸 Drone Data Augmentation (`models/augmentation.py`)
- Drone alag-alag unchai, dhoop-chaon aur angle se photo leta hai.
- Isliye humne Albumentations se rotation, brightness change, zoom, aur CutMix jaise realistic drone filters add kiye hain taaki model robust rahe.

### 4. ⚡ Fast & Stable Training Engine (`models/trainer.py`)
- **Mixed Precision (AMP)**: GPU par training fast aur low memory me hoti hai.
- **Model EMA**: Weights ko smooth rakhne ke liye taaki best performance mile.
- **WandB Tracking**: Training loss aur charts track karne ka pura setup.

### 5. 🔍 AI Confidence & Doubt Checker (`models/uncertainty.py`)
- AI andha dhundh prediction nahi deta — **Monte Carlo Dropout** se har parcel ka *confidence score* nikalta hai.
- Agar kisi ped ke neeche ghar chupa hai aur AI sure nahi hai, toh wo use surveyor ke physically check karne ke liye mark kar deta hai.

### 6. 🗺️ Badi GeoTIFF Photos ko Process Karna (`3_AeroSync_...ipynb`)
- Drone maps kayi GBs ke hote hain jo ek baar me memory me fit nahi aate.
- Humne smart tiler banaya hai jo badi image ke 512×512 ke tukde (tiles) banata hai aur smoothly stitch karta hai bina kisi border line ke.

### 7. 📐 AI Mask Se Clean Cadastral Polygons (`models/geometry.py`)
- AI ke rough pixel mask ko clean **vector GeoJSON polygons** me convert karta hai.
- **Orthogonalization**: Ghar ke kono ko 90 degree par seedha karta hai taaki wo naksha legally accurate lage.
- **ULPIN Auto-Generation**: Har property card ko legal ID aur area calculate karke deta hai.

### 8. 🧪 Testing & Validation (`tests/`)
### 8. 🧪 Testing & Validation (`tests/`)
- **44 PyTest Unit Tests** likhe hain jo har loss function, model layer, dataset pipeline, aur RAG retrieval engine ko test karte hain (All 44 passing ✅).

### 9. 🧠 Geo-Cadastral RAG & LLM Assistant (`models/rag.py`)
- **Knowledge Base (RAG)**: SVAMITVA Scheme Guidelines, DoLR norms, ULPIN rules, aur buffer zone laws ka built-in semantic store.
- **Natural Language Spatial Queries**: Drone survey output (GeoJSON) se direct sawal pooch sakte hain (Hindi/English).
- **Automated Encroachment Audit**: Talab (water bodies >=15m) aur Sadak (roads >=3m) ke pass buffer violations automatically detect karta hai.
- **SVAMITVA Property Card Draft Generator**: Har ULPIN parcel ka official Form 1 property card ready karta hai.
- **Multi-Backend**: Gemini API, OpenAI, local LLMs, ya bina kisi key ke built-in Offline Reasoner.

---

## 📂 Project Structure (Kaunsi File Kya Karti Hai)

```
AeroSync/
│
├── 1_AeroSync_Cadastral_Model_Training_and_Inference.ipynb   # Main notebook: Model training aur testing
├── 2_AeroSync_Building_Footprint_Extraction_Binary.ipynb    # Sirf gharon (buildings) ke footprints nikalne ke liye
├── 3_AeroSync_Large_GeoTIFF_Tiling_and_Stitching.ipynb       # Badi gigapixel drone maps ko tile aur stitch karne ke liye
├── 4_AeroSync_Cadastral_Quality_and_Accuracy_Evaluation.ipynb# Accuracy, IoU, Dice aur boundary quality check karne ke liye
├── 5_AeroSync_Cadastral_RAG_and_LLM_Assistant.ipynb         # Cadastral RAG & AI Chatbot for Land Records & Inquiries
│
├── models/                         # Core Python Library
│   ├── rag.py                      # RAG, Cadastral LLM, Encroachment Audit & Property Cards
│   ├── model.py                    # AI Architectures (Attention ResUNet, ASPP)
│   ├── losses.py                   # Loss functions (Focal, Dice, Boundary, clDice)
│   ├── trainer.py                  # PyTorch model training pipeline
│   ├── data.py                     # Dataset loader aur batching
│   ├── augmentation.py             # Drone image transformations
│   ├── geometry.py                 # Polygon cleaning, 90° straightening & GeoJSON
│   ├── uncertainty.py              # Confidence & doubt quantification
│   ├── constants.py                # Class names aur colors
│   └── utils.py                    # Configurations aur helper functions
│
├── tests/
│   ├── test_aerosync.py            # Computer Vision & geometry tests
│   └── test_rag.py                 # RAG, spatial query & LLM tests (44/44 passed)
│
├── requirements.txt                # Required libraries list
└── README.md                       # Documentation
```


---

## 🎨 AI Classes (Model Kya-Kya Pehchanta Hai)

| Class | Naam | Rang (Color) |
|---|---|---|
| **0** | Background | Khali zameen / mitti |
| **1** | Building | Ghar, dukan, kachha/pakka makaan |
| **2** | Road | Sadak, galiyan, raste |
| **3** | Water | Talab, nala, nadi |
| **4** | Greenery | Khet, ped-paudhe, ghaas |

---

## 🚀 Kaise Run Karein? (Quick Start)

### Local Computer Par:
```bash
# 1. Repo clone karo
git clone https://github.com/thatvivekhingu/Aerosync.git
cd Aerosync

# 2. Virtual environment banao aur activate karo
python -m venv .venv
.venv\Scripts\activate

# 3. Dependencies install karo
pip install -r requirements.txt

# 4. Test run karke verify karo
pytest tests/test_aerosync.py
```

### Google Colab Par:
Google Colab notebook ke top cell me sirf yeh 2 lines run karni hain:
```python
!git clone https://github.com/thatvivekhingu/Aerosync.git /content/AeroSync
%cd /content/AeroSync
!pip install -r requirements.txt
```

---

## 📊 Abhi Tak Ki Model Performance

- **Building Segmentation**: ~90% Dice Score (Accurate building outlines)
- **Mean IoU Across Classes**: ~80%
- **Boundary Precision**: Sharp edges without ragged corners

---

## 📜 License
MIT License. Open for development and research under DoLR / SVAMITVA initiatives.
