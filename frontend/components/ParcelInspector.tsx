"use client";

import React, { useState } from "react";
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
  Compass,
  Barcode,
  ShieldCheck,
  ShieldAlert,
  ArrowUpRight,
  Scale,
  Sparkles,
  Layers,
} from "lucide-react";
import { formatNumber } from "@/data/formatters";

interface ParcelInspectorProps {
  parcel: CadastralParcel;
  onOpenPropertyCard: () => void;
}

export default function ParcelInspector({ parcel, onOpenPropertyCard }: ParcelInspectorProps) {
  const [activeTab, setActiveTab] = useState<"boundary" | "property" | "solarTax">("boundary");
  const [surveyorStatus, setSurveyorStatus] = useState<"PENDING" | "APPROVED" | "FLAGGED">(
    parcel.verificationNeeded ? "FLAGGED" : "APPROVED"
  );

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between h-full shadow-sm">
      
      <div className="space-y-4">
        {/* Header with SIH 2026 Property ID & Status */}
        <div className="border-b border-slate-200 pb-3 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-teal-700 font-bold uppercase tracking-wider">
              <Sparkles size={13} />
              <span>SIH PS-26012 • Cadastral AI</span>
            </div>
            <h3 className="text-lg font-black font-heading text-slate-900 mt-0.5">
              {parcel.owner}
            </h3>
            <p className="text-xs text-slate-500">{parcel.village}, {parcel.district}</p>
          </div>

          <div className="text-right">
            <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-slate-900 text-teal-400 border border-slate-700">
              {parcel.propertyId || parcel.id}
            </span>
            <div className="text-[10px] text-slate-400 font-mono mt-1">Khasra: {parcel.khasra}</div>
          </div>
        </div>

        {/* Tab Switcher: Direction Boundaries vs Core Cadastre vs Solar/Tax */}
        <div className="flex rounded-xl bg-slate-200/80 p-1 text-xs font-semibold text-slate-700">
          <button
            onClick={() => setActiveTab("boundary")}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "boundary"
                ? "bg-white text-slate-900 shadow-sm font-bold"
                : "hover:text-slate-900 text-slate-600"
            }`}
          >
            <Compass size={13} className="text-teal-600" />
            <span>Direction Boundary</span>
          </button>

          <button
            onClick={() => setActiveTab("property")}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "property"
                ? "bg-white text-slate-900 shadow-sm font-bold"
                : "hover:text-slate-900 text-slate-600"
            }`}
          >
            <Layers size={13} className="text-primary" />
            <span>AI Cadastre</span>
          </button>

          <button
            onClick={() => setActiveTab("solarTax")}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "solarTax"
                ? "bg-white text-slate-900 shadow-sm font-bold"
                : "hover:text-slate-900 text-slate-600"
            }`}
          >
            <Sun size={13} className="text-amber-600" />
            <span>Solar & Tax</span>
          </button>
        </div>

        {/* TAB 1: DIRECTION BOUNDARIES (CHAUHADDI / चौहद्दी) */}
        {activeTab === "boundary" && (
          <div className="space-y-3 animate-fadeIn">
            {/* Chauhaddi Cardinal Direction Matrix */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Compass size={14} className="text-teal-600" />
                  <span>Chauhaddi Dimensions (चौहद्दी)</span>
                </span>
                <span className="text-[10px] font-mono font-bold bg-teal-50 text-teal-700 px-2 py-0.5 rounded border border-teal-200">
                  90° Orthogonal: {parcel.orthogonalizationScore}%
                </span>
              </div>

              {/* 4 Cardinal Rows */}
              <div className="space-y-2 text-xs">
                {/* North */}
                <div className="flex items-start justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <div>
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                      North (उत्तर):
                    </span>
                    <p className="text-[11px] text-slate-600 mt-0.5 font-sans">
                      {parcel.directionBoundaries.north.abutting}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      {parcel.directionBoundaries.north.lengthM} m
                    </span>
                    {parcel.directionBoundaries.north.status === "CONFLICT" && (
                      <span className="block text-[9px] font-bold text-rose-600">CONFLICT</span>
                    )}
                  </div>
                </div>

                {/* East */}
                <div className="flex items-start justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <div>
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                      East (पूर्व):
                    </span>
                    <p className="text-[11px] text-slate-600 mt-0.5 font-sans">
                      {parcel.directionBoundaries.east.abutting}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      {parcel.directionBoundaries.east.lengthM} m
                    </span>
                  </div>
                </div>

                {/* South */}
                <div className="flex items-start justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <div>
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                      South (दक्षिण):
                    </span>
                    <p className="text-[11px] text-slate-600 mt-0.5 font-sans">
                      {parcel.directionBoundaries.south.abutting}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      {parcel.directionBoundaries.south.lengthM} m
                    </span>
                  </div>
                </div>

                {/* West */}
                <div className="flex items-start justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <div>
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                      West (पश्चिम):
                    </span>
                    <p className="text-[11px] text-slate-600 mt-0.5 font-sans">
                      {parcel.directionBoundaries.west.abutting}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      {parcel.directionBoundaries.west.lengthM} m
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Boundary Conflict Alert Banner (SIH Solution) */}
            {parcel.conflictAlert && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-rose-800 mb-1">
                  <AlertTriangle size={14} className="text-rose-600" />
                  <span>Boundary Conflict Alert (SIH PS-26012)</span>
                </div>
                <p className="text-slate-700 text-[11px] leading-relaxed">
                  {parcel.conflictAlert.description}
                </p>
                <div className="mt-2 pt-1.5 border-t border-rose-200/60 flex items-center justify-between text-[10px] text-rose-900 font-semibold">
                  <span>Required Buffer: {parcel.conflictAlert.statutoryBufferM}m</span>
                  <span>Detected Clearance: {parcel.conflictAlert.actualClearanceM}m</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CORE AI CADASTRE & ULPIN */}
        {activeTab === "property" && (
          <div className="space-y-2.5 text-xs animate-fadeIn">
            {/* Barcode & Property ID (Slide 2 Feature) */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                  SIH Cadastral Barcode ID
                </span>
                <span className="font-mono font-black text-sm text-slate-900 tracking-wider">
                  {parcel.propertyId || "GJ-2026-00125"}
                </span>
              </div>
              {/* Simulated SVG Barcode Graphic */}
              <div className="flex flex-col items-end">
                <div className="flex gap-[2px] h-6 items-center">
                  {[2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 1, 2].map((w, i) => (
                    <div
                      key={i}
                      className="bg-slate-900 h-full"
                      style={{ width: `${w}px` }}
                    />
                  ))}
                </div>
                <span className="text-[8px] font-mono text-slate-400 mt-0.5">DoLR-SVAMITVA</span>
              </div>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <MapPin size={13} className="text-primary" /> ULPIN (Bhu-Aadhaar):
              </span>
              <span className="font-mono font-bold text-slate-900">{parcel.ulpin}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <Maximize2 size={13} className="text-primary" /> Built-up Area:
              </span>
              <span className="font-bold text-slate-900">
                {parcel.areaSqm} m² <span className="text-slate-500 font-normal">({parcel.areaSqft} ft²)</span>
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <Home size={13} className="text-primary" /> Roof Classification:
              </span>
              <span className="font-bold text-slate-800 bg-slate-200/70 px-2 py-0.5 rounded text-[11px]">
                {parcel.roofType || "RCC (Pakka)"}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">MC Dropout Uncertainty:</span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  parcel.uncertaintyScore < 0.15
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-rose-100 text-rose-800"
                }`}
              >
                {(parcel.uncertaintyScore * 100).toFixed(1)}% ({parcel.uncertaintyScore < 0.15 ? "Low / Confident" : "High Uncertainty"})
              </span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500 font-medium">Survey Priority:</span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  parcel.surveyPriority === "URGENT"
                    ? "bg-rose-600 text-white"
                    : "bg-slate-200 text-slate-800"
                }`}
              >
                {parcel.surveyPriority}
              </span>
            </div>
          </div>
        )}

        {/* TAB 3: SOLAR & TAX VALUATION */}
        {activeTab === "solarTax" && parcel.solarCapacityKwp && (
          <div className="space-y-2.5 animate-fadeIn">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-amber-900 flex items-center gap-1">
                  <Sun size={14} className="text-amber-600" /> PM Surya Ghar Potential
                </span>
                <span className="px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 font-bold text-[10px]">
                  {parcel.solarCapacityKwp} kWp
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-700 font-medium text-[11px]">
                <div>⚡ Annual: <strong>{formatNumber(parcel.solarAnnualGenKwh)} kWh</strong></div>
                <div>💰 Savings: <strong>₹{formatNumber(parcel.annualSolarSavingsInr)}/yr</strong></div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-emerald-900 flex items-center gap-1">
                  <Coins size={14} className="text-emerald-700" /> Panchayat Circle Valuation
                </span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-900 font-bold text-[10px]">
                  Verified
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-700 font-medium text-[11px]">
                <div>🏠 Valuation: <strong>₹{formatNumber(parcel.assetValuationInr)}</strong></div>
                <div>📋 Annual Tax: <strong>₹{formatNumber(parcel.annualPropertyTaxInr)}</strong></div>
              </div>
            </div>
          </div>
        )}

        {/* Human-in-the-Loop Surveyor Actions (SIH Slide 2 & 3) */}
        <div className="pt-2 border-t border-slate-200">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Human Surveyor Review (SIH Workflow):
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSurveyorStatus("APPROVED")}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1 transition-all ${
                surveyorStatus === "APPROVED"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
              }`}
            >
              <CheckCircle2 size={13} />
              <span>Approve 90° Polygon</span>
            </button>

            <button
              onClick={() => setSurveyorStatus("FLAGGED")}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1 transition-all ${
                surveyorStatus === "FLAGGED"
                  ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
              }`}
            >
              <AlertTriangle size={13} />
              <span>Flag Field Audit</span>
            </button>
          </div>
        </div>

      </div>

      {/* Action Button: Generate Official SVAMITVA Property Card with Real Image & Direction Boundary */}
      <button
        onClick={onOpenPropertyCard}
        className="w-full mt-4 py-3 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-glow-primary hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
      >
        <FileText size={16} />
        <span>Generate Digital Property Card (Gharoni)</span>
      </button>

    </div>
  );
}
