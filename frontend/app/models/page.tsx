"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { formatNumber } from "@/data/formatters";
import {
  Brain,
  Cpu,
  Layers,
  Eye,
  Zap,
  BarChart2,
  CheckCircle2,
  Activity,
  Sun,
  ShieldCheck,
  Building,
  RefreshCw,
  Sliders,
  Sparkles,
  MapPin,
  FileText,
  AlertTriangle,
  Globe,
  Radio,
  Compass,
  Maximize2,
  CloudSun,
  Boxes,
  Radar,
  ArrowRight,
} from "lucide-react";

/* ─────────────────── Types ─────────────────── */

interface RealInferencePatch {
  id: string;
  filename: string;
  village: string;
  ulpin: string;
  owner: string;
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

type SatelliteOutputViewMode =
  | "farseg_segmentation"
  | "oriented_detection"
  | "pansharpening"
  | "cloud_masking"
  | "foundation_embeddings";

const DRONE_OUTPUT_MODES: {
  id: DroneOutputViewMode;
  label: string;
  model: string;
  desc: string;
  badgeColor: string;
}[] = [
  {
    id: "cadastral_overlay",
    label: "Cadastral Polygon Overlay",
    model: "AeroSync UNet++ Nested",
    desc: "Sub-pixel parcel boundary segmentation with adaptive geometric regularization",
    badgeColor: "bg-teal-50 text-teal-700 border-teal-200",
  },
  {
    id: "unetpp_mask",
    label: "Binary Mask",
    model: "Deep Supervision Head",
    desc: "Direct probability thresholding at 0.5 confidence",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
  },
  {
    id: "gradcam",
    label: "XAI Grad-CAM Heatmap",
    model: "CadastralGradCAM",
    desc: "Neural attention visualization for revenue court Section 65B legal admissibility",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
  },
  {
    id: "change_detection",
    label: "Bi-Temporal Mutation",
    model: "Siamese Difference UNet",
    desc: "Compares T1 baseline survey with T2 flight to audit unauthorized construction",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
  },
  {
    id: "vari",
    label: "VARI Spectral Index",
    model: "Visible Resistant Index",
    desc: "RGB vegetation density filter: (G-R)/(G+R-B)",
    badgeColor: "bg-green-50 text-green-700 border-green-200",
  },
  {
    id: "gli",
    label: "GLI Chlorophyll Index",
    model: "Green Leaf Index",
    desc: "Differentiates live green vegetation from bare ground: (2G-R-B)/(2G+R+B)",
    badgeColor: "bg-lime-50 text-lime-700 border-lime-200",
  },
  {
    id: "ndwi",
    label: "NDWI Water Delineation",
    model: "Water Index RGB",
    desc: "Highlights water bodies and moisture channels: (G-B)/(G+B)",
    badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
  },
  {
    id: "shadow_plinth",
    label: "Shadow Plinth Index",
    model: "Building Plinth Extractor",
    desc: "Separates rooftop from shadow footprint for exact area calculation",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
  },
];

const SATELLITE_OUTPUT_MODES: {
  id: SatelliteOutputViewMode;
  label: string;
  model: string;
  desc: string;
  badgeColor: string;
  icon: any;
}[] = [
  {
    id: "farseg_segmentation",
    label: "FarSeg Foreground-Aware",
    model: "FarSeg (CVPR)",
    desc: "Resolves foreground-background class imbalance on wide-area satellite ortho-mosaics",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    icon: Layers,
  },
  {
    id: "oriented_detection",
    label: "Oriented Bounding Box (OBB)",
    model: "Oriented R-CNN / OBB",
    desc: "Detects rotated aerial buildings, solar arrays, vessels & vehicles with angle θ",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Compass,
  },
  {
    id: "pansharpening",
    label: "PanNet Deep Fusion (MS+PAN)",
    model: "PanNet Residual",
    desc: "Fuses high-res Panchromatic band with Multispectral channels preserving 99% spectral fidelity",
    badgeColor: "bg-cyan-50 text-cyan-700 border-cyan-200",
    icon: Zap,
  },
  {
    id: "cloud_masking",
    label: "Atmospheric Cloud/Shadow Mask",
    model: "CloudShadowNet",
    desc: "Automated 4-class cloud, cirrus haze, and shadow quality assurance pipeline",
    badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
    icon: CloudSun,
  },
  {
    id: "foundation_embeddings",
    label: "GeoFoundation ViT Embeddings",
    model: "SatMAE / GeoViT",
    desc: "256-D geospatial feature embeddings for zero-shot search and satellite tile retrieval",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: Radio,
  },
];

export default function ModelsStudioPage() {
  const [selectedEngine, setSelectedEngine] = useState<"drone" | "satellite">("drone");

  // Drone Engine States
  const [dronePatches, setDronePatches] = useState<RealInferencePatch[]>([]);
  const [selectedDronePatchIdx, setSelectedDronePatchIdx] = useState(0);
  const [activeDroneMode, setActiveDroneMode] = useState<DroneOutputViewMode>("cadastral_overlay");
  const [droneSliderPos, setDroneSliderPos] = useState(50);

  // Satellite Engine States
  const [satelliteData, setSatelliteData] = useState<any[]>([]);
  const [selectedSatIdx, setSelectedSatIdx] = useState(0);
  const [activeSatMode, setActiveSatMode] = useState<SatelliteOutputViewMode>("farseg_segmentation");

  useEffect(() => {
    // 1. Fetch Drone Real Inferences
    fetch("/inference/real_inferences.json")
      .then((res) => res.json())
      .then((data: RealInferencePatch[]) => {
        if (data && data.length > 0) {
          setDronePatches(data);
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
  const activeSatModeInfo =
    SATELLITE_OUTPUT_MODES.find((m) => m.id === activeSatMode) || SATELLITE_OUTPUT_MODES[0];

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fbfa] text-slate-800">
      <Navbar />

      {/* ── Page Header ── */}
      <section className="bg-white border-b border-slate-200/80 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1360px] mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-primary text-xs font-semibold mb-4 shadow-xs">
            <Cpu size={14} className="animate-pulse text-teal-600" />
            <span>AeroSync Dual-Engine Architecture — Drone &amp; Satellite</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-heading text-slate-900 tracking-tight mb-3">
            Unified AI Model Studio
          </h1>
          <p className="max-w-2xl mx-auto text-slate-600 text-sm sm:text-base leading-relaxed">
            Switch seamlessly between our <strong>5-in-1 Drone Cadastral Engine</strong> and the <strong>5-in-1 Satellite Foundation Engine</strong>.
          </p>

          {/* ── Master Engine Switcher Tabs ── */}
          <div className="inline-flex p-1.5 bg-slate-100 rounded-2xl border border-slate-200 mt-6 shadow-inner">
            <button
              onClick={() => setSelectedEngine("drone")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                selectedEngine === "drone"
                  ? "bg-white text-slate-900 shadow-md border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Cpu size={16} className={selectedEngine === "drone" ? "text-primary" : "text-slate-400"} />
              <span>🚁 Unified Drone Cadastral Engine (5-in-1)</span>
            </button>
            <button
              onClick={() => setSelectedEngine("satellite")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                selectedEngine === "satellite"
                  ? "bg-slate-900 text-white shadow-md border border-slate-900"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Globe size={16} className={selectedEngine === "satellite" ? "text-teal-400" : "text-slate-400"} />
              <span>🛰️ Unified Satellite Foundation Engine (5-in-1)</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Main Studio Container ── */}
      <main className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-12">
        {selectedEngine === "drone" ? (
          /* ========================================================================= */
          /* 🚁 ENGINE 1: UNIFIED DRONE CADASTRAL ENGINE                               */
          /* ========================================================================= */
          currentDronePatch ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden animate-in fade-in duration-300">
              {/* Studio Header Bar */}
              <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/60 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold font-mono">
                      {currentDronePatch.ulpin}
                    </span>
                    <span className="text-xs text-slate-500">• {currentDronePatch.village}</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                    Cadastral Drone Patch: {currentDronePatch.filename} ({currentDronePatch.owner})
                  </h2>
                </div>

                {/* Real Patch Selector Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
                  <span className="text-xs font-semibold text-slate-500 whitespace-nowrap mr-1">Select Patch:</span>
                  {dronePatches.map((p, idx) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedDronePatchIdx(idx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap border ${
                        selectedDronePatchIdx === idx
                          ? "bg-primary text-white border-primary shadow-sm"
                          : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {p.id} ({p.predicted_roof.split(" ")[0]})
                    </button>
                  ))}
                </div>
              </div>

              {/* Model Output Selection Tabs */}
              <div className="p-4 sm:px-6 bg-white border-b border-slate-100 flex items-center gap-2 overflow-x-auto">
                {DRONE_OUTPUT_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setActiveDroneMode(mode.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap border ${
                      activeDroneMode === mode.id
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span>{mode.label}</span>
                  </button>
                ))}
              </div>

              {/* Studio Workspace Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-8">
                {/* Left Column: Interactive Image Comparison */}
                <div className="lg:col-span-7 flex flex-col">
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-900 select-none">
                    {/* Original Drone Image (Background) */}
                    <img
                      src={
                        activeDroneMode === "change_detection"
                          ? currentDronePatch.images.t2_mutated
                          : currentDronePatch.images.original
                      }
                      alt="Original Drone Patch"
                      className="absolute inset-0 w-full h-full object-cover"
                    />

                    {/* AI Model Output Image (Foreground with Clip) */}
                    <div
                      className="absolute inset-0 overflow-hidden"
                      style={{ clipPath: `polygon(${droneSliderPos}% 0, 100% 0, 100% 100%, ${droneSliderPos}% 100%)` }}
                    >
                      <img
                        src={currentDronePatch.images[activeDroneMode]}
                        alt="AI Model Output"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </div>

                    {/* Slider Divider Line */}
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] z-20 pointer-events-none"
                      style={{ left: `${droneSliderPos}%` }}
                    >
                      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-md border-2 border-primary flex items-center justify-center text-primary font-bold text-xs">
                        ↔
                      </div>
                    </div>

                    {/* Labels on Canvas */}
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold">
                      {activeDroneMode === "change_detection" ? "T2 Drone Image" : "Original Drone Imagery"}
                    </div>
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-primary/90 backdrop-blur-md text-white text-[11px] font-semibold">
                      {activeDroneModeInfo.label} ({activeDroneModeInfo.model})
                    </div>

                    {/* Range Slider for Interaction */}
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={droneSliderPos}
                      onChange={(e) => setDroneSliderPos(Number(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
                      aria-label="Comparison slider"
                    />
                  </div>

                  <p className="text-center text-xs text-slate-500 mt-3 flex items-center justify-center gap-1.5">
                    <Sliders size={13} className="text-primary" />
                    Drag slider left &amp; right to compare Raw Drone Imagery vs. AI Output.
                  </p>
                </div>

                {/* Right Column: Genuine Model Metadata & Valuation */}
                <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                  <div className="p-5 rounded-2xl bg-teal-50/50 border border-teal-100">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${activeDroneModeInfo.badgeColor}`}>
                        {activeDroneModeInfo.model}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm mb-1">{activeDroneModeInfo.label}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{activeDroneModeInfo.desc}</p>
                  </div>

                  {/* Real Prediction Stats Grid */}
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                        Roof Material
                      </span>
                      <span className="text-base font-extrabold text-slate-900 block">
                        {currentDronePatch.predicted_roof}
                      </span>
                      <span className="text-[11px] text-teal-600 font-semibold mt-0.5 block">
                        {currentDronePatch.roof_confidence}% AI Confidence
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                        Plot Footprint
                      </span>
                      <span className="text-base font-extrabold text-slate-900 block">
                        {currentDronePatch.area_sqm} m²
                      </span>
                      <span className="text-[11px] text-slate-500 mt-0.5 block">
                        ({(currentDronePatch.area_sqm * 10.7639).toFixed(0)} sq. ft)
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
                        <Sun size={12} className="text-amber-500" /> Solar Potential
                      </span>
                      <span className="text-base font-extrabold text-amber-600 block">
                        {currentDronePatch.solar.capacity_kwp > 0
                          ? `${currentDronePatch.solar.capacity_kwp} kWp`
                          : "Not Suitable"}
                      </span>
                      <span className="text-[11px] text-slate-500 mt-0.5 block">
                        {currentDronePatch.solar.annual_generation_kwh > 0
                          ? `₹${formatNumber(currentDronePatch.solar.annual_savings_inr)}/yr savings`
                          : "Organic surface"}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
                        <Building size={12} className="text-primary" /> Gram Panchayat Tax
                      </span>
                      <span className="text-base font-extrabold text-slate-900 block">
                        ₹{formatNumber(currentDronePatch.tax.annual_tax_inr)}/yr
                      </span>
                      <span className="text-[11px] text-slate-500 mt-0.5 block">
                        Valuation: ₹{(currentDronePatch.tax.asset_valuation_inr / 100000).toFixed(1)} Lakh
                      </span>
                    </div>
                  </div>

                  {/* Legal Evidence Note */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-teal-600" />
                      NIC SVAMITVA Compliance Audit
                    </div>
                    <p>
                      Output is certified under <strong>Section 65B of the Indian Evidence Act</strong>. The Grad-CAM neural heatmap and UNet++ polygon coordinates form the primary verifiable digital annexure.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
              <RefreshCw size={24} className="animate-spin text-primary mx-auto mb-3" />
              <p className="text-slate-600 font-semibold">Loading drone inference dataset...</p>
            </div>
          )
        ) : (
          /* ========================================================================= */
          /* 🛰️ ENGINE 2: UNIFIED SATELLITE FOUNDATION ENGINE                          */
          /* ========================================================================= */
          currentSatScene ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden animate-in fade-in duration-300">
              {/* Satellite Studio Header Bar */}
              <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-900 text-white flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold font-mono">
                      {currentSatScene.source}
                    </span>
                    <span className="text-xs text-slate-400">• GSD: {currentSatScene.gsd_m}m</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-white">
                    {currentSatScene.name} — {currentSatScene.location}
                  </h2>
                </div>

                {/* Satellite Scene Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400 whitespace-nowrap mr-1">Satellite Pass:</span>
                  {satelliteData.map((s, idx) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSatIdx(idx)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                        selectedSatIdx === idx
                          ? "bg-teal-500 text-slate-950 border-teal-400 font-bold shadow-sm"
                          : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                      }`}
                    >
                      {s.name.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Satellite Sub-Model Selector */}
              <div className="p-4 sm:px-6 bg-slate-800/60 border-b border-slate-700/60 flex items-center gap-2 overflow-x-auto">
                {SATELLITE_OUTPUT_MODES.map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => setActiveSatMode(mode.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap border ${
                        activeSatMode === mode.id
                          ? "bg-teal-500 text-slate-950 border-teal-400 shadow-md font-bold"
                          : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                      }`}
                    >
                      <Icon size={14} />
                      <span>{mode.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Satellite Studio Content Panel */}
              <div className="p-6 sm:p-8 space-y-6">
                {activeSatMode === "farseg_segmentation" && (
                  <div className="space-y-6">
                    <div className="p-6 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                          CVPR SOTA Geospatial Segmentation
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 mt-2">
                          Foreground-Aware Relation Network (FarSeg)
                        </h3>
                        <p className="text-xs text-slate-600 max-w-2xl mt-1">
                          Models global-to-local semantic relations to eliminate foreground-background class imbalance and suppress false alarms on wide-area satellite ortho-mosaics.
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-xs font-bold text-slate-500 block uppercase">Overall mIoU</span>
                        <span className="text-3xl font-extrabold text-indigo-600">
                          {currentSatScene.modes.farseg_segmentation.miou}%
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {currentSatScene.modes.farseg_segmentation.classes.map((cls: any, idx: number) => (
                        <div key={idx} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="w-3.5 h-3.5 rounded-md" style={{ backgroundColor: cls.color }} />
                            <span className="text-xs font-bold text-slate-800">{cls.name}</span>
                          </div>
                          <span className="text-2xl font-extrabold text-slate-900 block">{cls.coverage_pct}%</span>
                          <span className="text-[11px] text-slate-500">Surface coverage</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeSatMode === "oriented_detection" && (
                  <div className="space-y-6">
                    <div className="p-6 rounded-2xl bg-amber-50/50 border border-amber-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          Oriented R-CNN / Rotated BBoxes (OBB)
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 mt-2">
                          Arbitrary-Angle Rotated Object Detector
                        </h3>
                        <p className="text-xs text-slate-600 max-w-2xl mt-1">
                          Predicts 5-parameter oriented bounding boxes (cx, cy, w, h, θ) to prevent axis-aligned box overlap on rotated roofs, solar panel blocks, and harbor vessels.
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-xs font-bold text-slate-500 block uppercase">Active Detections</span>
                        <span className="text-3xl font-extrabold text-amber-600">
                          {currentSatScene.modes.oriented_detection.detections.length}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentSatScene.modes.oriented_detection.detections.map((det: any) => (
                        <div key={det.id} className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono text-[11px] font-bold">
                                {det.id}
                              </span>
                              <span className="text-xs font-bold text-slate-900">{det.label}</span>
                            </div>
                            <span className="text-xs text-slate-500 block">
                              Footprint: {det.length_m}m × {det.width_m}m • {(det.length_m * det.width_m).toFixed(0)} m²
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 font-bold text-xs block mb-1">
                              θ = {det.angle_deg}°
                            </span>
                            <span className="text-[11px] text-teal-600 font-semibold">{(det.confidence * 100).toFixed(0)}% Conf</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeSatMode === "pansharpening" && (
                  <div className="space-y-6">
                    <div className="p-6 rounded-2xl bg-cyan-50/50 border border-cyan-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-100 text-cyan-800 border border-cyan-200">
                          PanNet High-Pass Residual Fusion
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 mt-2">
                          Deep Multispectral + Panchromatic Pansharpening
                        </h3>
                        <p className="text-xs text-slate-600 max-w-2xl mt-1">
                          Transfers high-frequency spatial edge textures from 0.3m PAN images into multispectral channels while retaining full radiometric and spectral calibration.
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-xs font-bold text-slate-500 block uppercase">Fidelity Index</span>
                        <span className="text-2xl font-extrabold text-cyan-600">
                          {currentSatScene.modes.pansharpening.spectral_fidelity.split(" ")[0]}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                        <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Spectral Angle Mapper (SAM)</span>
                        <span className="text-2xl font-extrabold text-slate-900 block">{currentSatScene.modes.pansharpening.sam_degrees}°</span>
                        <span className="text-xs text-teal-600 font-medium mt-1 block">Optimal Threshold &lt; 3.0°</span>
                      </div>
                      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                        <span className="text-xs font-bold text-slate-500 uppercase block mb-1">ERGAS Error Score</span>
                        <span className="text-2xl font-extrabold text-slate-900 block">{currentSatScene.modes.pansharpening.ergas_score}</span>
                        <span className="text-xs text-teal-600 font-medium mt-1 block">Optimal Synthesis &lt; 2.50</span>
                      </div>
                      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                        <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Resolution Boost</span>
                        <span className="text-2xl font-extrabold text-cyan-600 block">4× Native</span>
                        <span className="text-xs text-slate-500 mt-1 block">1.2m MS → 0.3m Sub-meter</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeSatMode === "cloud_masking" && (
                  <div className="space-y-6">
                    <div className="p-6 rounded-2xl bg-sky-50/50 border border-sky-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200">
                          CloudShadowNet Quality Assurance
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 mt-2">
                          Atmospheric Cloud, Haze &amp; Shadow Masking
                        </h3>
                        <p className="text-xs text-slate-600 max-w-2xl mt-1">
                          Automated atmospheric quality control flagging thick clouds, thin cirrus haze, and cloud shadows before automated parcel vectorization.
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-xs font-bold text-slate-500 block uppercase">Clear Ground</span>
                        <span className="text-3xl font-extrabold text-teal-600">
                          {currentSatScene.modes.cloud_masking.clear_ground_pct}%
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 rounded-2xl bg-white border border-slate-200">
                        <span className="text-xs font-semibold text-slate-500 block mb-1">Clear Ground</span>
                        <span className="text-xl font-bold text-teal-600">{currentSatScene.modes.cloud_masking.clear_ground_pct}%</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-white border border-slate-200">
                        <span className="text-xs font-semibold text-slate-500 block mb-1">Thick Cloud</span>
                        <span className="text-xl font-bold text-slate-400">{currentSatScene.modes.cloud_masking.thick_cloud_pct}%</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-white border border-slate-200">
                        <span className="text-xs font-semibold text-slate-500 block mb-1">Cirrus / Haze</span>
                        <span className="text-xl font-bold text-sky-600">{currentSatScene.modes.cloud_masking.cirrus_haze_pct}%</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-white border border-slate-200">
                        <span className="text-xs font-semibold text-slate-500 block mb-1">Cloud Shadow</span>
                        <span className="text-xl font-bold text-slate-700">{currentSatScene.modes.cloud_masking.shadow_pct}%</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeSatMode === "foundation_embeddings" && (
                  <div className="space-y-6">
                    <div className="p-6 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          GeoFoundation Vision Transformer (GeoViT)
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 mt-2">
                          Self-Supervised Geospatial Representation Embeddings
                        </h3>
                        <p className="text-xs text-slate-600 max-w-2xl mt-1">
                          Extracts 256-D L2-normalized semantic feature vectors for content-based satellite image retrieval (CBIR) and zero-shot land use scene matching.
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-xs font-bold text-slate-500 block uppercase">Cosine Match</span>
                        <span className="text-3xl font-extrabold text-emerald-600">
                          {(currentSatScene.modes.foundation_embeddings.cosine_similarity_top_match * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                        <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Top Semantic Match</span>
                        <span className="text-lg font-extrabold text-slate-900 block">
                          {currentSatScene.modes.foundation_embeddings.top_category}
                        </span>
                        <span className="text-xs text-emerald-600 font-semibold mt-1 block">Zero-Shot Vision-Language Alignment</span>
                      </div>
                      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                        <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Vector Embedding Dimension</span>
                        <span className="text-lg font-extrabold text-slate-900 block">256 Dimensions (L2 Normalized)</span>
                        <span className="text-xs text-slate-500 mt-1 block">Sub-second vector indexing via HNSW / FAISS</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
              <RefreshCw size={24} className="animate-spin text-teal-600 mx-auto mb-3" />
              <p className="text-slate-600 font-semibold">Loading satellite foundation models...</p>
            </div>
          )
        )}
      </main>

      <Footer />
    </div>
  );
}
