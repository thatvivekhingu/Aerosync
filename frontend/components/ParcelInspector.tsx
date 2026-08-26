"use client";

import React from "react";
import { CadastralParcel } from "@/data/parcels";
import {
  CheckCircle2,
  AlertTriangle,
  FileText,
  User,
  MapPin,
  Maximize2,
  Sun,
  Coins,
  Home,
  Zap,
} from "lucide-react";

interface ParcelInspectorProps {
  parcel: CadastralParcel;
  onOpenPropertyCard: () => void;
}

export default function ParcelInspector({ parcel, onOpenPropertyCard }: ParcelInspectorProps) {
  return (
    <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-6 flex flex-col justify-between h-full shadow-sm">
      
      <div className="space-y-4">
        {/* Header */}
        <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold font-heading text-slate-900">Parcel Intelligence</h3>
            <p className="text-xs text-slate-500">Live AI Segmentation &amp; Legal Cadastre</p>
          </div>
          <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-primary-light text-primary border border-primary/20">
            {parcel.id}
          </span>
        </div>

        {/* Primary Cadastral Attributes List */}
        <div className="space-y-2.5 text-sm">
          <div className="flex items-center justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <MapPin size={14} className="text-primary" /> ULPIN (Bhu-Aadhaar):
            </span>
            <span className="font-mono font-bold text-slate-900">{parcel.ulpin}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <User size={14} className="text-primary" /> Owner Name:
            </span>
            <span className="font-semibold text-slate-900 text-right">{parcel.owner}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <Home size={14} className="text-primary" /> Roof Classification:
            </span>
            <span className="font-bold text-slate-800 bg-slate-200/70 px-2 py-0.5 rounded text-xs">
              {parcel.roofType || "RCC (Pakka)"}
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <Maximize2 size={14} className="text-primary" /> Built-up Area:
            </span>
            <span className="font-bold text-slate-900">
              {parcel.areaSqm} m² <span className="text-slate-500 font-normal">({parcel.areaSqft} ft²)</span>
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Khasra / Khata No:</span>
            <span className="font-semibold text-slate-900">{parcel.khasra}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500 font-medium">AI Extraction Confidence:</span>
            <span
              className={`px-2 py-0.5 rounded text-xs font-bold ${
                parcel.confidence >= 0.85
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-rose-100 text-rose-800"
              }`}
            >
              {(parcel.confidence * 100).toFixed(1)}% {parcel.confidence >= 0.85 ? "(High)" : "(Low)"}
            </span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-slate-500 font-medium">Ground Verification:</span>
            <div className="flex items-center gap-1 text-xs font-bold">
              {parcel.verificationNeeded ? (
                <span className="text-rose-600 flex items-center gap-1">
                  <AlertTriangle size={14} /> Flagged (Ground Truthing)
                </span>
              ) : (
                <span className="text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 size={14} /> Digitally Verified
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Project Vaayu Enhancements: Solar Rooftop Potential & Property Tax */}
        {parcel.solarCapacityKwp && (
          <div className="pt-2 space-y-2">
            
            {/* Solar Widget */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-amber-900 flex items-center gap-1">
                  <Sun size={14} className="text-amber-600" /> Solar Rooftop Potential (MNRE)
                </span>
                <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 font-bold text-[10px]">
                  {parcel.solarCapacityKwp} kWp
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-700 font-medium">
                <div>⚡ Annual Yield: <strong>{parcel.solarAnnualGenKwh?.toLocaleString()} kWh</strong></div>
                <div>💰 Est. Savings: <strong>₹{parcel.annualSolarSavingsInr?.toLocaleString()}/yr</strong></div>
              </div>
            </div>

            {/* Property Tax & Valuation Widget */}
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-emerald-900 flex items-center gap-1">
                  <Coins size={14} className="text-emerald-700" /> Panchayat Valuation &amp; Tax
                </span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-900 font-bold text-[10px]">
                  Circle Rate
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-700 font-medium">
                <div>🏠 Asset Value: <strong>₹{parcel.assetValuationInr?.toLocaleString()}</strong></div>
                <div>📋 Annual Tax: <strong>₹{parcel.annualPropertyTaxInr?.toLocaleString()}</strong></div>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Action Button */}
      <button
        onClick={onOpenPropertyCard}
        className="w-full mt-4 py-3 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-sm shadow-glow-primary hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
      >
        <FileText size={18} />
        <span>Generate SVAMITVA Property Card</span>
      </button>

    </div>
  );
}
