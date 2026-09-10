"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import { aeroSyncStore, PLAN_LIMITS } from "@/lib/store";
import {
  BarChart3,
  HardDrive,
  FileText,
  ShieldCheck,
  Building2,
  Cpu,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function UsagePage() {
  const [storeState, setStoreState] = useState(aeroSyncStore.getState());

  useEffect(() => {
    const unsub = aeroSyncStore.subscribe(() => {
      setStoreState({ ...aeroSyncStore.getState() });
    });
    return () => unsub();
  }, []);

  const usage = aeroSyncStore.getUsage();
  const subscription = aeroSyncStore.getSubscription();
  const limits = PLAN_LIMITS[subscription.plan];

  const properties = aeroSyncStore.getProperties();
  const documents = aeroSyncStore.getDocuments();
  const verifications = aeroSyncStore.getVerifications();
  const reports = aeroSyncStore.getReports();

  const metrics = [
    {
      title: "Properties Mapped",
      current: properties.length,
      limit: limits.propertiesMax,
      unit: "Parcels",
      icon: Building2,
      desc: "Total cadastral parcels registered in this workspace.",
    },
    {
      title: "Monthly Document Ingestions",
      current: usage.documentsUploadedThisMonth,
      limit: limits.documentsPerMonth,
      unit: "Uploads / mo",
      icon: FileText,
      desc: "Scanned Property Cards and 7/12 extracts parsed.",
    },
    {
      title: "Verification Jobs Executed",
      current: usage.verificationsCountThisMonth,
      limit: limits.verificationsPerMonth,
      unit: "Jobs / mo",
      icon: ShieldCheck,
      desc: "Document ↔ GIS parcel mathematical reconciliations.",
    },
    {
      title: "OCR Token Operations",
      current: usage.ocrOperationsThisMonth,
      limit: limits.ocrPerMonth,
      unit: "Operations",
      icon: Cpu,
      desc: "Sub-pixel bounding box character recognitions.",
    },
    {
      title: "Storage Space Used",
      current: usage.storageUsedMb,
      limit: limits.storageMbMax,
      unit: "MB",
      icon: HardDrive,
      desc: "Document scan PDFs, drone tiles, and GeoJSON vectors.",
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 font-heading">
              Usage Metrics &amp; Quotas
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Track your workspace consumption across cadastral parcel allocations and monthly verifications.
            </p>
          </div>

          <Link
            href="/billing"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all self-start md:self-auto"
          >
            <Sparkles size={14} className="text-teal-400" />
            <span>Upgrade Plan Quota</span>
          </Link>
        </div>

        {/* Plan Header Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Current Plan Tier</div>
            <div className="text-xl font-black text-slate-900 font-heading mt-0.5">
              {subscription.plan} Workspace Plan
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Cycle renews on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-full text-xs font-bold">
              Active Subscription
            </span>
          </div>
        </div>

        {/* Meter Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {metrics.map((m) => {
            const Icon = m.icon;
            const pct = Math.min(100, Math.round((m.current / m.limit) * 100));
            const isNearLimit = pct >= 80;

            return (
              <div
                key={m.title}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                      <Icon size={16} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-xs">{m.title}</h3>
                      <p className="text-[11px] text-slate-500">{m.desc}</p>
                    </div>
                  </div>

                  <span className="font-mono text-xs font-bold text-slate-800">
                    {m.current} / {m.limit} {m.unit}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isNearLimit ? "bg-amber-500" : "bg-teal-600"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>{pct}% Used</span>
                    <span>{m.limit - m.current} Remaining</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
