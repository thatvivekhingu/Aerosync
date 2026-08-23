"""
models/constants.py
===================
Shared constants for the AeroSync Cadastral AI Engine.

Separated here so geometry.py, losses.py, model.py, and uncertainty.py
can all import them without circular dependencies.
"""

from __future__ import annotations

# Class index → human-readable label (SVAMITVA land-cover taxonomy)
CLASS_NAMES: dict[int, str] = {
    0: "Background / Open Parcel",
    1: "Building",
    2: "Road / Corridor",
    3: "Water Body",
    4: "Greenery / Agri",
}

# Class label → BGR colour for mask visualisation
CLASS_COLORS: dict[str, tuple[int, int, int]] = {
    "Background": (30, 30, 30),
    "Building": (255, 165, 0),
    "Road": (255, 255, 0),
    "Water": (0, 150, 255),
    "Greenery": (34, 139, 34),
}

# Road class index — used by clDiceLoss to restrict centerline loss
ROAD_CLASS_ID: int = 2
