"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import { aeroSyncStore } from "@/lib/store";
import { VerificationEngine } from "@/lib/services/verification-engine";
import { ReportGenerator } from "@/lib/services/report-generator";
import { VerificationJob } from "@/lib/types";
import {
  ShieldCheck,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ArrowRight,
  Scale,
  Sparkles,
  Info,
  X,
  FileSpreadsheet,
  Layers,
} from "lucide-react";

export default function VerificationsPage() {
  const [storeState, setStoreState] = useState(aeroSyncStore.getState());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedWhyJob, setSelectedWhyJob] = useState<VerificationJob | null>(null);
  const [showRunModal, setShowRunModal] = useState(false);

  // Run new verification form state
  const [selectedPropId, setSelectedPropId] = useState("");
  const [selectedDocId, setSelectedDocId] = useState("");
  const [runError, setRunError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = aeroSyncStore.subscribe(() => {
      setStoreState({ ...aeroSyncStore.getState() });
    });
    return () => unsub();
  }, []);

  const verifications = aeroSyncStore.getVerifications();
  const properties = aeroSyncStore.getProperties();
  const documents = aeroSyncStore.getDocuments();

  const filteredVerifications = verifications.filter((v) => {
    const prop = properties.find((p) => p.id === v.propertyId);
    const matchesSearch =
      v.verificationId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prop && prop.surveyNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
      v.propertyId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || v.verificationResult === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleRunVerification = (e: React.FormEvent) => {
    e.preventDefault();
    setRunError(null);

    const prop = properties.find((p) => p.id === selectedPropId) || properties[0];
    const doc = documents.find((d) => d.id === selectedDocId) || documents[0];

    if (!prop || !doc) {
      setRunError("Please select both a property and a document.");
      return;
    }

    const evalResult = VerificationEngine.evaluate(prop, doc);
    const storeRes = aeroSyncStore.addVerification(evalResult.job);

    if (storeRes.success && storeRes.job) {
      const repData = ReportGenerator.generateReport(storeRes.job, prop, doc);
      aeroSyncStore.addReport(repData);
      setShowRunModal(false);
    } else {
      setRunError(storeRes.error || "Failed to execute verification.");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 font-heading">
              Verification Engine &amp; Evidence Log
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Cross-reconcile document tokens against mapped GIS parcels with explainable reasoning &amp; statutory tolerance math.
            </p>
          </div>

          <button
            onClick={() => {
              if (properties.length > 0) setSelectedPropId(properties[0].id);
              if (documents.length > 0) setSelectedDocId(documents[0].id);
              setShowRunModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all self-start md:self-auto"
          >
            <Plus size={14} />
            <span>Run New Verification</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search size={14} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Verification ID (ASV-...), Survey No..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-teal-500 text-slate-900"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
              <Filter size={12} /> Status:
            </span>
            {["ALL", "VERIFIED", "PARTIALLY_VERIFIED", "REQUIRES_REVIEW", "MISMATCH_DETECTED"].map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    statusFilter === status
                      ? "bg-slate-900 text-white"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {status === "ALL" ? "All" : status.replace("_", " ")}
                </button>
              )
            )}
          </div>
        </div>

        {/* Verification Cards / Table */}
        <div className="space-y-4">
          {filteredVerifications.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center space-y-3">
              <ShieldCheck size={36} className="mx-auto text-slate-300" />
              <div className="text-sm font-bold text-slate-900">No verifications found</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Run a verification job between any mapped land parcel and uploaded document.
              </p>
            </div>
          ) : (
            filteredVerifications.map((job) => {
              const prop = properties.find((p) => p.id === job.propertyId);
              return (
                <div
                  key={job.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-teal-500/40 transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs bg-slate-100 px-2 py-1 rounded text-slate-800 border border-slate-200">
                        {job.verificationId}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-bold text-slate-900">
                        Survey No: {prop?.surveyNo || job.propertyId}
                      </span>
                      <span className="text-xs text-slate-500">
                        ({prop?.village || "Gujarat"})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                          job.verificationResult === "VERIFIED"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : job.verificationResult === "PARTIALLY_VERIFIED"
                            ? "bg-teal-50 text-teal-800 border-teal-200"
                            : "bg-rose-50 text-rose-800 border-rose-200"
                        }`}
                      >
                        {job.verificationResult.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-xs">
                    <div className="lg:col-span-8 space-y-1.5">
                      <h4 className="font-bold text-slate-900 text-sm">{job.headline}</h4>
                      <p className="text-slate-600 leading-relaxed">{job.summaryReason}</p>
                      <div className="pt-1 text-[11px] text-teal-800 bg-teal-50/70 p-2.5 rounded-xl border border-teal-100">
                        <strong>Recommendation:</strong> {job.recommendation}
                      </div>
                    </div>

                    {/* Criteria Snippets */}
                    <div className="lg:col-span-4 bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Survey No:</span>
                        <strong className="text-slate-900">{job.comparison.surveyNumber.docValue}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Area Variance:</span>
                        <strong className="font-mono text-slate-900">
                          {job.areaVariancePercent > 0 ? `+${job.areaVariancePercent}` : job.areaVariancePercent}%
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Boundary Overlap:</span>
                        <strong className="font-mono text-slate-900">
                          {job.boundaryOverlapPercent?.toFixed(1)}% IoU
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Ownership Title:</span>
                        <span className="text-amber-700 font-bold">Unverified</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
                    <div className="text-[11px] text-slate-400 font-mono">
                      Timestamp: {job.completedAt || job.createdAt}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedWhyJob(job)}
                        className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl font-bold flex items-center gap-1.5"
                      >
                        <HelpCircle size={13} />
                        <span>Why this result?</span>
                      </button>

                      <Link
                        href={`/property/${job.propertyId}`}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold flex items-center gap-1"
                      >
                        <span>View Dossier</span>
                        <ArrowRight size={12} />
                      </Link>

                      <Link
                        href={`/verify/${job.verificationId}`}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center gap-1"
                      >
                        <span>Section 65B Certificate</span>
                        <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* "Why This Result?" Modal */}
      {selectedWhyJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <HelpCircle size={18} className="text-teal-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Why Did AeroSync Reach This Conclusion?
                </h3>
              </div>
              <button
                onClick={() => setSelectedWhyJob(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-200"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-900">
                <div className="font-bold mb-1">Status: {selectedWhyJob.verificationResult.replace("_", " ")}</div>
                <p className="text-[11px] leading-relaxed">{selectedWhyJob.summaryReason}</p>
              </div>

              <div className="divide-y divide-slate-100">
                <div className="py-2.5">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>1. Survey Number Match</span>
                    <span className="text-emerald-700">✓ {selectedWhyJob.comparison.surveyNumber.status}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{selectedWhyJob.comparison.surveyNumber.explanation}</p>
                </div>

                <div className="py-2.5">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>2. Mathematical Area Tolerance</span>
                    <span className={selectedWhyJob.areaVariancePercent <= 3.0 ? "text-teal-700" : "text-rose-700"}>
                      {selectedWhyJob.comparison.area.status} ({selectedWhyJob.areaVariancePercent > 0 ? `+${selectedWhyJob.areaVariancePercent}` : selectedWhyJob.areaVariancePercent}%)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{selectedWhyJob.comparison.area.explanation}</p>
                </div>

                <div className="py-2.5">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>3. Location &amp; Administrative Coincidence</span>
                    <span className="text-emerald-700">✓ MATCH</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{selectedWhyJob.comparison.location.explanation}</p>
                </div>

                <div className="py-2.5">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>4. Boundary &amp; Plinth Alignment</span>
                    <span className="text-teal-700">{selectedWhyJob.comparison.boundary.status}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{selectedWhyJob.comparison.boundary.explanation}</p>
                </div>

                <div className="py-2.5">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>5. Legal Title Ownership</span>
                    <span className="text-amber-700">? UNVERIFIED</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{selectedWhyJob.comparison.ownership.explanation}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="font-bold text-slate-800">Evidence Used:</div>
                <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-0.5">
                  {selectedWhyJob.evidenceItems.map((e) => (
                    <li key={e.id}>{e.title} — {e.description}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedWhyJob(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Close Explanation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Run Verification Modal */}
      {showRunModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-teal-600" />
                <h3 className="font-bold text-slate-900 text-sm">Execute New Verification Job</h3>
              </div>
              <button
                onClick={() => setShowRunModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            {runError && (
              <div className="m-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
                {runError}
              </div>
            )}

            <form onSubmit={handleRunVerification} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  1. Select Mapped GIS Parcel
                </label>
                <select
                  value={selectedPropId}
                  onChange={(e) => setSelectedPropId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      Survey No: {p.surveyNo} — {p.village} ({p.gisAreaHa} ha)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  2. Select Uploaded Property Document
                </label>
                <select
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900"
                >
                  {documents.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.fileName} (Extracted Survey: {d.extractedSurveyNo || "N/A"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <div className="font-bold text-slate-800">Verification Steps Executed:</div>
                <div>• OCR token extraction &amp; string normalization</div>
                <div>• Shoelace formula area comparison against surveying tolerances</div>
                <div>• Section 65B immutable audit record creation</div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRunModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 shadow-xs"
                >
                  Execute Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
