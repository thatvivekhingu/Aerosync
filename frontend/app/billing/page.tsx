"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { aeroSyncStore, PLAN_LIMITS } from "@/lib/store";
import { SubscriptionPlan } from "@/lib/types";
import {
  CreditCard,
  CheckCircle2,
  Sparkles,
  Download,
  ShieldCheck,
  Zap,
  Building,
  HelpCircle,
} from "lucide-react";

export default function BillingPage() {
  const [storeState, setStoreState] = useState(aeroSyncStore.getState());
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<"MONTHLY" | "ANNUAL">("ANNUAL");

  useEffect(() => {
    const unsub = aeroSyncStore.subscribe(() => {
      setStoreState({ ...aeroSyncStore.getState() });
    });
    return () => unsub();
  }, []);

  const subscription = aeroSyncStore.getSubscription();

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    aeroSyncStore.updateSubscriptionPlan(plan);
  };

  const plans = [
    {
      id: "FREE" as SubscriptionPlan,
      name: "Free",
      priceMonthly: "₹0",
      priceAnnual: "₹0",
      desc: "For individual landowners verifying a single parcel or exploring sample datasets.",
      features: [
        "Up to 5 Mapped Properties",
        "5 Document Ingestions / mo",
        "3 Verification Jobs / mo",
        "Section 65B Certificate",
        "Standard Community Support",
      ],
    },
    {
      id: "PRO" as SubscriptionPlan,
      name: "Pro Surveyor",
      priceMonthly: "₹2,499 / mo",
      priceAnnual: "₹1,999 / mo",
      popular: true,
      desc: "For GIS surveyors, independent drone operators, and legal researchers.",
      features: [
        "Up to 100 Properties",
        "100 Document Ingestions / mo",
        "50 Verification Jobs / mo",
        "Sub-pixel Plinth Delineations",
        "5 Team Member Seats",
        "Priority Support",
      ],
    },
    {
      id: "BUSINESS" as SubscriptionPlan,
      name: "Business / Law Firm",
      priceMonthly: "₹7,999 / mo",
      priceAnnual: "₹6,499 / mo",
      desc: "For real estate due-diligence teams, banks, and survey agencies.",
      features: [
        "Up to 500 Properties",
        "500 Documents / mo",
        "300 Verifications / mo",
        "REST API & Webhooks Access",
        "20 Team Member Seats",
        "Custom Logo On Reports",
      ],
    },
    {
      id: "ENTERPRISE" as SubscriptionPlan,
      name: "Enterprise / State Agency",
      priceMonthly: "Custom",
      priceAnnual: "Custom",
      desc: "For state land revenue departments, large NBFCs, and sovereign agencies.",
      features: [
        "Unlimited Properties & Documents",
        "Dedicated Drone Pipeline GPU",
        "Custom State Land Code RAG",
        "SLA & Dedicated Account Lead",
        "On-Prem / Private Cloud Deploy",
      ],
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-heading">
            Subscription Plans &amp; Billing
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Choose the appropriate tier for your cadastral verification requirements and team volume.
          </p>
        </div>

        {/* Current Plan Overview */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-bold text-slate-400 uppercase">Active Subscription</div>
            <div className="text-xl font-bold text-slate-900 flex items-center gap-2 font-heading">
              <span>{subscription.plan} Workspace Tier</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-800 border border-emerald-200">
                Active
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Payment Method: Visa ending in 4242 • Next invoice on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all">
              Update Payment Method
            </button>
          </div>
        </div>

        {/* Plan Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((p) => {
            const isCurrent = subscription.plan === p.id;
            return (
              <div
                key={p.id}
                className={`bg-white rounded-2xl border p-6 flex flex-col justify-between transition-all relative ${
                  p.popular
                    ? "border-teal-500 shadow-lg ring-2 ring-teal-500/20"
                    : "border-slate-200 shadow-xs hover:border-slate-300"
                }`}
              >
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs">
                    Most Popular
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{p.name}</h3>
                    <p className="text-[11px] text-slate-500 mt-1 min-h-[32px]">{p.desc}</p>
                  </div>

                  <div className="py-2 border-y border-slate-100">
                    <div className="text-2xl font-black text-slate-900 font-heading">
                      {selectedBillingCycle === "ANNUAL" ? p.priceAnnual : p.priceMonthly}
                    </div>
                    <div className="text-[10px] text-slate-400">Billed annually</div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="text-[10px] font-bold uppercase text-slate-400">Included Features:</div>
                    {p.features.map((f, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-slate-600 text-[11px]">
                        <CheckCircle2 size={13} className="text-teal-600 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6">
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full py-2.5 bg-teal-50 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold cursor-default"
                    >
                      Current Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePlanSelect(p.id)}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                    >
                      Switch to {p.name}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Invoices History Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 font-bold text-slate-900 text-xs uppercase tracking-wider">
            Billing History &amp; GST Invoices
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            <div className="p-4 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900">Invoice #INV-2026-0814</div>
                <div className="text-[11px] text-slate-500">14 Aug 2026 • Pro Plan Annual Subscription</div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-mono font-bold text-slate-900">₹23,988</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  PAID
                </span>
                <button className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600">
                  <Download size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
