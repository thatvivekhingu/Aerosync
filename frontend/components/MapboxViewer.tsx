"use client";

import React, { useEffect, useRef, useState } from "react";
import { CadastralParcel, CADASTRAL_PARCELS } from "@/data/parcels";
import { Layers, Eye, Compass, ZoomIn, ZoomOut, CheckCircle, AlertTriangle } from "lucide-react";

interface MapboxViewerProps {
  selectedParcel: CadastralParcel;
  onSelectParcel: (parcel: CadastralParcel) => void;
}

export default function MapboxViewer({ selectedParcel, onSelectParcel }: MapboxViewerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [activeLayers, setActiveLayers] = useState({
    drone: true,
    segmentation: true,
    polygons: true,
    ulpins: true,
    uncertainty: false,
  });

  const [hoveredParcel, setHoveredParcel] = useState<CadastralParcel | null>(null);
  const [zoomLevel, setZoomLevel] = useState(17);

  const toggleLayer = (layerKey: keyof typeof activeLayers) => {
    setActiveLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Top Map Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-primary" />
          <span className="text-xs sm:text-sm font-semibold text-slate-700">Map Layers:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => toggleLayer("drone")}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
              activeLayers.drone
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-white text-slate-600 border-slate-300 hover:border-slate-400"
            }`}
          >
            🛰️ Satellite / Drone RGB
          </button>

          <button
            onClick={() => toggleLayer("segmentation")}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
              activeLayers.segmentation
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-white text-slate-600 border-slate-300 hover:border-slate-400"
            }`}
          >
            🎨 AI Mask
          </button>

          <button
            onClick={() => toggleLayer("polygons")}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
              activeLayers.polygons
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-white text-slate-600 border-slate-300 hover:border-slate-400"
            }`}
          >
            📐 90° Polygons
          </button>

          <button
            onClick={() => toggleLayer("ulpins")}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
              activeLayers.ulpins
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-white text-slate-600 border-slate-300 hover:border-slate-400"
            }`}
          >
            🏷️ ULPIN Labels
          </button>

          <button
            onClick={() => toggleLayer("uncertainty")}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
              activeLayers.uncertainty
                ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                : "bg-white text-slate-600 border-slate-300 hover:border-slate-400"
            }`}
          >
            🔍 Uncertainty Flags
          </button>
        </div>
      </div>

      {/* Mapbox Viewport Area */}
      <div className="relative w-full h-[520px] bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 shadow-inner group">
        
        {/* Interactive SVG / WebGL Canvas Overlay for Cadastral GIS */}
        <svg className="w-full h-full cursor-crosshair">
          <defs>
            {/* Real aerial imagery pattern */}
            <pattern id="dronePattern" patternUnits="userSpaceOnUse" width="800" height="520">
              <image href="/hero_drone.jpg" x="0" y="0" width="800" height="520" preserveAspectRatio="xMidYMid slice" opacity={activeLayers.drone ? "0.9" : "0.1"} />
            </pattern>
          </defs>

          {/* Background */}
          <rect width="100%" height="100%" fill="url(#dronePattern)" />

          {/* Cadastral Polygon Features */}
          {CADASTRAL_PARCELS.map((p, idx) => {
            const isSelected = selectedParcel.id === p.id;
            const isHovered = hoveredParcel?.id === p.id;

            // Map geo coordinates to SVG viewport bounds
            // 82.972 -> 82.979  => 50px -> 750px
            // 25.316 -> 25.319  => 450px -> 50px
            const pointsSvg = p.coordinates
              .map(([lng, lat]) => {
                const x = 60 + ((lng - 82.972) / (82.979 - 82.972)) * 680;
                const y = 460 - ((lat - 25.316) / (25.319 - 25.316)) * 400;
                return `${x},${y}`;
              })
              .join(" ");

            const cx = 60 + ((p.centroid[0] - 82.972) / (82.979 - 82.972)) * 680;
            const cy = 460 - ((p.centroid[1] - 25.316) / (25.319 - 25.316)) * 400;

            let fillColor = p.fillColor;
            if (!activeLayers.segmentation) fillColor = "transparent";
            if (activeLayers.uncertainty && p.verificationNeeded) fillColor = "rgba(230, 57, 70, 0.65)";

            return (
              <g key={p.id} onClick={() => onSelectParcel(p)} onMouseEnter={() => setHoveredParcel(p)} onMouseLeave={() => setHoveredParcel(null)} className="cursor-pointer transition-all">
                {/* Polygon body */}
                <polygon
                  points={pointsSvg}
                  fill={fillColor}
                  stroke={activeLayers.polygons ? (isSelected ? "#ffffff" : isHovered ? "#00f2fe" : p.color) : "transparent"}
                  strokeWidth={isSelected ? 3.5 : isHovered ? 2.5 : 1.8}
                  className="transition-all duration-200"
                />

                {/* Vertex corner points */}
                {activeLayers.polygons &&
                  p.coordinates.map(([lng, lat], vIdx) => {
                    const vx = 60 + ((lng - 82.972) / (82.979 - 82.972)) * 680;
                    const vy = 460 - ((lat - 25.316) / (25.319 - 25.316)) * 400;
                    return (
                      <circle
                        key={vIdx}
                        cx={vx}
                        cy={vy}
                        r={isSelected ? 4 : 2.5}
                        fill={isSelected ? "#02c39a" : "#ffffff"}
                        stroke="#0b1b2b"
                        strokeWidth={1}
                      />
                    );
                  })}

                {/* ULPIN label text */}
                {activeLayers.ulpins && (
                  <text
                    x={cx}
                    y={cy}
                    textAnchor="middle"
                    fill={isSelected ? "#ffffff" : "#f8fafc"}
                    fontSize={isSelected ? "11" : "10"}
                    fontWeight={isSelected ? "bold" : "600"}
                    style={{ textShadow: "0 1px 4px rgba(0,0,0,0.9)" }}
                  >
                    {p.ulpin}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Map Overlay Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-1.5 bg-white/90 backdrop-blur-md p-1.5 rounded-lg border border-slate-200 shadow-md">
          <button onClick={() => setZoomLevel((z) => Math.min(22, z + 1))} className="p-1.5 rounded hover:bg-slate-100 text-slate-700" title="Zoom In">
            <ZoomIn size={16} />
          </button>
          <button onClick={() => setZoomLevel((z) => Math.max(10, z - 1))} className="p-1.5 rounded hover:bg-slate-100 text-slate-700" title="Zoom Out">
            <ZoomOut size={16} />
          </button>
          <button className="p-1.5 rounded hover:bg-slate-100 text-primary font-bold text-xs" title="Compass Orientation">
            <Compass size={16} />
          </button>
        </div>

        {/* Cadastral Classes Legend */}
        <div className="absolute top-4 left-4 bg-slate-950/85 backdrop-blur-md text-white p-3 rounded-xl border border-white/15 text-xs shadow-lg flex flex-col gap-1.5">
          <div className="font-bold border-b border-white/20 pb-1 text-slate-200">Cadastral AI Classes</div>
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm bg-[#ff9800]"></span> Building (Class 1)</div>
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm bg-[#ffeb3b]"></span> Road (Class 2)</div>
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm bg-[#00a6fb]"></span> Water Body (Class 3)</div>
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm bg-[#e63946]"></span> Surveyor Flagged</div>
        </div>

        {/* Bottom Coordinates Status Chip */}
        <div className="absolute bottom-3 left-4 bg-slate-950/80 backdrop-blur-sm text-slate-300 px-3 py-1 rounded-md text-[11px] font-mono border border-white/10">
          EPSG:4326 (WGS84) • SVAMITVA Grid Varanasi (82.973°E, 25.317°N) • Zoom {zoomLevel}
        </div>
      </div>
    </div>
  );
}
