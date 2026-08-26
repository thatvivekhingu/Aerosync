"use client";

import React, { useState } from "react";
import { History, TrendingUp, AlertTriangle, CheckCircle, Eye, RefreshCw, Zap } from "lucide-react";

export default function ChangeDetectionViewer() {
  const [sliderPos, setSliderPos] = useState(50);
  const [activeFilter, setActiveFilter] = useState<"all" | "new_bld" | "encroachment">("all");

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 lg:p-8 shadow-lg">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-light text-primary flex items-center justify-center">
            <History size={22} />
          </div>
          <div>
            <h3 className="text-xl font-bold font-heading text-slate-900">
              Bi-Temporal Cadastral Mutation &amp; Encroachment Tracker
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              SiamUnet-Diff Temporal Comparison: Baseline Flight (2024) vs Current Survey (2026)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5">
            <AlertTriangle size={14} className="text-amber-700" />
            <span>3 Cadastral Mutations Flagged</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left: Interactive Before / After Dual-Layer Visualizer */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          
          <div className="relative w-full h-[380px] rounded-2xl overflow-hidden border border-slate-200 shadow-inner select-none group">
            
            {/* Layer 1: Year 2024 (Baseline) */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: "url('/hero_drone.jpg')",
                filter: "brightness(0.9) contrast(1.05)",
              }}
            >
              <div className="absolute top-3 left-3 bg-slate-950/80 text-white px-3 py-1 rounded-md text-xs font-bold">
                🗓️ Baseline Survey (2024)
              </div>
            </div>

            {/* Layer 2: Year 2026 (Current with Mutation Overlays) */}
            <div
              className="absolute inset-0 bg-cover bg-center overflow-hidden"
              style={{
                clipPath: `polygon(${sliderPos}% 0, 100% 0, 100% 100%, ${sliderPos}% 100%)`,
                backgroundImage: "url('/hero_drone.jpg')",
                filter: "brightness(1.05) contrast(1.1)",
              }}
            >
              {/* Highlighted Mutation Box 1 (New Construction) */}
              <div className="absolute top-1/3 left-1/2 w-28 h-20 border-2 border-rose-500 bg-rose-500/30 rounded-lg flex items-center justify-center animate-pulse">
                <span className="text-[10px] font-bold text-white bg-rose-700 px-1.5 py-0.5 rounded shadow">
                  +142 m² New Construction
                </span>
              </div>

              {/* Highlighted Mutation Box 2 (Pond Encroachment) */}
              <div className="absolute bottom-16 right-1/4 w-32 h-16 border-2 border-amber-400 bg-amber-400/30 rounded-lg flex items-center justify-center animate-pulse">
                <span className="text-[10px] font-bold text-slate-950 bg-amber-300 px-1.5 py-0.5 rounded shadow">
                  ⚠️ 8.5m Pond Buffer Breach
                </span>
              </div>

              <div className="absolute top-3 right-3 bg-primary text-white px-3 py-1 rounded-md text-xs font-bold shadow-md">
                🗓️ Current Survey (2026)
              </div>
            </div>

            {/* Interactive Split Divider Line */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(0,0,0,0.8)] cursor-ew-resize flex items-center justify-center pointer-events-none"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="w-7 h-7 rounded-full bg-white text-slate-800 shadow-xl flex items-center justify-center text-xs font-bold border border-slate-300">
                ↔
              </div>
            </div>

            {/* Native Slider Input Overlay */}
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPos}
              onChange={(e) => setSliderPos(Number(e.target.value))}
              className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-20"
            />
          </div>

          <div className="text-center text-xs text-slate-500">
            Drag the slider left or right to inspect temporal changes between 2024 and 2026 surveys.
          </div>
        </div>

        {/* Right: Change Detection Audit Log */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <h4 className="text-sm font-bold font-heading text-slate-900 uppercase tracking-wider">
            Detected Cadastral Mutations
          </h4>

          {/* Item 1 */}
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-600 text-white">
                NEW STRUCTURE
              </span>
              <span className="text-xs font-mono font-bold text-rose-900">Area: +142.4 m²</span>
            </div>
            <p className="text-xs text-slate-700 leading-snug">
              Unauthorized residential expansion detected on Parcel <strong>ULPIN-26012-0046</strong> not present in 2024 baseline.
            </p>
          </div>

          {/* Item 2 */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-600 text-white">
                WATER BED ENCROACHMENT
              </span>
              <span className="text-xs font-mono font-bold text-amber-900">Buffer: 8.5m</span>
            </div>
            <p className="text-xs text-slate-700 leading-snug">
              Pond (Talab) edge encroachment flagged under Section 67, UP Revenue Code 2006.
            </p>
          </div>

          {/* Item 3 */}
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-600 text-white">
                VERIFIED MUTATION
              </span>
              <span className="text-xs font-mono font-bold text-emerald-900">Boundary: Stable</span>
            </div>
            <p className="text-xs text-slate-700 leading-snug">
              Parcels 0041 to 0044 show zero illegal boundary displacement over 24-month period.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
