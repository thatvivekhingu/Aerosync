"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ComplianceAuditor from "@/components/ComplianceAuditor";
import { ShieldAlert, ShieldCheck, Scale, AlertTriangle, FileCheck, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function CompliancePage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#f8fbfa] text-slate-800">
      <Navbar />

      {/* ── Page Header ── */}
      <section className="bg-white border-b border-slate-200/80 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1360px] mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold mb-3 shadow-xs">
            <ShieldAlert size={14} className="text-rose-600" />
            <span>Automated Revenue Court &amp; Setback Compliance</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900 tracking-tight mb-2">
            Regulatory Buffer &amp; Encroachment Auditor
          </h1>
          <p className="max-w-2xl mx-auto text-slate-600 text-xs sm:text-sm leading-relaxed">
            Checks building footprints against Right-of-Way (RoW) road buffers, waterbody high-flood lines, and neighbouring plot setback standards under state revenue codes.
          </p>
        </div>
      </section>

      {/* ── Main Auditor Content ── */}
      <main className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm">
          <ComplianceAuditor />
        </div>

        {/* Legal References Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <Scale size={16} />
              <span>UP Revenue Code 2006</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mandates a minimum 3.0-meter clearance for rural arterial roads and strictly prohibits construction within 50 meters of Gaon Sabha waterbodies (Talab/Pokhra).
            </p>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
              <AlertTriangle size={16} />
              <span>Setback Violation Action</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Detected encroachments automatically generate a Section 67 Notice draft with drone orthomosaic annexures for Tehsildar review.
            </p>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-teal-600 font-bold text-sm">
              <CheckCircle2 size={16} />
              <span>Section 65B Admissibility</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              All buffer distance calculations are digitally signed with cryptographic hash verification to maintain strict judicial admissibility.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
