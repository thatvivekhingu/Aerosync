"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { aeroSyncStore, PLAN_LIMITS } from "@/lib/store";
import { Membership, UserRole } from "@/lib/types";
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Crown,
  Lock,
} from "lucide-react";

export default function TeamPage() {
  const [storeState, setStoreState] = useState(aeroSyncStore.getState());
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("MEMBER");
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = aeroSyncStore.subscribe(() => {
      setStoreState({ ...aeroSyncStore.getState() });
    });
    return () => unsub();
  }, []);

  const { currentOrg, memberships, currentUser } = storeState;
  const subscription = aeroSyncStore.getSubscription();
  const limits = PLAN_LIMITS[subscription.plan];

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    setInviteSuccess(null);

    if (!inviteEmail || !inviteEmail.includes("@")) {
      setInviteError("Please enter a valid email address.");
      return;
    }

    if (memberships.length >= limits.teamSeatsMax) {
      setInviteError(
        `Team seat limit reached (${limits.teamSeatsMax} seats on ${subscription.plan} plan). Upgrade to Pro/Business for additional seats.`
      );
      return;
    }

    const newMembership: Membership = {
      id: `mem-${Date.now().toString().slice(-4)}`,
      orgId: currentOrg?.id || "org-demo-01",
      userId: `usr-inv-${Date.now().toString().slice(-4)}`,
      role: inviteRole,
      invitedEmail: inviteEmail,
      status: "PENDING",
      joinedAt: new Date().toISOString(),
    };

    storeState.memberships.push(newMembership);
    aeroSyncStore.addAuditLog(
      "TEAM_MEMBER_INVITED",
      "TEAM",
      inviteEmail,
      `Invited ${inviteEmail} with role ${inviteRole}.`
    );
    setInviteSuccess(`Invitation sent to ${inviteEmail}.`);
    setInviteEmail("");
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 font-heading">
              Team &amp; Workspace Access
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage workspace members, role-based permissions, and invite surveyors or legal assistants.
            </p>
          </div>

          <div className="text-xs font-mono bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs">
            Seats Used: <strong className="text-slate-900">{memberships.length}</strong> / {limits.teamSeatsMax}
          </div>
        </div>

        {/* Invite Member Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <UserPlus size={16} className="text-teal-600" />
            <span>Invite New Team Member</span>
          </div>

          {inviteSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>{inviteSuccess}</span>
            </div>
          )}

          {inviteError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle size={16} className="text-rose-600" />
              <span>{inviteError}</span>
            </div>
          )}

          <form onSubmit={handleInvite} className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
            <div className="sm:col-span-6 relative">
              <Mail size={15} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@organization.com"
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            <div className="sm:col-span-3">
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as UserRole)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white text-slate-900"
              >
                <option value="ADMIN">Admin (Full Access)</option>
                <option value="MEMBER">Member (Upload &amp; Verify)</option>
                <option value="VIEWER">Viewer (Read Only)</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
              >
                <UserPlus size={14} />
                <span>Send Invite</span>
              </button>
            </div>
          </form>
        </div>

        {/* Members Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 font-bold text-slate-900 text-xs uppercase tracking-wider">
            Workspace Members ({memberships.length})
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {/* Active User (Owner) */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                  {currentUser?.fullName?.charAt(0) || "U"}
                </div>
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>{currentUser?.fullName}</span>
                    <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-semibold">
                      You
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">{currentUser?.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                  <Crown size={11} className="text-amber-600" />
                  <span>WORKSPACE OWNER</span>
                </span>
              </div>
            </div>

            {/* Other Members / Invites */}
            {memberships
              .filter((m) => m.userId !== currentUser?.id)
              .map((mem) => (
                <div key={mem.id} className="p-4 flex items-center justify-between hover:bg-slate-50/60">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                      {mem.invitedEmail?.charAt(0).toUpperCase() || "M"}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{mem.invitedEmail}</div>
                      <div className="text-[11px] text-slate-500">Status: {mem.status}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {mem.role}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
