"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import { aeroSyncStore } from "@/lib/store";
import {
  FileSpreadsheet,
  Download,
  Share2,
  ExternalLink,
  ShieldCheck,
  Search,
  CheckCircle2,
  QrCode,
  Calendar,
  Lock,
  ArrowRight,
} from "lucide-react";

export default function ReportsPage() {
  const [storeState, setStoreState] = useState(aeroSyncStore.getState());
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const unsub = aeroSyncStore.subscribe(() => {
      setStoreState({ ...aeroSyncStore.getState() });
    });
    return () => unsub();
  }, []);

  const reports = aeroSyncStore.getReports();
  const properties = aeroSyncStore.getProperties();

  const filteredReports = reports.filter((r) => {
    return (
      r.verificationId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 font-heading">
              Verification Certificates &amp; Reports
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Court-admissible Section 65B verification certificates with immutable SHA-256 integrity hashes.
            </p>
          </div>

          <Link
            href="/verifications"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all self-start md:self-auto"
          >
            <span>Run New Verification</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search size={14} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Verification ID (ASV-...), Title..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-teal-500 text-slate-900"
            />
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {filteredReports.length} Generated Certificates
          </span>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredReports.length === 0 ? (
            <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-16 text-center space-y-3">
              <FileSpreadsheet size={36} className="mx-auto text-slate-300" />
              <div className="text-sm font-bold text-slate-900">No reports generated yet</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Execute a verification job to automatically generate an official certificate.
              </p>
            </div>
          ) : (
            filteredReports.map((rep) => {
              const prop = properties.find((p) => p.id === rep.propertyId);
              return (
                <div
                  key={rep.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                        {rep.verificationId}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          rep.verificationStatus === "VERIFIED"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : rep.verificationStatus === "PARTIALLY_VERIFIED"
                            ? "bg-teal-50 text-teal-800 border-teal-200"
                            : "bg-rose-50 text-rose-800 border-rose-200"
                        }`}
                      >
                        {rep.verificationStatus.replace("_", " ")}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{rep.title}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{rep.summaryText}</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 font-mono text-[10px] text-slate-500 space-y-1">
                      <div>Survey: <strong>{prop?.surveyNo || "N/A"}</strong> ({prop?.village || "Gujarat"})</div>
                      <div className="truncate">Cert Hash: {rep.certificateHashSha256}</div>
                      <div>Signer: {rep.surveyorSignatureName}</div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Calendar size={12} />
                      <span>{new Date(rep.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/verify/${rep.verificationId}`}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center gap-1.5 text-xs shadow-xs"
                      >
                        <span>View Certificate</span>
                        <ExternalLink size={12} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AppLayout>
  );
}
