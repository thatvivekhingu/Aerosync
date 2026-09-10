"use client";

import React, { useState } from "react";
import { CadastralParcel, CADASTRAL_PARCELS } from "@/data/parcels";
import {
  Layers,
  Compass,
  ZoomIn,
  ZoomOut,
  AlertTriangle,
  ShieldCheck,
  Maximize2,
  Navigation,
  Sparkles,
  Eye,
  Sliders,
  Flag,
} from "lucide-react";

interface MapboxViewerProps {
  selectedParcel: CadastralParcel;
  onSelectParcel: (parcel: CadastralParcel) => void;
}

const AVAILABLE_PATCHES = [
  { id: "drone_aerial", label: "Estate Aerial - Cadastral Survey (High-Res)", file: "/inference/drone_aerial_property_mapping.jpg", overlay: "/inference/drone_aerial_property_mapping_cadastral_overlay.png" },
  { id: "patch_100", label: "Varanasi - Sevapuri Rural", file: "/inference/patch_100_orig.png", overlay: "/inference/patch_100_cadastral_overlay.png" },
  { id: "patch_105", label: "Lucknow - Malihabad Sector", file: "/inference/patch_105_orig.png", overlay: "/inference/patch_105_cadastral_overlay.png" },
  { id: "patch_106", label: "Prayagraj - Jhunsi Cadastre", file: "/inference/patch_106_orig.png", overlay: "/inference/patch_106_cadastral_overlay.png" },
  { id: "patch_109", label: "Gorakhpur - Pipraich Ortho", file: "/inference/patch_109_orig.png", overlay: "/inference/patch_109_cadastral_overlay.png" },
];

export default function MapboxViewer({ selectedParcel, onSelectParcel }: MapboxViewerProps) {
  const [activeLayers, setActiveLayers] = useState({
    drone: true,
    cadastralOverlay: false,
    polygons: true,
    directionBoundaries: true, // SIH Feature: Direction Boundary & Chauhaddi measurements
    conflicts: true, // SIH Feature: Boundary Conflict Detection
    ulpins: true,
    uncertainty: true, // SIH Feature: Unclear Area Flagging & MC Dropout
  });

  const [activePatch, setActivePatch] = useState(AVAILABLE_PATCHES[0]);
  const [hoveredParcel, setHoveredParcel] = useState<CadastralParcel | null>(null);
  const [zoomLevel, setZoomLevel] = useState(18);
  const [compassAngle, setCompassAngle] = useState(0);

  const toggleLayer = (layerKey: keyof typeof activeLayers) => {
    setActiveLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  // Switch patch automatically if parcel specifies a real drone image
  const currentDroneImage = selectedParcel.realDroneImage || activePatch.file;

  return (
    <div className="flex flex-col gap-3">
      {/* Top Map Toolbar with SIH Solutions */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl shadow-sm">
        
        {/* Left: Active Drone Survey Zone Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Drone Patch:
          </span>
          <select
            value={activePatch.id}
            onChange={(e) => {
              const found = AVAILABLE_PATCHES.find((p) => p.id === e.target.value);
              if (found) setActivePatch(found);
            }}
            className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
          >
            {AVAILABLE_PATCHES.map((patch) => (
              <option key={patch.id} value={patch.id}>
                {patch.label}
              </option>
            ))}
          </select>
        </div>

        {/* Right: Interactive Layer Toggles (All SIH Solutions) */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => toggleLayer("drone")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
              activeLayers.drone
                ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                : "bg-white text-slate-600 border-slate-300 hover:bg-slate-100"
            }`}
            title="Real Drone High-Res Orthomosaic"
          >
            🛰️ Real Drone RGB
          </button>

          <button
            onClick={() => toggleLayer("directionBoundaries")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
              activeLayers.directionBoundaries
                ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                : "bg-white text-slate-600 border-slate-300 hover:bg-slate-100"
            }`}
            title="Show N, S, E, W Boundary dimensions in meters"
          >
            🧭 Direction Boundaries (Chauhaddi)
          </button>

          <button
            onClick={() => toggleLayer("polygons")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
              activeLayers.polygons
                ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                : "bg-white text-slate-600 border-slate-300 hover:bg-slate-100"
            }`}
            title="90° Orthogonalized Legal Cadastral Polygons"
          >
            📐 90° Polygons
          </button>

          <button
            onClick={() => toggleLayer("conflicts")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
              activeLayers.conflicts
                ? "bg-rose-600 text-white border-rose-600 shadow-sm animate-pulse"
                : "bg-white text-slate-600 border-slate-300 hover:bg-slate-100"
            }`}
            title="SIH Solution: Boundary Conflict & Road/Water Buffer Detection"
          >
            ⚠️ Conflict Detection
          </button>

          <button
            onClick={() => toggleLayer("uncertainty")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
              activeLayers.uncertainty
                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                : "bg-white text-slate-600 border-slate-300 hover:bg-slate-100"
            }`}
            title="SIH Solution: Monte Carlo Dropout Uncertainty Flagging"
          >
            🔍 Surveyor Doubt Flags
          </button>

          <button
            onClick={() => toggleLayer("ulpins")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
              activeLayers.ulpins
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-white text-slate-600 border-slate-300 hover:bg-slate-100"
            }`}
            title="Bhu-Aadhaar & SIH Property ID"
          >
            🏷️ Property IDs
          </button>
        </div>
      </div>

      {/* Map Viewport Area with Real Drone Imagery */}
      <div className="relative w-full h-[540px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-xl group select-none">
        
        {/* Real Drone Orthomosaic Background */}
        <div className="absolute inset-0 overflow-hidden">
          {activeLayers.drone ? (
            <img
              src={currentDroneImage}
              alt="Real Drone Orthomosaic Survey"
              className="w-full h-full object-cover transition-transform duration-500"
              style={{
                transform: `scale(${zoomLevel / 18}) rotate(${compassAngle}deg)`,
                filter: "contrast(1.08) brightness(0.92) saturate(1.1)",
              }}
            />
          ) : (
            <div className="w-full h-full bg-[#0a1118]" />
          )}

          {/* AI Cadastral Multi-Class Overlay Layer if active */}
          {activeLayers.cadastralOverlay && (
            <img
              src={selectedParcel.cadastralOverlayImage || activePatch.overlay}
              alt="AI Cadastral Overlay"
              className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-80 pointer-events-none"
            />
          )}

          {/* Vignette & High-Contrast Backdrop */}
          <div className="absolute inset-0 bg-radial-gradient pointer-events-none opacity-30" />
        </div>

        {/* Interactive SVG GIS Vector Engine for Direction Boundaries & Polygons */}
        <svg className="absolute inset-0 w-full h-full cursor-crosshair z-10">
          <defs>
            {/* Direction Arrow Marker */}
            <marker id="northArrow" viewBox="0 0 10 10" refX="5" refY="3" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,0 L10,3 L0,6 L3,3 Z" fill="#02c39a" />
            </marker>
            <marker id="conflictArrow" viewBox="0 0 10 10" refX="5" refY="3" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,0 L10,3 L0,6 L3,3 Z" fill="#ef4444" />
            </marker>

            {/* Glowing filter for selected boundary */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Statutory 3-Meter Road Buffer Zone Simulation (SIH Conflict Detection) */}
          {activeLayers.conflicts && (
            <g className="transition-opacity duration-300">
              {/* Road Buffer Polygon (Dashed yellow/red buffer) */}
              <polygon
                points="50,420 750,420 750,380 50,380"
                fill="rgba(239, 68, 68, 0.15)"
                stroke="#f59e0b"
                strokeWidth="1.5"
                strokeDasharray="6 4"
              />
              <text x="70" y="405" fill="#f59e0b" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
                ⚠️ Statutory 3.0m Road Buffer Zone (DoLR PS 26012 Standard)
              </text>
            </g>
          )}

          {/* Render All Cadastral Parcels */}
          {CADASTRAL_PARCELS.map((p) => {
            const isSelected = selectedParcel.id === p.id;
            const isHovered = hoveredParcel?.id === p.id;

            // Map GIS Coordinates to SVG Viewport (800 x 540)
            const coords = p.coordinates.map(([lng, lat]) => {
              const x = 70 + ((lng - 82.972) / (82.979 - 82.972)) * 660;
              const y = 470 - ((lat - 25.316) / (25.319 - 25.316)) * 410;
              return { x, y };
            });

            const pointsSvg = coords.map((c) => `${c.x},${c.y}`).join(" ");

            const cx = 70 + ((p.centroid[0] - 82.972) / (82.979 - 82.972)) * 660;
            const cy = 470 - ((p.centroid[1] - 25.316) / (25.319 - 25.316)) * 410;

            // Fill color logic
            let fillColor = p.fillColor;
            if (activeLayers.uncertainty && p.verificationNeeded) {
              fillColor = "rgba(225, 29, 72, 0.55)";
            } else if (isSelected) {
              fillColor = "rgba(2, 195, 154, 0.35)";
            }

            const hasConflict = p.conflictAlert && activeLayers.conflicts;

            return (
              <g
                key={p.id}
                onClick={() => onSelectParcel(p)}
                onMouseEnter={() => setHoveredParcel(p)}
                onMouseLeave={() => setHoveredParcel(null)}
                className="cursor-pointer transition-all group/parcel"
              >
                {/* Regularized 90° Polygon Body */}
                <polygon
                  points={pointsSvg}
                  fill={fillColor}
                  stroke={
                    hasConflict
                      ? "#ef4444"
                      : isSelected
                      ? "#00f2fe"
                      : isHovered
                      ? "#38bdf8"
                      : p.color
                  }
                  strokeWidth={isSelected ? 3.5 : hasConflict ? 2.5 : isHovered ? 2.2 : 1.8}
                  strokeDasharray={hasConflict ? "6 3" : undefined}
                  filter={isSelected ? "url(#glow)" : undefined}
                  className="transition-all duration-200"
                />

                {/* Corner Orthogonalization 90° Angle Markers (SIH Solution) */}
                {activeLayers.polygons &&
                  coords.map((c, vIdx) => (
                    <g key={vIdx}>
                      <circle
                        cx={c.x}
                        cy={c.y}
                        r={isSelected ? 4.5 : 3}
                        fill={hasConflict ? "#ef4444" : isSelected ? "#00f2fe" : "#ffffff"}
                        stroke="#0f172a"
                        strokeWidth={1.5}
                      />
                    </g>
                  ))}

                {/* DIRECTION BOUNDARIES & CHAUHADDI DIMENSIONS OVERLAY (Exact User Request) */}
                {activeLayers.directionBoundaries && isSelected && coords.length >= 4 && (
                  <g className="animate-fadeIn pointer-events-none">
                    {/* NORTH BOUNDARY (Top edge) */}
                    <g>
                      <line
                        x1={coords[3].x}
                        y1={coords[3].y}
                        x2={coords[2].x}
                        y2={coords[2].y}
                        stroke={p.directionBoundaries.north.status === "CONFLICT" ? "#ef4444" : "#10b981"}
                        strokeWidth="3"
                      />
                      {/* North Dimension Chip */}
                      <rect
                        x={(coords[3].x + coords[2].x) / 2 - 38}
                        y={(coords[3].y + coords[2].y) / 2 - 20}
                        width="76"
                        height="16"
                        rx="4"
                        fill="rgba(15, 23, 42, 0.9)"
                        stroke={p.directionBoundaries.north.status === "CONFLICT" ? "#ef4444" : "#10b981"}
                        strokeWidth="1"
                      />
                      <text
                        x={(coords[3].x + coords[2].x) / 2}
                        y={(coords[3].y + coords[2].y) / 2 - 8}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        N: {p.directionBoundaries.north.lengthM}m {p.directionBoundaries.north.status === "CONFLICT" ? "⚠️" : ""}
                      </text>
                    </g>

                    {/* EAST BOUNDARY (Right edge) */}
                    <g>
                      <line
                        x1={coords[2].x}
                        y1={coords[2].y}
                        x2={coords[1].x}
                        y2={coords[1].y}
                        stroke={p.directionBoundaries.east.status === "CONFLICT" ? "#ef4444" : "#10b981"}
                        strokeWidth="3"
                      />
                      {/* East Dimension Chip */}
                      <rect
                        x={(coords[2].x + coords[1].x) / 2 + 6}
                        y={(coords[2].y + coords[1].y) / 2 - 8}
                        width="70"
                        height="16"
                        rx="4"
                        fill="rgba(15, 23, 42, 0.9)"
                        stroke={p.directionBoundaries.east.status === "CONFLICT" ? "#ef4444" : "#10b981"}
                        strokeWidth="1"
                      />
                      <text
                        x={(coords[2].x + coords[1].x) / 2 + 41}
                        y={(coords[2].y + coords[1].y) / 2 + 4}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        E: {p.directionBoundaries.east.lengthM}m
                      </text>
                    </g>

                    {/* SOUTH BOUNDARY (Bottom edge) */}
                    <g>
                      <line
                        x1={coords[1].x}
                        y1={coords[1].y}
                        x2={coords[0].x}
                        y2={coords[0].y}
                        stroke={p.directionBoundaries.south.status === "CONFLICT" ? "#ef4444" : "#10b981"}
                        strokeWidth="3"
                      />
                      {/* South Dimension Chip */}
                      <rect
                        x={(coords[1].x + coords[0].x) / 2 - 35}
                        y={(coords[1].y + coords[0].y) / 2 + 8}
                        width="70"
                        height="16"
                        rx="4"
                        fill="rgba(15, 23, 42, 0.9)"
                        stroke={p.directionBoundaries.south.status === "CONFLICT" ? "#ef4444" : "#10b981"}
                        strokeWidth="1"
                      />
                      <text
                        x={(coords[1].x + coords[0].x) / 2}
                        y={(coords[1].y + coords[0].y) / 2 + 20}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        S: {p.directionBoundaries.south.lengthM}m
                      </text>
                    </g>

                    {/* WEST BOUNDARY (Left edge) */}
                    <g>
                      <line
                        x1={coords[0].x}
                        y1={coords[0].y}
                        x2={coords[3].x}
                        y2={coords[3].y}
                        stroke={p.directionBoundaries.west.status === "CONFLICT" ? "#ef4444" : "#10b981"}
                        strokeWidth="3"
                      />
                      {/* West Dimension Chip */}
                      <rect
                        x={(coords[0].x + coords[3].x) / 2 - 76}
                        y={(coords[0].y + coords[3].y) / 2 - 8}
                        width="70"
                        height="16"
                        rx="4"
                        fill="rgba(15, 23, 42, 0.9)"
                        stroke={p.directionBoundaries.west.status === "CONFLICT" ? "#ef4444" : "#10b981"}
                        strokeWidth="1"
                      />
                      <text
                        x={(coords[0].x + coords[3].x) / 2 - 41}
                        y={(coords[0].y + coords[3].y) / 2 + 4}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        W: {p.directionBoundaries.west.lengthM}m
                      </text>
                    </g>

                    {/* 90° Angle Badge at Primary Corner */}
                    <rect
                      x={coords[3].x + 4}
                      y={coords[3].y + 4}
                      width="38"
                      height="14"
                      rx="3"
                      fill="rgba(2, 195, 154, 0.95)"
                    />
                    <text
                      x={coords[3].x + 23}
                      y={coords[3].y + 15}
                      textAnchor="middle"
                      fill="#0f172a"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      90.0°
                    </text>
                  </g>
                )}

                {/* Central ULPIN & SIH Property ID Label */}
                {activeLayers.ulpins && (
                  <g className="pointer-events-none">
                    <rect
                      x={cx - 52}
                      y={cy - 10}
                      width="104"
                      height="20"
                      rx="6"
                      fill={isSelected ? "rgba(2, 44, 34, 0.9)" : "rgba(15, 23, 42, 0.85)"}
                      stroke={isSelected ? "#00f2fe" : "rgba(255,255,255,0.2)"}
                      strokeWidth={isSelected ? 1.5 : 1}
                    />
                    <text
                      x={cx}
                      y={cy + 4}
                      textAnchor="middle"
                      fill={isSelected ? "#00f2fe" : "#ffffff"}
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {p.propertyId || p.id}
                    </text>
                  </g>
                )}

                {/* SIH Survey Priority Alert Flasher on Flagged Parcel */}
                {hasConflict && (
                  <g className="animate-bounce">
                    <rect
                      x={cx - 70}
                      y={cy - 35}
                      width="140"
                      height="18"
                      rx="4"
                      fill="#ef4444"
                      stroke="#ffffff"
                      strokeWidth="1"
                    />
                    <text
                      x={cx}
                      y={cy - 23}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      ⚠️ SURVEY PRIORITY ALERT
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Top-Right Map Controls: Zoom & True North Compass */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
          {/* Compass Rose with True North Indicator */}
          <div
            onClick={() => setCompassAngle((a) => (a + 90) % 360)}
            className="cursor-pointer bg-slate-900/90 backdrop-blur-md p-2 rounded-xl border border-slate-700 shadow-xl flex flex-col items-center justify-center text-white hover:bg-slate-800 transition-all group/compass"
            title="Click to orient Compass Bearing"
          >
            <div
              className="relative w-8 h-8 flex items-center justify-center transition-transform duration-500"
              style={{ transform: `rotate(${compassAngle}deg)` }}
            >
              <Navigation size={22} className="text-rose-500 fill-rose-500 transform -rotate-45" />
            </div>
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-0.5">
              {compassAngle === 0 ? "NORTH" : `${compassAngle}°`}
            </span>
          </div>

          {/* Zoom Buttons */}
          <div className="flex flex-col bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700 shadow-xl overflow-hidden text-white">
            <button
              onClick={() => setZoomLevel((z) => Math.min(24, z + 1))}
              className="p-2 hover:bg-slate-800 text-slate-200 border-b border-slate-700 transition-colors"
              title="Zoom In"
            >
              <ZoomIn size={16} />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(12, z - 1))}
              className="p-2 hover:bg-slate-800 text-slate-200 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut size={16} />
            </button>
          </div>
        </div>

        {/* Top-Left: SIH 2026 Problem Statement & Cadastral Legend */}
        <div className="absolute top-4 left-4 z-20 bg-slate-950/90 backdrop-blur-md text-white p-3.5 rounded-2xl border border-slate-700/80 text-xs shadow-2xl max-w-xs flex flex-col gap-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <div className="flex items-center gap-1.5">
              <Sparkles size={14} className="text-teal-400" />
              <span className="font-bold text-slate-100">SIH 2026 • Cadastral AI</span>
            </div>
            <span className="text-[10px] font-mono text-teal-400 bg-teal-950 px-1.5 py-0.5 rounded border border-teal-800">
              PS-26012
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#ff9800]"></span>
              <span className="text-slate-300">Building (90°)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#8338ec]"></span>
              <span className="text-slate-300">Road Corridor</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#00a6fb]"></span>
              <span className="text-slate-300">Water Body</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#ef4444] animate-pulse"></span>
              <span className="text-rose-400 font-bold">Conflict / Flagged</span>
            </div>
          </div>

          {/* Active Direction Boundary Status */}
          <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
            <span>Chauhaddi Dimensions:</span>
            <span className="text-teal-300 font-bold">N / S / E / W Active</span>
          </div>
        </div>

        {/* Bottom Banner: Real Coordinates & Sub-Centimeter Calibration */}
        <div className="absolute bottom-3 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          <div className="pointer-events-auto bg-slate-950/90 backdrop-blur-md text-slate-300 px-3.5 py-1.5 rounded-xl text-[11px] font-mono border border-slate-800 shadow-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>WGS84 EPSG:4326</span>
            <span className="text-slate-600">|</span>
            <span>
              {selectedParcel.centroid[1].toFixed(6)}°N, {selectedParcel.centroid[0].toFixed(6)}°E
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-teal-400 font-bold">Res: 2.8 cm/px Drone GSD</span>
          </div>

          {selectedParcel.conflictAlert && (
            <div className="pointer-events-auto bg-rose-950/90 border border-rose-600 text-rose-200 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 animate-pulse">
              <AlertTriangle size={14} className="text-rose-400" />
              <span>{selectedParcel.conflictAlert.description}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
