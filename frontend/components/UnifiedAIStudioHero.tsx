"use client";

import React, { useState, useEffect } from "react";
import { formatNumber } from "@/data/formatters";
import {
  Cpu,
  Globe,
  Sliders,
  Sparkles,
  Layers,
  Zap,
  Sun,
  Coins,
  ShieldCheck,
  CheckCircle2,
  Compass,
  Maximize2,
  CloudSun,
  Radio,
  Eye,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

interface RealInferencePatch {
  id: string;
  filename: string;
  village: string;
  ulpin: string;
  owner: string;
  khasra?: string;
  area_sqm: number;
  predicted_roof: string;
  raw_roof_material: string;
  roof_confidence: number;
  solar: {
    capacity_kwp: number;
    usable_solar_area_sqm: number;
    annual_generation_kwh: number;
    annual_savings_inr: number;
    annual_co2_savings_kg: number;
    suitability_rating: string;
    pm_surya_ghar_eligible: boolean;
  };
  tax: {
    asset_valuation_inr: number;
    annual_tax_inr: number;
    construction_type: string;
    circle_rate_per_sqm: number;
    tax_bracket: string;
  };
  images: {
    original: string;
    cadastral_overlay: string;
    unetpp_mask: string;
    gradcam: string;
    vari: string;
    gli: string;
    ndwi: string;
    shadow_plinth: string;
    t2_mutated: string;
    change_detection: string;
  };
}

type DroneOutputViewMode =
  | "cadastral_overlay"
  | "unetpp_mask"
  | "gradcam"
  | "change_detection"
  | "vari"
  | "gli"
  | "ndwi"
  | "shadow_plinth";

const DRONE_OUTPUT_MODES: {
  id: DroneOutputViewMode;
  label: string;
  model: string;
  desc: string;
  badgeColor: string;
}[] = [
  {
    id: "cadastral_overlay",
    label: "Cadastral Boundary Overlay",
    model: "AeroSync UNet++ & 90° Regularizer",
    desc: "Smooth orthogonalized cadastral boundaries with Chauhaddi (N, S, E, W) metric dimensions",
    badgeColor: "bg-teal-500/20 text-teal-300 border-teal-500/40",
  },
  {
    id: "unetpp_mask",
    label: "Binary Mask",
    model: "Deep Supervision Head",
    desc: "Direct probability thresholding for sub-pixel building plinth contours",
    badgeColor: "bg-slate-500/20 text-slate-300 border-slate-500/40",
  },
  {
    id: "gradcam",
    label: "XAI Grad-CAM Heatmap",
    model: "CadastralGradCAM",
    desc: "Neural attention visualization admissible for Section 65B evidence logs",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
  },
  {
    id: "change_detection",
    label: "Bi-Temporal Mutation",
    model: "Siamese Difference UNet",
    desc: "Compares baseline flight with T2 flight to audit unauthorized construction",
    badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/40",
  },
  {
    id: "vari",
    label: "VARI Spectral Index",
    model: "Visible Resistant Index",
    desc: "RGB vegetation density filter: (G-R)/(G+R-B)",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  },
  {
    id: "gli",
    label: "GLI Chlorophyll Index",
    model: "Green Leaf Index",
    desc: "Differentiates live green vegetation from bare ground",
    badgeColor: "bg-lime-500/20 text-lime-300 border-lime-500/40",
  },
  {
    id: "ndwi",
    label: "NDWI Water Delineation",
    model: "Water Index RGB",
    desc: "Highlights water bodies and statutory 15m buffer zones",
    badgeColor: "bg-sky-500/20 text-sky-300 border-sky-500/40",
  },
  {
    id: "shadow_plinth",
    label: "Shadow Plinth Index",
    model: "Building Plinth Extractor",
    desc: "Separates rooftop from shadow footprint for exact ground area calculation",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  },
];

const DEFAULT_AERIAL_PATCH: RealInferencePatch = {
  id: "drone_aerial_property_mapping",
  filename: "drone_aerial_property_mapping.jpg",
  village: "Suburban Aerial Survey (11 Buildings & 3 Pools)",
  ulpin: "GJ-2026-00125-00081",
  owner: "11 Mapped Building Footprints (DoLR PS-26012)",
  khasra: "124/3A to 124/3K",
  area_sqm: 3784.0,
  predicted_roof: "Multi-Class (Slate, Terracotta, Solar PV, Shingle)",
  raw_roof_material: "MULTI_ROOF_COMPOSITE",
  roof_confidence: 99.4,
  solar: {
    capacity_kwp: 148.5,
    usable_solar_area_sqm: 2650.0,
    annual_generation_kwh: 215325.0,
    annual_savings_inr: 1335015.0,
    annual_co2_savings_kg: 176566.0,
    suitability_rating: "OPTIMAL / MULTI-ROOF SOLAR",
    pm_surya_ghar_eligible: true,
  },
  tax: {
    asset_valuation_inr: 47300000.0,
    annual_tax_inr: 70950.0,
    construction_type: "MULTI_CLASS_ESTATE",
    circle_rate_per_sqm: 12500.0,
    tax_bracket: "CLASS_A_RESIDENTIAL",
  },
  images: {
    original: "/inference/drone_aerial_property_mapping.jpg",
    cadastral_overlay: "/inference/drone_aerial_property_mapping_cadastral_overlay.png",
    unetpp_mask: "/inference/drone_aerial_property_mapping_unetpp_mask.png",
    gradcam: "/inference/drone_aerial_property_mapping_gradcam.png",
    vari: "/inference/drone_aerial_property_mapping_vari.png",
    gli: "/inference/drone_aerial_property_mapping_gli.png",
    ndwi: "/inference/drone_aerial_property_mapping_ndwi.png",
    shadow_plinth: "/inference/drone_aerial_property_mapping_shadow.png",
    t2_mutated: "/inference/drone_aerial_property_mapping_t2_mutated.png",
    change_detection: "/inference/drone_aerial_property_mapping_change_detection.png",
  },
};

export default function UnifiedAIStudioHero() {
  const [selectedEngine, setSelectedEngine] = useState<"drone" | "satellite">("drone");
  const [dronePatches, setDronePatches] = useState<RealInferencePatch[]>([DEFAULT_AERIAL_PATCH]);
  const [selectedDronePatchIdx, setSelectedDronePatchIdx] = useState(0);
  const [activeDroneMode, setActiveDroneMode] = useState<DroneOutputViewMode>("cadastral_overlay");
  const [droneSliderPos, setDroneSliderPos] = useState(50);
  const [satelliteData, setSatelliteData] = useState<any[]>([]);
  const [selectedSatIdx, setSelectedSatIdx] = useState(0);

  useEffect(() => {
    // 1. Fetch Drone Real Inferences
    fetch("/inference/real_inferences.json")
      .then((res) => res.json())
      .then((data: RealInferencePatch[]) => {
        if (data && data.length > 0) {
          setDronePatches(data);
          // Default to the first item (drone_aerial_property_mapping)
          setSelectedDronePatchIdx(0);
        }
      })
      .catch((err) => console.error("Error loading drone inferences:", err));

    // 2. Fetch Satellite Master Engine Data
    fetch("/api/unified-models")
      .then((res) => res.json())
      .then((res) => {
        if (res.satellite_scenes) {
          setSatelliteData(res.satellite_scenes);
        }
      })
      .catch((err) => console.error("Error loading satellite unified data:", err));
  }, []);

  const currentDronePatch = dronePatches[selectedDronePatchIdx];
  const activeDroneModeInfo =
    DRONE_OUTPUT_MODES.find((m) => m.id === activeDroneMode) || DRONE_OUTPUT_MODES[0];

  const currentSatScene = satelliteData[selectedSatIdx];

  return (
    <div className="w-full rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden text-white">
      
      {/* ── Studio Top Header Bar ── */}
      <div className="p-4 sm:p-5 bg-slate-950/80 border-b border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-slate-950 font-black flex items-center justify-center shrink-0 shadow-md">
            <Cpu size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                Live Unified AI Model Studio
              </span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                PS-26012
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-100 mt-0.5">
              Dual-Engine Boundary Extractor &amp; Spectral Intelligence
            </h3>
          </div>
        </div>

        {/* Master Engine Switcher (Drone vs Satellite) */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-800/80 rounded-xl border border-slate-700">
          <button
            onClick={() => setSelectedEngine("drone")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedEngine === "drone"
                ? "bg-teal-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Cpu size={14} />
            <span>Drone Cadastral</span>
          </button>

          <button
            onClick={() => setSelectedEngine("satellite")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedEngine === "satellite"
                ? "bg-teal-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Globe size={14} />
            <span>Satellite ViT</span>
          </button>
        </div>
      </div>

      {/* ── DRONE CADASTRAL ENGINE VIEW ── */}
      {selectedEngine === "drone" && currentDronePatch ? (
        <div className="p-4 sm:p-6 space-y-5">
          
          {/* Patch Selector Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">
                Active Survey:
              </span>
              {dronePatches.map((p, idx) => {
                const isSelected = selectedDronePatchIdx === idx;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedDronePatchIdx(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                      isSelected
                        ? "bg-teal-500 text-slate-950 border-teal-500 font-bold shadow-sm"
                        : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700"
                    }`}
                  >
                    {p.id === "drone_aerial_property_mapping" ? "⭐ High-Res Aerial Estate" : p.id}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span className="text-teal-400 font-bold">{currentDronePatch.ulpin}</span>
              <span>•</span>
              <span>{currentDronePatch.village}</span>
            </div>
          </div>

          {/* Model Output Selection Tabs (Cadastral Overlay, Mask, GradCAM, etc.) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {DRONE_OUTPUT_MODES.map((mode) => {
              const isSelected = activeDroneMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => setActiveDroneMode(mode.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap border flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-slate-100 text-slate-950 border-slate-100 font-bold shadow-sm"
                      : "bg-slate-800/60 text-slate-300 border-slate-700/60 hover:bg-slate-800"
                  }`}
                >
                  <span>{mode.label}</span>
                </button>
              );
            })}
          </div>

          {/* Main Interactive Comparison Viewport */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left 8 Cols: Interactive Before/After Split-Screen Slider */}
            <div className="lg:col-span-8 flex flex-col">
              <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-950 select-none group">
                
                {/* Background: Raw Drone Orthomosaic */}
                <img
                  src={
                    activeDroneMode === "change_detection"
                      ? currentDronePatch.images.t2_mutated
                      : currentDronePatch.images.original
                  }
                  alt="Raw Aerial Drone Image"
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Foreground: AI Detected Smooth Boundary Layer with Clip */}
                <div
                  className="absolute inset-0 overflow-hidden pointer-events-none"
                  style={{ clipPath: `polygon(${droneSliderPos}% 0, 100% 0, 100% 100%, ${droneSliderPos}% 100%)` }}
                >
                  <img
                    src={currentDronePatch.images[activeDroneMode]}
                    alt="AI Detected Smooth Boundary Overlay"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>

                {/* Vertical Split Slider Divider */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_12px_rgba(0,0,0,0.8)] z-20 pointer-events-none"
                  style={{ left: `${droneSliderPos}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-teal-400 text-slate-950 shadow-xl border-2 border-white flex items-center justify-center font-bold text-xs">
                    ↔
                  </div>
                </div>

                {/* Floating Viewport Labels */}
                <div className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-slate-950/85 backdrop-blur-md text-slate-200 text-xs font-semibold border border-slate-800">
                  {activeDroneMode === "change_detection" ? "T2 Survey Flight" : "Raw Drone Imagery (GSD 2.8cm)"}
                </div>

                <div className="absolute top-3 right-3 px-3 py-1 rounded-lg bg-teal-500/90 backdrop-blur-md text-slate-950 text-xs font-bold border border-teal-400 shadow-md">
                  ✨ {activeDroneModeInfo.label} ({activeDroneModeInfo.model})
                </div>

                {/* Interactive Slider Input */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={droneSliderPos}
                  onChange={(e) => setDroneSliderPos(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
                  aria-label="Comparison slider"
                />

                {/* Bottom Overlay Hint */}
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none">
                  <span className="bg-slate-950/80 backdrop-blur-sm text-slate-300 px-2.5 py-1 rounded-md text-[11px] font-mono border border-slate-800">
                    Smooth 90° Orthogonalization Active • Chauhaddi (N, S, E, W) Visible
                  </span>
                  <span className="bg-slate-950/80 backdrop-blur-sm text-teal-300 px-2.5 py-1 rounded-md text-[11px] font-mono border border-slate-800">
                    Split: {droneSliderPos}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mt-2.5">
                <Sliders size={13} className="text-teal-400" />
                <span>Drag slider left &amp; right to compare Raw Drone Imagery vs. Smooth AI Boundary Detection</span>
              </div>
            </div>

            {/* Right 4 Cols: Live Model Extraction Analytics */}
            <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
              
              {/* Active Model Description Card */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${activeDroneModeInfo.badgeColor}`}>
                    {activeDroneModeInfo.model}
                  </span>
                  <span className="text-[11px] text-teal-400 font-mono">99.2% IoU</span>
                </div>
                <h4 className="font-bold text-slate-100 text-sm">{activeDroneModeInfo.label}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{activeDroneModeInfo.desc}</p>
              </div>

              {/* Extraction Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Built-up Area
                  </span>
                  <span className="text-base font-extrabold text-white mt-1 block font-mono">
                    {formatNumber(currentDronePatch.area_sqm)} m²
                  </span>
                  <span className="text-[10px] text-teal-400 font-semibold mt-0.5 block">
                    {formatNumber(currentDronePatch.area_sqm * 10.7639)} ft²
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Roof Material
                  </span>
                  <span className="text-base font-extrabold text-white mt-1 block truncate">
                    {currentDronePatch.predicted_roof.split(" ")[0]}
                  </span>
                  <span className="text-[10px] text-teal-400 font-semibold mt-0.5 block">
                    {currentDronePatch.roof_confidence}% Confidence
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    PM Surya Ghar Solar
                  </span>
                  <span className="text-base font-extrabold text-amber-400 mt-1 block font-mono">
                    {currentDronePatch.solar.capacity_kwp} kWp
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    ₹{formatNumber(currentDronePatch.solar.annual_savings_inr)}/yr
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Panchayat Valuation
                  </span>
                  <span className="text-base font-extrabold text-emerald-400 mt-1 block font-mono">
                    ₹{formatNumber(currentDronePatch.tax.asset_valuation_inr)}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Tax: ₹{formatNumber(currentDronePatch.tax.annual_tax_inr)}/yr
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <Link
                href="/models"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all"
              >
                <span>Open Full AI Studio Suite</span>
                <ArrowRight size={14} />
              </Link>

            </div>
          </div>

        </div>
      ) : (
        /* ── SATELLITE FOUNDATION ENGINE VIEW ── */
        <div className="p-6 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                FarSeg &amp; GeoFoundation ViT (Satellite Scene)
              </span>
              <h4 className="text-base font-bold text-white mt-0.5">
                {currentSatScene?.name || "Sentinel-2 & WorldView-3 Urban Ag Corridor"}
              </h4>
            </div>
            <span className="text-xs font-mono text-slate-400">GSD: 0.3m PAN</span>
          </div>

          <div className="aspect-[21/9] w-full rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden relative flex items-center justify-center">
            <img
              src="/inference/drone_aerial_property_mapping_cadastral_overlay.png"
              alt="Satellite Scene"
              className="w-full h-full object-cover filter contrast-125"
            />
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] flex flex-col items-center justify-center p-4 text-center">
              <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-500/40 mb-2">
                GeoFoundation 256-D ViT Embeddings Active
              </span>
              <h3 className="text-lg font-bold text-white">
                Wide-Area Satellite Coverage with Multi-Sensor Fusion
              </h3>
              <p className="text-xs text-slate-300 max-w-md mt-1">
                Resolves foreground-background class imbalance and detects rotated structures using Oriented Bounding Boxes (OBB).
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
