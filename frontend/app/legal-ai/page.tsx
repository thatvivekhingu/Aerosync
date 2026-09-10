"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RagChatbot from "@/components/RagChatbot";
import { Bot, BookOpen, Scale, Sparkles, HelpCircle, ShieldCheck } from "lucide-react";

export default function LegalAiPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#f8fbfa] text-slate-800">
      <Navbar />

      {/* ── Page Header ── */}
      <section className="bg-white border-b border-slate-200/80 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1360px] mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold mb-3 shadow-xs">
            <Bot size={14} className="text-purple-600" />
            <span>Cadastral RAG &amp; Statutory Legal LLM</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900 tracking-tight mb-2">
            AI Legal &amp; Revenue Code Intelligence
          </h1>
          <p className="max-w-2xl mx-auto text-slate-600 text-xs sm:text-sm leading-relaxed">
            Instant legal citations, dispute resolution guidelines, and statutory rights queries across UP, MP, Maharashtra, and Gujarat revenue codes.
          </p>
        </div>
      </section>

      {/* ── Main Chat Workspace ── */}
      <main className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm">
          <RagChatbot />
        </div>

        {/* Suggested Queries & Legal Guidance */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <BookOpen size={16} />
              <span>SVAMITVA Guidelines</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Provides procedural guidance on Gram Sabha notifications, Inquiry Officer hearings (15-day dispute window), and final Property Card issuance.
            </p>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-purple-600 font-bold text-sm">
              <Scale size={16} />
              <span>Abadi Land Rights (आबादी)</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Clarifies legal difference between agricultural land (Khatauni) and inhabited village Abadi land, establishing clear title for home loans.
            </p>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-teal-600 font-bold text-sm">
              <ShieldCheck size={16} />
              <span>Revenue Court Precedents</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Cites relevant High Court judgments regarding drone survey evidence admissibility and partition disputes among co-sharers.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
