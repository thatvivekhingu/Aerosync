"""
tests/test_techniques_models.py
===============================
Unit tests for the deep learning models integrated from the Techniques repository:
(https://github.com/thatvivekhingu/techniques / satellite-image-deep-learning/techniques)

Modules tested:
1. FarSeg (Foreground-Aware Relation Network for VHR geospatial object segmentation)
2. OrientedCadastralDetector (Oriented Bounding Box / Rotated Object Detector)
3. CadastralPanSharpenNet & metrics (Deep Pansharpening with SAM & ERGAS)
4. CloudShadowNet (Cloud, Haze, and Shadow Detection)
5. GeoFoundationViT & RemoteSensingEmbedder (Geospatial Foundation Model & similarity search)
"""

import numpy as np
import pytest
import torch

from models import (
    CadastralPanSharpenNet,
    CloudClass,
    CloudShadowNet,
    FarSeg,
    GeoFoundationViT,
    OrientedBox,
    OrientedCadastralDetector,
    RemoteSensingEmbedder,
    compute_ergas,
    compute_spectral_angle_mapper,
)


def test_farseg_forward_and_shapes():
    """Verify FarSeg segmentation network forward pass and relation module."""
    model = FarSeg(in_channels=3, num_classes=5, base_channels=32, fpn_channels=64)
    model.eval()

    x = torch.randn(2, 3, 128, 128)
    with torch.no_grad():
        out = model(x)

    assert out.shape == (2, 5, 128, 128)


def test_oriented_detector_forward_and_decode():
    """Verify Oriented Bounding Box (OBB) model output and oriented polygon decoding."""
    detector = OrientedCadastralDetector(in_channels=3, num_classes=4, hidden_dim=64)
    detector.eval()

    x = torch.randn(2, 3, 128, 128)
    cls_logits, reg_params = detector(x)

    assert cls_logits.shape == (2, 4, 16, 16)
    assert reg_params.shape == (2, 6, 16, 16)

    # Decode oriented boxes
    boxes_batch = detector.decode_predictions(cls_logits, reg_params, conf_threshold=0.0)
    assert len(boxes_batch) == 2
    assert len(boxes_batch[0]) > 0

    # Verify corner transformation
    first_box = boxes_batch[0][0]
    corners = first_box.to_corners()
    assert corners.shape == (4, 2)


def test_pansharpening_and_metrics():
    """Verify deep pansharpening network forward pass and remote sensing metrics (SAM, ERGAS)."""
    model = CadastralPanSharpenNet(ms_channels=4, pan_channels=1, num_filters=16, num_blocks=2)
    model.eval()

    ms = torch.rand(2, 4, 64, 64)
    pan = torch.rand(2, 1, 64, 64)

    with torch.no_grad():
        fused = model(ms, pan)

    assert fused.shape == (2, 4, 64, 64)
    assert 0.0 <= fused.min() and fused.max() <= 1.0

    # Test SAM and ERGAS metrics
    target = torch.rand(2, 4, 64, 64)
    sam_val = compute_spectral_angle_mapper(fused, target)
    ergas_val = compute_ergas(fused, target, scale_ratio=4.0)

    assert isinstance(sam_val.item(), float)
    assert isinstance(ergas_val, float)
    assert ergas_val >= 0.0


def test_cloud_shadow_net():
    """Verify atmospheric cloud, haze, and shadow segmentation."""
    model = CloudShadowNet(in_channels=3, num_classes=4, base_filters=16)
    model.eval()

    x = torch.randn(1, 3, 64, 64)
    logits = model(x)
    assert logits.shape == (1, 4, 64, 64)

    # Test high-level segmentation wrapper
    results = model.segment_clouds_and_shadows(x)
    assert "prediction_mask" in results
    assert "clear_ground_mask" in results
    assert "cloud_mask" in results
    assert "shadow_mask" in results
    assert results["prediction_mask"].shape == (64, 64)
    assert 0.0 <= results["cloud_coverage_fraction"] <= 1.0


def test_geo_foundation_vit_and_embedder():
    """Verify remote sensing foundation ViT and embedding similarity retrieval."""
    vit = GeoFoundationViT(img_size=64, patch_size=16, embed_dim=64, depth=2, num_heads=2, num_classes=6)
    vit.eval()

    x = torch.randn(2, 3, 64, 64)
    with torch.no_grad():
        logits, embs = vit(x)

    assert logits.shape == (2, 6)
    assert embs.shape == (2, 64)
    # Check L2 normalization
    norms = torch.norm(embs, dim=-1)
    assert torch.allclose(norms, torch.ones_like(norms), atol=1e-4)

    # Test Embedder helper
    embedder = RemoteSensingEmbedder(model=vit)
    tile1 = np.random.randint(0, 255, (64, 64, 3), dtype=np.uint8)
    tile2 = np.random.randint(0, 255, (64, 64, 3), dtype=np.uint8)

    emb1 = embedder.compute_embedding(tile1)
    emb2 = embedder.compute_embedding(tile2)

    assert emb1.shape == (64,)
    assert emb2.shape == (64,)

    sim = embedder.compute_cosine_similarity(emb1, emb2)
    assert -1.0 <= sim <= 1.0
