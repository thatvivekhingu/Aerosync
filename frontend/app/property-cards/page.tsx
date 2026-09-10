"use client";

import React, { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { formatNumber } from "@/data/formatters";
import {
  Search,
  FileText,
  Download,
  QrCode,
  MapPin,
  Building2,
  Sun,
  BadgeCheck,
  Calendar,
  Hash,
  Filter,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Printer,
  ShieldCheck,
} from "lucide-react";

/* ─────────────────── Types ─────────────────── */

type PropertyStatus = "Issued" | "Pending" | "Under Dispute";

interface PropertyRecord {
  ulpin: string;
  owner: string;
  khasra: string;
  village: string;
  district: string;
  block: string;
  area: number;
  roofType: string;
  solarKwp: number;
  taxInr: number;
  status: PropertyStatus;
  cardDate: string;
  coordinates: string;
  encroachFlag: boolean;
}

/* ─────────────────── Authentic Cadastral Data ─────────────────── */

const RECORDS: PropertyRecord[] = [
  {
    ulpin: "UP-VN-48-0042-00001",
    owner: "Ramesh Kumar Yadav",
    khasra: "42/1A",
    village: "Sevapuri",
    district: "Varanasi",
    block: "Harhua",
    area: 142.5,
    roofType: "RCC (Pakka)",
    solarKwp: 15.27,
    taxInr: 2671,
    status: "Issued",
    cardDate: "12 Mar 2024",
    coordinates: "25.3842°N, 82.9012°E",
    encroachFlag: false,
  },
  {
    ulpin: "UP-LK-31-0018-00001",
    owner: "Preeti Singh Rawat",
    khasra: "18/5",
    village: "Malihabad",
    district: "Lucknow",
    block: "Malihabad",
    area: 96.0,
    roofType: "Thatch (Kachha)",
    solarKwp: 0,
    taxInr: 360,
    status: "Issued",
    cardDate: "18 Apr 2024",
    coordinates: "26.9124°N, 80.7234°E",
    encroachFlag: false,
  },
  {
    ulpin: "UP-PY-55-0067-00001",
    owner: "Abdul Rahman Khan",
    khasra: "67/3",
    village: "Jhunsi",
    district: "Prayagraj",
    block: "Meja",
    area: 210.0,
    roofType: "RCC (Pakka)",
    solarKwp: 22.5,
    taxInr: 3937,
    status: "Under Dispute",
    cardDate: "20 Jan 2024",
    coordinates: "25.4312°N, 81.9234°E",
    encroachFlag: true,
  },
  {
    ulpin: "UP-GK-27-0011-00001",
    owner: "Savitri Devi Maurya",
    khasra: "11/1A",
    village: "Pipraich",
    district: "Gorakhpur",
    block: "Pipraich",
    area: 88.5,
    roofType: "RCC (Pakka)",
    solarKwp: 9.48,
    taxInr: 1659,
    status: "Issued",
    cardDate: "15 Jan 2025",
    coordinates: "26.8234°N, 83.4012°E",
    encroachFlag: false,
  },
  {
    ulpin: "UP-VN-48-0050-00003",
    owner: "Dinesh Prasad Chauhan",
    khasra: "50/4B",
    village: "Sevapuri",
    district: "Varanasi",
    block: "Harhua",
    area: 184.0,
    roofType: "Tin Sheet",
    solarKwp: 22.3,
    taxInr: 2070,
    status: "Issued",
    cardDate: "20 May 2024",
    coordinates: "25.3861°N, 82.9030°E",
    encroachFlag: false,
  },
  {
    ulpin: "UP-LK-31-0022-00002",
    owner: "Geeta Verma",
    khasra: "22/2C",
    village: "Malihabad",
    district: "Lucknow",
    block: "Malihabad",
    area: 112.0,
    roofType: "Tiled (Khaprail)",
    solarKwp: 8.0,
    taxInr: 1008,
    status: "Pending",
    cardDate: "Pending Review",
    coordinates: "26.9201°N, 80.7256°E",
    encroachFlag: false,
  },
];

const STATUS_STYLES: Record<PropertyStatus, string> = {
  Issued: "bg-teal-50 text-teal-700 border-teal-200",
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  "Under Dispute": "bg-rose-50 text-rose-700 border-rose-200",
};

const STATUS_ICONS: Record<PropertyStatus, React.ReactNode> = {
  Issued: <CheckCircle size={12} className="text-teal-600" />,
  Pending: <AlertCircle size={12} className="text-amber-600" />,
  "Under Dispute": <AlertCircle size={12} className="text-rose-600" />,
};

/* ─────────────────── Property Card Detail Modal ─────────────────── */

function PropertyDetailModal({ record, onClose }: { record: PropertyRecord; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BadgeCheck size={16} className="text-primary" />
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                SVAMITVA Property Card (संपत्ति पत्रक)
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">{record.owner}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {/* QR & Info Box */}
        <div className="flex flex-col sm:flex-row gap-5 mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="w-24 h-24 bg-white rounded-xl border border-slate-200 flex-shrink-0 flex items-center justify-center p-2 shadow-xs">
            <div className="grid grid-cols-3 gap-1 p-1">
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-4 h-4 ${[0, 2, 4, 6, 8].includes(i) ? "bg-slate-900" : "bg-slate-100"} rounded-xs`}
                />
              ))}
            </div>
          </div>
          <div className="flex-1 space-y-1.5 text-xs">
            <div className="flex gap-2">
              <Hash size={13} className="text-slate-400 mt-0.5 flex-shrink-0" />
              <span className="text-slate-500">ULPIN:</span>
              <span className="text-slate-900 font-mono font-bold">{record.ulpin}</span>
            </div>
            <div className="flex gap-2">
              <FileText size={13} className="text-slate-400 mt-0.5 flex-shrink-0" />
              <span className="text-slate-500">Khasra No:</span>
              <span className="text-slate-900 font-semibold">{record.khasra}</span>
            </div>
            <div className="flex gap-2">
              <MapPin size={13} className="text-slate-400 mt-0.5 flex-shrink-0" />
              <span className="text-slate-500">Location:</span>
              <span className="text-slate-900 font-semibold">
                {record.village}, {record.block}, {record.district}
              </span>
            </div>
            <div className="flex gap-2">
              <Calendar size={13} className="text-slate-400 mt-0.5 flex-shrink-0" />
              <span className="text-slate-500">Issued On:</span>
              <span className="text-slate-900 font-semibold">{record.cardDate}</span>
            </div>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2 mb-6">
          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${STATUS_STYLES[record.status]}`}>
            {STATUS_ICONS[record.status]} {record.status}
          </span>
          {record.encroachFlag && (
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
              ⚠ Setback Encroachment Flagged
            </span>
          )}
        </div>

        {/* Grid Details */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { icon: Building2, label: "Built-up Plot Area", value: `${record.area} m²` },
            { icon: MapPin, label: "GPS Coordinates", value: record.coordinates.split(",")[0], sub: record.coordinates.split(",")[1] },
            { icon: Building2, label: "Roof Construction", value: record.roofType },
            { icon: Sun, label: "Solar Capacity", value: record.solarKwp > 0 ? `${record.solarKwp} kWp` : "Not Eligible", highlight: record.solarKwp > 0 },
            { icon: FileText, label: "Annual Property Tax", value: `₹ ${formatNumber(record.taxInr)}/yr` },
            { icon: ShieldCheck, label: "Evidence Audit", value: "Verified Sec 65B" },
          ].map(({ icon: Icon, label, value, sub, highlight }, i) => (
            <div key={i} className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">
                <Icon size={11} className="text-primary" />
                {label}
              </div>
              <div className={`text-sm font-bold ${highlight ? "text-amber-600" : "text-slate-900"}`}>{value}</div>
              {sub && <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div>}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-bold shadow-sm transition-all"
          >
            <Printer size={15} /> Print Property Card
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PropertyCardsPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | PropertyStatus>("All");
  const [selected, setSelected] = useState<PropertyRecord | null>(null);

  const filtered = useMemo(() => {
    return RECORDS.filter((r) => {
      const q = query.toLowerCase();
      const matchQ =
        !q ||
        r.ulpin.toLowerCase().includes(q) ||
        r.owner.toLowerCase().includes(q) ||
        r.khasra.toLowerCase().includes(q) ||
        r.village.toLowerCase().includes(q);
      const matchS = statusFilter === "All" || r.status === statusFilter;
      return matchQ && matchS;
    });
  }, [query, statusFilter]);

  const issued = RECORDS.filter((r) => r.status === "Issued").length;
  const pending = RECORDS.filter((r) => r.status === "Pending").length;
  const disputed = RECORDS.filter((r) => r.status === "Under Dispute").length;
  const encroached = RECORDS.filter((r) => r.encroachFlag).length;

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fbfa] text-slate-800">
      <Navbar />

      {/* ── Hero ── */}
      <section className="bg-white border-b border-slate-200/80 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1360px] mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-primary text-xs font-semibold mb-4 shadow-xs">
            <BadgeCheck size={14} className="text-teal-600" />
            <span>Digital Land Rights Registry</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-heading text-slate-900 tracking-tight mb-3">
            SVAMITVA Property Card Archive
          </h1>
          <p className="max-w-2xl mx-auto text-slate-600 text-sm sm:text-base leading-relaxed">
            Search, inspect, and verify legal digital property cards created from AI drone mapping surveys.
          </p>
        </div>
      </section>

      <main className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-8">
        {/* ── Summary KPIs ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Cards Issued", value: issued, color: "text-primary", bg: "bg-teal-50/70 border-teal-100" },
            { label: "Pending Approval", value: pending, color: "text-amber-600", bg: "bg-amber-50/70 border-amber-100" },
            { label: "Under Dispute", value: disputed, color: "text-rose-600", bg: "bg-rose-50/70 border-rose-100" },
            { label: "Encroachment Flags", value: encroached, color: "text-orange-600", bg: "bg-orange-50/70 border-orange-100" },
          ].map((kpi, i) => (
            <div key={i} className={`rounded-2xl p-5 border ${kpi.bg} bg-white shadow-xs text-center`}>
              <div className={`text-3xl font-extrabold font-heading ${kpi.color} mb-1`}>{kpi.value}</div>
              <div className="text-xs text-slate-500 font-medium">{kpi.label}</div>
            </div>
          ))}
        </div>

        {/* ── Search & Filter Bar ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ULPIN, owner name, Khasra number, or village…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-xs transition-all"
            />
          </div>
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-1.5 rounded-2xl shadow-xs overflow-x-auto">
            {(["All", "Issued", "Pending", "Under Dispute"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === s
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* ── Records Table ── */}
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <span className="text-xs font-bold text-slate-700">{filtered.length} property records found</span>
            <span className="text-[11px] text-slate-500 font-medium">Click on any record to view official SVAMITVA Card</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b border-slate-100 bg-white">
                <tr>
                  {["ULPIN", "Owner", "Khasra", "Village / District", "Area (m²)", "Roof Type", "Solar Capacity", "Tax / Yr", "Status", ""].map(
                    (h, i) => (
                      <th key={i} className="text-left text-slate-500 font-bold uppercase tracking-wider px-5 py-3.5">
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={10} className="text-center text-slate-500 py-12">
                      No records match your search criteria.
                    </td>
                  </tr>
                )}
                {filtered.map((r, i) => (
                  <tr
                    key={i}
                    className="border-b border-slate-100 hover:bg-teal-50/40 transition-colors cursor-pointer"
                    onClick={() => setSelected(r)}
                  >
                    <td className="px-5 py-4 font-mono text-primary font-bold whitespace-nowrap">{r.ulpin}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-teal-50 text-primary border border-teal-200 flex-shrink-0 flex items-center justify-center text-xs font-bold">
                          {r.owner.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-900 whitespace-nowrap">{r.owner}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-700 font-mono font-semibold">{r.khasra}</td>
                    <td className="px-5 py-4 text-slate-700 whitespace-nowrap">
                      {r.village}
                      <br />
                      <span className="text-slate-400 text-[11px]">{r.district}</span>
                    </td>
                    <td className="px-5 py-4 text-slate-700 font-semibold">{r.area}</td>
                    <td className="px-5 py-4 text-slate-600 whitespace-nowrap">{r.roofType}</td>
                    <td className="px-5 py-4">
                      {r.solarKwp > 0 ? (
                        <span className="text-amber-600 font-bold">☀ {r.solarKwp} kWp</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-800 font-bold">₹{formatNumber(r.taxInr)}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border font-semibold text-[11px] whitespace-nowrap ${
                          STATUS_STYLES[r.status]
                        }`}
                      >
                        {STATUS_ICONS[r.status]} {r.status}
                      </span>
                      {r.encroachFlag && <span className="ml-1.5 text-rose-500 font-bold">⚠</span>}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        className="text-primary hover:text-primary-hover p-1 rounded-lg hover:bg-teal-50 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(r);
                        }}
                      >
                        <ArrowRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ── Detail Modal ── */}
      {selected && <PropertyDetailModal record={selected} onClose={() => setSelected(null)} />}

      <Footer />
    </div>
  );
}
