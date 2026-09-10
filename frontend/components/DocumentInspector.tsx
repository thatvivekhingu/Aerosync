"use client";

import React, { useState } from "react";
import { CadastralProperty, OCRBoundingBox } from "@/data/cadastral-registry";
import {
  FileText,
  Scan,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ShieldAlert,
  Info,
  QrCode,
  Stamp,
} from "lucide-react";

interface DocumentInspectorProps {
  property: CadastralProperty;
}

export default function DocumentInspector({ property }: DocumentInspectorProps) {
  const [selectedField, setSelectedField] = useState<string | null>("Survey No");
  const [showBoundingBoxes, setShowBoundingBoxes] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const activeBox = property.evidence.ocrBoxes.find((b) => b.field === selectedField);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-full">
      {/* Top Banner: Disclaimer */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between text-xs text-amber-900">
        <div className="flex items-center gap-2">
          <ShieldAlert size={14} className="text-amber-600 shrink-0" />
          <span className="font-semibold">
            DEMO DOCUMENT PREVIEW • NOT AN AUTHORITATIVE GOVERNMENT RECORD
          </span>
        </div>
        <span className="text-[11px] text-amber-700 font-mono">
          Doc ID: {property.documentNo}
        </span>
      </div>

      {/* Control Toolbar */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 flex-wrap text-xs">
        <div className="flex items-center gap-1.5">
          <FileText size={14} className="text-slate-500" />
          <span className="font-semibold text-slate-700">OCR Evidence Inspector</span>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 hover:text-slate-900">
            <input
              type="checkbox"
              checked={showBoundingBoxes}
              onChange={(e) => setShowBoundingBoxes(e.target.checked)}
              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            <span>Show OCR Boxes</span>
          </label>

          <div className="h-4 w-px bg-slate-200" />

          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoomLevel((z) => Math.max(80, z - 10))}
              className="p-1 rounded hover:bg-slate-200 text-slate-600"
              title="Zoom out"
            >
              <ZoomOut size={14} />
            </button>
            <span className="text-[11px] font-mono text-slate-500 min-w-[36px] text-center">
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(140, z + 10))}
              className="p-1 rounded hover:bg-slate-200 text-slate-600"
              title="Zoom in"
            >
              <ZoomIn size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Document Inspection Area */}
      <div className="p-4 bg-slate-100 flex-1 overflow-auto flex items-center justify-center min-h-[360px]">
        {/* Rendered Official Property Card Document Representation */}
        <div
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "top center" }}
          className="w-full max-w-[460px] bg-white border-2 border-slate-800 rounded-lg p-5 shadow-md relative text-slate-900 font-serif transition-transform"
        >
          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
            <span className="text-5xl font-black rotate-[-30deg] tracking-widest uppercase">
              SVAMITVA
            </span>
          </div>

          {/* Official Emblem Header */}
          <div className="text-center border-b-2 border-slate-800 pb-3 mb-3">
            <div className="text-[9px] font-sans font-bold uppercase tracking-widest text-slate-600">
              Government of {property.state} • Revenue Department
            </div>
            <div className="text-base font-black uppercase tracking-wider text-slate-900 mt-0.5">
              SVAMITVA PROPERTY CARD (संपत्ति पत्रक)
            </div>
            <div className="text-[10px] font-sans text-slate-500">
              Record of Rights issued under Section 65B Admissibility Framework
            </div>
          </div>

          {/* Document Content Fields */}
          <div className="space-y-2.5 text-xs font-sans">
            {/* ULPIN Row */}
            <div
              onClick={() => setSelectedField("ULPIN")}
              className={`p-1.5 rounded cursor-pointer border transition-all ${
                selectedField === "ULPIN" && showBoundingBoxes
                  ? "bg-teal-50 border-teal-500 ring-2 ring-teal-500/30"
                  : "border-transparent hover:bg-slate-50"
              }`}
            >
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                1. ULPIN (Bhu-Aadhaar 14-Digit)
              </span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {property.ulpin}
              </span>
            </div>

            {/* Survey No & Khasra */}
            <div className="grid grid-cols-2 gap-2">
              <div
                onClick={() => setSelectedField("Survey No")}
                className={`p-1.5 rounded cursor-pointer border transition-all ${
                  selectedField === "Survey No" && showBoundingBoxes
                    ? "bg-teal-50 border-teal-500 ring-2 ring-teal-500/30"
                    : "border-transparent hover:bg-slate-50"
                }`}
              >
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                  2. Survey / Khasra No
                </span>
                <span className="font-mono font-black text-slate-900 text-sm">
                  {property.surveyNo}
                </span>
              </div>

              <div
                onClick={() => setSelectedField("Total Area")}
                className={`p-1.5 rounded cursor-pointer border transition-all ${
                  selectedField === "Total Area" && showBoundingBoxes
                    ? "bg-amber-50 border-amber-500 ring-2 ring-amber-500/30"
                    : "border-transparent hover:bg-slate-50"
                }`}
              >
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                  3. Recorded Area (Doc)
                </span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {property.documentAreaHa > 0.1
                    ? `${property.documentAreaHa} Hectare`
                    : `${property.documentAreaSqm} m²`}
                </span>
              </div>
            </div>

            {/* Owner Details */}
            <div
              onClick={() => setSelectedField("Owner Name")}
              className={`p-1.5 rounded cursor-pointer border transition-all ${
                selectedField === "Owner Name" && showBoundingBoxes
                  ? "bg-teal-50 border-teal-500 ring-2 ring-teal-500/30"
                  : "border-transparent hover:bg-slate-50"
              }`}
            >
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                4. Applicant / Recorded Owner
              </span>
              <span className="font-semibold text-slate-900">
                {property.ownerName}
              </span>
              <span className="text-[10px] text-amber-700 block italic">
                (Ownership title requires Sub-Registrar confirmation)
              </span>
            </div>

            {/* Location */}
            <div className="p-1.5 bg-slate-50 rounded border border-slate-200 text-[11px]">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                5. Location & Administrative Mauza
              </span>
              <span>
                Village {property.village}, Taluka {property.taluka}, District {property.district},{" "}
                {property.state} — {property.pincode}
              </span>
            </div>

            {/* Footer with Seal & QR */}
            <div className="pt-2 mt-2 border-t border-slate-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-slate-900 rounded p-1 flex items-center justify-center text-white">
                  <QrCode size={24} />
                </div>
                <div className="text-[9px] text-slate-500 leading-tight">
                  <div>SHA-256 Validated</div>
                  <div className="font-mono">{property.documentNo}</div>
                  <div>Issued: {property.documentIssueDate}</div>
                </div>
              </div>

              <div
                onClick={() => setSelectedField("Issuing Authority")}
                className={`text-right p-1 rounded cursor-pointer border ${
                  selectedField === "Issuing Authority" && showBoundingBoxes
                    ? "bg-teal-50 border-teal-500"
                    : "border-transparent"
                }`}
              >
                <div className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-700 uppercase">
                  <Stamp size={12} className="text-teal-700" />
                  Official Stamp
                </div>
                <div className="text-[9px] text-slate-500 font-sans">
                  {property.documentIssuedBy}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Extracted Field Inspector Footer */}
      <div className="p-3 bg-slate-50 border-t border-slate-200">
        <div className="text-[11px] font-semibold text-slate-500 uppercase mb-2">
          Extracted OCR Token Details:
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {property.evidence.ocrBoxes.map((box) => {
            const isSelected = selectedField === box.field;
            return (
              <button
                key={box.field}
                onClick={() => setSelectedField(box.field)}
                className={`p-2 rounded-lg text-left border transition-all ${
                  isSelected
                    ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className={`text-[10px] uppercase font-bold ${isSelected ? "text-teal-100" : "text-slate-400"}`}>
                  {box.field}
                </div>
                <div className="font-mono text-xs font-bold truncate mt-0.5">
                  {box.value}
                </div>
                <div className={`text-[10px] mt-0.5 ${isSelected ? "text-teal-200" : "text-slate-500"}`}>
                  {(box.confidence * 100).toFixed(0)}% OCR Conf
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
