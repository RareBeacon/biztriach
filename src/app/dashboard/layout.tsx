"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardProvider, useDashboard } from "@/context/DashboardContext";
import {
  Bot, LayoutDashboard, Settings, BarChart3, Database, MessageSquare,
  LogOut, Plus, Package, ShoppingBag,
  Receipt, Wallet, MessageCircle, Globe,
  Smartphone, Key, Shield, Building2,
  ChevronDown, Check, Menu, X, ExternalLink,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────────
   Biztriach Console — Twilio-inspired dark sidebar + light content canvas
   ──────────────────────────────────────────────────────────────────────────── */

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, chatbots, activeChatbot, setActiveChatbotById, refreshChatbots, logout } = useDashboard();
  const [showBotDropdown, setShowBotDropdown] = useState(false);
  const [newBotName, setNewBotName] = useState("");
  const [isCreatingBot, setIsCreatingBot] = useState(false);

  const isAdmin = user?.email === "ogungboyeopeyemiphilip@gmail.com" || user?.email === "phoslabceo@gmail.com" || (user as any)?.role === "ADMIN";

  const sections = useMemo(() => [
    {
      title: "Business",
      items: [
        { label: "Overview", icon: LayoutDashboard, href: "/dashboard/overview" },
        { label: "Analytics", icon: BarChart3, href: "/dashboard/analytics" },
        { label: "Reports", icon: Wallet, href: "/dashboard/reports" },
      ]
    },
    {
      title: "AI Platform",
      items: [
        { label: "AI Agents", icon: Bot, href: "/dashboard/chatbots" },
        { label: "Knowledge Base", icon: Database, href: "/dashboard/documents" },
        { label: "Website Sources", icon: Globe, href: "/dashboard/knowledge/website" },
        { label: "Widget", icon: Smartphone, href: "/dashboard/widget" },
        { label: "Live Inbox", icon: MessageSquare, href: "/dashboard/conversations" },
      ]
    },
    {
      title: "Operations",
      items: [
        { label: "WhatsApp", icon: MessageCircle, href: "/dashboard/whatsapp", badge: "Live" },
        { label: "Inventory", icon: Package, href: "/dashboard/inventory" },
        { label: "Sales", icon: ShoppingBag, href: "/dashboard/sales" },
        { label: "Expenses", icon: Receipt, href: "/dashboard/expenses" },
        { label: "Customers", icon: Building2, href: "/dashboard/customers" },
      ]
    },
    {
      title: "System",
      items: [
        { label: "API Keys", icon: Key, href: "/dashboard/api-keys" },
        { label: "Settings", icon: Settings, href: "/dashboard/settings" },
        ...(isAdmin ? [{ label: "Admin", icon: Shield, href: "/dashboard/admin", badge: "Admin" }] : []),
      ]
    }
  ], [isAdmin]);

  const handleCreateBot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBotName.trim()) return;
    setIsCreatingBot(true);
    try {
      const res = await fetch("/api/chatbots", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newBotName.trim() }) });
      if (res.ok) {
        const newBot = await res.json();
        setNewBotName("");
        setIsCreatingBot(false);
        await refreshChatbots();
        setActiveChatbotById(newBot.id);
      }
    } catch (e) {
      console.error(e);
      setIsCreatingBot(false);
    }
  };

  const initials = (user?.name || user?.email || "U")
    .split(" ")
    .map((p: string) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex flex-col h-full bg-[#0b0d13] text-slate-300">
      {/* Brand */}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-white/[0.06] shrink-0">
        <Link href="/dashboard/overview" onClick={onNavigate} className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-900/40">
            <span className="text-white font-outfit font-black text-[15px] leading-none">B</span>
          </div>
          <div>
            <div className="font-outfit font-bold text-[15px] leading-none text-white">Biztriach</div>
            <div className="text-[9.5px] text-slate-500 tracking-[0.18em] uppercase font-semibold mt-1">Console</div>
          </div>
        </Link>
      </div>

      {/* Agent selector */}
      <div className="px-3 pt-4 pb-3 border-b border-white/[0.06] shrink-0">
        <div className="px-2 mb-2 text-[10px] uppercase tracking-widest font-bold text-slate-500">AI Agent</div>
        {activeChatbot ? (
          <div className="relative">
            <button onClick={() => setShowBotDropdown(!showBotDropdown)} className="w-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-left px-3 py-2.5 rounded-lg text-[13px] font-medium flex items-center justify-between transition text-slate-200">
              <span className="flex items-center gap-2.5 min-w-0">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: activeChatbot.themeColor }} />
                <span className="truncate">{activeChatbot.name}</span>
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition shrink-0 ${showBotDropdown ? "rotate-180" : ""}`} />
            </button>
            {showBotDropdown && (
              <div className="mt-1.5 bg-[#14161d] border border-white/10 rounded-lg shadow-2xl p-1.5 max-h-[240px] overflow-y-auto">
                {chatbots.map((bot: any) => (
                  <button key={bot.id} onClick={() => { setActiveChatbotById(bot.id); setShowBotDropdown(false); }} className={`w-full text-left px-3 py-2 rounded-md text-[12.5px] flex items-center justify-between transition ${activeChatbot?.id === bot.id ? "bg-violet-600/20 text-white" : "text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"}`}>
                    <span className="flex items-center gap-2 min-w-0"><span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: bot.themeColor }} /><span className="truncate">{bot.name}</span></span>
                    {activeChatbot?.id === bot.id && <Check className="w-3.5 h-3.5 text-violet-400 shrink-0" />}
                  </button>
                ))}
                <form onSubmit={handleCreateBot} className="mt-1.5 pt-1.5 border-t border-white/[0.06] flex gap-1.5">
                  <input value={newBotName} onChange={(e) => setNewBotName(e.target.value)} placeholder="New agent name…" className="flex-1 bg-white/[0.05] border border-white/10 rounded-md px-2.5 py-2 text-[12px] placeholder:text-slate-600 focus:outline-none focus:border-violet-500/60 text-slate-200" disabled={isCreatingBot} />
                  <button type="submit" disabled={isCreatingBot || !newBotName.trim()} className="w-8 h-8 rounded-md bg-violet-600 text-white flex items-center justify-center hover:bg-violet-500 disabled:opacity-40 shrink-0"><Plus className="w-3.5 h-3.5" /></button>
                </form>
              </div>
            )}
          </div>
        ) : (
          <button onClick={() => setShowBotDropdown(!showBotDropdown)} className="w-full bg-amber-500/10 border border-amber-500/25 text-amber-300/90 text-left px-3 py-2.5 rounded-lg text-[12px] flex items-center justify-between">
            No agent yet — create one
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
        {showBotDropdown && !activeChatbot && (
          <div className="mt-1.5 bg-[#14161d] border border-white/10 rounded-lg shadow-2xl p-1.5">
            <form onSubmit={handleCreateBot} className="flex gap-1.5">
              <input value={newBotName} onChange={(e) => setNewBotName(e.target.value)} placeholder="New agent name…" className="flex-1 bg-white/[0.05] border border-white/10 rounded-md px-2.5 py-2 text-[12px] placeholder:text-slate-600 focus:outline-none focus:border-violet-500/60 text-slate-200" disabled={isCreatingBot} />
              <button type="submit" disabled={isCreatingBot || !newBotName.trim()} className="w-8 h-8 rounded-md bg-violet-600 text-white flex items-center justify-center hover:bg-violet-500 disabled:opacity-40 shrink-0"><Plus className="w-3.5 h-3.5" /></button>
            </form>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {sections.map((section) => (
          <div key={section.title}>
            <div className="px-2 mb-1.5 text-[10px] uppercase tracking-widest font-bold text-slate-600">{section.title}</div>
            <div className="space-y-0.5">
              {section.items.map((item: any) => {
                const isActive = pathname === item.href || (item.href !== "/dashboard/overview" && pathname.startsWith(item.href));
                return (
                  <Link key={item.href} href={item.href} onClick={onNavigate} className={`group relative flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${isActive ? "bg-white/[0.08] text-white" : "text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]"}`}>
                    {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r bg-violet-500" />}
                    <item.icon className={`w-[17px] h-[17px] shrink-0 ${isActive ? "text-violet-400" : "text-slate-500 group-hover:text-slate-300"}`} />
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span className={`ml-auto text-[9.5px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${item.badge === "Live" ? "bg-emerald-500/15 text-emerald-400" : "bg-violet-500/15 text-violet-400"}`}>{item.badge}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-white/[0.06] shrink-0">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0">{initials}</div>
          <div className="min-w-0 flex-1">
            <div className="text-[12.5px] font-semibold text-slate-200 truncate">{user?.name || "User"}</div>
            <div className="text-[11px] text-slate-500 truncate">{user?.email}</div>
          </div>
          <button onClick={logout} title="Sign out" className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition shrink-0">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function TopBar({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const title = (segments[segments.length - 1] || "overview")
    .replace(/-/g, " ")
    .replace(/^./, (c) => c.toUpperCase());

  return (
    <div className="h-16 border-b border-slate-200 bg-white sticky top-0 z-30 px-5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button onClick={onMenu} className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100" aria-label="Menu">
          <Menu className="w-5 h-5" />
        </button>
        <div className="text-[15px] font-semibold text-slate-900 capitalize">{title}</div>
      </div>
      <div className="flex items-center gap-2">
        <a href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer" className="hidden md:inline-flex btn-ghost !h-9 text-[12.5px] text-slate-500">
          Meta Dashboard <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <span className="hidden sm:inline-flex pill-green"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Systems normal</span>
      </div>
    </div>
  );
}

function InnerLayout({ children }: { children: React.ReactNode }) {
  const { activeChatbot } = useDashboard();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-[#f6f7f8]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[252px] shrink-0 h-screen sticky top-0 border-r border-black/20">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-[280px] h-full shadow-2xl">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-3 z-10 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-white/10" aria-label="Close menu">
              <X className="w-4 h-4" />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <TopBar onMenu={() => setMobileOpen(true)} />
        {!activeChatbot && (
          <div className="mx-5 mt-5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-[13px] text-amber-900 flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0 font-bold text-amber-600">!</span>
            <span><strong>No AI agent active.</strong> Create your first agent from the sidebar — it powers your widget, WhatsApp replies, and business parsing.</span>
          </div>
        )}
        <div className="p-5 md:p-7 flex-1 max-w-[1500px] w-full mx-auto">{children}</div>
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <InnerLayout>{children}</InnerLayout>
    </DashboardProvider>
  );
}
