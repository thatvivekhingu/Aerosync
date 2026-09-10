"""
models/unified.py
=================
Consolidated Dual-Engine Architecture for AeroSync:
1. UnifiedAeroSyncDroneEngine (Drone & Cadastral Mapping Master Model)
   - Consolidates: High-Res Attention ResUNet, Bi-Temporal Siamese Change Detection,
     Promptable SAM Segmenter, SISR Super-Resolution, Rooftop Material Classifier & XAI Grad-CAM.
2. UnifiedSatelliteFoundationEngine (Satellite & Remote Sensing Master Model)
   - Consolidates: FarSeg Foreground-Aware Segmentation, Oriented (OBB) Rotated Detector,
     Deep PanNet Pansharpening, CloudShadowNet Atmospheric Masking, & GeoFoundation ViT Embeddings.

Provides a clean 2-Model unified interface for all drone cadastral and satellite workflows.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple, Union

import cv2
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

# Drone & Cadastral Modules
from .change_detection import CadastralChangeDetector, SiameseDifferenceUNet
from .geometry import mask_to_cadastral_geojson
from .model import AeroSyncAttentionResUNet
from .roof_material import RoofMaterial, RooftopClassifier
from .sam_adapter import PromptableCadastralSegmenter
from .super_res import CadastralSuperResolutionNet, enhance_drone_patch
from .xai import CadastralGradCAM, generate_legal_audit_heatmap

# Satellite Techniques Modules
from .cloud_removal import CloudClass, CloudShadowNet
from .farseg import FarSeg
from .geo_foundation import GeoFoundationViT, RemoteSensingEmbedder
from .oriented_detector import OrientedBox, OrientedCadastralDetector
from .pansharpen import (
    CadastralPanSharpenNet,
    compute_ergas,
    compute_spectral_angle_mapper,
)


# =========================================================================
# MODEL 1: Unified Drone & Cadastral Master Model
# =========================================================================

class UnifiedAeroSyncDroneEngine(nn.Module):
    """Unified Master Engine for High-Resolution Drone & Cadastral Analysis.
    
    Consolidates 5 Core Models into a single unified pipeline:
    1. Cadastral Segmentation (Attention ResUNet / UNet++)
    2. Bi-Temporal Change Detection & Encroachment Auditing (Siamese UNet)
    3. Promptable Parcel Segmentation (SAM Adapter)
    4. Sub-pixel Super-Resolution (SISR Net)
    5. Rooftop Material Classification & Legal Audit XAI (Grad-CAM)
    """

    def __init__(
        self,
        in_channels: int = 3,
        num_classes: int = 5,
        device: Optional[Union[str, torch.device]] = None,
    ) -> None:
        super().__init__()
        self.device = torch.device(device if device else ("cuda" if torch.cuda.is_available() else "cpu"))

        # 1. Segmentation Network
        self.segmenter = AeroSyncAttentionResUNet(in_channels=in_channels, num_classes=num_classes)

        # 2. Siamese Change Detection Network & Detector
        self.change_net = SiameseDifferenceUNet(in_channels=in_channels, num_classes=2)
        self.change_detector = CadastralChangeDetector(pixel_scale=1.0)

        # 3. Promptable SAM Adapter
        self.sam_adapter = PromptableCadastralSegmenter()

        # 4. Super-Resolution Network
        self.sr_net = CadastralSuperResolutionNet(in_channels=in_channels, scale_factor=2, num_blocks=4)

        # 5. Rooftop Material Classifier
        self.roof_classifier = RooftopClassifier()

        self.to(self.device)
        self.eval()

    # --- 1. Parcel Segmentation & Polygon Vectorization ---
    @torch.no_grad()
    def segment_parcels(
        self,
        image: Union[np.ndarray, torch.Tensor],
        return_geojson: bool = True,
    ) -> Dict[str, Any]:
        """Perform semantic segmentation on drone orthomosaic patch.
        
        Args:
            image: [H, W, 3] uint8/float numpy image or [B, 3, H, W] tensor.
            return_geojson: If True, vectorizes building parcels into GeoJSON features.
        """
        self.segmenter.eval()
        if isinstance(image, np.ndarray):
            h, w = image.shape[:2]
            img_norm = image.astype(np.float32) / 255.0 if image.dtype == np.uint8 else image.astype(np.float32)
            tensor = torch.from_numpy(img_norm).permute(2, 0, 1).unsqueeze(0).to(self.device)
        else:
            tensor = image.to(self.device)
            h, w = tensor.shape[-2:]

        logits = self.segmenter(tensor)
        probs = F.softmax(logits, dim=1)
        mask = torch.argmax(probs, dim=1).squeeze(0).cpu().numpy().astype(np.uint8)

        confidence = torch.max(probs, dim=1).values.squeeze(0).cpu().numpy()

        result = {
            "mask": mask,
            "confidence_map": confidence,
            "mean_confidence": float(np.mean(confidence)),
        }

        if return_geojson:
            geojson = mask_to_cadastral_geojson(mask, pixel_scale=1.0)
            result["geojson"] = geojson

        return result

    # --- 2. Bi-Temporal Change Detection ---
    @torch.no_grad()
    def detect_temporal_changes(
        self,
        t1_image: np.ndarray,
        t2_image: np.ndarray,
        min_change_area_sqm: float = 5.0,
    ) -> Dict[str, Any]:
        """Audit bi-temporal drone flights (T1 vs T2) for new constructions & encroachments."""
        # 1. Segment both timeframes
        res1 = self.segment_parcels(t1_image, return_geojson=False)
        res2 = self.segment_parcels(t2_image, return_geojson=False)

        m1, m2 = res1["mask"], res2["mask"]

        # 2. Run Siamese feature comparison & mutation detector
        mutations_report = self.change_detector.detect_changes(
            m1, m2, min_change_area_sqm=min_change_area_sqm
        )

        return {
            "t1_mask": m1,
            "t2_mask": m2,
            "mutation_audit": mutations_report,
        }

    # --- 3. Promptable Zero-Shot Parcel Segmentation ---
    def segment_with_prompt(
        self,
        image: np.ndarray,
        box_prompt: Optional[Tuple[int, int, int, int]] = None,
        positive_points: Optional[List[Tuple[int, int]]] = None,
        negative_points: Optional[List[Tuple[int, int]]] = None,
    ) -> np.ndarray:
        """Extract exact cadastral boundary using interactive bounding box or click coordinates."""
        if box_prompt is not None:
            return self.sam_adapter.segment_with_box_prompt(image, box_prompt)
        elif positive_points:
            return self.sam_adapter.segment_with_point_prompts(
                image, positive_points=positive_points, negative_points=negative_points
            )
        else:
            raise ValueError("Must provide either box_prompt or positive_points.")

    # --- 4. Sub-Pixel Super-Resolution Enhancement ---
    @torch.no_grad()
    def enhance_resolution(
        self,
        image_patch: np.ndarray,
        scale_factor: int = 2,
    ) -> np.ndarray:
        """Sharpen blurry drone raster tile and corner plinths using sub-pixel SISR."""
        return enhance_drone_patch(image_patch, scale_factor=scale_factor)

    # --- 5. Rooftop Classification & Explainable AI (XAI) ---
    def classify_and_explain(
        self,
        image_patch: np.ndarray,
    ) -> Dict[str, Any]:
        """Classify roof material and generate Grad-CAM visual explanation overlay."""
        # Material prediction
        mat_res = self.roof_classifier.classify_rooftop_patch(image_patch)

        # XAI Heatmap from segmenter
        gradcam = CadastralGradCAM(self.segmenter)
        img_norm = image_patch.astype(np.float32) / 255.0 if image_patch.dtype == np.uint8 else image_patch.astype(np.float32)
        tensor = torch.from_numpy(img_norm).permute(2, 0, 1).unsqueeze(0).to(self.device)

        heatmap = gradcam.generate_heatmap(tensor, target_class=1)
        gradcam.remove_hooks()

        overlay = generate_legal_audit_heatmap(image_patch, heatmap, alpha=0.5)

        return {
            "roof_material": mat_res["roof_material"],
            "material_confidence": float(mat_res["confidence"]),
            "heatmap": heatmap,
            "xai_overlay": overlay,
        }


# =========================================================================
# MODEL 2: Unified Satellite Foundation Master Model
# =========================================================================

class UnifiedSatelliteFoundationEngine(nn.Module):
    """Unified Master Engine for Satellite & Remote Sensing Imagery (Techniques Suite).
    
    Consolidates 5 Satellite Remote Sensing Models into a single unified pipeline:
    1. FarSeg (Foreground-Aware Semantic Segmentation for wide-area land cover)
    2. OrientedCadastralDetector (Arbitrary-Angle Rotated Bounding Box Detection)
    3. CadastralPanSharpenNet (Deep Multispectral + Panchromatic Residual Fusion)
    4. CloudShadowNet (Automated Cloud, Cirrus Haze, & Shadow Masking)
    5. GeoFoundationViT & RemoteSensingEmbedder (Geospatial Feature Embeddings & CBIR)
    """

    def __init__(
        self,
        in_channels: int = 3,
        num_classes: int = 5,
        embed_dim: int = 256,
        device: Optional[Union[str, torch.device]] = None,
    ) -> None:
        super().__init__()
        self.device = torch.device(device if device else ("cuda" if torch.cuda.is_available() else "cpu"))

        # 1. FarSeg Geospatial Segmentation Network
        self.farseg = FarSeg(in_channels=in_channels, num_classes=num_classes)

        # 2. Oriented Object Detector (Rotated Bounding Box)
        self.oriented_detector = OrientedCadastralDetector(in_channels=in_channels, num_classes=num_classes)

        # 3. Deep Pansharpening Network
        self.pansharpen_net = CadastralPanSharpenNet(ms_channels=4, pan_channels=1, num_filters=32, num_blocks=4)

        # 4. Cloud & Shadow Segmentation Network
        self.cloud_net = CloudShadowNet(in_channels=in_channels, num_classes=4, base_filters=32)

        # 5. Foundation Vision Transformer & Embedder
        self.foundation_vit = GeoFoundationViT(img_size=128, patch_size=16, embed_dim=embed_dim, depth=4)
        self.embedder = RemoteSensingEmbedder(model=self.foundation_vit)

        self.to(self.device)
        self.eval()

    # --- 1. Wide-Area Foreground-Aware Segmentation ---
    @torch.no_grad()
    def segment_satellite_scene(
        self,
        satellite_image: Union[np.ndarray, torch.Tensor],
    ) -> Dict[str, Any]:
        """Perform foreground-aware segmentation resolving class imbalance on satellite tiles."""
        self.farseg.eval()
        if isinstance(satellite_image, np.ndarray):
            img_norm = satellite_image.astype(np.float32) / 255.0 if satellite_image.dtype == np.uint8 else satellite_image.astype(np.float32)
            tensor = torch.from_numpy(img_norm).permute(2, 0, 1).unsqueeze(0).to(self.device)
        else:
            tensor = satellite_image.to(self.device)

        logits = self.farseg(tensor)
        probs = F.softmax(logits, dim=1)
        mask = torch.argmax(probs, dim=1).squeeze(0).cpu().numpy().astype(np.uint8)

        return {
            "mask": mask,
            "probabilities": probs.squeeze(0).cpu().numpy(),
        }

    # --- 2. Rotated / Oriented Bounding Box Detection ---
    @torch.no_grad()
    def detect_oriented_structures(
        self,
        satellite_image: Union[np.ndarray, torch.Tensor],
        conf_threshold: float = 0.4,
    ) -> List[OrientedBox]:
        """Detect tilted/rotated buildings, solar arrays, vessels, and vehicles with angle theta."""
        self.oriented_detector.eval()
        if isinstance(satellite_image, np.ndarray):
            img_norm = satellite_image.astype(np.float32) / 255.0 if satellite_image.dtype == np.uint8 else satellite_image.astype(np.float32)
            tensor = torch.from_numpy(img_norm).permute(2, 0, 1).unsqueeze(0).to(self.device)
        else:
            tensor = satellite_image.to(self.device)

        cls_logits, reg_params = self.oriented_detector(tensor)
        boxes_batch = self.oriented_detector.decode_predictions(
            cls_logits, reg_params, conf_threshold=conf_threshold
        )
        return boxes_batch[0] if boxes_batch else []

    # --- 3. Deep Satellite Pansharpening & Fusion ---
    @torch.no_grad()
    def pansharpen(
        self,
        multispectral: torch.Tensor,
        panchromatic: torch.Tensor,
        target_reference: Optional[torch.Tensor] = None,
    ) -> Dict[str, Any]:
        """Fuse lower-resolution multispectral image with crisp single-band Panchromatic image."""
        self.pansharpen_net.eval()
        ms = multispectral.to(self.device)
        pan = panchromatic.to(self.device)

        fused = self.pansharpen_net(ms, pan)

        result: Dict[str, Any] = {"fused_multispectral": fused}

        if target_reference is not None:
            ref = target_reference.to(self.device)
            sam = compute_spectral_angle_mapper(fused, ref)
            ergas = compute_ergas(fused, ref)
            result["sam_degrees"] = float(sam.item())
            result["ergas_score"] = float(ergas)

        return result

    # --- 4. Cloud & Atmospheric Shadow Masking ---
    @torch.no_grad()
    def mask_clouds_and_shadows(
        self,
        satellite_image: Union[np.ndarray, torch.Tensor],
    ) -> Dict[str, Any]:
        """Detect thick clouds, thin cirrus haze, and cast shadows on satellite orthomosaics."""
        if isinstance(satellite_image, np.ndarray):
            img_norm = satellite_image.astype(np.float32) / 255.0 if satellite_image.dtype == np.uint8 else satellite_image.astype(np.float32)
            tensor = torch.from_numpy(img_norm).permute(2, 0, 1).unsqueeze(0).to(self.device)
        else:
            tensor = satellite_image.to(self.device)

        return self.cloud_net.segment_clouds_and_shadows(tensor)

    # --- 5. Foundation Embeddings & Tile Similarity Search ---
    def compute_tile_embedding(self, tile_np: np.ndarray) -> np.ndarray:
        """Extract 256-D normalized semantic vector for zero-shot search and retrieval."""
        return self.embedder.compute_embedding(tile_np)

    def compute_similarity(self, emb1: np.ndarray, emb2: np.ndarray) -> float:
        """Compute cosine similarity score between two satellite tile embeddings."""
        return self.embedder.compute_cosine_similarity(emb1, emb2)
