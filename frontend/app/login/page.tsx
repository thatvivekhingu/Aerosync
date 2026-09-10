"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthService } from "@/lib/services/auth-service";
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Layers,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await AuthService.login(email, password);
    setLoading(false);

    if (res.success) {
      router.push("/dashboard");
    } else {
      setError(res.error || "Invalid credentials.");
    }
  };

  const handleQuickDemo = async () => {
    setLoading(true);
    const res = await AuthService.login("vivek@aerosync.io");
    setLoading(false);
    if (res.success) {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
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
          Sign in to your Workspace
        </h2>
        <p className="mt-1 text-center text-xs text-slate-600">
          Property Document &amp; Geospatial Verification Platform
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10 space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* 1-Click Demo Account */}
          <button
            type="button"
            onClick={handleQuickDemo}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200/90 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            <Sparkles size={14} className="text-teal-600" />
            <span>Launch Live Demo Workspace (1-Click)</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-slate-200" />
            <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider absolute">
              Or sign in with email
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="name@organization.com"
                  className="block w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl shadow-xs focus:ring-teal-500 focus:border-teal-500 text-slate-900"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-semibold text-teal-700 hover:text-teal-800"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={15} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl shadow-xs focus:ring-teal-500 focus:border-teal-500 text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to Workspace</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-600">
            Don&apos;t have an account yet?{" "}
            <Link
              href="/register"
              className="font-bold text-teal-700 hover:text-teal-800 hover:underline"
            >
              Create a free workspace
            </Link>
          </div>
        </div>

        {/* Security & Disclaimer Footer */}
        <p className="mt-6 text-center text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto">
          AeroSync is an evidence-first verification layer. Possession of property documents does not constitute legal title of ownership.
        </p>
      </div>
    </div>
  );
}
