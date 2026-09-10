"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { aeroSyncStore } from "@/lib/store";
import { Property } from "@/lib/types";
import {
  Building2,
  Search,
  Plus,
  Filter,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ArrowRight,
  X,
  Layers,
  Sparkles,
  ExternalLink,
} from "lucide-react";

function PropertiesContent() {
  const searchParams = useSearchParams();
  const [storeState, setStoreState] = useState(aeroSyncStore.getState());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [showAddModal, setShowAddModal] = useState(searchParams?.get("action") === "new");

  // New property form state
  const [surveyNo, setSurveyNo] = useState("");
  const [khasraNo, setKhasraNo] = useState("");
  const [ownerApplicantName, setOwnerApplicantName] = useState("");
  const [village, setVillage] = useState("");
  const [taluka, setTaluka] = useState("");
  const [district, setDistrict] = useState("Ahmedabad");
  const [stateName, setStateName] = useState("Gujarat");
  const [gisAreaHa, setGisAreaHa] = useState("1.80");
  const [lat, setLat] = useState("23.0185");
  const [lng, setLng] = useState("72.4833");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = aeroSyncStore.subscribe(() => {
      setStoreState({ ...aeroSyncStore.getState() });
    });
    return () => unsub();
  }, []);

  const properties = aeroSyncStore.getProperties();

  const filteredProperties = properties.filter((p) => {
    const matchesSearch =
      p.surveyNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.village.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.ownerApplicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || p.verificationStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddProperty = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!surveyNo || !village) {
      setFormError("Survey Number and Village are required.");
      return;
    }

    const latitude = parseFloat(lat) || 23.0185;
    const longitude = parseFloat(lng) || 72.4833;
    const areaHa = parseFloat(gisAreaHa) || 1.80;

    const res = aeroSyncStore.addProperty({
      parcelId: `PARCEL-${surveyNo.replace(/[^a-zA-Z0-9]/g, "-")}`,
      surveyNo,
      khasraNo: khasraNo || surveyNo,
      title: `Survey Parcel ${surveyNo} (${village})`,
      ownerApplicantName: ownerApplicantName || "Applicant (Unverified)",
      isOwnershipIndependentlyVerified: false,
      state: stateName,
      district,
      taluka: taluka || district,
      village,
      pincode: "380001",
      coordinates: [
        [longitude, latitude],
        [longitude + 0.001, latitude],
        [longitude + 0.001, latitude + 0.001],
        [longitude, latitude + 0.001],
        [longitude, latitude],
      ],
      centroid: [longitude + 0.0005, latitude + 0.0005],
      boundaryNodes: [
        { id: "P1", lat: latitude, lng: longitude, markerType: "SURVEY_PILLAR" },
        { id: "P2", lat: latitude, lng: longitude + 0.001, markerType: "CORNER_STONE" },
        { id: "P3", lat: latitude + 0.001, lng: longitude + 0.001, markerType: "SURVEY_PILLAR" },
        { id: "P4", lat: latitude + 0.001, lng: longitude, markerType: "CORNER_STONE" },
      ],
      gisAreaSqm: Math.round(areaHa * 10000),
      gisAreaHa: areaHa,
      gisPerimeterM: 520,
      source: "MANUAL_ENTRY",
      verificationStatus: "REQUIRES_REVIEW",
      roofType: "RCC (Pakka)",
    });

    if (res.success) {
      setShowAddModal(false);
      setSurveyNo("");
      setVillage("");
    } else {
      setFormError(res.error || "Failed to add property.");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 font-heading">
              Property Repository
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage mapped land parcels, boundary coordinates, and verification histories.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all self-start md:self-auto"
          >
            <Plus size={14} />
            <span>Add Land Parcel</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search size={14} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Survey No, Village, Owner..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-teal-500 text-slate-900"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
              <Filter size={12} /> Status:
            </span>
            {["ALL", "VERIFIED", "PARTIALLY_VERIFIED", "REQUIRES_REVIEW", "MISMATCH_DETECTED"].map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    statusFilter === status
                      ? "bg-slate-900 text-white"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {status === "ALL" ? "All Statuses" : status.replace("_", " ")}
                </button>
              )
            )}
          </div>
        </div>

        {/* Property Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          {filteredProperties.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <Building2 size={36} className="mx-auto text-slate-300" />
              <div className="text-sm font-bold text-slate-900">No properties found</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery || statusFilter !== "ALL"
                  ? "Try adjusting your search query or status filter."
                  : "Start by creating your first property parcel in this workspace."}
              </p>
              {!searchQuery && statusFilter === "ALL" && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
                >
                  Add First Parcel
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Survey / Parcel</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Applicant / Owner</th>
                    <th className="py-3 px-4">GIS Area</th>
                    <th className="py-3 px-4">Verification Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProperties.map((prop) => (
                    <tr key={prop.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 font-mono">
                          {prop.surveyNo}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {prop.ulpin || prop.id}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="font-medium text-slate-800">{prop.village}</div>
                        <div className="text-[11px] text-slate-500">
                          {prop.district}, {prop.state}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {prop.ownerApplicantName}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {prop.gisAreaHa > 0.1 ? `${prop.gisAreaHa} ha` : `${prop.gisAreaSqm} m²`}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            prop.verificationStatus === "VERIFIED"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : prop.verificationStatus === "PARTIALLY_VERIFIED"
                              ? "bg-teal-50 text-teal-800 border-teal-200"
                              : prop.verificationStatus === "REQUIRES_REVIEW"
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : "bg-rose-50 text-rose-800 border-rose-200"
                          }`}
                        >
                          {prop.verificationStatus.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/property/${prop.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 font-bold transition-all text-[11px]"
                        >
                          <span>Inspect Dossier</span>
                          <ArrowRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Property Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-teal-600" />
                <h3 className="font-bold text-slate-900 text-sm">Add New Land Parcel</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            {formError && (
              <div className="m-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddProperty} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Survey / Khasra No *
                  </label>
                  <input
                    type="text"
                    required
                    value={surveyNo}
                    onChange={(e) => setSurveyNo(e.target.value)}
                    placeholder="e.g. 124/3A"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Applicant / Owner Name
                  </label>
                  <input
                    type="text"
                    value={ownerApplicantName}
                    onChange={(e) => setOwnerApplicantName(e.target.value)}
                    placeholder="e.g. Harishbhai Patel"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Village *</label>
                  <input
                    type="text"
                    required
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    placeholder="e.g. Nidhrad Rural"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">District</label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="Ahmedabad"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GIS Area (ha)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={gisAreaHa}
                    onChange={(e) => setGisAreaHa(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Latitude</label>
                  <input
                    type="text"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Longitude</label>
                  <input
                    type="text"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900">
                AeroSync computes mathematical Shoelace polygon areas and verifies consistency. Document possession does not independently certify legal ownership.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800"
                >
                  Save Parcel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Loading properties repository...</div>}>
      <PropertiesContent />
    </Suspense>
  );
}
