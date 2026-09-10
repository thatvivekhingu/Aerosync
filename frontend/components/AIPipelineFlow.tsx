"use client";

import React from "react";
import {
  FileUp,
  ScanText,
  Binary,
  MapPin,
  Layers,
  Sparkles,
  Scale,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

interface AIPipelineFlowProps {
  currentStage?: number; // 1 to 9
}

export default function AIPipelineFlow({ currentStage = 8 }: AIPipelineFlowProps) {
  const STAGES = [
    {
      step: 1,
      title: "Document Uploaded",
      desc: "Raw PDF / High-res scan received & hashed (SHA-256)",
      icon: FileUp,
    },
    {
      step: 2,
      title: "OCR Layout Analysis",
      desc: "Document layout deconstruction & token detection",
      icon: ScanText,
    },
    {
      step: 3,
      title: "Field Extraction",
      desc: "Survey No, Khasra, ULPIN & recorded area parsing",
      icon: Binary,
    },
    {
      step: 4,
      title: "Parcel Identification",
      desc: "Spatial cadastral lookup in Taluka Mauza database",
      icon: MapPin,
    },
    {
      step: 5,
      title: "GIS Layer Alignment",
      desc: "Orthomosaic coordinates & EPSG CRS projection",
      icon: Layers,
    },
    {
      step: 6,
      title: "Boundary Segmentation",
      desc: "Sub-pixel plinth & boundary vectorization",
      icon: Sparkles,
    },
    {
      step: 7,
      title: "Area & Tolerance Math",
      desc: "Shoelace polygon integral vs Document area",
      icon: Scale,
    },
    {
      step: 8,
      title: "Verification Assessment",
      desc: "Status determination (Verified / Variance / Mismatch)",
      icon: ShieldCheck,
    },
    {
      step: 9,
      title: "Authority Sign-Off",
      desc: "Gram Sabha Form-5 / Sub-Registrar confirmation",
      icon: UserCheck,
    },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
              Verification Pipeline
            </span>
            <span className="text-xs text-slate-400 font-mono">Traceable v2.4</span>
          </div>
          <h3 className="text-lg font-bold text-white mt-1">
            How AeroSync Verifies Land Records Against Physical Earth
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Transparent, multi-stage pipeline executing real computer vision, geometry integration, and statutory tolerance checks.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700">
          <CheckCircle2 size={14} className="text-teal-400" />
          <span>Stage {currentStage} of 9 Active</span>
        </div>
      </div>

      {/* Grid of Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-9 gap-2">
        {STAGES.map((s, idx) => {
          const Icon = s.icon;
          const isDone = s.step < currentStage;
          const isCurrent = s.step === currentStage;

          return (
            <div
              key={s.step}
              className={`relative flex flex-col p-3 rounded-xl border transition-all ${
                isCurrent
                  ? "bg-teal-950/60 border-teal-500/60 text-white ring-1 ring-teal-500/30"
                  : isDone
                  ? "bg-slate-800/50 border-slate-700/60 text-slate-300"
                  : "bg-slate-900/40 border-slate-800/60 text-slate-500"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isCurrent
                      ? "bg-teal-500 text-slate-950 font-black"
                      : isDone
                      ? "bg-teal-900 text-teal-300"
                      : "bg-slate-800 text-slate-500"
                  }`}
                >
                  {s.step}
                </span>
                <Icon
                  size={16}
                  className={
                    isCurrent
                      ? "text-teal-400"
                      : isDone
                      ? "text-teal-500/80"
                      : "text-slate-600"
                  }
                />
              </div>

              <div className="text-xs font-semibold leading-tight line-clamp-1 text-slate-200">
                {s.title}
              </div>
              <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                {s.desc}
              </p>

              {/* Arrow divider for larger screens */}
              {idx < STAGES.length - 1 && (
                <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-slate-700">
                  <ArrowRight size={12} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
