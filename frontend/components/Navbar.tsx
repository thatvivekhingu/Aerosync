"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200/80 py-3"
          : "bg-white/80 backdrop-blur-sm border-b border-slate-100 py-4"
      }`}
    >
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link href="#home" className="flex items-center gap-2.5 group">
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
            Aero<span className="text-primary">Sync</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7">
          <Link href="#home" className="text-sm font-semibold text-primary relative py-1 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-primary after:rounded-full">
            Home
          </Link>
          <Link href="#features" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">
            Features
          </Link>
          <Link href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">
            How It Works
          </Link>
          <Link href="#modules" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">
            Modules
          </Link>
          <Link href="#use-cases" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">
            Use Cases
          </Link>
          <Link href="#about" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">
            About Us
          </Link>
          <Link href="#contact" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">
            Contact
          </Link>
        </nav>

        {/* Action Button */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="#dashboard"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-glow-primary hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100"
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-6 py-4 flex flex-col gap-3 shadow-lg">
          <Link href="#home" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold text-primary">Home</Link>
          <Link href="#features" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-slate-700">Features</Link>
          <Link href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-slate-700">How It Works</Link>
          <Link href="#modules" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-slate-700">Modules</Link>
          <Link href="#dashboard" onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-2.5 mt-2 rounded-lg bg-primary text-white text-sm font-semibold">
            Explore Dashboard
          </Link>
        </div>
      )}
    </header>
  );
}
