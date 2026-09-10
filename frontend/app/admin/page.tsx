"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { aeroSyncStore } from "@/lib/store";
import {
  ShieldAlert,
  Users,
  Building2,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Server,
  Database,
  Lock,
} from "lucide-react";

export default function AdminPage() {
  const [storeState, setStoreState] = useState(aeroSyncStore.getState());

  useEffect(() => {
    const unsub = aeroSyncStore.subscribe(() => {
      setStoreState({ ...aeroSyncStore.getState() });
    });
    return () => unsub();
  }, []);

  const { userOrgs, properties, documents, verifications, issueReports, auditLogs } = storeState;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-800 text-xs font-bold border border-rose-200 mb-2">
              <ShieldAlert size={14} className="text-rose-600" />
              <span>Admin Console</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 font-heading">
              Platform Administration &amp; System Health
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Global tenant monitoring, dispute queues, and Section 65B compliance verification logs.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Systems Normal</span>
          </div>
        </div>

        {/* Global Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs font-bold text-slate-400 uppercase">Total Workspaces</div>
            <div className="text-2xl font-black text-slate-900 font-mono mt-2">{userOrgs.length}</div>
            <div className="text-[11px] text-slate-500 mt-1">Active multi-tenant silos</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs font-bold text-slate-400 uppercase">Mapped Cadastres</div>
            <div className="text-2xl font-black text-slate-900 font-mono mt-2">{properties.length}</div>
            <div className="text-[11px] text-slate-500 mt-1">Total land parcels</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs font-bold text-slate-400 uppercase">Verifications Run</div>
            <div className="text-2xl font-black text-slate-900 font-mono mt-2">{verifications.length}</div>
            <div className="text-[11px] text-slate-500 mt-1">Automated trust evaluations</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs font-bold text-slate-400 uppercase">Dispute Reports</div>
            <div className="text-2xl font-black text-slate-900 font-mono mt-2">{issueReports.length}</div>
            <div className="text-[11px] text-slate-500 mt-1">Open surveyor flags</div>
          </div>
        </div>

        {/* System Health Subsystems */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Subsystem Operational Status</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Server size={18} className="text-teal-600" />
                <div>
                  <div className="font-bold text-slate-900">PyTorch Drone Inference</div>
                  <div className="text-[11px] text-slate-500">Latency: 142ms</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                100% OK
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Database size={18} className="text-teal-600" />
                <div>
                  <div className="font-bold text-slate-900">Cadastral Vector Index</div>
                  <div className="text-[11px] text-slate-500">EPSG:32643 CRS</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                100% OK
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Lock size={18} className="text-teal-600" />
                <div>
                  <div className="font-bold text-slate-900">Section 65B Hash Ledger</div>
                  <div className="text-[11px] text-slate-500">SHA-256 Validated</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                100% OK
              </span>
            </div>
          </div>
        </div>

        {/* Global Audit Log */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 font-bold text-slate-900 text-xs uppercase tracking-wider">
            System Audit Stream ({auditLogs.length} Events)
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {auditLogs.slice(0, 8).map((log) => (
              <div key={log.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50/70">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{log.action}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[11px] text-slate-500">{log.userEmail}</span>
                  </div>
                  <div className="text-[11px] text-slate-600">{log.detail}</div>
                </div>
                <div className="font-mono text-[10px] text-slate-400">
                  {new Date(log.createdAt).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
