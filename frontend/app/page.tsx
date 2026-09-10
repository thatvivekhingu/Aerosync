"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import PropertyVerificationHub from "@/components/PropertyVerificationHub";
import AIPipelineFlow from "@/components/AIPipelineFlow";
import Footer from "@/components/Footer";
import MapboxViewer from "@/components/MapboxViewer";
import ParcelInspector from "@/components/ParcelInspector";
import PropertyCardModal from "@/components/PropertyCardModal";
import { CadastralParcel, CADASTRAL_PARCELS } from "@/data/parcels";
import {
  Map,
  Brain,
  FileText,
  ShieldAlert,
  History,
  ArrowRight,
  BarChart2,
  Bot,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Scale,
  Search,
  Layers,
  Sparkles,
  Users,
  Building2,
  Check,
  HelpCircle,
  Compass,
  AlertTriangle,
  Flame,
} from "lucide-react";
import Link from "next/link";

const USE_CASES = [
  {
    title: "For Individual Landowners",
    badge: "Title Due-Diligence",
    desc: "Verify whether the Survey Number and area on your property card matches the physical ground parcel before entering a sale agreement.",
    icon: ShieldCheck,
    points: [
      "Spot area inflations or reductions",
      "Inspect sub-5cm drone plinths",
      "Download Section 65B report",
    ],
  },
  {
    title: "For Surveyors & Drone Operators",
    badge: "High Precision GIS",
    desc: "Process village orthomosaics, calculate shoelace polygon boundary integrals, and cross-reference state revenue plans.",
    icon: Map,
    points: [
      "Sub-pixel plinth delineations",
      "Statutory ±3.0% margin math",
      "Multi-format GeoJSON export",
    ],
  },
  {
    title: "For Lawyers & Property Due-Diligence",
    badge: "Court Admissible",
    desc: "Review client property cards, identify right-of-way encroachments, and generate audit-ready evidence packages.",
    icon: Scale,
    points: [
      "Section 65B evidence logs",
      "SHA-256 duplicate card check",
      "Village dispute history notes",
    ],
  },
  {
    title: "For Banks & Mortgage Underwriters",
    badge: "Collateral Risk",
    desc: "Automate collateral property verification, eliminate phantom land mortgages, and enforce multi-user approval queues.",
    icon: Building2,
    points: [
      "Multi-tenant workspace silos",
      "Enterprise REST API & webhooks",
      "Automated consistency checks",
    ],
  },
];

const PRICING_TIERS = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    desc: "For landowners verifying a single parcel or exploring sample datasets.",
    features: [
      "5 Mapped Properties",
      "5 Document Ingestions / mo",
      "3 Verification Jobs / mo",
      "Section 65B Certificate",
      "Community Support",
    ],
    cta: "Start Free",
    href: "/register",
    popular: false,
  },
  {
    name: "Pro Surveyor",
    price: "₹1,999",
    period: "per month",
    desc: "For GIS surveyors, independent drone operators, and legal researchers.",
    features: [
      "100 Mapped Properties",
      "100 Documents / mo",
      "50 Verifications / mo",
      "Sub-pixel Plinth Delineations",
      "5 Team Member Seats",
      "Priority Email & Chat Support",
    ],
    cta: "Get Pro Access",
    href: "/register",
    popular: true,
  },
  {
    name: "Business",
    price: "₹6,499",
    period: "per month",
    desc: "For real estate due-diligence teams, banks, and survey agencies.",
    features: [
      "500 Mapped Properties",
      "500 Documents / mo",
      "300 Verifications / mo",
      "REST API & Webhooks Access",
      "20 Team Member Seats",
      "Custom Logo on Certificates",
    ],
    cta: "Start Business Trial",
    href: "/register",
    popular: false,
  },
];

const FAQS = [
  {
    q: "Does AeroSync replace official government land record authorities?",
    a: "No. AeroSync is an independent evidence and verification layer that reconciles document tokens against GIS parcel vectors and drone surveys. Authoritative title deeds must always be certified by the competent Sub-Registrar / Tehsildar office.",
  },
  {
    q: "How does AeroSync handle small area variations?",
    a: "Surveying science accounts for slope, boundary pillar shifts, and wall thickness. AeroSync applies statutory tolerance thresholds (typically ±3.0%) to distinguish between standard surveying variances and significant land inflation or encroachment.",
  },
  {
    q: "Are AeroSync verification certificates admissible in court?",
    a: "Yes. AeroSync generates verification reports compliant with Section 65B of the Indian Evidence Act, 1872, including automated timestamps, SHA-256 document hashes, and immutable calculation formulas.",
  },
  {
    q: "Can I use AeroSync with my team or firm?",
    a: "Yes. AeroSync provides multi-tenant workspaces with role-based access control (Owner, Admin, Member, Viewer) and separate data isolation.",
  },
];

export default function HomePage() {
  const [selectedParcel, setSelectedParcel] = useState<CadastralParcel>(CADASTRAL_PARCELS[0]);
  const [isPropertyCardOpen, setIsPropertyCardOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <Hero />

      {/* ══════════════════════════════════════════════════════════════════════
          SIH 2026 FLAGSHIP SHOWCASE: AI-POWERED URBAN CADASTRAL MAPPING
          Problem Statement ID: 26012 | Team: Tech Titans 2.0
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-14 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-white border-b border-slate-800 relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-64 bg-teal-500/10 blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8 relative z-10">
          
          {/* Header & Badges */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/40 tracking-wider">
                  <Flame size={14} className="text-amber-400" />
                  <span>SMART INDIA HACKATHON 2026</span>
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-teal-500/10 text-teal-300 border border-teal-500/30">
                  PS ID: 26012 (DoLR / MoRD)
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                  Team: Tech Titans 2.0
                </span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black font-heading tracking-tight text-white">
                AeroSync — AI-Powered Automated Urban Cadastral Mapping
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-3xl leading-relaxed">
                Autonomous cadastral extraction directly from high-resolution drone orthomosaics. Features <strong className="text-teal-300">90° Orthogonalization</strong>, <strong className="text-teal-300">Direction Boundaries (Chauhaddi: N, S, E, W)</strong>, <strong className="text-rose-300">Boundary Conflict &amp; Statutory Buffer Detection</strong>, and <strong className="text-teal-300">Instant SVAMITVA Property Cards</strong> with Bhu-Aadhaar ULPIN.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPropertyCardOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 transition-all"
              >
                <FileText size={15} />
                <span>View Property Card (Gharoni)</span>
              </button>
            </div>
          </div>

          {/* SIH 2026 6-Step Technical Workflow Pill Bar (Slide 3) */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2 bg-slate-900/80 border border-slate-800 p-2.5 rounded-2xl text-[11px] backdrop-blur-md">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 font-bold flex items-center justify-center text-[10px]">1</span>
              <span className="text-slate-200 font-medium">Aerial Imagery</span>
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 font-bold flex items-center justify-center text-[10px]">2</span>
              <span className="text-slate-200 font-medium">Image Tiling</span>
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 font-bold flex items-center justify-center text-[10px]">3</span>
              <span className="text-slate-200 font-medium">AI ResUNet+ASPP</span>
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-rose-950/40 border border-rose-800/50">
              <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 font-bold flex items-center justify-center text-[10px]">4</span>
              <span className="text-rose-200 font-medium">Conflict &amp; Errors</span>
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-teal-950/40 border border-teal-800/50">
              <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 font-bold flex items-center justify-center text-[10px]">5</span>
              <span className="text-teal-200 font-medium">90° Regularization</span>
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-800/50">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px]">6</span>
              <span className="text-emerald-200 font-medium">Verified Cadastre</span>
            </div>
          </div>

          {/* MAIN 2-COLUMN CADASTRAL GIS WORKBENCH */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left 8 Cols: Real Drone Orthomosaic Map & Direction Boundaries */}
            <div className="lg:col-span-8 bg-slate-900/60 rounded-2xl border border-slate-800 p-2 shadow-2xl">
              <MapboxViewer
                selectedParcel={selectedParcel}
                onSelectParcel={(p) => setSelectedParcel(p)}
              />
            </div>

            {/* Right 4 Cols: Parcel Intelligence, Chauhaddi Matrix & SIH Barcode */}
            <div className="lg:col-span-4 h-full">
              <ParcelInspector
                parcel={selectedParcel}
                onOpenPropertyCard={() => setIsPropertyCardOpen(true)}
              />
            </div>
          </div>

          {/* SIH Key Outputs Quick Metrics Bar (Slide 2 & 5) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="text-2xl font-black text-teal-400 font-mono">95%</div>
              <div className="text-xs font-bold text-slate-200 mt-1">Survey Speed Acceleration</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Automated orthomosaic boundary tracing</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="text-2xl font-black text-amber-400 font-mono">90.0°</div>
              <div className="text-xs font-bold text-slate-200 mt-1">Sub-Centimeter Orthogonalization</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Cleans shadow and wall curvature</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="text-2xl font-black text-rose-400 font-mono">100%</div>
              <div className="text-xs font-bold text-slate-200 mt-1">Conflict &amp; Buffer Detection</div>
              <div className="text-[11px] text-slate-400 mt-0.5">3m road &amp; 15m water buffer checks</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="text-2xl font-black text-indigo-400 font-mono">14-Digit</div>
              <div className="text-xs font-bold text-slate-200 mt-1">Instant Bhu-Aadhaar ULPIN</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Ready for SVAMITVA Gharoni registry</div>
            </div>
          </div>

        </div>
      </section>

      {/* Property Card Modal Dialog */}
      {isPropertyCardOpen && (
        <PropertyCardModal
          parcel={selectedParcel}
          onClose={() => setIsPropertyCardOpen(false)}
        />
      )}

      {/* Live Interactive Verification Workspace Section */}
      <section className="py-12 bg-slate-100/70 border-y border-slate-200">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200 mb-2">
                <ShieldCheck size={14} className="text-teal-600" />
                <span>Live Interactive Workspace</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading">
                Interactive Land Parcel ↔ Document Reconciliation
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
                Select any sample property below to inspect its live satellite map boundary, OCR extracted document tokens, and mathematical area tolerance comparison.
              </p>
            </div>

            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              <Search size={14} className="text-teal-400" />
              <span>Open Full Verification Workspace</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Embedded Property Verification Hub */}
          <PropertyVerificationHub
            initialPropertyId="AS-GJ-124-3A"
            showPipeline={false}
          />
        </div>
      </section>

      {/* 5-Stage Verification Pipeline */}
      <section className="py-14 bg-white border-b border-slate-200">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Methodology &amp; Architecture
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading mt-1">
              Evidence-First Verification Pipeline
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Every verification verdict is backed by traceable OCR tokens, sub-pixel drone plinths, and statutory surveying tolerance math.
            </p>
          </div>

          <AIPipelineFlow currentStage={8} />
        </div>
      </section>

      {/* Persona Use Cases Grid */}
      <section className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Built for the Land Ecosystem
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading mt-1">
              Tailored for Every Stakeholder
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              From individual plot buyers to district revenue surveyors and mortgage risk officers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {USE_CASES.map((uc, idx) => {
              const Icon = uc.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-teal-400/50 transition-all"
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200">
                      <Icon size={20} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {uc.badge}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">{uc.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{uc.desc}</p>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-slate-100 text-xs">
                    {uc.points.map((pt, pIdx) => (
                      <div key={pIdx} className="flex items-center gap-2 text-slate-700 text-[11px]">
                        <CheckCircle2 size={13} className="text-teal-600 shrink-0" />
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Tier Grid */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Transparent Pricing
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading mt-1">
              Simple, Predictable Plans
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Start with a free account, upgrade as your property portfolio and verification volume grows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {PRICING_TIERS.map((tier, idx) => (
              <div
                key={idx}
                className={`bg-white rounded-3xl border p-8 flex flex-col justify-between relative transition-all ${
                  tier.popular
                    ? "border-teal-500 shadow-xl ring-2 ring-teal-500/20"
                    : "border-slate-200 shadow-sm hover:border-slate-300"
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-teal-600 text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-xs">
                    Most Popular
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{tier.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{tier.desc}</p>
                  </div>

                  <div className="py-3 border-y border-slate-100">
                    <span className="text-3xl font-black text-slate-900 font-heading">{tier.price}</span>
                    <span className="text-xs text-slate-400 ml-1.5">{tier.period}</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {tier.features.map((f, fIdx) => (
                      <div key={fIdx} className="flex items-center gap-2 text-slate-600">
                        <Check size={14} className="text-teal-600 shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-8">
                  <Link
                    href={tier.href}
                    className={`w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      tier.popular
                        ? "bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
                        : "bg-slate-900 hover:bg-slate-800 text-white"
                    }`}
                  >
                    <span>{tier.cta}</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Everything you need to know about AeroSync&apos;s verification and evidence methodology.
            </p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="font-bold text-slate-900 text-sm flex items-start gap-2">
                  <HelpCircle size={16} className="text-teal-600 shrink-0 mt-0.5" />
                  <span>{faq.q}</span>
                </div>
                <p className="text-xs text-slate-600 pl-6 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
