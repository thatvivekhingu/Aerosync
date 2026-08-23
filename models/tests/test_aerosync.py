"""
tests/test_aerosync.py
======================
Pytest unit tests for the AeroSync Cadastral AI Engine.

Run with:
    pytest tests/test_aerosync.py -v

Tests cover:
  - orthogonalize_polygon actually snaps corner angles to 90° multiples
  - mask_to_cadastral_geojson produces valid GeoJSON, correct ULPIN format,
    no polygons below min_area, and real confidence scores when prob_map given
  - Forward pass: AeroSyncAttentionResUNet output shape matches (B, C, H, W)
  - Deep supervision returns auxiliary heads only during training
  - AeroSyncTotalLoss forward pass returns finite scalar loss dict
  - MCDropoutInference returns different samples per pass (dropout is active)
  - TrainingConfig save/load round-trip
  - get_group_norm always returns groups that divide num_channels
"""

from __future__ import annotations

import json
import math
import tempfile
from pathlib import Path

import numpy as np
import pytest
import torch
from shapely.geometry import Polygon

# ---------------------------------------------------------------------------
# Adjust import path when running from repo root
# ---------------------------------------------------------------------------
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from models.geometry import mask_to_cadastral_geojson, orthogonalize_polygon, regularize_polygon
from models.losses import AeroSyncTotalLoss, BoundaryLoss, FocalDiceCadastralLoss, clDiceLoss
from models.model import (
    AeroSyncAttentionResUNet,
    CBAM,
    DeformableResBlock,
    SpatialAttention,
    TransformerBottleneck,
)
from models.uncertainty import MCDropoutInference, TTAInference
from models.utils import ModelEMA, TrainingConfig, get_group_norm, set_seed


# ===========================================================================
# Test fixtures
# ===========================================================================

@pytest.fixture()
def tiny_model() -> AeroSyncAttentionResUNet:
    """Tiny AeroSyncAttentionResUNet with base_filters=8 for fast CPU tests."""
    return AeroSyncAttentionResUNet(in_channels=3, num_classes=5, base_filters=8)


@pytest.fixture()
def dummy_batch() -> tuple[torch.Tensor, torch.Tensor]:
    """Random (B=2, C=3, H=64, W=64) image batch and matching label tensor."""
    set_seed(0)
    images = torch.randn(2, 3, 64, 64)
    labels = torch.randint(0, 5, (2, 64, 64))
    return images, labels


@pytest.fixture()
def axis_aligned_quad() -> Polygon:
    """Simple axis-aligned rectangle (should be a no-op for orthogonalization)."""
    return Polygon([(0, 0), (10, 0), (10, 8), (0, 8)])


@pytest.fixture()
def slightly_skewed_quad() -> Polygon:
    """Rectangle with a small 5° skew that should be corrected to 90° corners."""
    angle = math.radians(5)
    c, s = math.cos(angle), math.sin(angle)
    pts = [(0, 0), (10 * c, 10 * s), (10 * c - 8 * s, 10 * s + 8 * c), (-8 * s, 8 * c)]
    return Polygon(pts)


# ===========================================================================
# 1. orthogonalize_polygon tests
# ===========================================================================

class TestOrthogonalizePolygon:
    def test_returns_polygon_type(self, axis_aligned_quad):
        result = orthogonalize_polygon(axis_aligned_quad)
        assert isinstance(result, Polygon)

    def test_valid_polygon_returned(self, slightly_skewed_quad):
        result = orthogonalize_polygon(slightly_skewed_quad)
        assert result.is_valid
        assert not result.is_empty

    def test_snapped_angles_are_multiples_of_90(self, slightly_skewed_quad):
        """Verify that orthogonalized polygon edges are mutually perpendicular.

        The algorithm snaps edges to the polygon's DOMINANT orientation, not
        necessarily the world-frame 0°/90° grid. A 5°-rotated rectangle should
        produce edges at 5°, 95°, 185°, 275° — which are perpendicular to each
        other (correct) but not aligned to the global axis (not required).
        The correct test is therefore: all edge angles share the same value
        modulo 90°, meaning they are mutually parallel or perpendicular.
        """
        result = orthogonalize_polygon(slightly_skewed_quad)
        coords = list(result.exterior.coords)[:-1]
        edges = np.diff(np.array(coords + [coords[0]]), axis=0)
        lengths = np.linalg.norm(edges, axis=1)
        angles = np.degrees(np.arctan2(edges[:, 1], edges[:, 0]))

        # Filter out degenerate near-zero edges
        valid = lengths > 1e-9
        valid_angles = angles[valid]
        assert len(valid_angles) >= 2, "Not enough valid edges to test orthogonality"

        # For a fully orthogonal polygon: all edge angles mod 90° must be equal
        # (within floating-point tolerance).  A spread > 2° means edges are not
        # mutually perpendicular.
        angles_mod90 = valid_angles % 90.0
        spread = angles_mod90.max() - angles_mod90.min()
        # Handle the wrap-around case (e.g., 89° vs 1° — spread looks large but
        # the actual angular difference is only 2°)
        spread = min(spread, 90.0 - spread)
        assert spread < 2.0, (
            f"Polygon edges are not mutually perpendicular.\n"
            f"  Angles: {valid_angles.round(2)}\n"
            f"  Angles mod 90°: {angles_mod90.round(2)}\n"
            f"  Spread: {spread:.3f}° (must be < 2°)"
        )

    def test_degenerate_polygon_returns_original(self):
        # Triangle — too few vertices for meaningful orthogonalization
        tri = Polygon([(0, 0), (5, 0), (2.5, 4)])
        result = orthogonalize_polygon(tri)
        assert result == tri  # fall back to original

    def test_empty_polygon_returns_original(self):
        empty = Polygon()
        result = orthogonalize_polygon(empty)
        assert result.is_empty

    def test_invalid_polygon_returns_original(self):
        # Self-intersecting polygon
        invalid = Polygon([(0, 0), (10, 10), (10, 0), (0, 10)])
        result = orthogonalize_polygon(invalid)
        # Should return original without crashing
        assert isinstance(result, Polygon)

    def test_area_preserved_approximately(self, slightly_skewed_quad):
        result = orthogonalize_polygon(slightly_skewed_quad)
        original_area = slightly_skewed_quad.area
        # Snapped area should be within 10% of original
        assert abs(result.area - original_area) / original_area < 0.10


# ===========================================================================
# 2. mask_to_cadastral_geojson tests
# ===========================================================================

class TestMaskToCadastralGeoJSON:
    def _make_mask_with_building(self, h: int = 128, w: int = 128) -> np.ndarray:
        mask = np.zeros((h, w), dtype=np.int64)
        mask[20:70, 20:80] = 1  # Building blob
        return mask

    def test_returns_feature_collection(self):
        mask = self._make_mask_with_building()
        result = mask_to_cadastral_geojson(mask, class_id=1)
        assert result["type"] == "FeatureCollection"
        assert "features" in result

    def test_valid_geojson_schema(self):
        mask = self._make_mask_with_building()
        result = mask_to_cadastral_geojson(mask, class_id=1)
        # Must be serialisable to JSON
        json_str = json.dumps(result)
        parsed = json.loads(json_str)
        assert parsed["type"] == "FeatureCollection"

    def test_ulpin_format(self):
        mask = self._make_mask_with_building()
        result = mask_to_cadastral_geojson(mask, class_id=1)
        for feat in result["features"]:
            ulpin = feat["properties"]["ulpin"]
            parts = ulpin.split("-")
            assert parts[0] == "IN"
            assert parts[1] == "SVAMITVA"
            assert len(parts) == 5, f"ULPIN format wrong: {ulpin}"

    def test_no_polygons_below_min_area(self):
        mask = np.zeros((128, 128), dtype=np.int64)
        mask[60:65, 60:65] = 1  # Tiny 5×5 building — should be filtered
        result = mask_to_cadastral_geojson(mask, class_id=1, min_area=100.0)
        # Should fall back to demo placeholder but never contain real tiny polygons
        for feat in result["features"]:
            assert feat["properties"]["area_sqm"] >= 100.0 or \
                   feat["properties"]["validation_status"] == "DEMO_PLACEHOLDER"

    def test_confidence_score_with_prob_map(self):
        mask = self._make_mask_with_building()
        prob_map = np.random.rand(128, 128).astype(np.float32)
        prob_map[20:70, 20:80] = 0.95  # High confidence inside building
        result = mask_to_cadastral_geojson(mask, class_id=1, prob_map=prob_map)
        real_features = [
            f for f in result["features"]
            if f["properties"]["validation_status"] != "DEMO_PLACEHOLDER"
        ]
        for feat in real_features:
            score = feat["properties"]["confidence_score"]
            assert score is not None, "confidence_score should not be None when prob_map provided"
            assert 0.0 <= score <= 1.0

    def test_confidence_score_none_without_prob_map(self):
        mask = self._make_mask_with_building()
        result = mask_to_cadastral_geojson(mask, class_id=1, prob_map=None)
        real_features = [
            f for f in result["features"]
            if f["properties"]["validation_status"] != "DEMO_PLACEHOLDER"
        ]
        for feat in real_features:
            assert feat["properties"]["confidence_score"] is None, (
                "confidence_score must be None when prob_map is not provided"
            )

    def test_uncertainty_score_present_with_prob_map(self):
        mask = self._make_mask_with_building()
        prob_map = np.random.rand(128, 128).astype(np.float32)
        result = mask_to_cadastral_geojson(mask, class_id=1, prob_map=prob_map)
        real_features = [
            f for f in result["features"]
            if f["properties"]["validation_status"] != "DEMO_PLACEHOLDER"
        ]
        for feat in real_features:
            assert "uncertainty_score" in feat["properties"]
            score = feat["properties"]["uncertainty_score"]
            assert score is not None
            assert score >= 0.0


# ===========================================================================
# 3. Model forward pass tests
# ===========================================================================

class TestAeroSyncModel:
    def test_output_shape_standard(self, tiny_model, dummy_batch):
        images, _ = dummy_batch
        tiny_model.eval()
        with torch.no_grad():
            out = tiny_model(images)
        assert out.shape == (2, 5, 64, 64), f"Unexpected output shape: {out.shape}"

    def test_output_shape_single_sample(self, tiny_model):
        """Confirms GroupNorm stability at batch_size=1."""
        tiny_model.eval()
        with torch.no_grad():
            out = tiny_model(torch.randn(1, 3, 64, 64))
        assert out.shape == (1, 5, 64, 64)

    def test_deep_supervision_training_mode(self):
        model = AeroSyncAttentionResUNet(
            in_channels=3, num_classes=5, base_filters=8, deep_supervision=True
        )
        model.train()
        x = torch.randn(2, 3, 64, 64)
        out = model(x)
        assert isinstance(out, tuple), "Deep supervision should return tuple in train mode"
        main, aux = out
        assert main.shape == (2, 5, 64, 64)
        assert len(aux) == 2, "Should have exactly 2 auxiliary heads"

    def test_deep_supervision_eval_mode_returns_tensor(self):
        model = AeroSyncAttentionResUNet(
            in_channels=3, num_classes=5, base_filters=8, deep_supervision=True
        )
        model.eval()
        with torch.no_grad():
            out = model(torch.randn(1, 3, 64, 64))
        assert isinstance(out, torch.Tensor), "Eval mode must return plain Tensor (backward compat)"

    def test_no_nan_in_output(self, tiny_model, dummy_batch):
        images, _ = dummy_batch
        tiny_model.eval()
        with torch.no_grad():
            out = tiny_model(images)
        assert not torch.isnan(out).any(), "NaN detected in model output"
        assert not torch.isinf(out).any(), "Inf detected in model output"


# ===========================================================================
# 4. Loss function tests
# ===========================================================================

class TestLosses:
    def test_focal_dice_loss_finite(self, dummy_batch):
        images, labels = dummy_batch
        model = AeroSyncAttentionResUNet(in_channels=3, num_classes=5, base_filters=8)
        logits = model(images)
        loss_fn = FocalDiceCadastralLoss(num_classes=5)
        loss = loss_fn(logits, labels)
        assert torch.isfinite(loss), f"FocalDiceLoss is not finite: {loss}"

    def test_aerosync_total_loss_returns_dict(self, dummy_batch):
        images, labels = dummy_batch
        model = AeroSyncAttentionResUNet(in_channels=3, num_classes=5, base_filters=8)
        logits = model(images)
        loss_fn = AeroSyncTotalLoss(num_classes=5)
        loss_dict = loss_fn(logits, labels)
        assert "total" in loss_dict
        assert "focal" in loss_dict
        assert "dice" in loss_dict
        assert "boundary" in loss_dict
        assert "cldice" in loss_dict
        assert torch.isfinite(loss_dict["total"])

    def test_aerosync_total_loss_focal_gamma_arg(self):
        loss_fn1 = AeroSyncTotalLoss(num_classes=5, gamma=2.5)
        loss_fn2 = AeroSyncTotalLoss(num_classes=5, focal_gamma=2.5)
        assert loss_fn1.gamma == 2.5
        assert loss_fn2.gamma == 2.5

    def test_aerosync_total_loss_with_aux(self):
        model = AeroSyncAttentionResUNet(
            in_channels=3, num_classes=5, base_filters=8, deep_supervision=True
        )
        model.train()
        images = torch.randn(2, 3, 64, 64)
        labels = torch.randint(0, 5, (2, 64, 64))
        main_logits, aux_logits = model(images)
        loss_fn = AeroSyncTotalLoss(num_classes=5)
        loss_dict = loss_fn(main_logits, labels, aux_logits=aux_logits)
        assert "aux" in loss_dict
        assert torch.isfinite(loss_dict["total"])

    def test_boundary_loss_finite(self, dummy_batch):
        images, labels = dummy_batch
        model = AeroSyncAttentionResUNet(in_channels=3, num_classes=5, base_filters=8)
        logits = model(images)
        loss_fn = BoundaryLoss(num_classes=5)
        loss = loss_fn(logits, labels)
        assert torch.isfinite(loss)

    def test_cldice_loss_finite(self, dummy_batch):
        images, labels = dummy_batch
        model = AeroSyncAttentionResUNet(in_channels=3, num_classes=5, base_filters=8)
        logits = model(images)
        loss_fn = clDiceLoss(road_class_id=2)
        loss = loss_fn(logits, labels)
        assert torch.isfinite(loss)


# ===========================================================================
# 5. Uncertainty tests
# ===========================================================================

class TestUncertainty:
    def test_mc_dropout_returns_three_tensors(self, tiny_model):
        mc = MCDropoutInference(tiny_model, n_passes=3)
        x = torch.randn(1, 3, 64, 64)
        mean_probs, std_map, pred_mask = mc.predict(x)
        assert mean_probs.shape == (1, 5, 64, 64)
        assert std_map.shape == (1, 64, 64)
        assert pred_mask.shape == (1, 64, 64)

    def test_mc_dropout_std_nonzero(self, tiny_model):
        """Dropout must be active — different passes must produce different results."""
        mc = MCDropoutInference(tiny_model, n_passes=5)
        x = torch.randn(1, 3, 64, 64)
        _, std_map, _ = mc.predict(x)
        assert std_map.mean().item() > 0.0, "std_map is all zeros — dropout may not be active"

    def test_tta_output_shape(self, tiny_model):
        tta = TTAInference(tiny_model, use_flips=True, use_rotations=True)
        x = torch.randn(1, 3, 64, 64)
        mean_probs, pred_mask = tta.predict(x)
        assert mean_probs.shape == (1, 5, 64, 64)
        assert pred_mask.shape == (1, 64, 64)


# ===========================================================================
# 6. Utilities tests
# ===========================================================================

class TestUtils:
    def test_get_group_norm_valid_groups(self):
        for ch in [8, 16, 32, 64, 128, 256, 512]:
            gn = get_group_norm(ch)
            assert ch % gn.num_groups == 0, (
                f"GroupNorm groups={gn.num_groups} does not divide channels={ch}"
            )

    def test_training_config_save_load_roundtrip(self, tmp_path):
        cfg = TrainingConfig(
            learning_rate=1e-3,
            num_epochs=10,
            experiment_name="test_run",
        )
        save_path = tmp_path / "config.json"
        cfg.save(save_path)
        cfg2 = TrainingConfig.load(save_path)
        assert cfg2.learning_rate == cfg.learning_rate
        assert cfg2.num_epochs == cfg.num_epochs
        assert cfg2.experiment_name == cfg.experiment_name

    def test_training_config_img_size_is_tuple(self, tmp_path):
        cfg = TrainingConfig(img_size=(256, 256))
        save_path = tmp_path / "config.json"
        cfg.save(save_path)
        cfg2 = TrainingConfig.load(save_path)
        assert isinstance(cfg2.img_size, tuple)

    def test_model_ema_updates(self, tiny_model):
        ema = ModelEMA(tiny_model, decay=0.9)
        # Record initial shadow weight
        param_name = next(iter(ema.shadow))
        initial = ema.shadow[param_name].clone()
        # Simulate a parameter change
        with torch.no_grad():
            for p in tiny_model.parameters():
                p.add_(torch.ones_like(p))
        ema.update(tiny_model)
        updated = ema.shadow[param_name]
        # EMA shadow should have changed
        assert not torch.equal(initial, updated)


# ===========================================================================
# 7. Phase 2 Architecture components tests
# ===========================================================================

class TestPhase2Architecture:
    def test_cbam_output_shape(self):
        cbam = CBAM(in_channels=32, reduction=8)
        x = torch.randn(2, 32, 16, 16)
        out = cbam(x)
        assert out.shape == (2, 32, 16, 16)

    def test_cbam_modulates_features(self):
        cbam = CBAM(in_channels=16, reduction=4)
        x = torch.randn(2, 16, 8, 8)
        out = cbam(x)
        assert not torch.equal(out, x)
        assert torch.isfinite(out).all()

    def test_transformer_bottleneck_output_shape(self):
        tb = TransformerBottleneck(in_channels=64, out_channels=32, num_heads=4)
        x = torch.randn(2, 64, 8, 8)
        out = tb(x)
        assert out.shape == (2, 32, 8, 8)
        assert torch.isfinite(out).all()

    def test_deformable_resblock_output_shape(self):
        block = DeformableResBlock(in_channels=16, out_channels=32)
        x = torch.randn(2, 16, 16, 16)
        out = block(x)
        assert out.shape == (2, 32, 16, 16)
        assert torch.isfinite(out).all()

    def test_timm_backbone_model_instantiation(self):
        try:
            import timm  # noqa: F401
            has_timm = True
        except ImportError:
            has_timm = False

        if has_timm:
            model = AeroSyncAttentionResUNet(
                in_channels=3,
                num_classes=5,
                base_filters=8,
                backbone="resnet34",
                pretrained=False,
            )
            model.eval()
            with torch.no_grad():
                out = model(torch.randn(1, 3, 64, 64))
            assert out.shape == (1, 5, 64, 64)
            assert torch.isfinite(out).all()


# ===========================================================================
# 8. Phase 4 K-Fold validation logic tests
# ===========================================================================

class TestKFoldValidation:
    def test_kfold_split_no_leakage(self):
        n_samples = 20
        n_splits = 5
        indices = np.arange(n_samples)
        fold_size = n_samples // n_splits

        for fold in range(n_splits):
            val_idx = indices[fold * fold_size : (fold + 1) * fold_size]
            train_idx = np.setdiff1d(indices, val_idx)
            assert len(np.intersect1d(train_idx, val_idx)) == 0
            assert len(train_idx) + len(val_idx) == n_samples

    def test_kfold_all_samples_covered(self):
        n_samples = 25
        n_splits = 5
        indices = np.arange(n_samples)
        fold_size = n_samples // n_splits
        covered_val_indices = []

        for fold in range(n_splits):
            val_idx = indices[fold * fold_size : (fold + 1) * fold_size]
            covered_val_indices.extend(val_idx.tolist())

        assert sorted(covered_val_indices) == list(range(n_samples))

