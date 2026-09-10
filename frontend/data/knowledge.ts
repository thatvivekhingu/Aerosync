export interface KnowledgeDoc {
  id: string;
  title: string;
  category: string;
  content: string;
}

export const SVAMITVA_KNOWLEDGE_BASE: KnowledgeDoc[] = [
  {
    id: "svamitva_overview",
    title: "SVAMITVA Scheme Overview & Legal Basis",
    category: "Legal Framework",
    content: "SVAMITVA (Survey of Villages and Mapping with Improvised Technology in Village Areas) is a Central Sector scheme of the Ministry of Panchayati Raj (MoPR) implemented with Survey of India (SoI). Its goal is to provide rural citizens with the 'Record of Rights' by issuing official Property Cards (Gharoni) through drone surveys and high-resolution orthorectified imagery (ORI).",
  },
  {
    id: "ulpin_standards",
    title: "ULPIN (Unique Land Parcel Identification Number / Bhu-Aadhaar)",
    category: "Standards",
    content: "The ULPIN (Bhu-Aadhaar) is a 14-digit unique alphanumeric identification number for every land parcel in India, derived from its international standard Bounding Box coordinates (latitude/longitude centroids). It ensures non-duplication of ownership and smooth integration with DILRMP.",
  },
  {
    id: "buffer_regulations",
    title: "Cadastral Buffer Zones & Encroachment Guidelines",
    category: "Regulations",
    content: "1. Water Body Buffer: Under rural revenue norms, no permanent construction (Class 1) is permitted within 15 to 30 meters of designated water bodies (Class 3).\n2. Road Right-of-Way: Buildings must maintain a mandatory setback (typically 3 to 6 meters) from public roads (Class 2).\n3. Parcels violating these buffers are flagged for Gram Panchayat physical hearings.",
  },
  {
    id: "uncertainty_protocol",
    title: "AI Uncertainty & Surveyor Ground Truthing Protocol",
    category: "Survey SOP",
    content: "When drone segmentation models produce low confidence (< 0.70) due to tree canopy or shadows, the parcel is flagged with 'Surveyor Verification Needed = True'. A ground survey team with GNSS/CORS rovers physically audits the boundary during the 30-day Gram Sabha public notice window.",
  }
];

export const CADASTRAL_QA_PAIRS: Record<string, string> = {
  "default": "AeroSync Cadastral AI can assist you with SVAMITVA Scheme Guidelines, ULPIN generation, setback buffer violation audits, and Property Card drafting. How can I assist your survey?",
  "ulpin": "The **Unique Land Parcel Identification Number (ULPIN)**, also called **'Bhu-Aadhaar'**, is a 14-digit unique alphanumeric identification number for each land parcel in India, derived from its international standard centroid coordinates (latitude and longitude).",
  "buffer": "Under rural cadastral revenue norms and environmental guidelines:\n1. **Water Bodies**: No permanent structure is permitted within **15 to 30 meters** of water bodies (Class 3).\n2. **Road Right-of-Way**: Minimum **3 to 6 meters** setback is mandatory from public roads.",
  "uncertainty": "When the AI model detects uncertainty (confidence < 0.70 or high Monte Carlo Dropout variance), the parcel is automatically flagged with **'Surveyor Verification Needed = True'**. A ground surveyor with GNSS/CORS rovers physically audits the site during the 30-day Gram Sabha public review window.",
  "card": "A standard **SVAMITVA Property Card (Gharoni / Sampatti Patra)** contains: ULPIN ID, State/District/Village LGD code, Khasra Number, Owner details, exact built-up area in sq.m and sq.ft, boundary dimensions, and the Surveyor verification seal.",
  "hindi_gaon": "AeroSync drone survey me **2 Residential Buildings**, **1 Water Body (Talab)**, aur **1 Road** detect hue hain. Total built-up area **233.5 sq.m** hai aur Parcel `ULPIN-26012-0045` par surveyor verification flag laga hai."
};
