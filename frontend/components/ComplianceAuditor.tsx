"use client";

import React from "react";
import { AlertCircle, CheckCircle2, ShieldAlert, Scale } from "lucide-react";

export default function ComplianceAuditor() {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 lg:p-8 shadow-lg">
      
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
        <div className="w-10 h-10 rounded-xl bg-primary-light text-primary flex items-center justify-center">
          <Scale size={22} />
        </div>
        <div>
          <h3 className="text-xl font-bold font-heading text-slate-900">Cadastral Regulatory &amp; Setback Compliance</h3>
          <p className="text-xs sm:text-sm text-slate-500">Automated Proximity Auditing for Water Bodies &amp; Road Right-of-Ways</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Violation Card 1 */}
        <div className="bg-rose-50 border border-rose-200/90 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-600 text-white">
                CRITICAL VIOLATION
              </span>
              <span className="text-xs font-mono font-bold text-rose-800">ULPIN-26012-0045</span>
            </div>
            
            <h4 className="text-base font-bold text-rose-950 mb-2">Water Body (Talab) Buffer Encroachment</h4>
            <p className="text-xs sm:text-sm text-rose-900/80 leading-relaxed">
              Abutting structure is constructed within <strong>8.5 meters</strong> of designated village pond boundary. Statutory environmental norm requires minimum <strong>15 meters</strong> setback.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-rose-200/80 text-xs font-semibold text-rose-800">
            Action: Flagged for Revenue Officer Physical Hearing during Gram Sabha Review.
          </div>
        </div>

        {/* Compliant Card 2 */}
        <div className="bg-emerald-50 border border-emerald-200/90 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white">
                FULL COMPLIANCE
              </span>
              <span className="text-xs font-mono font-bold text-emerald-800">ULPIN-26012-0042 &amp; 0043</span>
            </div>
            
            <h4 className="text-base font-bold text-emerald-950 mb-2">Road Right-of-Way (RoW) Clearance</h4>
            <p className="text-xs sm:text-sm text-emerald-900/80 leading-relaxed">
              Structures maintain safe statutory clearance (<strong>≥ 4.2 meters</strong>) from the main village road center-line, satisfying the 3.0m minimum setback standard.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-emerald-200/80 text-xs font-semibold text-emerald-800">
            Status: Property Cards cleared for final digital signature.
          </div>
        </div>

      </div>

    </div>
  );
}
