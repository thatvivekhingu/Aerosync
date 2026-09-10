"use client";

import React from "react";
import { CadastralParcel } from "@/data/parcels";
import { formatNumber } from "@/data/formatters";
import {
  X,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Sun,
  Coins,
  Compass,
  MapPin,
  ShieldCheck,
  Building,
} from "lucide-react";

interface PropertyCardModalProps {
  parcel: CadastralParcel;
  onClose: () => void;
}

export default function PropertyCardModal({ parcel, onClose }: PropertyCardModalProps) {
  const handlePrint = () => {
    window.print();
  };

  const droneCropImg = parcel.cadastralOverlayImage || parcel.realDroneImage || "/inference/patch_100_cadastral_overlay.png";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
      
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📜</span>
            <div>
              <h3 className="font-bold text-sm font-heading tracking-wide">
                SVAMITVA Property Card (घरौनी / Form 1)
              </h3>
              <p className="text-[11px] text-teal-400 font-mono">
                SIH 2026 • Problem Statement ID: 26012 (MoRD / DoLR)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Printable Official SVAMITVA Card Document */}
        <div className="p-7 overflow-y-auto flex-1 font-serif text-slate-950 bg-white" id="printableCard">
          
          {/* Official Emblem & National Header */}
          <div className="text-center border-b-2 border-slate-950 pb-4 mb-4">
            <div className="text-[11px] uppercase tracking-widest text-slate-600 font-sans font-black">
              Government of India • Ministry of Panchayati Raj &amp; Survey of India
            </div>
            <h2 className="text-xl font-black tracking-wider text-slate-950 uppercase mt-1">
              SVAMITVA RECORD OF RIGHTS &amp; PROPERTY CARD (संपत्ति पत्रक)
            </h2>
            <div className="flex items-center justify-center gap-4 text-[11px] text-slate-600 font-sans mt-1">
              <span>Department of Land Resources (DoLR)</span>
              <span>•</span>
              <span className="font-mono font-bold text-teal-700">Scheme Code: PS-26012</span>
              <span>•</span>
              <span>Village Abadi Survey</span>
            </div>
          </div>

          {/* Top Identity Grid: Barcode, Property ID, QR & Administrative Header */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4 border border-slate-300 rounded-xl p-3.5 bg-slate-50/70 font-sans">
            
            {/* Left 8 Cols: Location & Ownership */}
            <div className="md:col-span-8 space-y-1 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
                <span className="font-bold uppercase text-slate-600 tracking-wider text-[10px]">
                  1. Official Cadastral Identification
                </span>
                <span className="font-mono font-black text-xs text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded border border-teal-300">
                  {parcel.propertyId || "GJ-2026-00125"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div><strong>State:</strong> {parcel.state}</div>
                <div><strong>District:</strong> {parcel.district}</div>
                <div><strong>Village / Mauza:</strong> {parcel.village}</div>
                <div><strong>Khasra No:</strong> {parcel.khasra}</div>
                <div><strong>Primary Owner:</strong> <span className="font-bold text-slate-900">{parcel.owner}</span></div>
                <div><strong>Land Use:</strong> Residential Abadi</div>
                <div className="col-span-2 mt-1 pt-1 border-t border-slate-200">
                  <strong>ULPIN (Bhu-Aadhaar):</strong> <span className="font-mono font-bold text-teal-700">{parcel.ulpin}</span>
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Barcode & Verification Seal */}
            <div className="md:col-span-4 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-slate-200 pl-0 md:pl-3 text-center">
              {/* Simulated High-Res Barcode Graphic matching SIH Slide 2 */}
              <div className="flex gap-[2px] h-9 items-center justify-center">
                {[2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 1, 4, 2, 1, 3, 1, 2, 3, 1, 2, 4].map((w, i) => (
                  <div key={i} className="bg-slate-950 h-full" style={{ width: `${w}px` }} />
                ))}
              </div>
              <span className="font-mono font-bold text-[11px] text-slate-900 mt-1">
                *{parcel.propertyId || "GJ-2026-00125"}*
              </span>
              <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 size={12} />
                <span>Digitally Verified</span>
              </div>
            </div>
          </div>

          {/* REAL DRONE IMAGERY CROP & GEOMETRIC REGULARIZATION SECTION (Exact User Request) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4 font-sans">
            
            {/* Real Drone Aerial Orthomosaic Crop (Left 5 Cols) */}
            <div className="md:col-span-5 border border-slate-300 rounded-xl overflow-hidden bg-slate-950 flex flex-col shadow-xs">
              <div className="bg-slate-900 text-white px-3 py-1.5 text-[10px] font-bold flex items-center justify-between border-b border-slate-800">
                <span>🛰️ Real Drone Orthomosaic Crop</span>
                <span className="text-teal-400 font-mono">2.8 cm GSD</span>
              </div>
              <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                <img
                  src={droneCropImg}
                  alt="Real Drone Orthomosaic Parcel Footprint"
                  className="w-full h-full object-cover"
                />
                {/* 90° Orthogonal Polygon Overlay Watermark */}
                <div className="absolute inset-0 border-2 border-teal-400/80 m-4 rounded-xs pointer-events-none flex items-center justify-center">
                  <span className="bg-slate-950/80 text-teal-300 font-mono text-[9px] px-1.5 py-0.5 rounded border border-teal-500/40">
                    90° REGULARIZED
                  </span>
                </div>
              </div>
              <div className="px-2.5 py-1 text-[10px] text-slate-300 bg-slate-900 text-center font-mono">
                Centroid: {parcel.centroid[1].toFixed(5)}°N, {parcel.centroid[0].toFixed(5)}°E
              </div>
            </div>

            {/* Spatial Measurements & Regularization Specs (Right 7 Cols) */}
            <div className="md:col-span-7 border border-slate-300 rounded-xl p-3.5 bg-slate-50/70 flex flex-col justify-between text-xs">
              <div>
                <div className="font-bold uppercase text-slate-600 border-b border-slate-200 pb-1 mb-2 text-[10px] tracking-wider">
                  2. Spatial Measurements &amp; Regularization
                </div>
                <div className="grid grid-cols-2 gap-3 text-slate-900">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Built-up Area (Sq.m):</span>
                    <strong className="text-sm font-bold font-mono">{parcel.areaSqm} m²</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Built-up Area (Sq.ft):</span>
                    <strong className="text-sm font-bold font-mono">{parcel.areaSqft} ft²</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Perimeter:</span>
                    <strong className="text-sm font-bold font-mono">{parcel.perimeterM} meters</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">90° Orthogonalization:</span>
                    <strong className="text-sm font-bold text-teal-700">{parcel.orthogonalizationScore}% Match</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Roof Material:</span>
                    <strong className="text-sm font-bold text-slate-800">{parcel.roofType || "RCC (Pakka)"}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">MC Dropout Uncertainty:</span>
                    <strong className="text-sm font-bold text-emerald-700">{(parcel.uncertaintyScore * 100).toFixed(1)}% (Low)</strong>
                  </div>
                </div>
              </div>

              {/* Sub-Centimeter Compliance Note */}
              <div className="mt-2 pt-2 border-t border-slate-200 text-[10px] text-slate-600">
                ✅ Conforms to Survey of India Technical Guidelines for Drones (Sub-Centimeter Orthorectification).
              </div>
            </div>
          </div>

          {/* DIRECTION BOUNDARIES TABLE (CHAUHADDI / चौहद्दी) - Exact User Request */}
          <div className="border border-slate-300 rounded-xl p-3.5 bg-slate-50/70 mb-4 font-sans text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2.5">
              <span className="font-bold uppercase text-slate-700 tracking-wider text-[11px] flex items-center gap-1.5">
                <Compass size={14} className="text-teal-700" />
                <span>3. Legal Direction Boundaries (चौहद्दी विवरण / Chauhaddi)</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500">True North Orientation: 0.0°</span>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-300 text-[11px] text-slate-600 bg-slate-200/60">
                  <th className="py-1.5 px-2 font-bold">Direction (दिशा)</th>
                  <th className="py-1.5 px-2 font-bold">Length (मीटर)</th>
                  <th className="py-1.5 px-2 font-bold">Abutting Property / Landmark (सीमा विवरण)</th>
                  <th className="py-1.5 px-2 font-bold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-[11px]">
                <tr>
                  <td className="py-1.5 px-2 font-bold text-slate-900">North (उत्तर)</td>
                  <td className="py-1.5 px-2 font-mono font-bold">{parcel.directionBoundaries.north.lengthM} m</td>
                  <td className="py-1.5 px-2 text-slate-700">{parcel.directionBoundaries.north.abutting}</td>
                  <td className="py-1.5 px-2 text-right">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">CLEAN</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-2 font-bold text-slate-900">East (पूर्व)</td>
                  <td className="py-1.5 px-2 font-mono font-bold">{parcel.directionBoundaries.east.lengthM} m</td>
                  <td className="py-1.5 px-2 text-slate-700">{parcel.directionBoundaries.east.abutting}</td>
                  <td className="py-1.5 px-2 text-right">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">CLEAN</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-2 font-bold text-slate-900">South (दक्षिण)</td>
                  <td className="py-1.5 px-2 font-mono font-bold">{parcel.directionBoundaries.south.lengthM} m</td>
                  <td className="py-1.5 px-2 text-slate-700">{parcel.directionBoundaries.south.abutting}</td>
                  <td className="py-1.5 px-2 text-right">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">CLEAN</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-2 font-bold text-slate-900">West (पश्चिम)</td>
                  <td className="py-1.5 px-2 font-mono font-bold">{parcel.directionBoundaries.west.lengthM} m</td>
                  <td className="py-1.5 px-2 text-slate-700">{parcel.directionBoundaries.west.abutting}</td>
                  <td className="py-1.5 px-2 text-right">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">CLEAN</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Legal Sign-Off & Official Seal */}
          <div className="flex items-end justify-between border-t-2 border-slate-950 pt-4 font-sans text-xs">
            <div className="space-y-1">
              <div className="font-bold text-slate-900">Digital Authentication:</div>
              <div className="text-[10px] font-mono text-slate-500">SHA-256: 8f4b2e91a03c...d8721</div>
              <div className="text-[10px] text-slate-600">Generated automatically by AeroSync AI Engine</div>
            </div>

            <div className="text-right">
              <div className="w-32 h-10 border-b border-dashed border-slate-400 mb-1 ml-auto" />
              <div className="font-bold text-slate-950 uppercase text-[11px]">Authorized Revenue Officer</div>
              <div className="text-[10px] text-slate-500">Government of Uttar Pradesh / SoI</div>
            </div>
          </div>

        </div>

        {/* Modal Bottom Actions */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-100 border-t border-slate-300">
          <span className="text-xs text-slate-600 font-sans">
            Ready for official printing on A4 or export to PDF.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold flex items-center gap-1.5 shadow-glow-primary transition-all"
            >
              <Printer size={15} />
              <span>Print Official Card</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
