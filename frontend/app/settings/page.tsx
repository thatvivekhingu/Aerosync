"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { aeroSyncStore } from "@/lib/store";
import {
  Settings,
  User,
  Building,
  Key,
  Bell,
  Shield,
  Trash2,
  CheckCircle2,
  Copy,
  Plus,
  Lock,
} from "lucide-react";

export default function SettingsPage() {
  const [storeState, setStoreState] = useState(aeroSyncStore.getState());
  const [activeTab, setActiveTab] = useState<"profile" | "workspace" | "api" | "security">("profile");

  const [fullName, setFullName] = useState(storeState.currentUser?.fullName || "");
  const [email, setEmail] = useState(storeState.currentUser?.email || "");
  const [phone, setPhone] = useState(storeState.currentUser?.phone || "");
  const [workspaceName, setWorkspaceName] = useState(storeState.currentOrg?.name || "");
  const [stateName, setStateName] = useState(storeState.currentOrg?.state || "Gujarat");

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  useEffect(() => {
    const unsub = aeroSyncStore.subscribe(() => {
      setStoreState({ ...aeroSyncStore.getState() });
    });
    return () => unsub();
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (storeState.currentUser) {
      storeState.currentUser.fullName = fullName;
      storeState.currentUser.phone = phone;
    }
    if (storeState.currentOrg) {
      storeState.currentOrg.name = workspaceName;
      storeState.currentOrg.state = stateName;
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleCreateApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName) return;

    const rawKey = `asy_live_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    const newKey = {
      id: `key-${Date.now().toString().slice(-4)}`,
      orgId: storeState.currentOrg?.id || "org-demo-01",
      name: newKeyName,
      keyPrefix: rawKey.slice(0, 12),
      keyHash: "sha256_mock_hash",
      permissions: ["read:properties", "create:verifications"],
      lastUsedAt: "Just now",
      createdAt: new Date().toISOString(),
    };

    storeState.apiKeys.push(newKey);
    setGeneratedKey(rawKey);
    setNewKeyName("");
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-heading">
            Workspace &amp; Account Settings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your personal profile, workspace parameters, API keys, and security controls.
          </p>
        </div>

        {/* Settings Tab Bar */}
        <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-semibold">
          {[
            { id: "profile", label: "Profile & Identity", icon: User },
            { id: "workspace", label: "Workspace Settings", icon: Building },
            { id: "api", label: "API Keys & Integrations", icon: Key },
            { id: "security", label: "Security & Privacy", icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 px-3 flex items-center gap-1.5 transition-all border-b-2 ${
                  active
                    ? "border-teal-600 text-teal-900 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {savedSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>Settings successfully updated.</span>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs max-w-2xl space-y-5">
            <h3 className="font-bold text-slate-900 text-sm">Personal Profile</h3>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-xs"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Workspace Tab */}
        {activeTab === "workspace" && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs max-w-2xl space-y-5">
            <h3 className="font-bold text-slate-900 text-sm">Workspace Information</h3>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Workspace Name</label>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Primary State Jurisdiction</label>
                <select
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900"
                >
                  <option value="Gujarat">Gujarat (AnyRoR / Jantri)</option>
                  <option value="Uttar Pradesh">Uttar Pradesh (SVAMITVA / Bhulekh)</option>
                  <option value="Maharashtra">Maharashtra (Mahabhulekh)</option>
                  <option value="Madhya Pradesh">Madhya Pradesh (MP Bhulekh)</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-xs"
                >
                  Save Workspace Changes
                </button>
              </div>
            </form>
          </div>
        )}

        {/* API Keys Tab */}
        {activeTab === "api" && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs max-w-3xl space-y-6">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">API Keys &amp; Webhook Access</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Authenticate programmatic requests to AeroSync Verification &amp; Property Endpoints.
              </p>
            </div>

            {generatedKey && (
              <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl space-y-2 text-xs">
                <div className="font-bold text-teal-900">New Secret API Key Generated:</div>
                <div className="p-2 bg-slate-900 text-teal-300 font-mono rounded-lg select-all">
                  {generatedKey}
                </div>
                <div className="text-[11px] text-teal-800">
                  Copy this key now. For security reasons, it will not be displayed again.
                </div>
              </div>
            )}

            <form onSubmit={handleCreateApiKey} className="flex gap-2 text-xs">
              <input
                type="text"
                required
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g. Drone Pipeline Webhook / Mobile App"
                className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-slate-900"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs"
              >
                Generate Key
              </button>
            </form>

            <div className="divide-y divide-slate-100 text-xs border border-slate-200 rounded-xl overflow-hidden">
              {storeState.apiKeys.map((k) => (
                <div key={k.id} className="p-3.5 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">{k.name}</div>
                    <div className="font-mono text-[11px] text-slate-400">{k.keyPrefix}...</div>
                  </div>
                  <div className="text-[11px] text-slate-500">Last used: {k.lastUsedAt}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Security & Danger Zone Tab */}
        {activeTab === "security" && (
          <div className="space-y-6 max-w-2xl">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
              <h3 className="font-bold text-slate-900 text-sm">Security Controls</h3>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <div>
                  <div className="font-bold text-slate-800">Two-Factor Authentication (2FA)</div>
                  <div className="text-[11px] text-slate-500">Protect logins with TOTP authenticator</div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px]">
                  OPTIONAL
                </span>
              </div>
            </div>

            <div className="bg-rose-50/50 p-6 rounded-2xl border border-rose-200 shadow-xs space-y-3 text-xs text-rose-900">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                <Trash2 size={16} />
                <span>Danger Zone</span>
              </div>
              <p className="text-[11px] text-rose-700">
                Deleting this workspace will permanently erase all mapped parcel geometries, documents, verification jobs, and Section 65B certificates.
              </p>
              <button className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-xs">
                Delete Workspace Permanently
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
