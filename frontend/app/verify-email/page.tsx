"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, CheckCircle2, ArrowRight, RefreshCw } from "lucide-react";

export default function VerifyEmailPage() {
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleResend = () => {
    setResending(true);
    setTimeout(() => {
      setResending(false);
      setResent(true);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto space-y-6">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto">
            <Mail size={28} />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Verify your email address
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              We have sent a verification confirmation to your email. Click the link in the message to activate all features.
            </p>
          </div>

          {resent && (
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-800 font-semibold flex items-center justify-center gap-2">
              <CheckCircle2 size={16} />
              <span>Verification email resent!</span>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <Link
              href="/dashboard"
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2"
            >
              <span>Continue to Workspace</span>
              <ArrowRight size={14} />
            </Link>

            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="w-full py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
            >
              <RefreshCw size={13} className={resending ? "animate-spin" : ""} />
              <span>Resend Verification Email</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
