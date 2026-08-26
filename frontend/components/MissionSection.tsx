"use client";

import React from "react";
import { Plane, Cpu, Map, FileCheck } from "lucide-react";

export default function MissionSection() {
  const cards = [
    {
      icon: <Plane className="w-7 h-7 text-primary group-hover:text-white transition-colors" />,
      title: "Drone Data Acquisition",
      description: "High-resolution aerial imagery captured for accurate mapping.",
    },
    {
      icon: <Cpu className="w-7 h-7 text-primary group-hover:text-white transition-colors" />,
      title: "AI & Computer Vision",
      description: "Advanced models extract features and detect land boundaries.",
    },
    {
      icon: <Map className="w-7 h-7 text-primary group-hover:text-white transition-colors" />,
      title: "Geospatial Processing",
      description: "Georeferencing, stitching and terrain analysis for precision.",
    },
    {
      icon: <FileCheck className="w-7 h-7 text-primary group-hover:text-white transition-colors" />,
      title: "Digital Land Records",
      description: "Generate accurate, standardized and secure cadastral records.",
    },
  ];

  return (
    <section id="features" className="py-16 md:py-24 bg-white border-t border-slate-100">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900 mb-3 tracking-tight">
            Our Mission
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            To digitize and modernize land records using advanced drone technology and AI, enabling transparency, reducing disputes and empowering rural communities.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, idx) => (
            <div
              key={idx}
              className="group bg-white p-7 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:-translate-y-1.5 hover:border-primary/40 transition-all duration-300 flex flex-col gap-4"
            >
              <div className="w-14 h-14 rounded-xl bg-primary-light group-hover:bg-primary flex items-center justify-center transition-colors duration-300">
                {card.icon}
              </div>
              <h3 className="text-xl font-bold font-heading text-slate-900 group-hover:text-primary transition-colors">
                {card.title}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {card.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
