"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChangeDetectionViewer from "@/components/ChangeDetectionViewer";
import { History, Activity, AlertTriangle, Layers, ShieldAlert, CheckCircle2 } from "lucide-react";

export default function ChangeDetectionPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#f8fbfa] text-slate-800">
      <Navbar />

      {/* ── Page Header ── */}
      <section className="bg-white border-b border-slate-200/80 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1360px] mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold mb-3 shadow-xs">
            <History size={14} className="text-amber-600" />
            <span>Bi-Temporal Siamese Neural Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900 tracking-tight mb-2">
            Bi-Temporal Cadastral Mutation Tracker
          </h1>
          <p className="max-w-2xl mx-auto text-slate-600 text-xs sm:text-sm leading-relaxed">
            Compares flight epochs (Flight 2024 vs Flight 2026) to detect newly erected buildings, demolished structures, and illegal boundary encroachments.
          </p>
        </div>
      </section>

      {/* ── Main Change Detection Viewer ── */}
      <main className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm">
          <ChangeDetectionViewer />
        </div>

        {/* Mutation Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <Layers size={16} />
              <span>Epoch Alignment</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Automatic sub-pixel orthorectification and geometric tie-point alignment ensures zero false positives from minor drone flight tilt differences.
            </p>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
              <Activity size={16} />
              <span>Mutation Classification</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Classifies mutations into New Construction, Demolished Building, Road RoW Narrowing, and Waterbody Shrinkage with 91.7% accuracy.
            </p>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
              <AlertTriangle size={16} />
              <span>Encroachment Alert Log</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Detected deviations greater than 5.0 sqm trigger automated notifications to the Gram Sabha Secretary and Revenue Lekhpal.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
