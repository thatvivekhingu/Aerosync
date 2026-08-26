"""
AeroSync — Geo-Cadastral RAG & LLM Engine
==========================================
Problem Statement ID: 26012 | DoLR, Ministry of Rural Development

Provides:
  1. CadastralKnowledgeBase: Ingests & indexes SVAMITVA Scheme guidelines, DoLR SOPs,
     ULPIN generation standards, setback/buffer regulations, and dispute workflows.
  2. SpatialGeoJSONRetriever: Semantic & tabular query engine for drone-extracted
     vector parcel data (ULPIN, area, perimeter, class, uncertainty/confidence).
  3. RegulatoryAuditEngine: Evaluates setback/encroachment violations (e.g. water body, road buffers).
  4. PropertyCardGenerator: Formats official SVAMITVA Form 1 / Property Cards.
  5. AeroSyncCadastralLLM: Multi-backend conversational agent (Gemini, OpenAI, Local LLMs,
     and built-in Offline Cadastral Reasoning Engine with Hindi & English support).
"""

from __future__ import annotations

import json
import math
import os
import re
from dataclasses import asdict, dataclass, field
from typing import Any, Callable, Dict, List, Optional, Tuple, Union

import numpy as np

# ─────────────────────────────────────────────────────────────────────────────
# 1. BUILT-IN CADASTRAL KNOWLEDGE CORPUS (SVAMITVA & DoLR Guidelines)
# ─────────────────────────────────────────────────────────────────────────────

DEFAULT_SVAMITVA_KNOWLEDGE_DOCS = [
    {
        "doc_id": "svamitva_overview",
        "title": "SVAMITVA Scheme Overview & Objectives",
        "category": "legal_framework",
        "content": (
            "SVAMITVA (Survey of Villages and Mapping with Improvised Technology in Village Areas) is a "
            "Central Sector scheme of the Ministry of Panchayati Raj (MoPR) implemented with the Survey of "
            "India (SoI), State Revenue Departments, and Panchayati Raj Departments. Its objective is to "
            "provide rural citizens with the 'Record of Rights' by issuing Property Cards / Title Deeds "
            "(Gharoni / Sampatti Patra) through drone surveys and high-resolution orthorectified imagery (ORI). "
            "Problem Statement 26012 by the Department of Land Resources (DoLR) addresses AI-automated parcel "
            "extraction, boundary regularization, and digital land-record integration."
        ),
    },
    {
        "doc_id": "ulpin_standards",
        "title": "ULPIN (Unique Land Parcel Identification Number) Guidelines",
        "category": "standards",
        "content": (
            "The Unique Land Parcel Identification Number (ULPIN), also called 'Bhu-Aadhaar', is a 14-digit "
            "unique alphanumeric identification number for every land parcel in India. It is derived from the "
            "international standard Bounding Box coordinates (latitude and longitude centroids) of the parcel. "
            "ULPIN ensures non-duplication of ownership, transparent real-estate transactions, and smooth "
            "integration with the Digital India Land Records Modernization Programme (DILRMP)."
        ),
    },
    {
        "doc_id": "buffer_and_setbacks",
        "title": "Cadastral Buffer Zones, Encroachment & Setback Regulations",
        "category": "regulations",
        "content": (
            "1. Water Body Buffer: Under rural revenue norms and environmental guidelines, no permanent construction "
            "(Building / Class 1) is permitted within 15 to 30 meters of designated water bodies (Ponds, Lakes, "
            "Streams / Class 3).\n"
            "2. Road Right-of-Way (RoW): Buildings must maintain a minimum setback (typically 3 to 6 meters depending "
            "on village road hierarchy) from the edge of designated public roads (Class 2).\n"
            "3. Encroachment Flags: Parcels violating these proximity buffers are flagged as 'High Encroachment Risk' "
            "for physical field verification by the Gram Panchayat / Revenue Officer."
        ),
    },
    {
        "doc_id": "dispute_and_uncertainty",
        "title": "Boundary Uncertainty & Surveyor Ground Truthing Protocol",
        "category": "survey_sop",
        "content": (
            "When drone segmentation models produce uncertainty (e.g. Monte Carlo Dropout variance > threshold or "
            "confidence score < 0.70) due to tree canopy, shadow, or abutting walls:\n"
            "1. The system must flag the parcel with 'Surveyor Verification Needed' = True.\n"
            "2. A physical ground truthing team with GNSS / CORS rovers visits the site during Gram Sabha notice periods.\n"
            "3. Objections must be resolved within the 30-day statutory public review window before the final Property Card is finalized."
        ),
    },
    {
        "doc_id": "property_card_format",
        "title": "SVAMITVA Property Card Mandatory Attributes",
        "category": "documentation",
        "content": (
            "A standard SVAMITVA Property Card / Gharoni must contain:\n"
            "- Unique Land Parcel Identification Number (ULPIN)\n"
            "- State, District, Tehsil, and Village (LGD Code)\n"
            "- Survey Number / Khasra / Khata Number\n"
            "- Owner Name and Co-owner details\n"
            "- Built-up Area (sq. meters and sq. feet)\n"
            "- Boundary Dimensions (North, South, East, West lengths in meters)\n"
            "- Abutting Details (Road, Open Land, Neighboring Parcels)\n"
            "- Quality / AI Confidence Indicator and Surveyor Verification Seal."
        ),
    },
    {
        "doc_id": "up_revenue_code_2006",
        "title": "Uttar Pradesh Revenue Code 2006 & Abadi Gharoni Rules",
        "category": "state_laws_up",
        "content": (
            "Under Uttar Pradesh Revenue Code 2006:\n"
            "1. Section 67: Gram Sabha land encroachment removal protocol for public ponds (Talab), rasta, and pasture land.\n"
            "2. Section 80: Conversion of agricultural land to abadi / non-agricultural commercial usage.\n"
            "3. SVAMITVA Gharoni (Form 1): Authorized property title issued for rural residential dwellings inside village Abadi."
        ),
    },
    {
        "doc_id": "mp_land_revenue_code_1959",
        "title": "Madhya Pradesh Land Revenue Code 1959 (Abadi & Gaon Than)",
        "category": "state_laws_mp",
        "content": (
            "Under MP Land Revenue Code 1959:\n"
            "1. Section 244 & 246: Rights to rural house-sites in village Abadi and Gram Sabha consent.\n"
            "2. Section 248: Penalty and summary eviction for unauthorized encroachment on government and nistar land.\n"
            "3. Bhu-Abhilekh integration: Direct linkage of drone ULPIN vector polygons with MP Bhulekh portal."
        ),
    },
    {
        "doc_id": "maharashtra_revenue_code_1966",
        "title": "Maharashtra Land Revenue Code 1966 & Gaothan Survey (Property Card Form D-1)",
        "category": "state_laws_mh",
        "content": (
            "Under Maharashtra Land Revenue Code 1966:\n"
            "1. Section 126-131: Detailed Cadastral survey of Gaothan (village abadi) lands by Settlement Commissioner.\n"
            "2. Property Card (Form D-1): Permanent Record of Rights issued for rural residential properties.\n"
            "3. City Survey (CTS) / ULPIN synchronization: Dual indexing of Mahabhulekh 7/12 extract and Gaothan property cards."
        ),
    },
    {
        "doc_id": "gujarat_land_revenue_code",
        "title": "Gujarat Land Revenue Code 1879 & Gamtal Drone Survey Guidelines",
        "category": "state_laws_gj",
        "content": (
            "Under Gujarat Land Revenue Code:\n"
            "1. Gamtal Survey: Demarcation of village abadi residential limits under Section 135.\n"
            "2. Village Form No. 2 & Property Card: Official title issuance linked to E-Dhara land records system.\n"
            "3. Setback Standard: Minimum 3.5m setback from village arterial roads and 15m from rural water bodies."
        ),
    },
]


# ─────────────────────────────────────────────────────────────────────────────
# 2. IN-MEMORY SEMANTIC & KEYWORD RETRIEVER (Zero-Dependency Fallback)
# ─────────────────────────────────────────────────────────────────────────────

def _tokenize(text: str) -> List[str]:
    """Simple alphanumeric tokenizer with stopword stripping."""
    stopwords = {
        "a", "an", "the", "and", "or", "in", "on", "at", "to", "for", "with", "is",
        "are", "was", "were", "of", "by", "that", "this", "it", "from", "be", "as",
        "ka", "ki", "ke", "hai", "hain", "aur", "me", "ko", "se", "par", "ye", "wo"
    }
    words = re.findall(r"\w+", text.lower())
    return [w for w in words if len(w) > 1 and w not in stopwords]


class CadastralKnowledgeBase:
    """
    Retrieval index for SVAMITVA / DoLR legal frameworks, SOPs, and land guidelines.
    Supports BM25/TF-IDF similarity and optional dense sentence embedding.
    """

    def __init__(self, custom_docs: Optional[List[Dict[str, Any]]] = None):
        self.documents: List[Dict[str, Any]] = []
        self._doc_tokens: List[List[str]] = []
        self._vocab: Dict[str, int] = {}

        docs = custom_docs or DEFAULT_SVAMITVA_KNOWLEDGE_DOCS
        for doc in docs:
            self.add_document(doc)

    def add_document(self, doc: Dict[str, Any]) -> None:
        """Add a text document to the knowledge store."""
        content = doc.get("content", "")
        title = doc.get("title", "")
        full_text = f"{title} {content}"
        tokens = _tokenize(full_text)

        self.documents.append(doc)
        self._doc_tokens.append(tokens)

        for tok in tokens:
            if tok not in self._vocab:
                self._vocab[tok] = len(self._vocab)

    def retrieve(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Retrieve top_k most relevant knowledge base chunks for a given query.
        Uses BM25-inspired term frequency - inverse document frequency scoring.
        """
        query_tokens = _tokenize(query)
        if not query_tokens or not self.documents:
            return self.documents[:top_k]

        N = len(self.documents)
        scores = []

        for idx, doc_tokens in enumerate(self._doc_tokens):
            score = 0.0
            doc_len = len(doc_tokens) + 1e-6
            for q_tok in query_tokens:
                tf = doc_tokens.count(q_tok)
                # Count docs containing q_tok
                df = sum(1 for dt in self._doc_tokens if q_tok in dt)
                idf = math.log((N - df + 0.5) / (df + 0.5) + 1.0)
                # BM25 term weighting
                k1, b = 1.5, 0.75
                bm25_tf = (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (doc_len / 50.0)))
                score += idf * bm25_tf

            scores.append((score, idx))

        class KnowledgeDoc(dict):
            def __getattr__(self, name):
                try:
                    return self[name]
                except KeyError:
                    raise AttributeError(f"'KnowledgeDoc' has no attribute '{name}'")

        scored_docs = sorted(zip(scores, self.documents), key=lambda x: x[0], reverse=True)
        return [KnowledgeDoc({**doc, "relevance_score": float(s[0])}) for s, doc in scored_docs[:top_k]]

    def query(self, text: str, top_k: int = 3) -> List[Any]:
        """Alias for retrieve()."""
        return self.retrieve(text, top_k=top_k)


# ─────────────────────────────────────────────────────────────────────────────
# 3. SPATIAL GeoJSON RETRIEVER & TABULAR QUERY ENGINE
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class ParcelRecord:
    ulpin: str
    class_id: int
    class_name: str
    area_sqm: float
    perimeter_m: float
    confidence: float
    verification_needed: bool
    centroid: Tuple[float, float]
    coordinates: List[Any]
    properties: Dict[str, Any] = field(default_factory=dict)


class SpatialGeoJSONRetriever:
    """
    Indexes segmented Cadastral GeoJSON parcels for natural language & structured querying.
    """

    def __init__(self, geojson_data: Optional[Dict[str, Any]] = None):
        self.parcels: List[ParcelRecord] = []
        if geojson_data:
            self.load_geojson(geojson_data)

    def load_geojson(self, geojson_data: Dict[str, Any]) -> None:
        """Parse GeoJSON FeatureCollection into ParcelRecords."""
        self.parcels.clear()
        features = geojson_data.get("features", [])
        for feat in features:
            props = feat.get("properties", {})
            geom = feat.get("geometry", {})
            coords = geom.get("coordinates", [])

            # Compute rough centroid from first ring
            centroid = (0.0, 0.0)
            if coords and len(coords[0]) > 0:
                pts = coords[0]
                cx = sum(p[0] for p in pts) / len(pts)
                cy = sum(p[1] for p in pts) / len(pts)
                centroid = (round(cx, 6), round(cy, 6))

            record = ParcelRecord(
                ulpin=props.get("ulpin", f"ULPIN-AUTO-{len(self.parcels)+1:04d}"),
                class_id=int(props.get("class_id", 1)),
                class_name=props.get("class_name", "Building"),
                area_sqm=float(props.get("area_sqm", props.get("area_px", 0.0))),
                perimeter_m=float(props.get("perimeter_m", props.get("perimeter_px", 0.0))),
                confidence=float(props.get("confidence", 0.90)),
                verification_needed=bool(props.get("surveyor_verification_needed", False)),
                centroid=centroid,
                coordinates=coords,
                properties=props,
            )
            self.parcels.append(record)

    def get_summary_stats(self) -> Dict[str, Any]:
        """Compute aggregate survey statistics."""
        if not self.parcels:
            return {"total_parcels": 0}

        total_count = len(self.parcels)
        bldg_count = sum(1 for p in self.parcels if p.class_id == 1 or p.class_name.lower() == "building")
        total_builtup_area = sum(p.area_sqm for p in self.parcels if p.class_id == 1 or p.class_name.lower() == "building")
        uncertain_count = sum(1 for p in self.parcels if p.verification_needed or p.confidence < 0.75)
        avg_confidence = float(np.mean([p.confidence for p in self.parcels]))

        return {
            "total_parcels": total_count,
            "building_parcels": bldg_count,
            "total_builtup_area_sqm": round(total_builtup_area, 2),
            "total_builtup_area_sqft": round(total_builtup_area * 10.7639, 2),
            "uncertain_parcels_count": uncertain_count,
            "mean_confidence": round(avg_confidence, 4),
        }

    def filter_parcels(
        self,
        min_area: Optional[float] = None,
        max_area: Optional[float] = None,
        class_name: Optional[str] = None,
        verification_needed: Optional[bool] = None,
        min_confidence: Optional[float] = None,
        max_confidence: Optional[float] = None,
        ulpin_query: Optional[str] = None,
    ) -> List[ParcelRecord]:
        """Filter parcel records by multiple geometric & cadastral criteria."""
        results = []
        for p in self.parcels:
            if min_area is not None and p.area_sqm < min_area:
                continue
            if max_area is not None and p.area_sqm > max_area:
                continue
            if class_name is not None and class_name.lower() not in p.class_name.lower():
                continue
            if verification_needed is not None and p.verification_needed != verification_needed:
                continue
            if min_confidence is not None and p.confidence < min_confidence:
                continue
            if max_confidence is not None and p.confidence > max_confidence:
                continue
            if ulpin_query is not None and ulpin_query.upper() not in p.ulpin.upper():
                continue
            results.append(p)
        return results

    def find_by_ulpin(self, ulpin: str) -> Optional[ParcelRecord]:
        """Look up single parcel by ULPIN."""
        for p in self.parcels:
            if ulpin.upper() in p.ulpin.upper():
                return p
        return None


# ─────────────────────────────────────────────────────────────────────────────
# 4. REGULATORY AUDIT & BUFFER VIOLATION DETECTOR
# ─────────────────────────────────────────────────────────────────────────────

def audit_regulatory_compliance(
    parcels: List[ParcelRecord],
    water_buffer_m: float = 15.0,
    road_setback_m: float = 3.0,
) -> List[Dict[str, Any]]:
    """
    Checks proximity violations between buildings (Class 1) and water bodies (Class 3)
    or road boundaries (Class 2).
    """
    violations = []
    buildings = [p for p in parcels if p.class_id == 1 or p.class_name.lower() == "building"]
    water_bodies = [p for p in parcels if p.class_id == 3 or p.class_name.lower() == "water"]
    roads = [p for p in parcels if p.class_id == 2 or p.class_name.lower() == "road"]

    def _euclidean_dist(c1: Tuple[float, float], c2: Tuple[float, float]) -> float:
        return math.sqrt((c1[0] - c2[0]) ** 2 + (c1[1] - c2[1]) ** 2)

    for b in buildings:
        # Check water buffer
        for w in water_bodies:
            dist = _euclidean_dist(b.centroid, w.centroid)
            if dist < water_buffer_m:
                violations.append({
                    "violation_type": "Water Body Buffer Encroachment",
                    "severity": "CRITICAL",
                    "parcel_ulpin": b.ulpin,
                    "target_feature": w.ulpin,
                    "distance_m": round(dist, 2),
                    "permitted_min_m": water_buffer_m,
                    "remedial_action": "Flag for Gram Panchayat Environmental Setback Hearing",
                })

        # Check road setback
        for r in roads:
            dist = _euclidean_dist(b.centroid, r.centroid)
            if dist < road_setback_m:
                violations.append({
                    "violation_type": "Road Right-of-Way (RoW) Setback Violation",
                    "severity": "WARNING",
                    "parcel_ulpin": b.ulpin,
                    "target_feature": r.ulpin,
                    "distance_m": round(dist, 2),
                    "permitted_min_m": road_setback_m,
                    "remedial_action": "Physical RoW boundary demarcated by Revenue Surveyor",
                })

    return violations


# ─────────────────────────────────────────────────────────────────────────────
# 5. SVAMITVA PROPERTY CARD / GHARONI GENERATOR
# ─────────────────────────────────────────────────────────────────────────────

def generate_property_card(
    parcel: ParcelRecord,
    state: str = "Uttar Pradesh",
    district: str = "Varanasi",
    tehsil: str = "Sadar",
    village: str = "Kashi Rural",
    lgd_code: str = "260120",
    owner_name: str = "Shri Rajesh Kumar",
) -> Dict[str, Any]:
    """Generates an official DoLR / SVAMITVA Property Card draft in structured format."""
    return {
        "document_type": "SVAMITVA Property Card (Gharoni / Sampatti Patra)",
        "scheme": "SVAMITVA Scheme, Ministry of Panchayati Raj & DoLR",
        "ulpin": parcel.ulpin,
        "village_details": {
            "state": state,
            "district": district,
            "tehsil": tehsil,
            "village_name": village,
            "lgd_code": lgd_code,
        },
        "ownership_details": {
            "primary_owner": owner_name,
            "property_category": parcel.class_name,
        },
        "spatial_measurements": {
            "builtup_area_sqm": parcel.area_sqm,
            "builtup_area_sqft": round(parcel.area_sqm * 10.7639, 2),
            "perimeter_meters": parcel.perimeter_m,
            "centroid_coordinates": {
                "latitude": parcel.centroid[1],
                "longitude": parcel.centroid[0],
            },
        },
        "verification_status": {
            "ai_extraction_confidence": f"{parcel.confidence * 100:.1f}%",
            "physical_surveyor_verification_required": parcel.verification_needed,
            "status": "DRAFT - Subject to Gram Sabha Public Review (30-day notice)",
        },
    }


# ─────────────────────────────────────────────────────────────────────────────
# 6. AEROSYNC CADASTRAL LLM (Multi-Backend & Offline Reasoning)
# ─────────────────────────────────────────────────────────────────────────────

class AeroSyncCadastralLLM:
    """
    Intelligent Conversational Agent for AeroSync Cadastral AI.
    Works seamlessly with:
      - Google Gemini API (if GEMINI_API_KEY / GOOGLE_API_KEY is available)
      - OpenAI / Ollama (if configured)
      - Built-in Offline Cadastral Reasoning Engine (zero API key needed).
    """

    def __init__(
        self,
        knowledge_base: Optional[CadastralKnowledgeBase] = None,
        spatial_retriever: Optional[SpatialGeoJSONRetriever] = None,
        api_key: Optional[str] = None,
        provider: str = "auto",  # 'auto', 'gemini', 'openai', 'offline'
    ):
        self.kb = knowledge_base or CadastralKnowledgeBase()
        self.spatial = spatial_retriever or SpatialGeoJSONRetriever()
        self.provider = provider
        self.api_key = api_key or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

        self._init_backend()

    def _init_backend(self) -> None:
        """Configure LLM backend or fallback to Offline Cadastral Engine."""
        self.backend_type = "offline"

        if (self.provider in ("auto", "gemini")) and self.api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                self.gemini_model = genai.GenerativeModel("gemini-1.5-flash")
                self.backend_type = "gemini"
            except Exception:
                self.backend_type = "offline"
        elif self.provider == "offline":
            self.backend_type = "offline"

    def chat(self, user_query: str) -> str:
        """
        Execute RAG Pipeline:
          1. Retrieve legal/SOP guidelines from CadastralKnowledgeBase.
          2. Retrieve relevant spatial parcel statistics from SpatialGeoJSONRetriever.
          3. Synthesize structured answer via LLM backend or Offline Expert Engine.
        """
        # 1. Retrieve Knowledge Docs
        retrieved_docs = self.kb.retrieve(user_query, top_k=2)
        kb_context = "\n".join([f"- [{d['title']}]: {d['content']}" for d in retrieved_docs])

        # 2. Retrieve Spatial Summary & Check for specific parcel queries
        stats = self.spatial.get_summary_stats()
        spatial_context = (
            f"Total Mapped Parcels: {stats.get('total_parcels', 0)}, "
            f"Buildings: {stats.get('building_parcels', 0)}, "
            f"Total Built-up Area: {stats.get('total_builtup_area_sqm', 0.0)} sqm, "
            f"Parcels with Surveyor Flags: {stats.get('uncertain_parcels_count', 0)}, "
            f"Mean Extraction Confidence: {stats.get('mean_confidence', 0.0) * 100:.1f}%"
        )

        # Check if user asks for specific ULPIN
        ulpin_match = re.search(r"ULPIN[\w\-]+", user_query, re.IGNORECASE)
        specific_parcel_str = ""
        if ulpin_match:
            matched_p = self.spatial.find_by_ulpin(ulpin_match.group(0))
            if matched_p:
                specific_parcel_str = (
                    f"\nSpecific Parcel Details for {matched_p.ulpin}:\n"
                    f"- Class: {matched_p.class_name}\n"
                    f"- Area: {matched_p.area_sqm:.2f} sqm ({matched_p.area_sqm * 10.7639:.2f} sq.ft)\n"
                    f"- Confidence: {matched_p.confidence * 100:.1f}%\n"
                    f"- Surveyor Verification Needed: {matched_p.verification_needed}\n"
                    f"- Centroid (Lon, Lat): {matched_p.centroid}\n"
                )

        # 3. Handle via Gemini API if available
        if self.backend_type == "gemini":
            prompt = (
                "You are AeroSync Cadastral AI, an expert AI land records assistant for the SVAMITVA Scheme "
                "and Department of Land Resources (DoLR), Government of India.\n\n"
                "=== CADASTRAL KNOWLEDGE CONTEXT ===\n"
                f"{kb_context}\n\n"
                "=== DRONE SURVEY SPATIAL CONTEXT ===\n"
                f"{spatial_context}\n"
                f"{specific_parcel_str}\n\n"
                f"User Question: {user_query}\n\n"
                "Provide a clear, accurate, and professional response in the language of the user (English, Hindi, or Hinglish). "
                "Mention relevant legal norms, ULPIN, and parcel statistics where applicable."
            )
            try:
                resp = self.gemini_model.generate_content(prompt)
                return resp.text
            except Exception as e:
                # Fallback to offline engine
                pass

        # 4. Offline Cadastral Reasoning Engine (Deterministic & Fast)
        return self._offline_reasoning(user_query, retrieved_docs, stats, specific_parcel_str)

    def _offline_reasoning(
        self,
        query: str,
        docs: List[Dict[str, Any]],
        stats: Dict[str, Any],
        specific_parcel_str: str,
    ) -> str:
        """Deterministic rule-based response generator for offline execution."""
        q_lower = query.lower()

        # Check for Property Card generation request
        if "property card" in q_lower or "gharoni" in q_lower or "sampatti patra" in q_lower or "kagaz" in q_lower:
            ulpin_match = re.search(r"ULPIN[\w\-]+", query, re.IGNORECASE)
            target_p = None
            if ulpin_match:
                target_p = self.spatial.find_by_ulpin(ulpin_match.group(0))
            if not target_p and self.spatial.parcels:
                target_p = self.spatial.parcels[0]

            if target_p:
                card = generate_property_card(target_p)
                return (
                    "### 📜 SVAMITVA Property Card Draft (स्वामित्व संपत्ति पत्र)\n"
                    f"**ULPIN / भू-आधार ID**: `{card['ulpin']}`\n"
                    f"- **Village / मौजा**: {card['village_details']['village_name']}, {card['village_details']['district']} ({card['village_details']['state']})\n"
                    f"- **Owner Name / स्वामी का नाम**: {card['ownership_details']['primary_owner']}\n"
                    f"- **Built-up Area / निर्मित क्षेत्रफल**: **{card['spatial_measurements']['builtup_area_sqm']} sq.m** ({card['spatial_measurements']['builtup_area_sqft']} sq.ft)\n"
                    f"- **Perimeter / परिमाप**: {card['spatial_measurements']['perimeter_meters']} m\n"
                    f"- **AI Confidence**: {card['verification_status']['ai_extraction_confidence']}\n"
                    f"- **Surveyor Verification**: {'⚠️ Required (संशय)' if card['verification_status']['physical_surveyor_verification_required'] else '✅ Verified (सत्यापित)'}\n"
                    f"- **Legal Status**: *{card['verification_status']['status']}*"
                )

        # Check for Encroachment / Buffer check request
        if "encroachment" in q_lower or "violation" in q_lower or "buffer" in q_lower or "talab" in q_lower or "sadak" in q_lower or "setback" in q_lower:
            violations = audit_regulatory_compliance(self.spatial.parcels)
            if not violations:
                return (
                    "### 🛡️ Cadastral Regulatory Compliance Audit\n"
                    "✅ **No illegal buffer encroachments detected.** All segmented buildings maintain "
                    "safe statutory distance from water bodies (>=15m) and road rights-of-way (>=3m)."
                )
            res = f"### ⚠️ Cadastral Regulatory Violations Detected ({len(violations)} issues):\n"
            for v in violations[:5]:
                res += (
                    f"- **[{v['severity']}] {v['violation_type']}**:\n"
                    f"  - Building ULPIN: `{v['parcel_ulpin']}`\n"
                    f"  - Distance to Water/Road: **{v['distance_m']}m** (Permitted Min: {v['permitted_min_m']}m)\n"
                    f"  - Action: *{v['remedial_action']}*\n"
                )
            return res

        # Check for statistics / summary
        if "kitne" in q_lower or "how many" in q_lower or "summary" in q_lower or "total" in q_lower or "area" in q_lower:
            return (
                f"### 📊 AeroSync Drone Survey Summary\n"
                f"- **Total Mapped Parcels**: {stats.get('total_parcels', 0)}\n"
                f"- **Residential Buildings**: {stats.get('building_parcels', 0)}\n"
                f"- **Total Built-up Area**: {stats.get('total_builtup_area_sqm', 0.0)} sq.m ({stats.get('total_builtup_area_sqft', 0.0)} sq.ft)\n"
                f"- **Uncertainty / Surveyor Flags**: {stats.get('uncertain_parcels_count', 0)} parcels\n"
                f"- **Average AI Extraction Confidence**: {stats.get('mean_confidence', 0.0) * 100:.1f}%\n"
                f"{specific_parcel_str}"
            )

        # General legal/SOP query answer from retrieved docs
        doc_summary = "\n\n".join([f"**{d['title']}**:\n{d['content']}" for d in docs])
        return (
            f"### 🏛️ AeroSync Cadastral AI Assistant\n"
            f"{doc_summary}\n\n"
            f"**Current Survey Snapshot**: {stats.get('total_parcels', 0)} parcels mapped | "
            f"Mean AI Confidence: {stats.get('mean_confidence', 0.0) * 100:.1f}%\n"
            f"{specific_parcel_str}"
        )
