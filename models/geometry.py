"""
models/geometry.py
==================
Geometry processing utilities for AeroSync cadastral segmentation.

Contains:
- regularize_polygon       : Simplify / heal shapely polygons.
- orthogonalize_polygon    : Dominant-angle edge snapping to 90° multiples.
- mask_to_cadastral_geojson: Vectorize segmentation mask → GeoJSON FeatureCollection
                             with real per-polygon confidence scores.

All public functions are backward-compatible with the original model.py API.
"""

from __future__ import annotations

import json
import logging
from typing import Optional

import cv2
import numpy as np
from shapely.geometry import Polygon

from .constants import CLASS_NAMES

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# 1. Polygon regularization (unchanged from original)
# ---------------------------------------------------------------------------

def regularize_polygon(poly: Polygon, tolerance: float = 1.5) -> Polygon:
    """Simplify and heal a shapely Polygon.

    Parameters
    ----------
    poly : Polygon
        Input polygon (may be invalid).
    tolerance : float
        Simplification tolerance in the polygon's coordinate units.

    Returns
    -------
    Polygon
        Simplified, valid polygon, or the original on failure.
    """
    if poly.is_empty or not poly.is_valid:
        poly = poly.buffer(0)
    simplified = poly.simplify(tolerance, preserve_topology=True)
    if not simplified.is_valid or simplified.is_empty:
        return poly
    return simplified


# ---------------------------------------------------------------------------
# 2. Dominant-angle orthogonalization (Bug 1 fix)
# ---------------------------------------------------------------------------

def orthogonalize_polygon(poly: Polygon, angle_threshold_deg: float = 15.0) -> Polygon:
    """Orthogonalize a building footprint using dominant-angle edge snapping.

    The original implementation computed snapped vectors but never used them
    (a silent no-op). This replacement uses a proper dominant-orientation
    algorithm:

    1. Compute the angle of every edge modulo 90 degrees.
    2. Take the length-weighted median as the polygon's dominant orientation
       ``theta_dom``.
    3. Snap each edge direction to the nearest multiple of 90° from
       ``theta_dom``, preserving the original edge length.
    4. Reconstruct vertex positions by walking the snapped edge vectors from
       the centroid's first vertex.
    5. Validate with shapely; fall back to the original polygon on failure.

    This matters for SVAMITVA because legal cadastral maps require right-angle
    building footprints — the previous no-op silently produced angled outputs
    that fail cadastral validation.

    Parameters
    ----------
    poly : Polygon
        Input building footprint polygon.
    angle_threshold_deg : float
        Unused — kept for backward-compatible signature only.

    Returns
    -------
    Polygon
        Orthogonalized polygon, or the original on failure.
    """
    if not poly.is_valid or poly.is_empty or poly.geom_type != "Polygon":
        return poly

    coords = list(poly.exterior.coords)[:-1]  # drop closing duplicate
    n = len(coords)
    if n < 4:
        return poly

    coords_arr = np.array(coords, dtype=np.float64)

    # ------------------------------------------------------------------
    # Step 1 — compute edge vectors and their angles mod 90°
    # ------------------------------------------------------------------
    edges = np.roll(coords_arr, -1, axis=0) - coords_arr          # shape (n, 2)
    lengths = np.linalg.norm(edges, axis=1)                        # shape (n,)

    # Remove degenerate edges
    valid = lengths > 1e-9
    if valid.sum() < 3:
        return poly

    angles_rad = np.arctan2(edges[:, 1], edges[:, 0])             # (-π, π]
    angles_mod90 = angles_rad % (np.pi / 2)                       # (0, π/2]

    # ------------------------------------------------------------------
    # Step 2 — length-weighted median to find dominant orientation θ_dom
    # ------------------------------------------------------------------
    valid_angles = angles_mod90[valid]
    valid_lengths = lengths[valid]
    sort_idx = np.argsort(valid_angles)
    sorted_angles = valid_angles[sort_idx]
    sorted_lengths = valid_lengths[sort_idx]
    cumulative = np.cumsum(sorted_lengths)
    total = cumulative[-1]
    median_idx = np.searchsorted(cumulative, total / 2.0)
    theta_dom = sorted_angles[min(median_idx, len(sorted_angles) - 1)]

    # ------------------------------------------------------------------
    # Step 3 — snap each edge to the nearest 90° multiple from θ_dom
    # ------------------------------------------------------------------
    snapped_edges = np.empty_like(edges)
    for i in range(n):
        length = lengths[i]
        if length < 1e-9:
            snapped_edges[i] = edges[i]
            continue

        angle = angles_rad[i]
        # Express angle relative to dominant orientation, round to nearest 90°
        relative = angle - theta_dom
        snapped_relative = np.round(relative / (np.pi / 2)) * (np.pi / 2)
        snapped_angle = snapped_relative + theta_dom

        snapped_edges[i] = np.array([
            np.cos(snapped_angle) * length,
            np.sin(snapped_angle) * length,
        ])

    # ------------------------------------------------------------------
    # Step 4 — reconstruct vertices by cumulative sum of snapped edges
    # ------------------------------------------------------------------
    new_coords = np.empty_like(coords_arr)
    new_coords[0] = coords_arr[0]
    for i in range(1, n):
        new_coords[i] = new_coords[i - 1] + snapped_edges[i - 1]

    # ------------------------------------------------------------------
    # Step 5 — validate; fall back on failure
    # ------------------------------------------------------------------
    try:
        closing = new_coords[0]
        ring = np.vstack([new_coords, closing])
        snapped_poly = Polygon(ring)
        if snapped_poly.is_valid and not snapped_poly.is_empty and snapped_poly.area > 0:
            return snapped_poly
    except Exception:
        pass

    logger.debug("orthogonalize_polygon: snapped polygon invalid, returning original.")
    return poly


# ---------------------------------------------------------------------------
# 3. Mask → GeoJSON vectorization (Bug 2 fix: real confidence scores)
# ---------------------------------------------------------------------------

def mask_to_cadastral_geojson(
    pred_mask: np.ndarray,
    class_id: int = 1,
    min_area: float = 30.0,
    pixel_scale: float = 0.035544,
    tiepoint_x: float = 0.0,
    tiepoint_y: float = 0.0,
    tolerance: float = 1.2,
    prob_map: Optional[np.ndarray] = None,
) -> dict:
    """Vectorize a segmentation mask into a cadastral GeoJSON FeatureCollection.

    Parameters
    ----------
    pred_mask : np.ndarray
        2-D integer array of class indices, shape (H, W).
    class_id : int
        The class index to vectorize (default 1 = Building).
    min_area : float
        Minimum polygon area in coordinate units (metres squared when
        georeferenced). Polygons smaller than this are discarded.
    pixel_scale : float
        Ground sampling distance in metres per pixel (default 0.035544 m ≈
        3.5 cm GSD typical for SVAMITVA drone surveys).
    tiepoint_x : float
        World X coordinate of the top-left pixel (EPSG:3857 eastings).
    tiepoint_y : float
        World Y coordinate of the top-left pixel (EPSG:3857 northings).
    tolerance : float
        Polygon simplification tolerance multiplier (× pixel_scale).
    prob_map : np.ndarray or None
        Optional 2-D float array of per-pixel softmax probability for
        ``class_id``, shape (H, W), values in [0, 1].
        When provided:
          - ``confidence_score`` = mean probability inside the polygon mask.
          - ``uncertainty_score`` = std of probabilities inside the mask.
        When ``None``, both fields are set to ``null`` in GeoJSON (previously
        they were hardcoded to the misleading value 0.96).

    Returns
    -------
    dict
        GeoJSON FeatureCollection (EPSG:3857) with building/parcel polygons.
    """
    binary = (pred_mask == class_id).astype(np.uint8) * 255
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
    binary = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)

    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    features = []
    parcel_idx = 1

    for cnt in contours:
        if len(cnt) < 4:
            continue
        pts_px = cnt.reshape(-1, 2)
        world_pts = [
            (tiepoint_x + (x_px * pixel_scale), tiepoint_y - (y_px * pixel_scale))
            for x_px, y_px in pts_px
        ]
        if len(world_pts) < 4:
            continue

        try:
            poly = Polygon(world_pts)
            if not poly.is_valid:
                poly = poly.buffer(0)

            area_sqm = poly.area
            if area_sqm < min_area:
                continue

            clean_poly = regularize_polygon(poly, tolerance=tolerance * pixel_scale)
            if class_id == 1:  # Orthogonalize building footprints
                clean_poly = orthogonalize_polygon(clean_poly)

            centroid = clean_poly.centroid
            ulpin_id = (
                f"IN-SVAMITVA-"
                f"{abs(int(centroid.x)) % 10000:04d}-"
                f"{abs(int(centroid.y)) % 10000:04d}-"
                f"{parcel_idx:03d}"
            )

            # ----------------------------------------------------------
            # Per-polygon confidence & uncertainty (Bug 2 fix)
            # ----------------------------------------------------------
            confidence_score: Optional[float] = None
            uncertainty_score: Optional[float] = None

            if prob_map is not None:
                # Build a pixel-space mask for this contour
                h, w = pred_mask.shape
                contour_mask = np.zeros((h, w), dtype=np.uint8)
                cv2.drawContours(contour_mask, [cnt], -1, 255, thickness=cv2.FILLED)
                roi_probs = prob_map[contour_mask == 255]
                if roi_probs.size > 0:
                    confidence_score = float(np.mean(roi_probs))
                    uncertainty_score = float(np.std(roi_probs))

            feature = {
                "type": "Feature",
                "id": parcel_idx,
                "properties": {
                    "parcel_id": parcel_idx,
                    "ulpin": ulpin_id,
                    "feature_type": CLASS_NAMES.get(class_id, "Building Footprint"),
                    "area_sqm": round(area_sqm, 2),
                    "perimeter_m": round(clean_poly.length, 2),
                    "confidence_score": round(confidence_score, 4) if confidence_score is not None else None,
                    "uncertainty_score": round(uncertainty_score, 4) if uncertainty_score is not None else None,
                    "validation_status": "AI_Attention_Generated_Validated",
                },
                "geometry": json.loads(json.dumps(clean_poly.__geo_interface__)),
            }
            features.append(feature)
            parcel_idx += 1

        except Exception as exc:
            logger.warning("Skipping contour due to error: %s", exc)
            continue

    # Fallback demo parcels when no real detections exist
    if len(features) == 0:
        logger.warning(
            "mask_to_cadastral_geojson: no polygons above min_area=%.1f found "
            "for class_id=%d; inserting demo placeholder features.",
            min_area,
            class_id,
        )
        for i in range(1, 4):
            x_w = tiepoint_x + (i * 15.0)
            y_w = tiepoint_y - (i * 15.0)
            poly = Polygon(
                [(x_w, y_w), (x_w + 12.0, y_w), (x_w + 12.0, y_w - 10.0), (x_w, y_w - 10.0)]
            )
            centroid = poly.centroid
            ulpin_id = (
                f"IN-SVAMITVA-"
                f"{abs(int(centroid.x)) % 10000:04d}-"
                f"{abs(int(centroid.y)) % 10000:04d}-"
                f"{i:03d}"
            )
            features.append(
                {
                    "type": "Feature",
                    "id": i,
                    "properties": {
                        "parcel_id": i,
                        "ulpin": ulpin_id,
                        "feature_type": CLASS_NAMES.get(class_id, "Building Footprint"),
                        "area_sqm": 120.0,
                        "perimeter_m": 44.0,
                        "confidence_score": None,
                        "uncertainty_score": None,
                        "validation_status": "DEMO_PLACEHOLDER",
                    },
                    "geometry": json.loads(json.dumps(poly.__geo_interface__)),
                }
            )

    return {
        "type": "FeatureCollection",
        "crs": {
            "type": "name",
            "properties": {"name": "urn:ogc:def:crs:EPSG::3857"},
        },
        "features": features,
    }
