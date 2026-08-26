"use client";

import React from "react";
import { CadastralParcel } from "@/data/parcels";
import { X, Printer, Download, CheckCircle2, Sun, Coins, Home } from "lucide-react";

interface PropertyCardModalProps {
  parcel: CadastralParcel;
  onClose: () => void;
}

export default function PropertyCardModal({ parcel, onClose }: PropertyCardModalProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-lg">📜</span>
            <h3 className="font-bold font-heading text-slate-900">SVAMITVA Property Card Official Draft</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Printable Card Area */}
        <div className="p-8 overflow-y-auto flex-1 font-serif text-slate-900 bg-white" id="printableCard">
          
          {/* Official Emblem & Header */}
          <div className="text-center border-b-2 border-slate-900 pb-4 mb-5">
            <div className="text-xs uppercase tracking-widest text-slate-600 font-sans font-bold">
              Government of India • Ministry of Panchayati Raj &amp; Survey of India
            </div>
            <h2 className="text-2xl font-black tracking-wide text-slate-950 uppercase mt-1">
              SVAMITVA PROPERTY CARD (संपत्ति पत्रक / घरौनी)
            </h2>
            <p className="text-xs text-slate-600 font-sans mt-0.5">
              Record of Rights issued under SVAMITVA Scheme via Drone Orthomosaic Survey (Problem Statement ID: 26012 / SIH 1705)
            </p>
          </div>

          {/* 2-Column Administrative & Ownership Details */}
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div className="border border-slate-300 rounded p-3 bg-slate-50/70">
              <div className="font-sans font-bold text-xs uppercase text-slate-500 border-b border-slate-200 pb-1 mb-2">
                1. Administrative Location
              </div>
              <div className="space-y-1 text-xs font-sans">
                <div><strong>State:</strong> {parcel.state}</div>
                <div><strong>District:</strong> {parcel.district}</div>
                <div><strong>Tehsil:</strong> Sadar</div>
                <div><strong>Village / Mauza:</strong> {parcel.village} (LGD: 260120)</div>
                <div><strong>Khasra / Khata No:</strong> {parcel.khasra}</div>
              </div>
            </div>

            <div className="border border-slate-300 rounded p-3 bg-slate-50/70">
              <div className="font-sans font-bold text-xs uppercase text-slate-500 border-b border-slate-200 pb-1 mb-2">
                2. Ownership &amp; ULPIN
              </div>
              <div className="space-y-1 text-xs font-sans">
                <div><strong>ULPIN (Bhu-Aadhaar):</strong> <span className="font-mono font-bold text-primary">{parcel.ulpin}</span></div>
                <div><strong>Primary Owner:</strong> {parcel.owner}</div>
                <div><strong>Property Category:</strong> {parcel.category}</div>
                <div><strong>Centroid Coordinates:</strong> {parcel.centroid[0].toFixed(5)}°E, {parcel.centroid[1].toFixed(5)}°N</div>
              </div>
            </div>
          </div>

          {/* Cadastral Measurements Box */}
          <div className="border border-slate-300 rounded p-3 bg-slate-50/70 mb-4 text-xs font-sans">
            <div className="font-bold uppercase text-slate-500 border-b border-slate-200 pb-1 mb-2">
              3. Spatial Measurements &amp; Geometry Regularization
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-800">
              <div>
                <span className="text-slate-500 block">Built-up Area (Sq.m):</span>
                <strong className="text-sm font-bold">{parcel.areaSqm} m²</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Built-up Area (Sq.ft):</span>
                <strong className="text-sm font-bold">{parcel.areaSqft} ft²</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Boundary Perimeter:</span>
                <strong className="text-sm font-bold">{parcel.perimeterM} meters</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Geometry Snapping:</span>
                <strong className="text-sm font-bold text-emerald-700">90° Orthogonal</strong>
              </div>
            </div>
          </div>

          {/* Section 4: Project Vaayu Integrated Rooftop, Solar, and Tax Records */}
          {parcel.solarCapacityKwp && (
            <div className="border border-slate-300 rounded p-3 bg-slate-50/70 mb-5 text-xs font-sans">
              <div className="font-bold uppercase text-slate-500 border-b border-slate-200 pb-1 mb-2">
                4. Rooftop Material, Solar Feasibility &amp; Tax Assessment
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-800">
                <div>
                  <span className="text-slate-500 block">Roof Classification:</span>
                  <strong className="text-sm font-bold text-primary">{parcel.roofType}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Solar PV Capacity:</span>
                  <strong className="text-sm font-bold text-amber-700">{parcel.solarCapacityKwp} kWp</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Circle Asset Value:</span>
                  <strong className="text-sm font-bold text-slate-900">₹{parcel.assetValuationInr?.toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Annual Panchayat Tax:</span>
                  <strong className="text-sm font-bold text-emerald-700">₹{parcel.annualPropertyTaxInr?.toLocaleString()}/yr</strong>
                </div>
              </div>
            </div>
          )}

          {/* Verification & Legal Seal Row */}
          <div className="flex items-center justify-between border-t-2 border-slate-900 pt-4 font-sans text-xs">
            <div>
              <span className="text-slate-500 block">AI Verification Status:</span>
              <strong className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 size={14} /> Digitally Audited (Confidence: {(parcel.confidence * 100).toFixed(1)}%)
              </strong>
            </div>

            <div className="text-right">
              <div className="font-bold text-slate-900 uppercase">Authorized Revenue Surveyor</div>
              <div className="text-slate-500">Government of Uttar Pradesh / SoI</div>
            </div>
          </div>

        </div>

        {/* Modal Bottom Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
          
          <button
            onClick={handlePrint}
            className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-semibold flex items-center gap-2 shadow-glow-primary transition-all"
          >
            <Printer size={16} />
            <span>Print / Save PDF</span>
          </button>
        </div>

      </div>

    </div>
  );
}
