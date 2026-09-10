"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DocumentInspector from "@/components/DocumentInspector";
import ReportIssueModal from "@/components/ReportIssueModal";
import AIPipelineFlow from "@/components/AIPipelineFlow";
import {
  CADASTRAL_REGISTRY,
  getPropertyById,
  VerificationStatus,
} from "@/data/cadastral-registry";
import {
  MapPin,
  FileText,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  QrCode,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Layers,
  Scale,
  Sun,
  Coins,
  History,
  Flag,
  Stamp,
  ExternalLink,
  ChevronRight,
  Info,
  Check,
  Building,
  HardDrive,
  Cpu,
  Download,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function PropertyDetailPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "AS-GJ-124-3A";
  const property = getPropertyById(id) || CADASTRAL_REGISTRY[0];

  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [mapLayer, setMapLayer] = useState<"cadastral" | "satellite" | "hybrid">("hybrid");
  const [activeTab, setActiveTab] = useState<"dossier" | "review" | "document" | "pipeline">("dossier");

  const isMatched = property.verificationStatus === "VERIFIED";
  const isPartial = property.verificationStatus === "PARTIALLY_VERIFIED";
  const isReview = property.verificationStatus === "REQUIRES_REVIEW";
  const isMismatch = property.verificationStatus === "MISMATCH_DETECTED";

  const areaDiffHa = property.documentAreaHa - property.gisAreaHa;
  const areaDiffPct = ((areaDiffHa / (property.documentAreaHa || 1)) * 100).toFixed(2);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Breadcrumbs & Quick Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <Link href="/" className="hover:text-slate-900 transition-colors">Workspace</Link>
            <ChevronRight size={12} />
            <Link href="/properties" className="hover:text-slate-900 transition-colors">Property Repository</Link>
            <ChevronRight size={12} />
            <span className="font-mono font-bold text-slate-900">{property.id}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-[11px] font-semibold">
              <Info size={13} className="text-amber-700 shrink-0" />
              <span>Sample Record · Not an official government land record</span>
            </div>

            <Link
              href="/verify"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold transition-all shadow-xs"
            >
              <ArrowLeft size={14} />
              <span>All Records</span>
            </Link>
          </div>
        </div>

        {/* SECTION 1: Master Record Header (Kombai Field Dossier Banner) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-teal-600" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {property.ulpin}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-semibold text-slate-500">
                  Khasra: <strong className="text-slate-800 font-mono">{property.khasraNo}</strong>
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-semibold text-slate-500">
                  Cadastral Source: <strong className="text-slate-800">{property.evidence?.sensorMetadata?.sensor || "High-Res Drone Survey"}</strong>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading tracking-tight">
                Survey Parcel No. {property.surveyNo}
              </h1>

              <div className="text-xs text-slate-600 flex items-center gap-1.5 pt-0.5">
                <MapPin size={14} className="text-teal-600 shrink-0" />
                <span>
                  Village {property.village}, Taluka {property.taluka}, District {property.district}, {property.state} — {property.pincode}
                </span>
              </div>
            </div>

            {/* Verification Status Pill & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div
                className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
                  isMatched
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : isPartial
                    ? "bg-teal-50 border-teal-200 text-teal-900"
                    : isReview
                    ? "bg-amber-50 border-amber-200 text-amber-900"
                    : "bg-rose-50 border-rose-200 text-rose-900"
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full ${
                    isMatched
                      ? "bg-emerald-500"
                      : isPartial
                      ? "bg-teal-500"
                      : isReview
                      ? "bg-amber-500"
                      : "bg-rose-500"
                  }`}
                />
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider opacity-70">
                    Verification Verdict
                  </div>
                  <div className="text-sm font-black font-heading">
                    {property.verificationStatus.replace(/_/g, " ")}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/verify/${(property as any).verificationReportId || "ASV-2026-000182"}`}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5"
                >
                  <Stamp size={14} className="text-teal-400" />
                  <span>Section 65B Certificate</span>
                </Link>
                <button
                  onClick={() => setShowReportModal(true)}
                  className="p-2.5 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-600 transition-all"
                  title="Report Dispute or Variance"
                >
                  <Flag size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-t border-slate-100 mt-6 pt-3 text-xs font-bold">
            {[
              { id: "dossier", label: "Field Dossier & Comparative Matrix", icon: Layers },
              { id: "document", label: "Property Card & OCR Tokens", icon: FileText },
              { id: "pipeline", label: "5-Stage Verification Pipeline", icon: ShieldCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
                    active
                      ? "bg-teal-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab 1: Field Dossier (Kombai 01 Layout) */}
        {activeTab === "dossier" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: GIS Map Panel & Technical Vector Details (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Dark GIS Map Canvas */}
              <div className="bg-[#0b1329] rounded-2xl border border-slate-800 overflow-hidden shadow-md text-white">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-200">
                    <Layers size={14} className="text-teal-400" />
                    <span>GIS Cadastral Vector Map (EPSG:32643)</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[10px] text-teal-400 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                    <span>{property.centroid[1].toFixed(4)}°N, {property.centroid[0].toFixed(4)}°E</span>
                  </div>
                </div>

                {/* SVG Vector Canvas */}
                <div className="relative h-80 bg-[#0b1329] flex items-center justify-center p-6">
                  {/* Grid Background */}
                  <div
                    className="absolute inset-0 opacity-15"
                    style={{
                      backgroundImage: "linear-gradient(#4cc4b8 1px, transparent 1px), linear-gradient(90deg, #4cc4b8 1px, transparent 1px)",
                      backgroundSize: "32px 32px",
                    }}
                  />

                  {/* North Indicator */}
                  <div className="absolute top-4 right-4 w-7 h-7 rounded border border-slate-700 bg-slate-900/80 text-[10px] font-bold text-slate-300 flex items-center justify-center font-mono">
                    N
                  </div>

                  {/* Vector SVG Polygon */}
                  <svg viewBox="0 0 400 240" className="w-full h-full max-h-72 z-10">
                    {/* Neighboring Ghost Parcels */}
                    <polygon points="30,40 120,30 140,110 50,120" fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
                    <polygon points="260,30 360,40 370,120 270,110" fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
                    <polygon points="120,130 240,130 230,220 110,210" fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />

                    {/* Active Parcel Boundary */}
                    <polygon
                      points="120,40 260,45 250,135 110,125"
                      fill="rgba(2, 128, 144, 0.28)"
                      stroke="#028090"
                      strokeWidth="2.5"
                    />

                    {/* Corner Boundary Pillars */}
                    <circle cx="120" cy="40" r="4.5" fill="#4cc4b8" stroke="#0b1329" strokeWidth="1.5" />
                    <circle cx="260" cy="45" r="4.5" fill="#4cc4b8" stroke="#0b1329" strokeWidth="1.5" />
                    <circle cx="250" cy="135" r="4.5" fill="#4cc4b8" stroke="#0b1329" strokeWidth="1.5" />
                    <circle cx="110" cy="125" r="4.5" fill="#4cc4b8" stroke="#0b1329" strokeWidth="1.5" />

                    {/* Parcel Label */}
                    <text x="185" y="85" fill="#ffffff" fontSize="13" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                      Survey {property.surveyNo}
                    </text>
                    <text x="185" y="102" fill="#99f6e4" fontSize="10" textAnchor="middle" fontFamily="monospace">
                      {property.gisAreaHa} ha ({property.gisAreaSqm.toLocaleString()} m²)
                    </text>
                  </svg>

                  {/* Bottom Map Legend */}
                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>Perimeter: {property.gisPerimeterM}m (4 Survey Pillars)</span>
                    <span>WGS 84 / UTM Zone 43N</span>
                  </div>
                </div>

                {/* Map Metrics Bar */}
                <div className="p-4 bg-slate-900 border-t border-slate-800 grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">GIS Shoelace Area</div>
                    <div className="font-mono font-bold text-teal-300 mt-0.5">
                      {property.gisAreaHa} Hectare
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Boundary Perimeter</div>
                    <div className="font-mono font-bold text-slate-200 mt-0.5">
                      {property.gisPerimeterM} Meters
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Centroid Coordinates</div>
                    <div className="font-mono font-bold text-slate-200 mt-0.5">
                      {property.centroid[1].toFixed(4)}°N, {property.centroid[0].toFixed(4)}°E
                    </div>
                  </div>
                </div>
              </div>

              {/* Drone ML Segmentation Patch (Kombai Linked Image Sample) */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm font-heading">
                      High-Resolution Drone Orthomosaic Inference
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      PyTorch Attention ResUNet sub-pixel plinth &amp; boundary segmentation
                    </p>
                  </div>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    Patch #106 • {property.roofType}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold uppercase text-slate-400">Original Drone Tile (5cm GSD)</div>
                    <div className="h-44 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                      <img
                        src="/inference/patch_106_orig.png"
                        alt="Drone Original"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as any).src = "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&fit=crop&q=80";
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold uppercase text-slate-400">ResUNet Cadastral Segmentation Mask</div>
                    <div className="h-44 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                      <img
                        src="/inference/patch_106_cadastral_overlay.png"
                        alt="Cadastral Overlay"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as any).src = "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&fit=crop&q=80";
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between text-slate-600">
                  <span>Plinth Type: <strong className="text-slate-900">{property.roofType}</strong></span>
                  <span>Model IoU Overlap: <strong className="text-teal-700 font-mono">96.2%</strong></span>
                  <span>Resolution: <strong className="text-slate-900 font-mono">0.05 m / px</strong></span>
                </div>
              </div>
            </div>

            {/* Right: Comparative Inspection Matrix & Evidence (5 Cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Comparative Matrix Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm font-heading">
                    Document ↔ GIS Comparative Matrix
                  </h3>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Statutory ±3.0% Tolerance
                  </span>
                </div>

                {/* Criterion 1: Survey Number */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">1. Survey / Khasra Identifier</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      MATCH
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block font-sans">Doc Value</span>
                      <span className="font-bold text-slate-900">{property.comparison?.surveyNumber?.docValue || property.surveyNo}</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block font-sans">GIS Value</span>
                      <span className="font-bold text-slate-900">{property.surveyNo}</span>
                    </div>
                  </div>
                </div>

                {/* Criterion 2: Total Area */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">2. Total Area Calculation</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        Math.abs(parseFloat(areaDiffPct)) <= 3.0
                          ? "bg-teal-50 text-teal-800 border-teal-200"
                          : "bg-rose-50 text-rose-800 border-rose-200"
                      }`}
                    >
                      {areaDiffPct}% VARIANCE
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block font-sans">Doc Extracted</span>
                      <span className="font-bold text-slate-900">{property.documentAreaHa} ha</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block font-sans">GIS Shoelace</span>
                      <span className="font-bold text-slate-900">{property.gisAreaHa} ha</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal pt-1">
                    Difference of {Math.abs(areaDiffHa * 10000).toFixed(0)} m² is within permissible statutory surveying tolerance margins (±3.0%).
                  </p>
                </div>

                {/* Criterion 3: Location */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">3. Administrative Revenue Location</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      MATCH
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200">
                    {property.village}, {property.taluka}, {property.district}, {property.state}
                  </div>
                </div>

                {/* Criterion 4: Ownership Title Legal Status */}
                <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900">4. Legal Ownership Title</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      REQUIRES DEED
                    </span>
                  </div>
                  <div className="text-[11px] text-amber-900">
                    Document Applicant: <strong>{property.ownerName}</strong>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-normal pt-1">
                    Document possession does not automatically confirm unencumbered legal ownership without authoritative Title Deed registration at the Sub-Registrar Office.
                  </p>
                </div>
              </div>

              {/* Statutory Legal Boundary Notice */}
              <div className="p-5 bg-slate-900 rounded-2xl text-white space-y-3 text-xs">
                <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
                  <Scale size={16} />
                  <span>Section 65B Electronic Evidence</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Every mathematical step is recorded in an immutable audit trail. This electronic dossier is certified under Section 65B of the Indian Evidence Act, 1872 with certificate hash <code className="font-mono text-teal-300">SHA-256: 9f8a2c1b...</code>
                </p>
                <div className="pt-1">
                  <Link
                    href={`/verify/${(property as any).verificationReportId || "ASV-2026-000182"}`}
                    className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1.5"
                  >
                    <span>View &amp; Print Section 65B Certificate</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Document & OCR Inspector */}
        {activeTab === "document" && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <DocumentInspector property={property} />
          </div>
        )}

        {/* Tab 3: 5-Stage Verification Pipeline */}
        {activeTab === "pipeline" && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-heading">
                5-Stage Verification &amp; Evidence Pipeline
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Traceable step-by-step execution for Survey Parcel No {property.surveyNo}.
              </p>
            </div>
            <AIPipelineFlow currentStage={8} />
          </div>
        )}
      </main>

      {/* Report Issue Modal */}
      {showReportModal && (
        <ReportIssueModal
          property={property}
          onClose={() => setShowReportModal(false)}
        />
      )}

      <Footer />
    </div>
  );
}
