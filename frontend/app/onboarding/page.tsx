"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { aeroSyncStore } from "@/lib/store";
import {
  ShieldCheck,
  Building,
  MapPin,
  FileCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Layers,
  Map,
} from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [workspaceName, setWorkspaceName] = useState("");
  const [stateName, setStateName] = useState("Gujarat");
  const [districtName, setDistrictName] = useState("Ahmedabad");
  const [useCase, setUseCase] = useState("LANDOWNER");

  const handleComplete = () => {
    const state = aeroSyncStore.getState();
    if (state.currentOrg) {
      state.currentOrg.name = workspaceName || state.currentOrg.name;
      state.currentOrg.state = stateName;
      state.currentOrg.district = districtName;
    }
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full mx-auto space-y-6">
        {/* Progress Bar */}
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
          <span>Step {step} of 3</span>
          <span className="text-teal-700 font-bold">
            {step === 1 ? "Purpose & Persona" : step === 2 ? "Workspace Location" : "Ready to Verify"}
          </span>
        </div>
        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-teal-600 h-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Welcome to AeroSync! What will you use it for?
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  We customize your dashboard tools and verification workflows based on your primary role.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    id: "LANDOWNER",
                    title: "My Property",
                    desc: "Verify my land documents against drone surveys & satellite maps.",
                    icon: ShieldCheck,
                  },
                  {
                    id: "SURVEYOR",
                    title: "Surveying & GIS",
                    desc: "Delineate plinths, verify cadastre boundaries & export reports.",
                    icon: Map,
                  },
                  {
                    id: "LEGAL",
                    title: "Legal & Due-Diligence",
                    desc: "Audit property records, check encroachment & generate title notes.",
                    icon: FileCheck,
                  },
                  {
                    id: "ENTERPRISE",
                    title: "Organization / Bank",
                    desc: "Manage team verifications, collateral validation & API access.",
                    icon: Building,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = useCase === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setUseCase(item.id)}
                      className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                        isSelected
                          ? "border-teal-600 bg-teal-50/60 ring-2 ring-teal-500/20"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center mb-3">
                        <Icon size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{item.title}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                          {item.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2"
              >
                <span>Continue</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Configure your primary operating area
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Sets your default state land revenue code guidelines and map coordinate projection.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Workspace Name
                  </label>
                  <input
                    type="text"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    placeholder="e.g. Patel Family Land Holdings or Gujarat Survey Team"
                    className="block w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl shadow-xs focus:ring-teal-500 focus:border-teal-500 text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Primary State
                    </label>
                    <select
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      className="block w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl shadow-xs bg-white text-slate-900"
                    >
                      <option value="Gujarat">Gujarat (AnyRoR / Jantri)</option>
                      <option value="Uttar Pradesh">Uttar Pradesh (Bhulekh / SVAMITVA)</option>
                      <option value="Maharashtra">Maharashtra (Mahabhulekh)</option>
                      <option value="Madhya Pradesh">Madhya Pradesh (MP Bhulekh)</option>
                      <option value="Karnataka">Karnataka (Bhoomi)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Primary District
                    </label>
                    <input
                      type="text"
                      value={districtName}
                      onChange={(e) => setDistrictName(e.target.value)}
                      placeholder="e.g. Ahmedabad, Varanasi"
                      className="block w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl shadow-xs text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                >
                  <span>Continue</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center mx-auto">
                <Sparkles size={28} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Your Workspace is Ready!
                </h2>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  You can now add your first land parcel or upload a property card to verify cadastral consistency.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-left text-slate-600 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-slate-800">
                  <CheckCircle2 size={16} className="text-teal-600 shrink-0" />
                  <span>Free Plan Activated (5 properties, 5 documents/mo)</span>
                </div>
                <div className="flex items-center gap-2 font-semibold text-slate-800">
                  <CheckCircle2 size={16} className="text-teal-600 shrink-0" />
                  <span>Section 65B Audit Trail &amp; Evidence Engine Enabled</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleComplete}
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <span>Enter AeroSync Workspace</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
