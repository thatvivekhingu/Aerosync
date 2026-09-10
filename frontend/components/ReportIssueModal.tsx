"use client";

import React, { useState } from "react";
import { CadastralProperty } from "@/data/cadastral-registry";
import {
  X,
  AlertTriangle,
  Flag,
  CheckCircle2,
  FileWarning,
  Send,
  ShieldAlert,
} from "lucide-react";

interface ReportIssueModalProps {
  property: CadastralProperty;
  onClose: () => void;
}

export default function ReportIssueModal({ property, onClose }: ReportIssueModalProps) {
  const [issueType, setIssueType] = useState<string>("BOUNDARY_MISMATCH");
  const [notes, setNotes] = useState<string>("");
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-rose-50/80 border-b border-rose-100">
          <div className="flex items-center gap-2 text-rose-800">
            <ShieldAlert size={20} className="text-rose-600" />
            <h3 className="font-bold text-slate-900">
              Report Suspicious / Mismatched Document
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        {submitted ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={28} />
            </div>
            <h4 className="text-lg font-bold text-slate-900">
              Discrepancy Report Logged
            </h4>
            <p className="text-xs text-slate-600 mt-2 max-w-sm mx-auto">
              Your flag for <strong>Survey No {property.surveyNo}</strong> (Doc ID: {property.documentNo}) has been submitted to the Tehsil Field Verification Queue. Reference ID: <code className="font-mono font-bold text-slate-800">DISP-2026-{Math.floor(1000 + Math.random() * 9000)}</code>.
            </p>
            <button
              onClick={onClose}
              className="mt-6 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold"
            >
              Close Window
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <div className="font-semibold text-slate-700">Property Details:</div>
              <div className="text-slate-500 mt-1 flex flex-wrap gap-x-4 gap-y-1 font-mono">
                <span>Survey: <strong>{property.surveyNo}</strong></span>
                <span>ULPIN: <strong>{property.ulpin}</strong></span>
                <span>Village: <strong>{property.village}</strong></span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Select Discrepancy / Issue Type:
              </label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full text-xs rounded-xl border-slate-300 bg-white p-2.5 focus:border-rose-500 focus:ring-rose-500"
              >
                <option value="BOUNDARY_MISMATCH">Ground boundary does not match GIS plinth / wall</option>
                <option value="WRONG_PARCEL">Document belongs to a different Survey / Khasra number</option>
                <option value="DUPLICATE_DOC">Duplicate property card or conflicting claim exists</option>
                <option value="INCORRECT_OWNER">Applicant / Owner name is inaccurate or disputed</option>
                <option value="SUSPICIOUS_FORGERY">Suspicious document / forged seal or metadata</option>
                <option value="AREA_DISCREPANCY">Severe area inflation or reduction beyond permissible limit</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Specific Evidence / Description:
              </label>
              <textarea
                required
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe why you believe this document is mismatched or suspicious (e.g. physical survey pillar position, mutation record date, road encroachment)..."
                className="w-full text-xs rounded-xl border-slate-300 p-3 focus:border-rose-500 focus:ring-rose-500 text-slate-800 placeholder-slate-400"
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-[11px] text-amber-800 flex items-start gap-2">
              <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <span>
                All flagged reports are timestamped and logged under the Section 65B Audit Trail for revenue officer review.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm shadow-rose-200"
              >
                <Send size={13} />
                Submit Discrepancy Flag
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
