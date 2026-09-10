"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { aeroSyncStore } from "@/lib/store";
import {
  Menu,
  X,
  ShieldCheck,
  LayoutDashboard,
  Brain,
  FileText,
  CreditCard,
  ArrowRight,
  Sparkles,
  Map,
} from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const [storeState, setStoreState] = useState(aeroSyncStore.getState());

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    const unsub = aeroSyncStore.subscribe(() => {
      setStoreState({ ...aeroSyncStore.getState() });
    });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      unsub();
    };
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200/80 py-3"
          : "bg-white/85 backdrop-blur-sm border-b border-slate-100 py-3.5"
      }`}
    >
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 flex items-center justify-center transition-transform group-hover:scale-105">
            <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <circle cx="18" cy="18" r="5" stroke="#028090" strokeWidth="2.5" fill="#e0f2f1" />
              <path d="M14 14L8 8M22 14L28 8M14 22L8 28M22 22L28 28" stroke="#028090" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="7" cy="7" r="3" fill="#00a896" />
              <circle cx="29" cy="7" r="3" fill="#00a896" />
              <circle cx="7" cy="29" r="3" fill="#00a896" />
              <circle cx="29" cy="29" r="3" fill="#00a896" />
            </svg>
          </div>
          <span className="text-2xl font-extrabold font-heading text-slate-900 tracking-tight">
            Aero<span className="text-teal-600">Sync</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          <Link
            href="/verify"
            className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100/70 transition-all"
          >
            Verify Property
          </Link>
          <Link
            href="/dashboard"
            className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100/70 transition-all"
          >
            GIS Platform
          </Link>
          <Link
            href="/models"
            className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100/70 transition-all"
          >
            AI Studio
          </Link>
          <Link
            href="/property-cards"
            className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100/70 transition-all"
          >
            Registry
          </Link>
        </nav>

        {/* Auth CTAs */}
        <div className="hidden lg:flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100/70 transition-all"
          >
            Sign In
          </Link>

          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-xs transition-all"
          >
            <span>Get Started Free</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="lg:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden px-4 pt-3 pb-6 bg-white border-b border-slate-200 space-y-3 animate-fadeIn text-xs font-semibold">
          <Link
            href="/verify"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-slate-700 hover:text-slate-900"
          >
            Verify Property
          </Link>
          <Link
            href="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-slate-700 hover:text-slate-900"
          >
            GIS Platform &amp; Workspace
          </Link>
          <Link
            href="/models"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-slate-700 hover:text-slate-900"
          >
            AI Studio
          </Link>
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 border border-slate-200 rounded-xl text-slate-800 font-bold"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 bg-slate-900 text-white rounded-xl font-bold"
            >
              Create Free Workspace
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
