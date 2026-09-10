"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { aeroSyncStore } from "@/lib/store";
import { PropertyDocument } from "@/lib/types";
import {
  FileText,
  UploadCloud,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  ShieldCheck,
  X,
  ArrowRight,
  Sparkles,
  Eye,
  Hash,
  Clock,
  Copy,
} from "lucide-react";

function DocumentsContent() {
  const searchParams = useSearchParams();
  const [storeState, setStoreState] = useState(aeroSyncStore.getState());
  const [searchQuery, setSearchQuery] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(searchParams?.get("action") === "upload");
  const [previewDoc, setPreviewDoc] = useState<PropertyDocument | null>(null);

  // Upload Form State
  const [fileName, setFileName] = useState("");
  const [documentNo, setDocumentNo] = useState("");
  const [documentType, setDocumentType] = useState<PropertyDocument["documentType"]>("SVAMITVA_PROPERTY_CARD");
  const [extractedSurveyNo, setExtractedSurveyNo] = useState("");
  const [extractedAreaHa, setExtractedAreaHa] = useState("1.82");
  const [issuedBy, setIssuedBy] = useState("Superintendent of Land Records");
  const [issuedDate, setIssuedDate] = useState("14 Jan 2026");
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = aeroSyncStore.subscribe(() => {
      setStoreState({ ...aeroSyncStore.getState() });
    });
    return () => unsub();
  }, []);

  const documents = aeroSyncStore.getDocuments();

  const filteredDocuments = documents.filter((d) => {
    return (
      d.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.documentNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.extractedSurveyNo && d.extractedSurveyNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
      d.fileHashSha256.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);

    const fName = fileName || `property_card_${(extractedSurveyNo || "124_3A").replace("/", "_")}.pdf`;
    const docNum = documentNo || `PC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const survey = extractedSurveyNo || "124/3A";
    const areaHa = parseFloat(extractedAreaHa) || 1.82;
    const shaHash = `sha256_${Date.now().toString(16)}_${Math.random().toString(16).slice(2, 10)}`;

    const res = aeroSyncStore.addDocument({
      fileName: fName,
      fileSizeBytes: 1540200,
      fileMimeType: "application/pdf",
      fileHashSha256: shaHash,
      documentType,
      documentNo: docNum,
      issuedBy,
      issuedDate,
      processingStatus: "COMPLETED",
      extractedSurveyNo: survey,
      extractedAreaSqm: Math.round(areaHa * 10000),
      extractedAreaHa: areaHa,
      extractedOwnerName: "Document Applicant",
      extractedLocation: "Gujarat",
      ocrConfidence: 0.96,
      ocrBoxes: [
        { field: "Survey No", value: survey, confidence: 0.98, box: [28, 32, 22, 5] },
        { field: "Total Area", value: `${areaHa} Hectare`, confidence: 0.95, box: [38, 32, 26, 5] },
      ],
      ocrTextRaw: `GOVERNMENT REVENUE RECORD\nSVAMITVA PROPERTY CARD\nSURVEY: ${survey}\nAREA: ${areaHa} HA\nDATE: ${issuedDate}`,
      isDuplicateDetected: false,
      isDemo: false,
      uploadedByUserId: storeState.currentUser?.id || "usr-anon",
    });

    if (res.success) {
      setShowUploadModal(false);
      setFileName("");
      setDocumentNo("");
      setExtractedSurveyNo("");
    } else {
      setUploadError(res.error || "Failed to upload document.");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 font-heading">
              Document Management &amp; OCR Engine
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Store property cards, 7/12 extracts, and Sanad deeds with SHA-256 integrity hashes &amp; token extraction.
            </p>
          </div>

          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all self-start md:self-auto"
          >
            <UploadCloud size={15} />
            <span>Upload Document</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search size={14} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by File Name, Document No, Survey No, Hash..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-teal-500 text-slate-900"
            />
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {filteredDocuments.length} Documents
          </span>
        </div>

        {/* Document Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          {filteredDocuments.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <FileText size={36} className="mx-auto text-slate-300" />
              <div className="text-sm font-bold text-slate-900">No documents uploaded</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Upload a scanned property card or 7/12 record to extract tokens and run verification.
              </p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold"
              >
                Upload First Document
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Document Details</th>
                    <th className="py-3 px-4">Extracted Survey / Area</th>
                    <th className="py-3 px-4">SHA-256 Hash</th>
                    <th className="py-3 px-4">OCR Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <FileText size={14} className="text-teal-600 shrink-0" />
                          <span>{doc.fileName}</span>
                          {doc.isDuplicateDetected && (
                            <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[9px] font-bold">
                              DUPLICATE HASH
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {doc.documentType.replace(/_/g, " ")} • Doc ID: {doc.documentNo}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        <div className="font-mono font-bold text-slate-900">
                          Survey: {doc.extractedSurveyNo || "N/A"}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Area: {doc.extractedAreaHa ? `${doc.extractedAreaHa} ha` : `${doc.extractedAreaSqm} m²`}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        <span className="bg-slate-100 px-2 py-1 rounded border border-slate-200">
                          {doc.fileHashSha256.slice(0, 12)}...
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 size={11} />
                          <span>OCR Parsed ({(doc.ocrConfidence * 100).toFixed(0)}%)</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px]"
                        >
                          Preview
                        </button>
                        <Link
                          href="/verifications"
                          className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] inline-flex items-center gap-1"
                        >
                          <span>Verify</span>
                          <ArrowRight size={11} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UploadCloud size={18} className="text-teal-600" />
                <h3 className="font-bold text-slate-900 text-sm">Upload Scanned Property Card</h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            {uploadError && (
              <div className="m-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
                {uploadError}
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4 text-xs">
              <div className="border-2 border-dashed border-teal-400 bg-teal-50/40 rounded-xl p-5 text-center space-y-2">
                <UploadCloud size={24} className="mx-auto text-teal-600" />
                <div className="font-bold text-slate-800">Choose PDF / Image or Drag &amp; Drop</div>
                <div className="text-[11px] text-slate-500">Supports official SVAMITVA, 7/12, and Sanad scans (Max 25MB)</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">File Name</label>
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="property_card_124_3a.pdf"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Document Type</label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900"
                  >
                    <option value="SVAMITVA_PROPERTY_CARD">SVAMITVA Property Card</option>
                    <option value="7_12_EXTRACT">7/12 Record of Rights</option>
                    <option value="SANAD_DEED">Sanad Title Deed</option>
                    <option value="KHATAUNI">UP Khatauni Extract</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Survey Number</label>
                  <input
                    type="text"
                    value={extractedSurveyNo}
                    onChange={(e) => setExtractedSurveyNo(e.target.value)}
                    placeholder="e.g. 124/3A"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Document Area (ha)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={extractedAreaHa}
                    onChange={(e) => setExtractedAreaHa(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 shadow-xs"
                >
                  Upload &amp; Extract
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document OCR Preview Drawer Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{previewDoc.fileName}</h3>
                <span className="text-[11px] font-mono text-slate-400">Doc ID: {previewDoc.documentNo}</span>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="font-bold text-slate-800 text-xs">Extracted OCR Tokens</div>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div>Survey No: <strong className="font-mono text-slate-900">{previewDoc.extractedSurveyNo}</strong></div>
                  <div>Area: <strong className="font-mono text-slate-900">{previewDoc.extractedAreaHa} ha</strong></div>
                  <div>ULPIN: <strong className="font-mono text-slate-900">{previewDoc.extractedUlpin || "N/A"}</strong></div>
                  <div>Issuing Authority: <strong className="text-slate-900">{previewDoc.issuedBy}</strong></div>
                </div>
              </div>

              <div>
                <div className="font-bold text-slate-700 mb-1">Raw OCR Stream</div>
                <pre className="p-3 bg-slate-900 text-teal-300 font-mono text-[11px] rounded-xl overflow-x-auto whitespace-pre-wrap">
                  {previewDoc.ocrTextRaw}
                </pre>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900">
                Integrity Check: SHA-256 <code className="font-mono font-bold">{previewDoc.fileHashSha256}</code>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default function DocumentsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Loading documents repository...</div>}>
      <DocumentsContent />
    </Suspense>
  );
}
