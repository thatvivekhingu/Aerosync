"""
tests/test_vaayu_integration.py
===============================
Unit tests for Project Vaayu features:
1. AeroSyncUNetPlusPlus (Nested UNet++ with deep supervision)
2. RooftopClassifier (RCC / Tin / Tiled / Thatch classification)
3. SolarPotentialCalculator (kWh/year energy yield and CO2 offsets)
4. GramPanchayatTaxCalculator (circle rates and local tax assessments)
5. GeospatialGridTiler (georeferenced tile extents)
"""

import numpy as np
import pytest
import torch

from models import (
    AeroSyncUNetPlusPlus,
    GeospatialGridTiler,
    GramPanchayatTaxCalculator,
    PropertyValuationReport,
    RoofMaterial,
    RooftopClassifier,
    SolarPotentialCalculator,
    SolarPotentialReport,
    convert_shapefile_dict_to_geojson,
)


def test_unet_plus_plus_eval_mode():
    """Verify UNet++ forward pass in evaluation mode."""
    model = AeroSyncUNetPlusPlus(in_channels=3, num_classes=5, deep_supervision=True)
    model.eval()

    x = torch.randn(2, 3, 64, 64)
    with torch.no_grad():
        out = model(x)

    assert isinstance(out, torch.Tensor)
    assert out.shape == (2, 5, 64, 64)


def test_unet_plus_plus_train_deep_supervision():
    """Verify UNet++ forward pass in training mode with deep supervision."""
    model = AeroSyncUNetPlusPlus(in_channels=3, num_classes=5, deep_supervision=True)
    model.train()

    x = torch.randn(2, 3, 64, 64)
    outputs = model(x)

    assert isinstance(outputs, tuple)
    assert len(outputs) == 4
    for o in outputs:
        assert o.shape == (2, 5, 64, 64)


def test_rooftop_material_classifier():
    """Verify classification of different rooftop materials."""
    classifier = RooftopClassifier()

    # 1. Tin patch (high brightness, low saturation)
    tin_patch = np.full((32, 32, 3), 220, dtype=np.uint8)
    res_tin = classifier.classify_rooftop_patch(tin_patch)
    assert res_tin["roof_material"] == RoofMaterial.TIN_CORRUGATED_SHEET.value
    assert res_tin["confidence"] >= 0.70

    # 2. Terracotta tile patch (Red >> Green and Blue)
    tile_patch = np.zeros((32, 32, 3), dtype=np.uint8)
    tile_patch[:, :, 0] = 200  # Red
    tile_patch[:, :, 1] = 90   # Green
    tile_patch[:, :, 2] = 70   # Blue
    res_tile = classifier.classify_rooftop_patch(tile_patch)
    assert res_tile["roof_material"] == RoofMaterial.TILED_TERRACOTTA.value

    # 3. RCC Concrete patch (Flat gray)
    rcc_patch = np.full((32, 32, 3), 120, dtype=np.uint8)
    res_rcc = classifier.classify_rooftop_patch(rcc_patch)
    assert res_rcc["roof_material"] == RoofMaterial.RCC_CONCRETE.value


def test_solar_potential_calculator():
    """Verify solar rooftop calculation formulas."""
    calc = SolarPotentialCalculator()

    # 100 sqm RCC roof
    report = calc.compute_solar_potential(100.0, RoofMaterial.RCC_CONCRETE)
    assert isinstance(report, SolarPotentialReport)
    assert report.total_roof_area_sqm == 100.0
    assert report.usable_solar_area_sqm == 75.0  # 75% usable
    assert report.recommended_capacity_kwp > 5.0  # ~10.7 kWp
    assert report.annual_generation_kwh > 10000.0
    assert report.annual_savings_inr > 50000.0
    assert report.suitability_rating == "EXCELLENT"


def test_gram_panchayat_tax_calculator():
    """Verify property tax and valuation calculator."""
    calc = GramPanchayatTaxCalculator()

    # 120 sqm RCC building
    val_report = calc.compute_valuation_and_tax(120.0, RoofMaterial.RCC_CONCRETE)
    assert isinstance(val_report, PropertyValuationReport)
    assert val_report.total_area_sqm == 120.0
    assert val_report.circle_rate_per_sqm == 12500.0
    assert val_report.estimated_asset_value_inr == 120.0 * 12500.0  # ₹ 1,500,000
    assert val_report.annual_property_tax_inr == (120.0 * 12500.0) * 0.0015


def test_geospatial_grid_tiler():
    """Verify georeferenced grid tile generation."""
    tiler = GeospatialGridTiler(tile_size_px=512, overlap_px=64)
    tiles = tiler.generate_grid_tiles(image_width_px=1024, image_height_px=1024)

    assert len(tiles) >= 4
    for t in tiles:
        assert t.width_px <= 512
        assert t.height_px <= 512
        assert t.min_x < t.max_x

    # Test shapefile dict conversion
    geojson = convert_shapefile_dict_to_geojson([
        {"geometry": {"type": "Point", "coordinates": [77.2, 28.6]}, "properties": {"id": 1}}
    ])
    assert geojson["type"] == "FeatureCollection"
    assert len(geojson["features"]) == 1
