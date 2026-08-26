"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Play, ShieldCheck, MapPin, Lock, Clock } from "lucide-react";

export default function Hero() {
  return (
    <section id="home" className="relative pt-8 pb-16 md:pt-12 md:pb-20 overflow-hidden">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left Column: Content */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            
            {/* Tag / Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-light text-primary text-xs font-semibold w-fit border border-primary/20">
              <span className="w-2 h-2 rounded-full bg-teal-accent animate-ping"></span>
              <span>Problem Statement ID: 26012 | DoLR, Ministry of Rural Development</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold font-heading text-slate-900 leading-[1.14] tracking-tight">
              AI-Powered Cadastral Land Intelligence from{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#028090] via-[#00a896] to-[#02c39a]">
                Drone Imagery
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
              AeroSync is an end-to-end platform that uses AI, computer vision and geospatial intelligence to generate accurate, reliable and tamper-proof land records from drone data.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="#dashboard"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-base font-semibold shadow-glow-primary hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
              >
                <span>Explore Platform</span>
                <ArrowRight size={18} />
              </Link>

              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-lg bg-transparent hover:bg-primary/5 text-slate-800 border-2 border-primary text-base font-semibold transition-all duration-200"
              >
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Play size={12} className="fill-primary ml-0.5" />
                </div>
                <span>Watch Overview</span>
              </a>
            </div>

            {/* 4 Trust Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 pt-6 border-t border-slate-200 mt-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 text-primary flex items-center justify-center flex-shrink-0">
                  <ShieldCheck size={24} className="stroke-[2.2]" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-slate-700 leading-tight">
                  Accurate &amp; Reliable
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 text-primary flex items-center justify-center flex-shrink-0">
                  <MapPin size={24} className="stroke-[2.2]" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-slate-700 leading-tight">
                  Geospatial Intelligence
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 text-primary flex items-center justify-center flex-shrink-0">
                  <Lock size={24} className="stroke-[2.2]" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-slate-700 leading-tight">
                  Secure &amp; Tamper-proof
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 text-primary flex items-center justify-center flex-shrink-0">
                  <Clock size={24} className="stroke-[2.2]" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-slate-700 leading-tight">
                  Efficient &amp; Scalable
                </span>
              </div>
            </div>

          </div>

          {/* Right Column: Hero Drone Media Graphic */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/80 group">
              <Image
                src="/hero_drone.jpg"
                alt="AeroSync Drone Cadastral Mapping"
                width={800}
                height={500}
                className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                priority
              />

              {/* Floating Overlay Chip */}
              <div className="absolute bottom-5 left-5 bg-slate-950/85 backdrop-blur-md text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2.5 border border-white/20 shadow-xl">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] pulse-dot"></div>
                <span>SVAMITVA AI Engine Online • 44 Tests Validated</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
