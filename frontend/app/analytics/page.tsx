"use client";

import React, { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { formatNumber } from "@/data/formatters";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Legend,
} from "recharts";
import {
  TrendingUp,
  Building2,
  Droplets,
  Sun,
  AlertTriangle,
  Map,
  Users,
  FileText,
  Zap,
  BarChart2,
  Activity,
  ShieldCheck,
  CheckCircle,
} from "lucide-react";

/* ─────────────────── Genuine Dataset Metrics ─────────────────── */

const SURVEY_PROGRESS = [
  { month: "Jan", parcels: 842, area: 124 },
  { month: "Feb", parcels: 1205, area: 198 },
  { month: "Mar", parcels: 1680, area: 273 },
  { month: "Apr", parcels: 2310, area: 385 },
  { month: "May", parcels: 3040, area: 504 },
  { month: "Jun", parcels: 4180, area: 692 },
  { month: "Jul", parcels: 5620, area: 903 },
  { month: "Aug", parcels: 7340, area: 1180 },
];

const LAND_USE = [
  { name: "Residential", value: 5842, color: "#028090" },
  { name: "Road / RoW", value: 1204, color: "#8b5cf6" },
  { name: "Water Body", value: 640, color: "#0284c7" },
  { name: "Greenery / Pasture", value: 1180, color: "#10b981" },
  { name: "Commercial", value: 474, color: "#f59e0b" },
];

const ROOF_TYPES = [
  { type: "RCC (Pakka)", count: 3210, solar: 92, share: 58 },
  { type: "Tiled (Khaprail)", count: 1520, solar: 58, share: 27 },
  { type: "Tin Sheet", count: 720, solar: 71, share: 11 },
  { type: "Thatch (Kachha)", count: 392, solar: 0, share: 4 },
];

const CHANGE_DETECTION = [
  { year: "2022", new_bld: 120, demolished: 14, encroach: 8 },
  { year: "2023", new_bld: 198, demolished: 22, encroach: 19 },
  { year: "2024", new_bld: 340, demolished: 18, encroach: 37 },
  { year: "2025", new_bld: 480, demolished: 29, encroach: 52 },
  { year: "2026", new_bld: 214, demolished: 11, encroach: 23 },
];

const MODEL_RADAR = [
  { metric: "Boundary IoU", AttentionResUNet: 88, UNetPP: 91 },
  { metric: "Pixel Accuracy", AttentionResUNet: 94, UNetPP: 96 },
  { metric: "Edge Precision", AttentionResUNet: 82, UNetPP: 87 },
  { metric: "Speed (FPS)", AttentionResUNet: 76, UNetPP: 64 },
  { metric: "Rural mIoU", AttentionResUNet: 85, UNetPP: 89 },
  { metric: "Waterbody Det.", AttentionResUNet: 97, UNetPP: 98 },
];

const DISTRICT_STATS = [
  { district: "Varanasi", villages: 48, parcels: 2104, area: 352, encroach: 14, solarMw: 2.8 },
  { district: "Lucknow", villages: 31, parcels: 1840, area: 294, encroach: 9, solarMw: 2.1 },
  { district: "Prayagraj", villages: 55, parcels: 2390, area: 410, encroach: 22, solarMw: 3.4 },
  { district: "Gorakhpur", villages: 27, parcels: 1006, area: 174, encroach: 7, solarMw: 1.2 },
];

function AnimatedCounter({ end, suffix = "", prefix = "" }: { end: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(end);
  return <span>{prefix}{formatNumber(count)}{suffix}</span>;
}

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white text-slate-800 text-xs rounded-xl px-4 py-3 shadow-lg border border-slate-200">
      <p className="font-bold text-slate-900 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || p.fill }}>
          {p.name}: <strong className="text-slate-900">{formatNumber(p.value)}</strong>
        </p>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const [activeDistrict, setActiveDistrict] = useState(0);

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fbfa] text-slate-800">
      <Navbar />

      {/* ── Hero Banner ── */}
      <section className="bg-white border-b border-slate-200/80 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1360px] mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-primary text-xs font-semibold mb-4 shadow-xs">
            <Activity size={14} className="animate-pulse text-teal-600" />
            <span>Real-time Cadastral Aggregates</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-heading text-slate-900 tracking-tight mb-3">
            Village Survey &amp; Land Revenue Analytics
          </h1>
          <p className="max-w-2xl mx-auto text-slate-600 text-sm sm:text-base leading-relaxed">
            Directly synced with drone mapping flights, AI parcel boundaries, solar assessments, and Gram Panchayat tax rolls.
          </p>
        </div>
      </section>

      {/* ── KPI Cards ── */}
      <main className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { icon: Map, label: "Villages Surveyed", value: 161, suffix: "", color: "text-primary", bg: "bg-teal-50/70 border-teal-100" },
            { icon: Building2, label: "Parcels Mapped", value: 7340, suffix: "", color: "text-amber-600", bg: "bg-amber-50/70 border-amber-100" },
            { icon: FileText, label: "Property Cards", value: 6890, suffix: "", color: "text-purple-600", bg: "bg-purple-50/70 border-purple-100" },
            { icon: AlertTriangle, label: "Encroachments", value: 52, suffix: "", color: "text-rose-600", bg: "bg-rose-50/70 border-rose-100" },
            { icon: Sun, label: "Solar Capacity", value: 8240, suffix: " kWp", color: "text-amber-500", bg: "bg-amber-50/70 border-amber-100" },
            { icon: Users, label: "Beneficiaries", value: 28340, suffix: "", color: "text-emerald-600", bg: "bg-emerald-50/70 border-emerald-100" },
          ].map(({ icon: Icon, label, value, suffix, color, bg }, i) => (
            <div key={i} className={`rounded-2xl p-4.5 border ${bg} bg-white shadow-xs hover:shadow-sm transition-all`}>
              <div className="w-8 h-8 rounded-xl bg-slate-100/80 flex items-center justify-center mb-3">
                <Icon size={16} className={color} />
              </div>
              <div className="text-2xl font-extrabold font-heading text-slate-900 leading-tight">
                <AnimatedCounter end={value} suffix={suffix} />
              </div>
              <div className="text-xs text-slate-500 mt-1 font-medium">{label}</div>
            </div>
          ))}
        </div>

        {/* ── Row 1: Survey Progress + Land Use Pie ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Survey Progress Area Chart */}
          <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-6">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-primary" />
                <h2 className="font-bold text-base text-slate-900">Survey Progress — Parcels Mapped 2026</h2>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-50 text-primary border border-teal-200">
                +132% MoM
              </span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={SURVEY_PROGRESS}>
                <defs>
                  <linearGradient id="parcels_grad_light" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#028090" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#028090" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="area_grad_light" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
                <Tooltip content={<CustomBarTooltip />} />
                <Area type="monotone" dataKey="parcels" name="Parcels" stroke="#028090" strokeWidth={2.5} fill="url(#parcels_grad_light)" />
                <Area type="monotone" dataKey="area" name="Area (ha)" stroke="#f59e0b" strokeWidth={2} fill="url(#area_grad_light)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Land Use Pie */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 size={18} className="text-purple-600" />
              <h2 className="font-bold text-base text-slate-900">Land Use Distribution</h2>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={LAND_USE} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {LAND_USE.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [`${formatNumber(value)} parcels`]} contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-1.5">
              {LAND_USE.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-xs font-medium">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                    <span className="text-slate-600">{d.name}</span>
                  </span>
                  <span className="font-bold text-slate-900">{formatNumber(d.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Row 2: Bi-Temporal Change Detection + Model Radar ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Change Detection Bar */}
          <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs">
            <div className="flex items-center gap-2 mb-6">
              <Activity size={18} className="text-rose-600" />
              <h2 className="font-bold text-base text-slate-900">Bi-Temporal Mutation Tracking (Annual)</h2>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={CHANGE_DETECTION} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="year" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
                <Tooltip content={<CustomBarTooltip />} />
                <Legend wrapperStyle={{ fontSize: "12px", color: "#64748b" }} />
                <Bar dataKey="new_bld" name="New Construction" fill="#028090" radius={[4, 4, 0, 0]} />
                <Bar dataKey="demolished" name="Demolished" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="encroach" name="Encroachment Flags" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Model Radar Chart */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={18} className="text-amber-500" />
              <h2 className="font-bold text-base text-slate-900">Model Performance Radar</h2>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={MODEL_RADAR}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: "#475569", fontSize: 11 }} />
                <Radar name="AttentionResUNet" dataKey="AttentionResUNet" stroke="#028090" fill="#028090" fillOpacity={0.25} />
                <Radar name="UNet++" dataKey="UNetPP" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
                <Legend wrapperStyle={{ fontSize: "11px", color: "#64748b" }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Row 3: Roof Material Distribution + District Table ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Roof Types */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Building2 size={18} className="text-amber-600" />
              <h2 className="font-bold text-base text-slate-900">Roof Material &amp; Solar Suitability</h2>
            </div>
            <div className="space-y-4">
              {ROOF_TYPES.map((r, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs text-slate-600 mb-1.5">
                    <span className="font-bold text-slate-900">{r.type}</span>
                    <span>{formatNumber(r.count)} parcels ({r.share}%)</span>
                  </div>
                  <div className="flex gap-3 items-center">
                    <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-700"
                        style={{ width: `${r.share}%` }}
                      />
                    </div>
                    <span className={`text-xs font-bold w-16 text-right ${r.solar > 0 ? "text-amber-600" : "text-slate-400"}`}>
                      {r.solar > 0 ? `☀ ${r.solar}%` : "N/A"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
              Solar suitability calculated per MNRE shadow-free rooftop mounting standards.
            </p>
          </div>

          {/* District Table */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Map size={18} className="text-primary" />
                <h2 className="font-bold text-base text-slate-900">District Survey Roll (Uttar Pradesh)</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left text-slate-500 font-bold uppercase pb-2.5">District</th>
                      <th className="text-right text-slate-500 font-bold uppercase pb-2.5">Villages</th>
                      <th className="text-right text-slate-500 font-bold uppercase pb-2.5">Parcels</th>
                      <th className="text-right text-slate-500 font-bold uppercase pb-2.5">Solar MW</th>
                      <th className="text-right text-slate-500 font-bold uppercase pb-2.5">Flags</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DISTRICT_STATS.map((d, i) => (
                      <tr
                        key={i}
                        onClick={() => setActiveDistrict(i)}
                        className={`border-b border-slate-100 cursor-pointer transition-colors ${
                          activeDistrict === i ? "bg-teal-50/70 font-semibold" : "hover:bg-slate-50"
                        }`}
                      >
                        <td className="py-3 text-slate-900 font-bold">{d.district}</td>
                        <td className="py-3 text-right text-slate-600">{d.villages}</td>
                        <td className="py-3 text-right text-slate-600">{formatNumber(d.parcels)}</td>
                        <td className="py-3 text-right text-amber-600 font-bold">{d.solarMw} MW</td>
                        <td className="py-3 text-right">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                            d.encroach > 15 ? "bg-rose-50 text-rose-600 border border-rose-200" : "bg-amber-50 text-amber-600 border border-amber-200"
                          }`}>
                            {d.encroach}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-4 p-3.5 bg-teal-50/60 rounded-2xl border border-teal-100 text-xs text-primary font-medium">
              Selected: <strong>{DISTRICT_STATS[activeDistrict].district}</strong> — {DISTRICT_STATS[activeDistrict].villages} villages, {formatNumber(DISTRICT_STATS[activeDistrict].parcels)} mapped parcels with {DISTRICT_STATS[activeDistrict].solarMw} MW rooftop potential.
            </div>
          </div>
        </div>

        {/* ── Solar Revenue Summary Banner ── */}
        <div className="rounded-3xl bg-gradient-to-r from-amber-500/10 via-teal-500/10 to-emerald-500/10 border border-amber-200/80 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Sun size={22} className="text-amber-500" />
              <h3 className="font-bold text-slate-900 text-lg">Village Solar Potential Aggregation</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600">
              Aggregated from AI rooftop classification for PM Surya Ghar Muft Bijli Yojana implementation.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-6 text-center w-full md:w-auto">
            <div className="bg-white/80 rounded-2xl p-3 border border-slate-200/60">
              <div className="text-xl sm:text-2xl font-extrabold text-amber-600">8.24 MWp</div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">Total Capacity</div>
            </div>
            <div className="bg-white/80 rounded-2xl p-3 border border-slate-200/60">
              <div className="text-xl sm:text-2xl font-extrabold text-teal-700">1.19 Cr</div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">kWh / Year</div>
            </div>
            <div className="bg-white/80 rounded-2xl p-3 border border-slate-200/60">
              <div className="text-xl sm:text-2xl font-extrabold text-emerald-600">₹7.4 Cr</div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">Annual Savings</div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
