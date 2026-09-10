"use client";

import React, { useState } from "react";
import {
  CadastralProperty,
  CADASTRAL_REGISTRY,
  VerificationStatus,
} from "@/data/cadastral-registry";
import DocumentInspector from "@/components/DocumentInspector";
import ReportIssueModal from "@/components/ReportIssueModal";
import AIPipelineFlow from "@/components/AIPipelineFlow";
import {
  Map as MapIcon,
  Layers,
  FileText,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Search,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Navigation,
  Info,
  Clock,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Scale,
  Flag,
  Fingerprint,
} from "lucide-react";
import Link from "next/link";

interface PropertyVerificationHubProps {
  initialPropertyId?: string;
  showPipeline?: boolean;
}

export default function PropertyVerificationHub({
  initialPropertyId = "AS-GJ-124-3A",
  showPipeline = true,
}: PropertyVerificationHubProps) {
  const [selectedId, setSelectedId] = useState<string>(initialPropertyId);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [mapLayer, setMapLayer] = useState<"cadastral" | "satellite" | "hybrid">("hybrid");
  const [activeEvidenceTab, setActiveEvidenceTab] = useState<"doc" | "gis" | "sensor" | "math">("doc");
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"verification" | "document" | "evidence" | "audit">("verification");

  const currentProperty =
    CADASTRAL_REGISTRY.find((p) => p.id === selectedId) || CADASTRAL_REGISTRY[0];

  // Status Badge Colors & Labels
  const getStatusBadge = (status: VerificationStatus) => {
    switch (status) {
      case "VERIFIED":
        return {
          label: "VERIFIED",
          bg: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
          icon: CheckCircle2,
        };
      case "PARTIALLY_VERIFIED":
        return {
          label: "PARTIALLY VERIFIED",
          bg: "bg-teal-500/10 text-teal-700 border-teal-500/30",
          icon: CheckCircle2,
        };
      case "REQUIRES_REVIEW":
        return {
          label: "REQUIRES REVIEW",
          bg: "bg-amber-500/10 text-amber-700 border-amber-500/30",
          icon: AlertTriangle,
        };
      case "MISMATCH_DETECTED":
        return {
          label: "MISMATCH DETECTED",
          bg: "bg-rose-500/10 text-rose-700 border-rose-500/30",
          icon: XCircle,
        };
      case "INSUFFICIENT_EVIDENCE":
      default:
        return {
          label: "INSUFFICIENT EVIDENCE",
          bg: "bg-slate-500/10 text-slate-700 border-slate-500/30",
          icon: HelpCircle,
        };
    }
  };

  const statusInfo = getStatusBadge(currentProperty.verificationStatus);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-6">
      {/* Top Search & Property Selector Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Land Verification Engine
            </div>
            <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Selected:</span>
              <span className="font-mono text-teal-700">{currentProperty.id}</span>
              <span className="text-slate-400">•</span>
              <span>Survey No: {currentProperty.surveyNo}</span>
            </div>
          </div>
        </div>

        {/* Demo Property Switcher Pills */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
            Select Sample:
          </span>
          {CADASTRAL_REGISTRY.map((p) => {
            const isSelected = p.id === currentProperty.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  isSelected
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {p.surveyNo} ({p.village.split(" ")[0]})
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Split-View Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[640px]">
        {/* LEFT 55%: Interactive Cadastral & Satellite Map Viewer */}
        <div className="lg:col-span-7 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden flex flex-col shadow-lg relative min-h-[500px]">
          {/* Map Controls Header */}
          <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between gap-2 pointer-events-none">
            <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl px-3.5 py-2 shadow-lg flex items-center gap-2 text-xs text-white">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span className="font-semibold">Survey No {currentProperty.surveyNo}</span>
              <span className="text-slate-400">|</span>
              <span className="font-mono text-[11px] text-slate-300">
                {currentProperty.centroid[1].toFixed(5)}°N, {currentProperty.centroid[0].toFixed(5)}°E
              </span>
            </div>

            {/* Layer Switcher */}
            <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 shadow-lg flex items-center gap-1 text-xs">
              <button
                onClick={() => setMapLayer("satellite")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  mapLayer === "satellite"
                    ? "bg-teal-500 text-slate-950 font-bold"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                Satellite
              </button>
              <button
                onClick={() => setMapLayer("cadastral")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  mapLayer === "cadastral"
                    ? "bg-teal-500 text-slate-950 font-bold"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                Cadastral
              </button>
              <button
                onClick={() => setMapLayer("hybrid")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  mapLayer === "hybrid"
                    ? "bg-teal-500 text-slate-950 font-bold"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                Hybrid
              </button>
            </div>
          </div>

          {/* Simulated Real GIS Interactive Vector Canvas */}
          <div className="flex-1 w-full h-full relative bg-[#0d1b2a] overflow-hidden flex items-center justify-center p-6 select-none">
            {/* Real Drone Orthomosaic Aerial Background (Exact User Request) */}
            <div className="absolute inset-0 transition-opacity duration-300 overflow-hidden">
              <img
                src="/inference/patch_100_orig.png"
                alt="Real Drone Orthomosaic"
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  mapLayer === "cadastral" ? "opacity-20" : "opacity-85"
                }`}
                style={{ filter: "contrast(1.12) brightness(0.88) saturate(1.1)" }}
              />
              <div className="absolute inset-0 bg-slate-950/30 mix-blend-multiply pointer-events-none" />
            </div>

            {/* True North Compass Rose Overlay */}
            <div className="absolute top-16 right-4 z-20 bg-slate-950/80 backdrop-blur-md p-2 rounded-xl border border-slate-700/80 text-white flex flex-col items-center shadow-lg">
              <Navigation size={18} className="text-rose-500 fill-rose-500 transform -rotate-45" />
              <span className="text-[8px] font-mono font-bold text-slate-300 uppercase tracking-wider mt-0.5">NORTH</span>
            </div>

            {/* Simulated Surrounding Neighboring Parcels */}
            <svg className="w-full h-full max-w-[580px] max-h-[460px] relative z-10 filter drop-shadow-md">
              {/* Neighbor 1 */}
              <polygon
                points="40,60 180,60 170,180 30,170"
                fill="rgba(30, 41, 59, 0.6)"
                stroke="#64748b"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
              <text x="75" y="110" fill="#cbd5e1" fontSize="11" fontFamily="monospace" fontWeight="bold">
                Survey 123
              </text>

              {/* Neighbor 2 */}
              <polygon
                points="410,50 540,50 530,190 390,180"
                fill="rgba(30, 41, 59, 0.6)"
                stroke="#64748b"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
              <text x="430" y="110" fill="#cbd5e1" fontSize="11" fontFamily="monospace" fontWeight="bold">
                Survey 125
              </text>

              {/* Neighbor 3 */}
              <polygon
                points="160,340 380,340 360,440 140,430"
                fill="rgba(30, 41, 59, 0.6)"
                stroke="#64748b"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
              <text x="230" y="390" fill="#cbd5e1" fontSize="11" fontFamily="monospace" fontWeight="bold">
                Cart Track / RoW
              </text>

              {/* ACTIVE SELECTED PARCEL */}
              <polygon
                points="190,70 380,75 365,310 175,300"
                fill={
                  currentProperty.verificationStatus === "MISMATCH_DETECTED"
                    ? "rgba(225, 29, 72, 0.35)"
                    : currentProperty.verificationStatus === "PARTIALLY_VERIFIED"
                    ? "rgba(13, 148, 136, 0.35)"
                    : "rgba(16, 185, 129, 0.35)"
                }
                stroke={
                  currentProperty.verificationStatus === "MISMATCH_DETECTED"
                    ? "#f43f5e"
                    : currentProperty.verificationStatus === "PARTIALLY_VERIFIED"
                    ? "#14b8a6"
                    : "#10b981"
                }
                strokeWidth="3"
                className="transition-all duration-300"
              />

              {/* DIRECTION BOUNDARIES (CHAUHADDI DIMENSIONS) - Exact User Request */}
              {/* North Boundary Dimension */}
              <rect x="255" y="58" width="60" height="15" rx="3" fill="rgba(15, 23, 42, 0.9)" stroke="#10b981" strokeWidth="1" />
              <text x="285" y="69" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="monospace">
                N: 14.8m
              </text>

              {/* East Boundary Dimension */}
              <rect x="375" y="185" width="60" height="15" rx="3" fill="rgba(15, 23, 42, 0.9)" stroke="#10b981" strokeWidth="1" />
              <text x="405" y="196" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="monospace">
                E: 18.2m
              </text>

              {/* South Boundary Dimension */}
              <rect x="240" y="308" width="60" height="15" rx="3" fill="rgba(15, 23, 42, 0.9)" stroke="#10b981" strokeWidth="1" />
              <text x="270" y="319" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="monospace">
                S: 14.5m
              </text>

              {/* West Boundary Dimension */}
              <rect x="120" y="180" width="60" height="15" rx="3" fill="rgba(15, 23, 42, 0.9)" stroke="#10b981" strokeWidth="1" />
              <text x="150" y="191" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="monospace">
                W: 18.0m
              </text>

              {/* Inner Plinth Footprint (Sub-pixel AI Extracted) */}
              <rect
                x="220"
                y="110"
                width="110"
                height="140"
                fill="rgba(255, 152, 0, 0.4)"
                stroke="#f59e0b"
                strokeWidth="1.5"
                rx="4"
              />
              <text x="235" y="175" fill="#fef3c7" fontSize="10" fontWeight="bold">
                Plinth: {currentProperty.roofType}
              </text>

              {/* Corner Survey Pillars (90° Orthogonalized) */}
              <circle cx="190" cy="70" r="5" fill="#02c39a" stroke="#ffffff" strokeWidth="1.5" />
              <text x="175" y="60" fill="#7dd3fc" fontSize="9" fontWeight="bold">P1 (90°)</text>

              <circle cx="380" cy="75" r="5" fill="#02c39a" stroke="#ffffff" strokeWidth="1.5" />
              <text x="390" y="70" fill="#7dd3fc" fontSize="9" fontWeight="bold">P2 (90°)</text>

              <circle cx="365" cy="310" r="5" fill="#02c39a" stroke="#ffffff" strokeWidth="1.5" />
              <text x="375" y="325" fill="#7dd3fc" fontSize="9" fontWeight="bold">P3 (90°)</text>

              <circle cx="175" cy="300" r="5" fill="#02c39a" stroke="#ffffff" strokeWidth="1.5" />
              <text x="150" y="315" fill="#7dd3fc" fontSize="9" fontWeight="bold">P4 (90°)</text>

              {/* Center Label */}
              <text
                x="240"
                y="95"
                fill="#ffffff"
                fontSize="12"
                fontWeight="900"
                fontFamily="sans-serif"
              >
                Survey {currentProperty.surveyNo}
              </text>
              <text
                x="242"
                y="275"
                fill="#99f6e4"
                fontSize="11"
                fontWeight="bold"
                fontFamily="monospace"
              >
                {currentProperty.gisAreaHa > 0.1
                  ? `${currentProperty.gisAreaHa} ha`
                  : `${currentProperty.gisAreaSqm} m²`}
              </text>
            </svg>

            {/* Bottom Scale & Coordinate Overlay */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-[11px] text-slate-400 z-20">
              <div className="bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 backdrop-blur-sm flex items-center gap-3 font-mono">
                <span>EPSG:32643 (UTM 43N)</span>
                <span>•</span>
                <span>GSD: 4.8 cm/pixel</span>
              </div>

              <div className="bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 backdrop-blur-sm font-mono text-slate-300">
                Perimeter: {currentProperty.gisPerimeterM}m
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT 45%: Verification, Comparison & Evidence Panel */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          {/* Header Card: Verification Status & Discrepancy Reason */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Automated Verification Status
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.bg}`}
              >
                <StatusIcon size={14} />
                {statusInfo.label}
              </span>
            </div>

            <h4 className="text-base font-bold text-slate-900 leading-snug">
              {currentProperty.statusHeadline}
            </h4>

            <p className="text-xs text-slate-600 mt-2 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              {currentProperty.statusReason}
            </p>
          </div>

          {/* Navigation Tabs for Right Panel */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("verification")}
              className={`flex-1 py-2 rounded-lg transition-all ${
                activeTab === "verification"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Comparison
            </button>
            <button
              onClick={() => setActiveTab("document")}
              className={`flex-1 py-2 rounded-lg transition-all ${
                activeTab === "document"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Document OCR
            </button>
            <button
              onClick={() => setActiveTab("evidence")}
              className={`flex-1 py-2 rounded-lg transition-all ${
                activeTab === "evidence"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Evidence
            </button>
            <button
              onClick={() => setActiveTab("audit")}
              className={`flex-1 py-2 rounded-lg transition-all ${
                activeTab === "audit"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Audit Trail
            </button>
          </div>

          {/* TAB 1: Document ↔ Parcel Comparison Table */}
          {activeTab === "verification" && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Document ↔ Parcel Comparison Table
                </h4>
                <span className="text-[11px] text-slate-400 font-mono">5 Criteria</span>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {/* 1. Survey Number */}
                <div className="py-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-700">Survey / Khasra Number</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {currentProperty.comparison.surveyNumber.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                    <div>Doc: <strong className="font-mono">{currentProperty.comparison.surveyNumber.docValue}</strong></div>
                    <div>GIS: <strong className="font-mono">{currentProperty.comparison.surveyNumber.gisValue}</strong></div>
                  </div>
                </div>

                {/* 2. Area */}
                <div className="py-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-700">Land / Plinth Area</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        currentProperty.comparison.area.status === "MATCH"
                          ? "bg-emerald-100 text-emerald-800"
                          : currentProperty.comparison.area.status === "SMALL_VARIANCE"
                          ? "bg-teal-100 text-teal-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {currentProperty.comparison.area.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                    <div>Doc: <strong>{currentProperty.comparison.area.docAreaHa > 0.1 ? `${currentProperty.comparison.area.docAreaHa} ha` : `${currentProperty.documentAreaSqm} m²`}</strong></div>
                    <div>GIS: <strong>{currentProperty.comparison.area.gisAreaHa > 0.1 ? `${currentProperty.comparison.area.gisAreaHa} ha` : `${currentProperty.gisAreaSqm} m²`}</strong> ({currentProperty.comparison.area.variancePercent > 0 ? `+${currentProperty.comparison.area.variancePercent}` : currentProperty.comparison.area.variancePercent}%)</div>
                  </div>
                </div>

                {/* 3. Location */}
                <div className="py-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-700">Location Coordinates</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {currentProperty.comparison.location.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 truncate">
                    <span>{currentProperty.comparison.location.docLocation}</span>
                  </div>
                </div>

                {/* 4. Boundary Alignment */}
                <div className="py-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-700">Boundary & Plinth Geometry</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        currentProperty.comparison.boundary.status === "MATCH"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-teal-100 text-teal-800"
                      }`}
                    >
                      {currentProperty.comparison.boundary.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    {currentProperty.comparison.boundary.note}
                  </div>
                </div>

                {/* 5. Ownership */}
                <div className="py-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-700">Ownership Record Status</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                      {currentProperty.comparison.ownership.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    <div>Applicant: <strong>{currentProperty.comparison.ownership.docName}</strong></div>
                    <div className="text-amber-700 mt-0.5">{currentProperty.comparison.ownership.note}</div>
                  </div>
                </div>
              </div>

              {/* Security & Ownership Disclaimer */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-900 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldAlert size={15} className="text-amber-700 shrink-0" />
                  <span>Document possession ≠ verified ownership.</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  AeroSync verifies consistency between document tokens, parcel geometry, location, and survey identifiers. Final ownership title requires certified index-II records from the Sub-Registrar / Tehsildar.
                </p>
              </div>

              {/* Report Issue Button */}
              <button
                onClick={() => setShowReportModal(true)}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Flag size={14} className="text-rose-600" />
                Report Suspicious / Mismatched Document
              </button>
            </div>
          )}

          {/* TAB 2: Document Inspection */}
          {activeTab === "document" && (
            <div className="h-[440px]">
              <DocumentInspector property={currentProperty} />
            </div>
          )}

          {/* TAB 3: Evidence Package */}
          {activeTab === "evidence" && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3 text-xs">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Inspectable Evidence Package
              </h4>

              <div className="space-y-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-800 mb-1">1. Drone & Sensor Metadata</div>
                  <div className="font-mono text-[11px] text-slate-600 space-y-0.5">
                    <div>Flight Date: {currentProperty.evidence.sensorMetadata.flightDate}</div>
                    <div>Sensor: {currentProperty.evidence.sensorMetadata.sensor}</div>
                    <div>GSD: {currentProperty.evidence.sensorMetadata.gsdCmPerPx} cm/pixel</div>
                    <div>CRS: {currentProperty.evidence.sensorMetadata.crs}</div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-800 mb-1">2. Boundary Nodes (WGS84 GPS)</div>
                  <div className="font-mono text-[11px] text-slate-600 grid grid-cols-2 gap-1">
                    {currentProperty.boundaryNodes.map((n) => (
                      <div key={n.id}>
                        {n.id}: {n.lat.toFixed(4)}°N, {n.lng.toFixed(4)}°E
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-800 mb-1">3. Mathematical Area Integral</div>
                  <p className="text-[11px] text-slate-600 font-mono">
                    {currentProperty.evidence.calculationFormula}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Audit Trail */}
          {activeTab === "audit" && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3 text-xs">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Section 65B Admissible Audit Trail
              </h4>

              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {currentProperty.auditTrail.map((ev, idx) => (
                  <div key={idx} className="relative">
                    <div
                      className={`absolute -left-[21px] top-0.5 w-3 h-3 rounded-full border-2 bg-white ${
                        ev.status === "FLAGGED"
                          ? "border-rose-500"
                          : ev.status === "WARNING"
                          ? "border-amber-500"
                          : "border-teal-500"
                      }`}
                    />
                    <div className="font-mono text-[10px] text-slate-400">{ev.timestamp}</div>
                    <div className="font-bold text-slate-800 text-xs">{ev.event}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{ev.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Optional Pipeline Flow */}
      {showPipeline && (
        <div className="pt-2">
          <AIPipelineFlow currentStage={8} />
        </div>
      )}

      {/* Discrepancy / Report Modal */}
      {showReportModal && (
        <ReportIssueModal
          property={currentProperty}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}
