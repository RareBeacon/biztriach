"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardProvider, useDashboard } from "@/context/DashboardContext";
import {
  Bot, LayoutDashboard, Settings, BarChart3, Database, MessageSquare,
  LogOut, Plus, ChevronDown, User, Sparkles, Package, ShoppingBag,
  Receipt, Wallet, MessageCircle, Globe, Mail, Target, Layers,
  Users, FileText, Smartphone, Key, Shield, Building2, Megaphone,
  Zap, ChevronRight, Search, Bell, Command
} from "lucide-react";

function Sidebar() {
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
        { label: "Overview", icon: LayoutDashboard, href: "/dashboard/overview", badge: null },
        { label: "Analytics", icon: BarChart3, href: "/dashboard/analytics", badge: null },
        { label: "Reports", icon: Wallet, href: "/dashboard/reports", badge: "AI" },
      ]
    },
    {
      title: "AI Platform",
      items: [
        { label: "AI Agents", icon: Bot, href: "/dashboard/chatbots", badge: null },
        { label: "Knowledge Base", icon: Database, href: "/dashboard/documents", badge: `${(activeChatbot as any)?.documentCount || ""}` },
        { label: "Website Sources", icon: Globe, href: "/dashboard/knowledge/website", badge: "NEW" },
        { label: "Widget", icon: Smartphone, href: "/dashboard/widget", badge: null },
        { label: "Live Inbox", icon: MessageSquare, href: "/dashboard/conversations", badge: null },
      ]
    },
    {
      title: "Marketing",
      items: [
        { label: "Landing Pages", icon: Layers, href: "/dashboard/landing-pages", badge: "AI" },
        { label: "Funnels", icon: Target, href: "/dashboard/funnels", badge: null },
        { label: "Leads", icon: Users, href: "/dashboard/leads", badge: null },
        { label: "Email Campaigns", icon: Mail, href: "/dashboard/email", badge: null },
      ]
    },
    {
      title: "Operations",
      items: [
        { label: "WhatsApp", icon: MessageCircle, href: "/dashboard/whatsapp", badge: "Live" },
        { label: "Inventory", icon: Package, href: "/dashboard/inventory", badge: null },
        { label: "Sales", icon: ShoppingBag, href: "/dashboard/sales", badge: null },
        { label: "Expenses", icon: Receipt, href: "/dashboard/expenses", badge: null },
        { label: "Customers", icon: Building2, href: "/dashboard/customers", badge: null },
      ]
    },
    {
      title: "System",
      items: [
        { label: "API Keys (BYOK)", icon: Key, href: "/dashboard/api-keys", badge: null },
        { label: "Settings", icon: Settings, href: "/dashboard/settings", badge: null },
        ...(isAdmin ? [{ label: "Admin", icon: Shield, href: "/dashboard/admin", badge: "ADMIN" }] : []),
      ]
    }
  ], [activeChatbot, isAdmin]);

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

  return (
    <aside className="w-[300px] bg-[#0a0a16] text-white flex flex-col shrink-0 h-screen sticky top-0 border-r border-white/[0.06] overflow-hidden">
      {/* Brand */}
      <div className="h-[68px] px-5 flex items-center justify-between border-b border-white/[0.06] shrink-0">
        <Link href="/dashboard/overview" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center font-outfit font-black">B</div>
          <div>
            <div className="font-outfit font-bold text-[15px] leading-none">Biztriach</div>
            <div className="text-[10px] text-white/40 tracking-widest uppercase font-bold mt-0.5">Business OS</div>
          </div>
        </Link>
        <div className="w-7 h-7 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
          <Command className="w-3.5 h-3.5 text-white/60" />
        </div>
      </div>

      {/* Agent Selector */}
      <div className="p-4 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-widest font-bold text-white/30">Active Agent</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/20 text-emerald-300">Multi-tenant</span>
        </div>
        {activeChatbot ? (
          <button onClick={() => setShowBotDropdown(!showBotDropdown)} className="w-full bg-white/[0.06] hover:bg-white/[0.08] border border-white/[0.08] text-left px-3 py-2.5 rounded-[12px] text-[13px] font-medium flex items-center justify-between transition">
            <span className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: activeChatbot.themeColor }} />
              <span className="truncate max-w-[150px]">{activeChatbot.name}</span>
            </span>
            <ChevronDown className={`w-4 h-4 text-white/40 transition ${showBotDropdown ? "rotate-180" : ""}`} />
          </button>
        ) : (
          <div className="text-[12px] text-white/40 py-2">No agents yet — create one below</div>
        )}

        {showBotDropdown && (
          <div className="mt-2 bg-[#15151f] border border-white/[0.08] rounded-[12px] shadow-[0_20px_60px_rgba(0,0,0,0.5)] p-1.5 max-h-[260px] overflow-y-auto">
            {chatbots.map((bot) => (
              <button key={bot.id} onClick={() => { setActiveChatbotById(bot.id); setShowBotDropdown(false); }} className={`w-full text-left px-3 py-2 rounded-[10px] text-[13px] flex items-center justify-between ${activeChatbot?.id === bot.id ? "bg-white text-black font-semibold" : "hover:bg-white/[0.06] text-white/70"}`}>
                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: bot.themeColor }} />{bot.name}</span>
                {activeChatbot?.id === bot.id && <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            ))}
            <form onSubmit={handleCreateBot} className="mt-1 pt-1 border-t border-white/[0.06] flex gap-1.5">
              <input value={newBotName} onChange={(e) => setNewBotName(e.target.value)} placeholder="New agent name..." className="flex-1 bg-white/[0.06] border border-white/[0.08] rounded-[10px] px-3 py-1.5 text-[12px] placeholder:text-white/30 focus:outline-none focus:border-violet-500/50" disabled={isCreatingBot} />
              <button type="submit" disabled={isCreatingBot || !newBotName.trim()} className="w-8 h-8 rounded-[10px] bg-white text-black flex items-center justify-center hover:bg-zinc-100 disabled:opacity-50 shrink-0"><Plus className="w-4 h-4" /></button>
            </form>
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto p-3 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
        {sections.map((section) => (
          <div key={section.title}>
            <div className="px-3 mb-2 text-[10px] font-bold tracking-widest uppercase text-white/25">{section.title}</div>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/dashboard/overview" && pathname.startsWith(item.href));
                return (
                  <Link key={item.href} href={item.href} className={`group flex items-center justify-between px-3 py-2.5 rounded-[12px] text-[13.5px] font-medium transition ${isActive ? "bg-white text-black shadow-lg" : "text-white/55 hover:text-white hover:bg-white/[0.06]"}`}>
                    <span className="flex items-center gap-3"><item.icon className={`w-[18px] h-[18px] ${isActive ? "text-black" : "text-white/40 group-hover:text-white/80"}`} /> {item.label}</span>
                    {item.badge && <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${item.badge === "NEW" ? "bg-violet-500 text-white" : item.badge === "Live" ? "bg-emerald-500 text-white animate-pulse" : item.badge === "AI" ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white" : item.badge === "ADMIN" ? "bg-amber-500 text-black" : "bg-white/[0.08] text-white/50"}`}>{item.badge}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User */}
      <div className="p-3 border-t border-white/[0.06] bg-[#0f0f1a]">
        <div className="flex items-center gap-3 rounded-[12px] bg-white/[0.04] border border-white/[0.06] p-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-[12px]">{user?.name?.[0]?.toUpperCase() || "U"}</div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold truncate leading-tight">{user?.name || "User"}</div>
            <div className="text-[11px] text-white/40 truncate">{user?.email}</div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${user && (user as any).status === "PENDING" ? "bg-amber-500/20 text-amber-300 border border-amber-500/20" : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20"}`}>{(user as any)?.status || "APPROVED"}</span>
              {isAdmin && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/20 font-bold">OWNER</span>}
            </div>
          </div>
          <button onClick={logout} className="w-8 h-8 rounded-[10px] bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.06] flex items-center justify-center text-white/40 hover:text-white transition"><LogOut className="w-4 h-4" /></button>
        </div>
        <div className="mt-3 flex items-center justify-center gap-1 text-[10px] text-white/20"><Sparkles className="w-3 h-3" /> Biztriach v2 • Multi-tenant ready</div>
      </div>
    </aside>
  );
}

function TopBar() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const title = segments[segments.length - 1]?.replace(/-/g, " ") || "Overview";

  return (
    <div className="h-[68px] border-b border-slate-200/60 bg-white/70 backdrop-blur-xl sticky top-0 z-30 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 text-[13px] text-slate-500">
          <span className="capitalize">Dashboard</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold text-slate-900 capitalize">{title}</span>
        </div>
        <div className="md:hidden font-outfit font-bold capitalize">{title}</div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 h-9 px-3 rounded-full bg-slate-100 border border-slate-200 text-[12px] text-slate-500">
          <Search className="w-3.5 h-3.5" />
          <span>Search (⌘K)</span>
          <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-white border">Soon</span>
        </div>
        <button className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900"><Bell className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

function InnerLayout({ children }: { children: React.ReactNode }) {
  const { activeChatbot } = useDashboard();
  return (
    <div className="flex min-h-screen w-full bg-[#fcfcfd]">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <TopBar />
        {!activeChatbot && (
          <div className="mx-6 mt-4 rounded-[14px] bg-amber-50 border border-amber-200 px-4 py-3 text-[13px] text-amber-900 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center shrink-0"><Sparkles className="w-4 h-4 text-white" /></div>
            <div><span className="font-semibold">No AI Agent active</span> — Create your first Biztriach employee from sidebar. It will be trained on your business and handle support, inventory, and sales.</div>
          </div>
        )}
        <div className="p-6 md:p-8 flex-1 max-w-[1600px] w-full mx-auto">{children}</div>
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
