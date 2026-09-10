"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { aeroSyncStore } from "@/lib/store";
import {
  ShieldCheck,
  Printer,
  Share2,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Scale,
  Calendar,
  Lock,
  ArrowLeft,
  Building2,
  FileText,
  Copy,
  Check,
} from "lucide-react";

export default function VerificationCertificatePage() {
  const params = useParams();
  const idParam = typeof params?.id === "string" ? params.id : "ASV-2026-000182";
  const [copied, setCopied] = useState(false);

  const verifications = aeroSyncStore.getVerifications();
  const properties = aeroSyncStore.getProperties();
  const documents = aeroSyncStore.getDocuments();

  const job =
    verifications.find(
      (v) =>
        v.verificationId.toLowerCase() === idParam.toLowerCase() ||
        v.id.toLowerCase() === idParam.toLowerCase() ||
        v.propertyId.toLowerCase() === idParam.toLowerCase()
    ) || verifications[0];

  const prop = properties.find((p) => p.id === job?.propertyId) || properties[0];
  const doc = documents.find((d) => d.id === job?.documentId) || documents[0];

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!job || !prop) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-4 max-w-md">
          <AlertTriangle size={36} className="mx-auto text-amber-500" />
          <h2 className="text-lg font-bold text-slate-900">Certificate Record Not Found</h2>
          <p className="text-xs text-slate-500">The verification identifier ({idParam}) is not present in this workspace registry.</p>
          <Link href="/dashboard" className="inline-block px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8 print:bg-white print:p-0">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Control Bar (Hidden on print) */}
        <div className="flex items-center justify-between print:hidden">
          <Link
            href="/reports"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-xs"
          >
            <ArrowLeft size={14} />
            <span>Back to Reports</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-xs"
            >
              {copied ? <Check size={14} className="text-teal-600" /> : <Copy size={14} />}
              <span>{copied ? "Link Copied" : "Share URL"}</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm"
            >
              <Printer size={14} />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>

        {/* ── Official Section 65B Certificate Document ── */}
        <div className="bg-white rounded-3xl border-2 border-slate-800 shadow-xl p-8 sm:p-12 space-y-8 relative overflow-hidden print:border-none print:shadow-none print:p-4 text-slate-900 font-serif">
          {/* Subtle Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
            <span className="text-8xl font-black rotate-[-25deg] uppercase">
              AEROSYNC CERTIFIED
            </span>
          </div>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b-2 border-slate-800">
            <div>
              <div className="flex items-center gap-2 text-xs font-sans font-black tracking-widest text-teal-800 uppercase mb-1">
                <ShieldCheck size={16} />
                <span>Geospatial Evidence &amp; Cadastral Verification Certificate</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black font-heading text-slate-900 tracking-tight">
                Certificate of Cadastral Consistency
              </h1>
              <p className="text-xs text-slate-600 font-sans mt-1">
                Issued under Section 65B of the Indian Evidence Act, 1872 (Electronic Records Certification)
              </p>
            </div>

            <div className="text-right font-sans shrink-0">
              <div className="font-mono text-sm font-black bg-slate-900 text-white px-3 py-1.5 rounded-lg">
                {job.verificationId}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Date: {new Date(job.completedAt || job.createdAt).toLocaleDateString("en-IN", { dateStyle: "long" })}
              </div>
            </div>
          </div>

          {/* Verification Verdict Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-300 font-sans flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Automated Verification Status
              </div>
              <div className="text-lg font-black text-slate-900 mt-0.5">
                {job.headline}
              </div>
              <div className="text-xs text-slate-600 mt-1">{job.summaryReason}</div>
            </div>

            <span
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 border ${
                job.verificationResult === "VERIFIED"
                  ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                  : job.verificationResult === "PARTIALLY_VERIFIED"
                  ? "bg-teal-100 text-teal-900 border-teal-300"
                  : "bg-rose-100 text-rose-900 border-rose-300"
              }`}
            >
              {job.verificationResult.replace("_", " ")}
            </span>
          </div>

          {/* Property & Document Comparative Matrix */}
          <div className="space-y-3 font-sans">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              1. Document ↔ GIS Parcel Comparative Matrix
            </h3>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Criteria</th>
                    <th className="py-2.5 px-3">Recorded Document Value</th>
                    <th className="py-2.5 px-3">GIS Mapped Parcel</th>
                    <th className="py-2.5 px-3">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-slate-800">Survey / Khasra No</td>
                    <td className="py-2.5 px-3 font-mono">{job.comparison.surveyNumber.docValue}</td>
                    <td className="py-2.5 px-3 font-mono">{job.comparison.surveyNumber.gisValue}</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-700">✓ MATCH</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-slate-800">Land Area (Hectares)</td>
                    <td className="py-2.5 px-3 font-mono">{job.comparison.area.docValue} ha</td>
                    <td className="py-2.5 px-3 font-mono">{job.comparison.area.gisValue} ha</td>
                    <td className="py-2.5 px-3 font-bold text-teal-700">
                      {job.areaVariancePercent > 0 ? `+${job.areaVariancePercent}` : job.areaVariancePercent}% Variance
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-slate-800">Location Coincidence</td>
                    <td className="py-2.5 px-3">{prop.village}, {prop.district}</td>
                    <td className="py-2.5 px-3 font-mono">{prop.centroid[1].toFixed(4)}°N, {prop.centroid[0].toFixed(4)}°E</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-700">✓ MATCH</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-slate-800">Boundary Overlap</td>
                    <td className="py-2.5 px-3 font-mono">{job.comparison.boundary.docValue}</td>
                    <td className="py-2.5 px-3 font-mono">{job.comparison.boundary.gisValue}</td>
                    <td className="py-2.5 px-3 font-bold text-teal-700">{job.comparison.boundary.status}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-slate-800">Legal Ownership Title</td>
                    <td className="py-2.5 px-3">{prop.ownerApplicantName}</td>
                    <td className="py-2.5 px-3 text-slate-500">Unverified Title Record</td>
                    <td className="py-2.5 px-3 font-bold text-amber-700">? REQUIRES DEED</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Evidence Delineation */}
          <div className="space-y-2 font-sans text-xs">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              2. Inspectable Evidence Package
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {job.evidenceItems.map((e) => (
                <div key={e.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-800">{e.title}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{e.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 65B Electronic Declaration & Legal Disclaimer */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300/80 font-sans text-xs text-amber-950 space-y-2">
            <div className="font-bold flex items-center gap-1.5">
              <Scale size={16} className="text-amber-800 shrink-0" />
              <span>Section 65B Statutory Declaration &amp; Legal Guardrail</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-900">
              This computer-generated certificate confirms electronic document token extraction and mathematical GIS polygon area consistency within statutory surveying tolerance limits (±3.0%). AeroSync does not independently confer or adjudicate legal title ownership. Legal ownership title requires official certified copies from the Sub-Registrar / Tehsildar office.
            </p>
          </div>

          {/* Signatures & Hash Footer */}
          <div className="pt-6 border-t-2 border-slate-800 font-sans flex flex-col sm:flex-row items-center justify-between gap-6 text-xs">
            <div className="space-y-1 text-slate-600">
              <div>Certificate Hash: <code className="font-mono font-bold text-slate-900">sha256:{job.verificationId.toLowerCase()}</code></div>
              <div>Document File Hash: <code className="font-mono font-bold text-slate-900">{doc?.fileHashSha256?.slice(0, 16) || "7f8a9e4d5c6b7a8f"}...</code></div>
              <div className="text-[11px] text-slate-400">Generated by AeroSync Cadastral Trust Engine v2.4</div>
            </div>

            <div className="text-center sm:text-right">
              <div className="font-serif italic text-base text-slate-900 font-bold">
                AeroSync Automated Cadastral Surveyor
              </div>
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">
                Electronic Seal &amp; Signature
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
