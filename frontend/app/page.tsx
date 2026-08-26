"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import MissionSection from "@/components/MissionSection";
import MapboxViewer from "@/components/MapboxViewer";
import ParcelInspector from "@/components/ParcelInspector";
import RagChatbot from "@/components/RagChatbot";
import PropertyCardModal from "@/components/PropertyCardModal";
import ComplianceAuditor from "@/components/ComplianceAuditor";
import ChangeDetectionViewer from "@/components/ChangeDetectionViewer";
import Footer from "@/components/Footer";
import { CadastralParcel, CADASTRAL_PARCELS } from "@/data/parcels";
import { Map, Bot, FileText, ShieldAlert, History } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"gis" | "rag" | "compliance" | "changedetect">("gis");
  const [selectedParcel, setSelectedParcel] = useState<CadastralParcel>(CADASTRAL_PARCELS[0]);
  const [showPropertyCardModal, setShowPropertyCardModal] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Navigation */}
      <Navbar />

      {/* Hero Section */}
      <Hero />

      {/* Mission & Feature Cards Section */}
      <MissionSection />

      {/* Interactive Cadastral Intelligence Platform Section */}
      <section id="dashboard" className="py-16 md:py-24 bg-[#f0f7f6] border-t border-slate-200">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Dashboard Header */}
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900 mb-3 tracking-tight">
              Interactive Cadastral Intelligence Platform
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Explore live drone parcel segmentation, audit setback compliance, query legal land guidelines via AI, track bi-temporal mutations, and draft official SVAMITVA Property Cards.
            </p>
          </div>

          {/* Tab Navigation Controls */}
          <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 bg-slate-200/80 backdrop-blur rounded-2xl w-fit mx-auto mb-8 shadow-inner">
            <button
              onClick={() => setActiveTab("gis")}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                activeTab === "gis"
                  ? "bg-white text-primary shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Map size={16} />
              <span>Live Mapbox GIS &amp; Parcel Inspector</span>
            </button>

            <button
              onClick={() => setActiveTab("changedetect")}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                activeTab === "changedetect"
                  ? "bg-white text-primary shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <History size={16} />
              <span>Bi-Temporal Change Tracker</span>
            </button>

            <button
              onClick={() => setActiveTab("rag")}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                activeTab === "rag"
                  ? "bg-white text-primary shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Bot size={16} />
              <span>Cadastral RAG &amp; AI Chat</span>
            </button>

            <button
              onClick={() => setActiveTab("compliance")}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                activeTab === "compliance"
                  ? "bg-white text-primary shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ShieldAlert size={16} />
              <span>Buffer &amp; Encroachment Audit</span>
            </button>
          </div>

          {/* Active Tab Content */}
          {activeTab === "gis" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white border border-slate-200 rounded-3xl p-6 lg:p-7 shadow-lg animate-fadeIn">
              <div className="lg:col-span-8">
                <MapboxViewer
                  selectedParcel={selectedParcel}
                  onSelectParcel={(p) => setSelectedParcel(p)}
                />
              </div>

              <div className="lg:col-span-4">
                <ParcelInspector
                  parcel={selectedParcel}
                  onOpenPropertyCard={() => setShowPropertyCardModal(true)}
                />
              </div>
            </div>
          )}

          {activeTab === "changedetect" && (
            <div className="animate-fadeIn">
              <ChangeDetectionViewer />
            </div>
          )}

          {activeTab === "rag" && (
            <div className="animate-fadeIn">
              <RagChatbot />
            </div>
          )}

          {activeTab === "compliance" && (
            <div className="animate-fadeIn">
              <ComplianceAuditor />
            </div>
          )}

        </div>
      </section>

      {/* Property Card Modal Dialog */}
      {showPropertyCardModal && (
        <PropertyCardModal
          parcel={selectedParcel}
          onClose={() => setShowPropertyCardModal(false)}
        />
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
