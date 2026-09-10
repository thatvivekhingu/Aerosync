"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import { aeroSyncStore } from "@/lib/store";
import {
  Building2,
  FileText,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Plus,
  UploadCloud,
  FileSpreadsheet,
  Layers,
  MapPin,
  CheckCircle2,
  ExternalLink,
  Scale,
  Sparkles,
} from "lucide-react";

export default function DashboardPage() {
  const [storeState, setStoreState] = useState(aeroSyncStore.getState());

  useEffect(() => {
    const unsub = aeroSyncStore.subscribe(() => {
      setStoreState({ ...aeroSyncStore.getState() });
    });
    return () => unsub();
  }, []);

  const properties = aeroSyncStore.getProperties();
  const documents = aeroSyncStore.getDocuments();
  const verifications = aeroSyncStore.getVerifications();
  const reports = aeroSyncStore.getReports();
  const subscription = aeroSyncStore.getSubscription();
  const usage = aeroSyncStore.getUsage();

  const requiresReviewCount = verifications.filter(
    (v) => v.verificationResult === "REQUIRES_REVIEW" || v.verificationResult === "MISMATCH_DETECTED"
  ).length;

  const isFreshWorkspace = properties.length === 0 && documents.length === 0;

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Workspace Greeting & Quick Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-bold border border-teal-200/80 mb-2">
              <ShieldCheck size={14} className="text-teal-600" />
              <span>{storeState.currentOrg?.name || "Active Workspace"}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
              Property Verification Command Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Reconcile uploaded property cards against GIS cadastral geometries and Section 65B legal evidence.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/properties?action=new"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              <Plus size={14} />
              <span>Add Property</span>
            </Link>
            <Link
              href="/documents?action=upload"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              <UploadCloud size={14} />
              <span>Upload Document</span>
            </Link>
          </div>
        </div>

        {/* Real Metrics Grid (Zero if fresh, real values otherwise) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Properties</span>
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                <Building2 size={16} />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                {properties.length}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Mapped in this workspace</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Documents</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                <FileText size={16} />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                {documents.length}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">OCR scanned &amp; hashed</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verifications</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <ShieldCheck size={16} />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                {verifications.length}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Completed audit jobs</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Requires Review</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <AlertTriangle size={16} />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                {requiresReviewCount}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Area / boundary flags</div>
            </div>
          </div>
        </div>

        {/* Fresh Workspace Zero-State Banner */}
        {isFreshWorkspace && (
          <div className="bg-white border-2 border-dashed border-teal-300 rounded-3xl p-8 text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto">
              <Building2 size={28} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Your workspace is empty</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Get started by adding your first property parcel or toggling Demo Mode in the sidebar to explore sample Gujarat &amp; UP land parcels.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/properties?action=new"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2"
              >
                <Plus size={14} />
                <span>Add First Property</span>
              </Link>
              <button
                onClick={() => aeroSyncStore.toggleDemoMode(true)}
                className="px-5 py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold flex items-center gap-2"
              >
                <Sparkles size={14} className="text-teal-600" />
                <span>Load Demo Dataset</span>
              </button>
            </div>
          </div>
        )}

        {/* Main Dashboard Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left 65%: Recent Verification Queue */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Recent Verifications</h3>
                <p className="text-xs text-slate-500">Document ↔ Parcel reconciliation queue</p>
              </div>
              <Link
                href="/verifications"
                className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1"
              >
                <span>View All ({verifications.length})</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {verifications.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No verifications run yet in this workspace.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {verifications.slice(0, 4).map((v) => {
                  const prop = properties.find((p) => p.id === v.propertyId);
                  return (
                    <div key={v.id} className="py-3.5 flex items-center justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-900">
                            Survey No: {prop?.surveyNo || v.propertyId}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="font-mono text-[11px] text-slate-500">{v.verificationId}</span>
                        </div>
                        <div className="text-xs text-slate-600 truncate max-w-md">
                          {v.headline}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            v.verificationResult === "VERIFIED"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : v.verificationResult === "PARTIALLY_VERIFIED"
                              ? "bg-teal-50 text-teal-800 border-teal-200"
                              : "bg-rose-50 text-rose-800 border-rose-200"
                          }`}
                        >
                          {v.verificationResult.replace("_", " ")}
                        </span>
                        <Link
                          href={`/property/${v.propertyId}`}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
                          title="Inspect Property Dossier"
                        >
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right 35%: Usage Meter & Quick GIS Link */}
          <div className="lg:col-span-5 space-y-6">
            {/* Usage Summary Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Plan Quota Usage</h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900 text-white uppercase">
                  {subscription.plan} Plan
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between text-slate-600 mb-1">
                    <span>Properties Mapped</span>
                    <span className="font-mono font-bold text-slate-900">{properties.length} / 100</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-teal-600 h-full" style={{ width: `${Math.min(100, (properties.length / 100) * 100)}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-600 mb-1">
                    <span>Monthly Verifications</span>
                    <span className="font-mono font-bold text-slate-900">{usage.verificationsCountThisMonth} / 50</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-teal-600 h-full" style={{ width: `${Math.min(100, (usage.verificationsCountThisMonth / 50) * 100)}%` }} />
                  </div>
                </div>
              </div>

              <Link
                href="/billing"
                className="block text-center py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                Manage Subscription &amp; Limits
              </Link>
            </div>

            {/* Quick Evidence Legal Disclaimer */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-xs text-amber-900 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5">
                <Scale size={15} className="text-amber-700 shrink-0" />
                <span>Section 65B Legal Evidence Layer</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                AeroSync verifies document consistency against GIS maps. Final title ownership requires authoritative Sub-Registrar / Tehsildar deed confirmation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
