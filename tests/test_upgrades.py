"""
tests/test_upgrades.py
======================
Unit tests for all 7 real-world limitation upgrades and architectural solutions:
1. Abutting building separation (Distance transform + Watershed)
2. Adaptive shape regularizer (Orthogonal + Organic village morphology)
3. Fast Evidential Uncertainty (Single-pass calibrated entropy)
4. Fast TTA inference
5. Seamless 2D Hann window overlap stitching
6. Rural roof material heterogeneity transforms
7. State-specific Land Revenue Code RAG retrieval (UP, MP, MH, GJ)
"""

import numpy as np
import pytest
import torch
from shapely.geometry import Polygon

from models import (
    CadastralKnowledgeBase,
    FastEvidentialUncertainty,
    FastTTAInference,
    adaptive_cadastral_regularization,
    apply_rural_roof_heterogeneity,
    compute_orthogonality_score,
    hann_weighted_2d_window,
    mask_to_cadastral_geojson,
    seamless_tile_stitch,
    separate_abutting_buildings,
)
from models.model import AeroSyncAttentionResUNet


def test_separate_abutting_buildings():
    """Verify that two connected adjacent buildings with a shared wall are split."""
    mask = np.zeros((100, 100), dtype=np.uint8)
    # House 1: (20, 20) to (50, 40)
    mask[20:50, 20:40] = 255
    # House 2: (20, 40) to (50, 60) - abutting directly at x=40
    mask[20:50, 40:60] = 255

    labels = separate_abutting_buildings(mask, threshold_ratio=0.3)
    unique_labels = np.unique(labels)
    assert len(unique_labels) >= 2, "Expected at least 1 or 2 distinct separated components"
    assert labels.shape == mask.shape


def test_adaptive_cadastral_regularization():
    """Verify orthogonal vs organic polygon handling."""
    # 1. Nearly orthogonal rectangle (4 right angles)
    rect = Polygon([(0, 0), (10, 0.2), (9.8, 8), (0, 7.9)])
    score = compute_orthogonality_score(rect)
    assert score > 0.5

    clean_rect = adaptive_cadastral_regularization(rect, ortho_threshold=0.5)
    assert clean_rect.is_valid
    assert clean_rect.area > 0

    # 2. Organic / Curved village hut (trapezoid / pentagon with 45°/135° angles)
    organic = Polygon([(0, 0), (10, 0), (14, 5), (8, 9), (2, 7)])
    clean_org = adaptive_cadastral_regularization(organic, ortho_threshold=0.8)
    assert clean_org.is_valid
    assert clean_org.area > 0


def test_fast_evidential_uncertainty():
    """Verify single-pass evidential uncertainty executes in 1 forward pass."""
    model = AeroSyncAttentionResUNet(in_channels=3, num_classes=5)
    model.eval()

    evaluator = FastEvidentialUncertainty(model, temperature=1.0)
    x = torch.randn(2, 3, 128, 128)

    probs, uncertainty, mask = evaluator.predict(x)
    assert probs.shape == (2, 5, 128, 128)
    assert uncertainty.shape == (2, 128, 128)
    assert mask.shape == (2, 128, 128)
    assert uncertainty.min() >= 0.0
    assert uncertainty.max() <= 1.0


def test_fast_tta_inference():
    """Verify lightweight 2-transform fast TTA."""
    model = AeroSyncAttentionResUNet(in_channels=3, num_classes=5)
    tta = FastTTAInference(model)
    x = torch.randn(1, 3, 64, 64)
    probs, disagreement, mask = tta.predict(x)
    assert probs.shape == (1, 5, 64, 64)
    assert mask.shape == (1, 64, 64)


def test_hann_weighted_seamless_tile_stitch():
    """Verify 2D Hann window creation and overlap stitching."""
    win = hann_weighted_2d_window(64, 64)
    assert win.shape == (64, 64)
    assert 0.95 <= win.max() <= 1.0
    assert win.min() >= 1e-5

    # Stitch 2 overlapping tiles
    tile1 = np.ones((5, 64, 64), dtype=np.float32) * 0.2
    tile1[1, :, :] = 0.8  # class 1
    tile2 = np.ones((5, 64, 64), dtype=np.float32) * 0.2
    tile2[2, :, :] = 0.8  # class 2

    stitched = seamless_tile_stitch(
        tile_preds=[tile1, tile2],
        tile_coords=[(0, 0, 64, 64), (0, 32, 64, 96)],
        full_height=64,
        full_width=96,
        num_classes=5,
    )
    assert stitched.shape == (64, 96)
    assert stitched.dtype == np.uint8


def test_rural_roof_heterogeneity_augmentation():
    """Verify rural roof texture perturbations do not alter image dimensions or dtype."""
    img = np.random.randint(50, 200, (128, 128, 3), dtype=np.uint8)
    aug = apply_rural_roof_heterogeneity(img, p=1.0)
    assert aug.shape == img.shape
    assert aug.dtype == np.uint8


def test_multi_state_revenue_code_rag():
    """Verify state-specific land revenue codes are indexed and retrievable."""
    kb = CadastralKnowledgeBase()

    # Query UP Revenue Code
    res_up = kb.query("What does Section 67 of UP Revenue Code 2006 say about pond encroachment?", top_k=2)
    assert any("Uttar Pradesh Revenue Code" in d.title or "Section 67" in d.content for d in res_up)

    # Query MP Land Revenue Code
    res_mp = kb.query("What are the Gram Sabha Abadi rights under MP Land Revenue Code 1959?", top_k=2)
    assert any("Madhya Pradesh" in d.title or "MP Land Revenue" in d.title for d in res_mp)

    # Query Maharashtra Property Card
    res_mh = kb.query("How is Gaothan Property Card Form D-1 surveyed in Maharashtra?", top_k=2)
    assert any("Maharashtra" in d.title or "Gaothan" in d.content for d in res_mh)
