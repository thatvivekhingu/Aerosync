"""
tests/test_next_level.py
========================
Unit tests for the 5 Next-Level remote sensing & cadastral deep learning modules:
1. Bi-temporal change detection & encroachment auditing
2. Promptable SAM / point & box parcel segmentation
3. Multi-spectral indices (VARI, GLI, NDWI, Plinth Index)
4. Single-Image Super-Resolution (SISR)
5. Explainable AI (XAI) Grad-CAM spatial heatmaps
"""

import numpy as np
import pytest
import torch

from models import (
    CadastralChangeDetector,
    CadastralGradCAM,
    CadastralSuperResolutionNet,
    ChangeType,
    PromptableCadastralSegmenter,
    SiameseDifferenceUNet,
    compute_gli,
    compute_ndwi_rgb,
    compute_shadow_plinth_index,
    compute_vari,
    enhance_drone_patch,
    generate_legal_audit_heatmap,
    generate_spectral_layer_stack,
)
from models.model import AeroSyncAttentionResUNet


def test_siamese_change_detection_network():
    """Verify Siamese difference network forward pass."""
    net = SiameseDifferenceUNet(in_channels=3, num_classes=2)
    t1 = torch.randn(2, 3, 64, 64)
    t2 = torch.randn(2, 3, 64, 64)

    out = net(t1, t2)
    assert out.shape == (2, 2, 64, 64)


def test_cadastral_change_detector():
    """Verify mutation classification between two temporal masks."""
    detector = CadastralChangeDetector(pixel_scale=1.0)
    m1 = np.zeros((100, 100), dtype=np.uint8)
    m2 = np.zeros((100, 100), dtype=np.uint8)

    # 1. New construction in T2: (20, 20) to (30, 30) => 100 sqm
    m2[20:30, 20:30] = 1

    # 2. Water body encroachment in T2: (50, 50) was water(3) in T1, now building(1) in T2
    m1[50:60, 50:60] = 3
    m2[50:60, 50:60] = 1

    res = detector.detect_changes(m1, m2, min_change_area_sqm=5.0)
    assert res["total_mutations_count"] >= 2
    types = [m["change_type"] for m in res["mutations"]]
    assert ChangeType.NEW_CONSTRUCTION.value in types
    assert ChangeType.WATER_BODY_ENCROACHMENT.value in types


def test_promptable_sam_segmenter():
    """Verify point and box prompt segmentation."""
    segmenter = PromptableCadastralSegmenter()
    img = np.zeros((128, 128, 3), dtype=np.uint8)
    img[30:70, 30:70] = [200, 150, 100]  # simulated building

    # 1. Box prompt
    mask_box = segmenter.segment_with_box_prompt(img, (25, 25, 75, 75))
    assert mask_box.shape == (128, 128)
    assert mask_box[50, 50] == 1
    assert mask_box[10, 10] == 0

    # 2. Point prompt
    mask_point = segmenter.segment_with_point_prompts(img, positive_points=[(50, 50)])
    assert mask_point.shape == (128, 128)
    assert mask_point[50, 50] == 1


def test_remote_sensing_indices():
    """Verify VARI, GLI, NDWI, and shadow-plinth calculations."""
    img = np.random.randint(0, 255, (64, 64, 3), dtype=np.uint8)

    vari = compute_vari(img)
    gli = compute_gli(img)
    ndwi = compute_ndwi_rgb(img)
    shadow = compute_shadow_plinth_index(img)
    stack = generate_spectral_layer_stack(img)

    assert vari.shape == (64, 64)
    assert gli.shape == (64, 64)
    assert ndwi.shape == (64, 64)
    assert shadow.shape == (64, 64)
    assert stack.shape == (64, 64, 6)


def test_super_resolution_enhancer():
    """Verify 2x super-resolution network and patch enhancer."""
    sr_net = CadastralSuperResolutionNet(scale_factor=2, num_blocks=2)
    x = torch.randn(1, 3, 32, 32)
    out = sr_net(x)
    assert out.shape == (1, 3, 64, 64)

    img = np.random.randint(0, 255, (32, 32, 3), dtype=np.uint8)
    enhanced = enhance_drone_patch(img, scale_factor=2)
    assert enhanced.shape == (64, 64, 3)


def test_explainable_ai_gradcam():
    """Verify Grad-CAM heatmap generation and overlay."""
    model = AeroSyncAttentionResUNet(in_channels=3, num_classes=5)
    model.eval()

    gradcam = CadastralGradCAM(model)
    x = torch.randn(1, 3, 64, 64)

    heatmap = gradcam.generate_heatmap(x, target_class=1)
    gradcam.remove_hooks()

    assert heatmap.shape == (64, 64)
    assert 0.0 <= heatmap.min()
    assert heatmap.max() <= 1.0 + 1e-5

    img = np.random.randint(0, 255, (64, 64, 3), dtype=np.uint8)
    overlay = generate_legal_audit_heatmap(img, heatmap, alpha=0.5)
    assert overlay.shape == (64, 64, 3)
    assert overlay.dtype == np.uint8
