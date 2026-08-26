"""
models/geospatial_pipeline.py
=============================
Geospatial Preprocessing, Tiling, and Vectorization Pipeline.
Inspired by GDAL/OGR scripts in Project Vaayu for processing large .ecw / .tif drone orthophotos.

Enables:
1. Pure Python grid tile generation with coordinate reference systems (CRS).
2. Georeferenced bounding box calculation and tile grid coordinates.
3. Shapefile / GeoJSON conversion and property card data enrichment.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple
import numpy as np


@dataclass
class TileExtent:
    tile_x: int
    tile_y: int
    min_x: float
    min_y: float
    max_x: float
    max_y: float
    width_px: int
    height_px: int


class GeospatialGridTiler:
    """Computes georeferenced sliding window grid bounds for high-res drone orthomosaics."""

    def __init__(self, tile_size_px: int = 512, overlap_px: int = 64) -> None:
        self.tile_size_px = tile_size_px
        self.overlap_px = overlap_px
        self.stride_px = tile_size_px - overlap_px

    def generate_grid_tiles(
        self,
        image_width_px: int,
        image_height_px: int,
        geo_transform: Optional[Tuple[float, float, float, float, float, float]] = None,
    ) -> List[TileExtent]:
        """Generate grid bounding boxes across an orthomosaic.

        Parameters
        ----------
        image_width_px : int
            Image width in pixels.
        image_height_px : int
            Image height in pixels.
        geo_transform : Optional[Tuple[float, float, float, float, float, float]]
            GDAL-style Affine transform (origin_x, pixel_width, 0, origin_y, 0, -pixel_height).

        Returns
        -------
        List[TileExtent]
            List of georeferenced tile metadata.
        """
        if geo_transform is None:
            # Default mock 0.05m GSD
            origin_x, px_w, rot_x, origin_y, rot_y, px_h = 77.2090, 0.0000005, 0.0, 28.6139, 0.0, -0.0000005
        else:
            origin_x, px_w, rot_x, origin_y, rot_y, px_h = geo_transform

        tiles: List[TileExtent] = []

        x_steps = max(1, int(np.ceil((image_width_px - self.overlap_px) / self.stride_px)))
        y_steps = max(1, int(np.ceil((image_height_px - self.overlap_px) / self.stride_px)))

        for i in range(x_steps):
            for j in range(y_steps):
                x0 = i * self.stride_px
                y0 = j * self.stride_px
                x1 = min(image_width_px, x0 + self.tile_size_px)
                y1 = min(image_height_px, y0 + self.tile_size_px)

                # Geographic coordinates
                geo_min_x = origin_x + x0 * px_w
                geo_max_x = origin_x + x1 * px_w
                geo_max_y = origin_y + y0 * px_h
                geo_min_y = origin_y + y1 * px_h

                tiles.append(
                    TileExtent(
                        tile_x=i,
                        tile_y=j,
                        min_x=round(geo_min_x, 7),
                        min_y=round(geo_min_y, 7),
                        max_x=round(geo_max_x, 7),
                        max_y=round(geo_max_y, 7),
                        width_px=x1 - x0,
                        height_px=y1 - y0,
                    )
                )

        return tiles


def convert_shapefile_dict_to_geojson(features: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Convert raw GIS feature records into a standard GeoJSON FeatureCollection."""
    geojson_features = []
    for f in features:
        geom = f.get("geometry", {})
        props = f.get("properties", {})
        geojson_features.append(
            {
                "type": "Feature",
                "geometry": geom,
                "properties": props,
            }
        )

    return {
        "type": "FeatureCollection",
        "features": geojson_features,
    }
