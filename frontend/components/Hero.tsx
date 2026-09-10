"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  MapPin,
  Lock,
  Scale,
  CheckCircle2,
  FileText,
  Layers,
  Sparkles,
  Search,
  Cpu,
} from "lucide-react";
import UnifiedAIStudioHero from "@/components/UnifiedAIStudioHero";

export default function Hero() {
  return (
    <section id="home" className="relative pt-8 pb-16 md:pt-12 md:pb-20 overflow-hidden bg-gradient-to-b from-teal-50/40 via-white to-slate-100/60">
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Top Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-3xl space-y-3.5">
            {/* Tag / Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 text-teal-800 text-xs font-semibold w-fit border border-teal-200 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
              <span>Evidence-First Geospatial Cadastral Intelligence • SIH 2026 PS-26012</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-[3.4rem] font-black font-heading text-slate-900 leading-[1.12] tracking-tight">
              Verify land records against the{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#028090] via-[#00a896] to-[#02c39a]">
                land itself.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
              AeroSync connects high-resolution drone orthomosaics, parcel geometry, and AI segmentation to extract <strong className="text-teal-700">90° legal boundaries</strong>, detect <strong className="text-rose-600">setback encroachment</strong>, and generate <strong className="text-slate-900">SVAMITVA Property Cards</strong>.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Search size={15} className="text-teal-400" />
              <span>Verify a Property Free</span>
              <ArrowRight size={15} />
            </Link>

            <Link
              href="/models"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-teal-50 text-slate-800 border border-slate-300 hover:border-teal-300 text-xs sm:text-sm font-bold transition-all duration-200 shadow-xs"
            >
              <Cpu size={15} className="text-teal-600" />
              <span>Full AI Studio Suite</span>
            </Link>
          </div>
        </div>

        {/* ── UNIFIED AI MODEL STUDIO EMBEDDED IN HERO ── */}
        <div className="relative z-10">
          <UnifiedAIStudioHero />
        </div>

        {/* 4 Trust & Evidence Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-3 border-t border-slate-200 text-xs">
          <div className="flex items-start gap-2.5">
            <ShieldCheck size={20} className="text-teal-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-900 font-bold">Evidence-First</strong>
              <span className="text-slate-500 text-xs">Inspectable OCR &amp; vectors</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Scale size={20} className="text-teal-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-900 font-bold">Tolerance Math</strong>
              <span className="text-slate-500 text-xs">±3.0% statutory surveying margin</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Layers size={20} className="text-teal-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-900 font-bold">Sub-Centimeter GSD</strong>
              <span className="text-slate-500 text-xs">90° Orthogonal boundary plinths</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Lock size={20} className="text-teal-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-900 font-bold">Section 65B</strong>
              <span className="text-slate-500 text-xs">Court-admissible tamper logs</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
