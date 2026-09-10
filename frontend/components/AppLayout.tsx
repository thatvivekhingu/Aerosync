"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { aeroSyncStore } from "@/lib/store";
import {
  LayoutDashboard,
  Building2,
  FileText,
  ShieldCheck,
  FileSpreadsheet,
  Map as MapIcon,
  Users,
  BarChart3,
  CreditCard,
  Settings,
  ShieldAlert,
  Search,
  Bell,
  ChevronDown,
  Sparkles,
  LogOut,
  Menu,
  X,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Plus,
  Compass,
} from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [storeState, setStoreState] = useState(aeroSyncStore.getState());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const unsub = aeroSyncStore.subscribe(() => {
      setStoreState({ ...aeroSyncStore.getState() });
    });
    return () => unsub();
  }, []);

  const { currentUser, currentOrg, userOrgs, notifications, isDemoMode } = storeState;
  const unreadNotifs = notifications.filter((n) => !n.isRead);

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/properties", label: "Properties", icon: Building2 },
    { href: "/documents", label: "Documents", icon: FileText },
    { href: "/verifications", label: "Verifications", icon: ShieldCheck },
    { href: "/reports", label: "Reports", icon: FileSpreadsheet },
    { href: "/team", label: "Team", icon: Users },
    { href: "/usage", label: "Usage & Quotas", icon: BarChart3 },
    { href: "/billing", label: "Billing & Plans", icon: CreditCard },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const handleLogout = () => {
    aeroSyncStore.logout();
    router.push("/login");
  };

  const handleToggleDemo = () => {
    aeroSyncStore.toggleDemoMode(!isDemoMode);
  };

  // Global search filtering
  const matchingProps = searchQuery
    ? aeroSyncStore.getProperties().filter(
        (p) =>
          p.surveyNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.village.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.ulpin && p.ulpin.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  const matchingDocs = searchQuery
    ? aeroSyncStore.getDocuments().filter(
        (d) =>
          d.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.documentNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const matchingVerifs = searchQuery
    ? aeroSyncStore.getVerifications().filter(
        (v) =>
          v.verificationId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.propertyId.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 fixed inset-y-0 z-30 shadow-xs">
        {/* Workspace Switcher Header */}
        <div className="p-4 border-b border-slate-200 relative">
          <button
            onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-slate-200/80 transition-all text-left group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                {currentOrg?.name?.charAt(0) || "A"}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">
                  {currentOrg?.name || "AeroSync Workspace"}
                </div>
                <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                  <span>{currentOrg?.state || "Gujarat"}</span>
                  <span>•</span>
                  <span className="text-teal-700 font-semibold uppercase">{aeroSyncStore.getSubscription().plan}</span>
                </div>
              </div>
            </div>
            <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-700 shrink-0" />
          </button>

          {/* Org Switcher Dropdown */}
          {orgDropdownOpen && (
            <div className="absolute top-16 left-4 right-4 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 animate-fadeIn">
              <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">
                Your Workspaces
              </div>
              {userOrgs.map((org) => (
                <button
                  key={org.id}
                  onClick={() => {
                    aeroSyncStore.switchOrg(org.id);
                    setOrgDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-medium transition-colors ${
                    org.id === currentOrg?.id ? "bg-teal-50 text-teal-900 font-bold" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="truncate">{org.name}</span>
                  {org.id === currentOrg?.id && <CheckCircle2 size={13} className="text-teal-600" />}
                </button>
              ))}
              <div className="border-t border-slate-100 my-1 pt-1">
                <button
                  onClick={() => {
                    setOrgDropdownOpen(false);
                    router.push("/onboarding");
                  }}
                  className="w-full flex items-center gap-1.5 p-2 text-xs font-semibold text-teal-700 hover:bg-teal-50 rounded-lg"
                >
                  <Plus size={13} />
                  <span>Create New Workspace</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  active
                    ? "bg-teal-50 text-teal-900 font-bold shadow-xs border border-teal-200/80"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                }`}
              >
                <Icon size={16} className={active ? "text-teal-700" : "text-slate-400"} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-3 pb-1">
            <div className="text-[10px] uppercase font-bold text-slate-400 px-3 py-1">
              Geospatial Tools
            </div>
            <Link
              href="/models"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
            >
              <Compass size={16} className="text-slate-400" />
              <span>AI Drone Studio</span>
            </Link>
            <Link
              href="/compliance"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
            >
              <ShieldAlert size={16} className="text-slate-400" />
              <span>Buffer &amp; RoW Audit</span>
            </Link>
          </div>
        </nav>

        {/* Demo Mode Toggle & Status Footer */}
        <div className="p-3 border-t border-slate-200 space-y-2 bg-slate-50/50">
          <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-amber-500" />
              <span className="font-semibold text-slate-800">Demo Mode</span>
            </div>
            <button
              onClick={handleToggleDemo}
              className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                isDemoMode ? "bg-amber-100 text-amber-900 border border-amber-300" : "bg-slate-100 text-slate-600"
              }`}
            >
              {isDemoMode ? "ON" : "OFF"}
            </button>
          </div>

          <div className="flex items-center justify-between px-2 pt-1 text-[11px] text-slate-500">
            <span className="font-mono">v2.4 Production</span>
            <Link href="/" className="hover:text-slate-900 flex items-center gap-1">
              <span>Landing</span>
              <ExternalLink size={10} />
            </Link>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area with Header ── */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        {/* Top App Header */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            {/* Quick Global Search Trigger */}
            <button
              onClick={() => setSearchModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 hover:bg-slate-100 text-xs text-slate-500 border border-slate-200/80 w-48 sm:w-72 transition-colors text-left"
            >
              <Search size={14} className="text-slate-400" />
              <span className="truncate">Search Survey No, ULPIN, Doc...</span>
              <kbd className="hidden sm:inline-block ml-auto text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            {isDemoMode && (
              <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>DEMO DATA ACTIVE</span>
              </div>
            )}

            {/* In-app Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="relative p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Bell size={16} />
                {unreadNotifs.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
                )}
              </button>

              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-50 animate-fadeIn">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs font-bold text-slate-900">
                    <span>Notifications</span>
                    <span className="text-[10px] text-teal-700">{unreadNotifs.length} Unread</span>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">No notifications yet.</div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => aeroSyncStore.markNotificationAsRead(n.id)}
                          className={`py-2.5 px-1 text-xs cursor-pointer hover:bg-slate-50 rounded-lg ${
                            n.isRead ? "opacity-60" : "font-semibold"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <span className="w-2 h-2 rounded-full bg-teal-500 mt-1 shrink-0" />
                            <div>
                              <div className="text-slate-800 text-xs">{n.title}</div>
                              <div className="text-slate-500 text-[11px] font-normal mt-0.5">{n.message}</div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                  {currentUser?.fullName?.charAt(0) || "U"}
                </div>
                <ChevronDown size={12} className="text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 animate-fadeIn text-xs">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <div className="font-bold text-slate-900">{currentUser?.fullName}</div>
                    <div className="text-[11px] text-slate-500 truncate">{currentUser?.email}</div>
                  </div>
                  <Link
                    href="/settings"
                    onClick={() => setUserDropdownOpen(false)}
                    className="block px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-lg font-medium"
                  >
                    Account Settings
                  </Link>
                  <Link
                    href="/billing"
                    onClick={() => setUserDropdownOpen(false)}
                    className="block px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-lg font-medium"
                  >
                    Subscription &amp; Invoices
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg font-bold"
                  >
                    <LogOut size={13} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Main Routed View ── */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">{children}</main>
      </div>

      {/* ── Global Search Modal ── */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center gap-3">
              <Search size={18} className="text-slate-400 shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Survey No (124/3A), ULPIN, Document ID, Village..."
                className="w-full text-sm outline-none text-slate-900"
              />
              <button
                onClick={() => setSearchModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 max-h-96 overflow-y-auto space-y-4 text-xs">
              {searchQuery === "" ? (
                <div className="text-center py-8 text-slate-400">
                  Type a survey number (e.g. <strong>124/3A</strong>) or village name to search your workspace.
                </div>
              ) : (
                <>
                  {matchingProps.length > 0 && (
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-2">Properties ({matchingProps.length})</div>
                      <div className="space-y-1">
                        {matchingProps.map((p) => (
                          <Link
                            key={p.id}
                            href={`/property/${p.id}`}
                            onClick={() => setSearchModalOpen(false)}
                            className="block p-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors"
                          >
                            <div className="font-bold text-slate-900">Survey No: {p.surveyNo}</div>
                            <div className="text-slate-500 text-[11px]">{p.village}, {p.district} • {p.gisAreaHa} ha</div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {matchingDocs.length > 0 && (
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-2">Documents ({matchingDocs.length})</div>
                      <div className="space-y-1">
                        {matchingDocs.map((d) => (
                          <Link
                            key={d.id}
                            href={`/documents`}
                            onClick={() => setSearchModalOpen(false)}
                            className="block p-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors"
                          >
                            <div className="font-bold text-slate-900">{d.fileName}</div>
                            <div className="text-slate-500 text-[11px]">Doc No: {d.documentNo} • SHA: {d.fileHashSha256.slice(0, 8)}...</div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {matchingProps.length === 0 && matchingDocs.length === 0 && (
                    <div className="text-center py-6 text-slate-400">No matching records found.</div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
