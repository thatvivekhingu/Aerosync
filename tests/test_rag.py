"""
Tests for AeroSync Geo-Cadastral RAG & LLM Engine (models/rag.py)
================================================================
Problem Statement ID: 26012 | DoLR, Ministry of Rural Development
"""

import os
import pytest
from models.rag import (
    AeroSyncCadastralLLM,
    CadastralKnowledgeBase,
    DEFAULT_SVAMITVA_KNOWLEDGE_DOCS,
    ParcelRecord,
    SpatialGeoJSONRetriever,
    audit_regulatory_compliance,
    generate_property_card,
)


@pytest.fixture
def sample_geojson():
    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[[10.0, 10.0], [20.0, 10.0], [20.0, 20.0], [10.0, 20.0], [10.0, 10.0]]],
                },
                "properties": {
                    "ulpin": "ULPIN-26012-0001",
                    "class_id": 1,
                    "class_name": "Building",
                    "area_sqm": 100.0,
                    "perimeter_m": 40.0,
                    "confidence": 0.95,
                    "surveyor_verification_needed": False,
                },
            },
            {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[[18.0, 18.0], [25.0, 18.0], [25.0, 25.0], [18.0, 25.0], [18.0, 18.0]]],
                },
                "properties": {
                    "ulpin": "ULPIN-26012-0002",
                    "class_id": 3,
                    "class_name": "Water",
                    "area_sqm": 49.0,
                    "perimeter_m": 28.0,
                    "confidence": 0.98,
                    "surveyor_verification_needed": False,
                },
            },
            {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[[100.0, 100.0], [110.0, 100.0], [110.0, 110.0], [100.0, 110.0], [100.0, 100.0]]],
                },
                "properties": {
                    "ulpin": "ULPIN-26012-0003",
                    "class_id": 1,
                    "class_name": "Building",
                    "area_sqm": 120.0,
                    "perimeter_m": 44.0,
                    "confidence": 0.62,
                    "surveyor_verification_needed": True,
                },
            },
            {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[[102.0, 100.0], [104.0, 100.0], [104.0, 120.0], [102.0, 120.0], [102.0, 100.0]]],
                },
                "properties": {
                    "ulpin": "ULPIN-26012-0004",
                    "class_id": 2,
                    "class_name": "Road",
                    "area_sqm": 40.0,
                    "perimeter_m": 44.0,
                    "confidence": 0.91,
                    "surveyor_verification_needed": False,
                },
            },
        ],
    }


def test_cadastral_knowledge_base_retrieval():
    kb = CadastralKnowledgeBase()
    assert len(kb.documents) >= 5

    # Test retrieval for ULPIN
    ulpin_res = kb.retrieve("What is ULPIN and Bhu-Aadhaar?", top_k=2)
    assert len(ulpin_res) == 2
    assert any("ULPIN" in doc["title"] or "ULPIN" in doc["content"] for doc in ulpin_res)

    # Test retrieval for Buffer/Setbacks
    buffer_res = kb.retrieve("water body buffer distance in meters", top_k=1)
    assert "Buffer" in buffer_res[0]["title"] or "setback" in buffer_res[0]["content"].lower()


def test_spatial_geojson_retriever(sample_geojson):
    retriever = SpatialGeoJSONRetriever(sample_geojson)
    assert len(retriever.parcels) == 4

    stats = retriever.get_summary_stats()
    assert stats["total_parcels"] == 4
    assert stats["building_parcels"] == 2
    assert stats["total_builtup_area_sqm"] == 220.0
    assert stats["uncertain_parcels_count"] == 1

    # Filter test
    uncertain = retriever.filter_parcels(verification_needed=True)
    assert len(uncertain) == 1
    assert uncertain[0].ulpin == "ULPIN-26012-0003"

    # Find by ULPIN
    p = retriever.find_by_ulpin("0001")
    assert p is not None
    assert p.ulpin == "ULPIN-26012-0001"


def test_regulatory_compliance_audit(sample_geojson):
    retriever = SpatialGeoJSONRetriever(sample_geojson)
    violations = audit_regulatory_compliance(retriever.parcels, water_buffer_m=15.0, road_setback_m=3.0)

    # In sample_geojson, building 1 (centroid ~15, 15) is close to water body (centroid ~21.5, 21.5)
    # distance is sqrt(6.5^2 + 6.5^2) = ~9.19m < 15m -> violation!
    assert len(violations) >= 1
    v_types = [v["violation_type"] for v in violations]
    assert "Water Body Buffer Encroachment" in v_types or "Road Right-of-Way (RoW) Setback Violation" in v_types


def test_property_card_generator(sample_geojson):
    retriever = SpatialGeoJSONRetriever(sample_geojson)
    p = retriever.parcels[0]
    card = generate_property_card(p, owner_name="Rameshwar Singh")

    assert card["ulpin"] == "ULPIN-26012-0001"
    assert card["ownership_details"]["primary_owner"] == "Rameshwar Singh"
    assert card["spatial_measurements"]["builtup_area_sqm"] == 100.0
    assert "builtup_area_sqft" in card["spatial_measurements"]
    assert card["verification_status"]["physical_surveyor_verification_required"] is False


def test_aerosync_cadastral_llm_chat(sample_geojson):
    kb = CadastralKnowledgeBase()
    retriever = SpatialGeoJSONRetriever(sample_geojson)
    llm = AeroSyncCadastralLLM(knowledge_base=kb, spatial_retriever=retriever, provider="offline")

    # 1. Summary Query
    ans1 = llm.chat("Gaon me kitne buildings mapped hui hain?")
    assert "Residential Buildings" in ans1 or "2" in ans1

    # 2. Encroachment Query
    ans2 = llm.chat("Check buffer violation and encroachment near talab")
    assert "Encroachment" in ans2 or "Violation" in ans2 or "Buffer" in ans2

    # 3. Property Card Query
    ans3 = llm.chat("Generate property card for ULPIN-26012-0001")
    assert "ULPIN-26012-0001" in ans3
    assert "Property Card" in ans3 or "संपत्ति" in ans3
