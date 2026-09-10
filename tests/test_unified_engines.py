"""
tests/test_unified_engines.py
=============================
Unit tests for the 2 Unified Master Engines:
1. UnifiedAeroSyncDroneEngine (Cadastral & Drone 5-in-1 Master Model)
2. UnifiedSatelliteFoundationEngine (Satellite & Remote Sensing 5-in-1 Master Model)
"""

import numpy as np
import pytest
import torch

from models import (
    AeroSyncDroneMasterModel,
    AeroSyncSatelliteMasterModel,
    UnifiedAeroSyncDroneEngine,
    UnifiedSatelliteFoundationEngine,
)


def test_unified_drone_cadastral_engine():
    """Verify all 5 capabilities in UnifiedAeroSyncDroneEngine."""
    drone_engine = UnifiedAeroSyncDroneEngine(in_channels=3, num_classes=5, device="cpu")

    # Dummy drone tile
    drone_patch = np.random.randint(0, 255, (64, 64, 3), dtype=np.uint8)

    # 1. Semantic segmentation & GeoJSON vectorization
    seg_res = drone_engine.segment_parcels(drone_patch, return_geojson=True)
    assert "mask" in seg_res
    assert "geojson" in seg_res
    assert seg_res["mask"].shape == (64, 64)

    # 2. Bi-temporal change detection & encroachment auditing
    patch_t2 = np.random.randint(0, 255, (64, 64, 3), dtype=np.uint8)
    change_res = drone_engine.detect_temporal_changes(drone_patch, patch_t2, min_change_area_sqm=1.0)
    assert "t1_mask" in change_res
    assert "t2_mask" in change_res
    assert "mutation_audit" in change_res

    # 3. Promptable SAM zero-shot segmentation
    box_mask = drone_engine.segment_with_prompt(drone_patch, box_prompt=(10, 10, 50, 50))
    assert box_mask.shape == (64, 64)

    # 4. Super-Resolution Enhancement
    sr_enhanced = drone_engine.enhance_resolution(drone_patch, scale_factor=2)
    assert sr_enhanced.shape == (128, 128, 3)

    # 5. Rooftop Classification & Grad-CAM XAI
    xai_res = drone_engine.classify_and_explain(drone_patch)
    assert "roof_material" in xai_res
    assert "heatmap" in xai_res
    assert "xai_overlay" in xai_res
    assert xai_res["xai_overlay"].shape == (64, 64, 3)


def test_unified_satellite_foundation_engine():
    """Verify all 5 capabilities in UnifiedSatelliteFoundationEngine."""
    sat_engine = UnifiedSatelliteFoundationEngine(in_channels=3, num_classes=5, embed_dim=64, device="cpu")

    sat_patch = np.random.randint(0, 255, (128, 128, 3), dtype=np.uint8)

    # 1. Wide-area FarSeg segmentation
    seg_res = sat_engine.segment_satellite_scene(sat_patch)
    assert "mask" in seg_res
    assert seg_res["mask"].shape == (128, 128)

    # 2. Oriented Object Detection (OBB / Rotated BBoxes)
    boxes = sat_engine.detect_oriented_structures(sat_patch, conf_threshold=0.0)
    assert isinstance(boxes, list)
    if boxes:
        corners = boxes[0].to_corners()
        assert corners.shape == (4, 2)

    # 3. Deep Pansharpening & Fusion
    ms = torch.rand(1, 4, 32, 32)
    pan = torch.rand(1, 1, 32, 32)
    target = torch.rand(1, 4, 32, 32)
    ps_res = sat_engine.pansharpen(ms, pan, target_reference=target)
    assert "fused_multispectral" in ps_res
    assert "sam_degrees" in ps_res
    assert "ergas_score" in ps_res

    # 4. Atmospheric Cloud, Haze & Shadow Masking
    cloud_res = sat_engine.mask_clouds_and_shadows(sat_patch)
    assert "clear_ground_mask" in cloud_res
    assert "cloud_mask" in cloud_res
    assert "shadow_mask" in cloud_res
    assert 0.0 <= cloud_res["cloud_coverage_fraction"] <= 1.0

    # 5. Foundation Vision Transformer Embeddings & Similarity
    tile_a = np.random.randint(0, 255, (128, 128, 3), dtype=np.uint8)
    tile_b = np.random.randint(0, 255, (128, 128, 3), dtype=np.uint8)

    emb_a = sat_engine.compute_tile_embedding(tile_a)
    emb_b = sat_engine.compute_tile_embedding(tile_b)

    assert emb_a.shape == (64,)
    assert emb_b.shape == (64,)

    sim = sat_engine.compute_similarity(emb_a, emb_b)
    assert -1.0 <= sim <= 1.0


def test_aliases():
    """Verify Master Model alias imports."""
    assert AeroSyncDroneMasterModel is UnifiedAeroSyncDroneEngine
    assert AeroSyncSatelliteMasterModel is UnifiedSatelliteFoundationEngine
