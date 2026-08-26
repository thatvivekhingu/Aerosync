"use client";

import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer id="contact" className="bg-slate-950 text-slate-300 pt-16 pb-10 border-t border-slate-900">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-slate-900">
          
          {/* Col 1 */}
          <div className="lg:col-span-5 flex flex-col gap-3.5">
            <Link href="#home" className="text-2xl font-extrabold font-heading text-white tracking-tight">
              Aero<span className="text-teal-emerald">Sync</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Automated Cadastral Feature Extraction &amp; Land Intelligence Platform for the SVAMITVA Scheme and Department of Land Resources (DoLR), Ministry of Rural Development.
            </p>
          </div>

          {/* Col 2 */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            <h4 className="text-sm font-bold font-heading text-white uppercase tracking-wider">Modules</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-400">
              <li><Link href="#dashboard" className="hover:text-teal-emerald transition-colors">Drone Tiling Engine</Link></li>
              <li><Link href="#dashboard" className="hover:text-teal-emerald transition-colors">Attention ResUNet</Link></li>
              <li><Link href="#dashboard" className="hover:text-teal-emerald transition-colors">90° Orthogonalization</Link></li>
              <li><Link href="#dashboard" className="hover:text-teal-emerald transition-colors">Cadastral RAG / LLM</Link></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            <h4 className="text-sm font-bold font-heading text-white uppercase tracking-wider">Government SOPs</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-400">
              <li><a href="#" className="hover:text-teal-emerald transition-colors">SVAMITVA Scheme</a></li>
              <li><a href="#" className="hover:text-teal-emerald transition-colors">DoLR PS 26012</a></li>
              <li><a href="#" className="hover:text-teal-emerald transition-colors">ULPIN Guidelines</a></li>
              <li><a href="#" className="hover:text-teal-emerald transition-colors">DILRMP Standards</a></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            <h4 className="text-sm font-bold font-heading text-white uppercase tracking-wider">Resources</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-400">
              <li><a href="https://github.com/thatvivekhingu/AeroSync" className="hover:text-teal-emerald transition-colors">GitHub Repository</a></li>
              <li><a href="#" className="hover:text-teal-emerald transition-colors">Model Cards &amp; Metrics</a></li>
              <li><a href="#" className="hover:text-teal-emerald transition-colors">44/44 Verified Tests</a></li>
              <li><a href="#" className="hover:text-teal-emerald transition-colors">API Documentation</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright row */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>&copy; 2026 AeroSync — AI Cadastral Land Intelligence. All rights reserved.</div>
          <div>Developed under Problem Statement ID: 26012 | DoLR, Ministry of Rural Development</div>
        </div>

      </div>
    </footer>
  );
}
