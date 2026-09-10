"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyVerificationHub from "@/components/PropertyVerificationHub";
import {
  ShieldCheck,
  Search,
  UploadCloud,
  FileCheck,
  MapPin,
  Scale,
  ArrowRight,
  Info,
  HelpCircle,
  FileText,
} from "lucide-react";
import { CADASTRAL_REGISTRY } from "@/data/cadastral-registry";

export default function VerifyPage() {
  const [selectedPropId, setSelectedPropId] = useState<string>("AS-GJ-124-3A");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [uploadMode, setUploadMode] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const handleSimulatedUpload = (name: string) => {
    setUploadedFileName(name);
    setUploadMode(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200/80 mb-2">
              <ShieldCheck size={14} />
              <span>Official Verification Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading">
              Land Document ↔ Physical Parcel Verification
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
              Cross-verify scanned Property Cards, 7/12 extracts, and Sanad deeds against high-resolution drone orthomosaics, GIS vector boundaries, and statutory surveying margins.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setUploadMode(!uploadMode)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              <UploadCloud size={16} />
              <span>Upload New Document</span>
            </button>
          </div>
        </div>

        {/* Upload Drawer (when toggled) */}
        {uploadMode && (
          <div className="bg-white rounded-2xl p-6 border-2 border-dashed border-teal-400 shadow-sm animate-fadeIn">
            <div className="text-center max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
                <UploadCloud size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Upload Scanned Property Document
              </h3>
              <p className="text-xs text-slate-500">
                Upload PDF or High-Resolution image (SVAMITVA Property Card, Khatauni, or 7/12). The OCR engine will extract Survey No, Area, and ULPIN.
              </p>

              <div className="flex justify-center gap-2 pt-2">
                <button
                  onClick={() => handleSimulatedUpload("property_card_124_3a_scan.pdf")}
                  className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-semibold"
                >
                  Load Demo Card (Survey 124/3A)
                </button>
                <button
                  onClick={() => handleSimulatedUpload("property_card_142_1_scan.pdf")}
                  className="px-4 py-2 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-xl text-xs font-semibold border border-teal-200"
                >
                  Load Demo Card (Survey 142/1)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Uploaded Notification */}
        {uploadedFileName && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <FileCheck size={16} className="text-emerald-600" />
              <span>
                Document Processed: <strong>{uploadedFileName}</strong> (OCR parsed with 98.2% field confidence).
              </span>
            </div>
            <button
              onClick={() => setUploadedFileName(null)}
              className="text-xs font-bold text-emerald-800 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Core Verification Hub Split-View */}
        <PropertyVerificationHub
          initialPropertyId={selectedPropId}
          showPipeline={true}
        />

        {/* How It Works Explainer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h4 className="font-bold text-sm text-slate-900">
              Sub-Pixel Plinth Extraction
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Drone orthomosaics are processed with Attention ResUNet models to segment building walls and plinths with sub-5cm spatial precision.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h4 className="font-bold text-sm text-slate-900">
              Statutory Tolerance Math
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Area differences are benchmarked against the ±3.0% permissible threshold under State Revenue Survey Manuals before flagging.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h4 className="font-bold text-sm text-slate-900">
              Evidence-Backed Auditing
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every comparison is accompanied by OCR bounding boxes, sensor flight metadata, and Section 65B tamper-evident audit logs.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
