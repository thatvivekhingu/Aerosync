"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthService } from "@/lib/services/auth-service";
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Building,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [persona, setPersona] = useState<"LANDOWNER" | "SURVEYOR" | "LEGAL" | "ENTERPRISE">("LANDOWNER");
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      setError("Please accept the terms of service and evidence disclaimer.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await AuthService.register(email, fullName, password, persona);
    setLoading(false);

    if (res.success) {
      router.push("/onboarding");
    } else {
      setError(res.error || "Registration failed.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-4 group">
          <div className="w-10 h-10 flex items-center justify-center transition-transform group-hover:scale-105">
            <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <circle cx="18" cy="18" r="5" stroke="#028090" strokeWidth="2.5" fill="#e0f2f1" />
              <path d="M14 14L8 8M22 14L28 8M14 22L8 28M22 22L28 28" stroke="#028090" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="7" cy="7" r="3" fill="#00a896" />
              <circle cx="29" cy="7" r="3" fill="#00a896" />
              <circle cx="7" cy="29" r="3" fill="#00a896" />
              <circle cx="29" cy="29" r="3" fill="#00a896" />
            </svg>
          </div>
          <span className="text-3xl font-extrabold font-heading text-slate-900 tracking-tight">
            Aero<span className="text-teal-600">Sync</span>
          </span>
        </Link>

        <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900">
          Create your Free Workspace
        </h2>
        <p className="mt-1 text-center text-xs text-slate-600">
          Start verifying property documents against mapped cadastral parcels
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User size={15} />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Harish Patel"
                  className="block w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl shadow-xs focus:ring-teal-500 focus:border-teal-500 text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={15} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="harish@example.com"
                  className="block w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl shadow-xs focus:ring-teal-500 focus:border-teal-500 text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={15} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="block w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl shadow-xs focus:ring-teal-500 focus:border-teal-500 text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Primary Use Case
              </label>
              <select
                value={persona}
                onChange={(e) => setPersona(e.target.value as any)}
                className="block w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl shadow-xs bg-white focus:ring-teal-500 focus:border-teal-500 text-slate-900"
              >
                <option value="LANDOWNER">Individual Landowner / Property Buyer</option>
                <option value="SURVEYOR">GIS Surveyor / Drone Operator</option>
                <option value="LEGAL">Lawyer / Real Estate Due-Diligence</option>
                <option value="ENTERPRISE">Bank / Financial Institution / Enterprise</option>
              </select>
            </div>

            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="terms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <label htmlFor="terms" className="text-[11px] text-slate-600 leading-tight">
                I understand AeroSync verifies document consistency against GIS maps and does not independently grant or certify legal ownership.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all"
            >
              {loading ? (
                <span>Creating Workspace...</span>
              ) : (
                <>
                  <span>Create Workspace &amp; Continue</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-teal-700 hover:text-teal-800 hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
