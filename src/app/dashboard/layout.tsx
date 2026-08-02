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
        { label: "Overview", icon: LayoutDashboard, href: "/dashboard/overview", badge: null, color: "violet" },
        { label: "Analytics", icon: BarChart3, href: "/dashboard/analytics", badge: null, color: "indigo" },
        { label: "Reports", icon: Wallet, href: "/dashboard/reports", badge: "AI", color: "cyan" },
      ]
    },
    {
      title: "AI Platform",
      items: [
        { label: "AI Agents", icon: Bot, href: "/dashboard/chatbots", badge: null, color: "violet" },
        { label: "Knowledge Base", icon: Database, href: "/dashboard/documents", badge: `${(activeChatbot as any)?.documentCount || ""}`, color: "indigo" },
        { label: "Website Sources", icon: Globe, href: "/dashboard/knowledge/website", badge: "NEW", color: "cyan" },
        { label: "Widget", icon: Smartphone, href: "/dashboard/widget", badge: null, color: "emerald" },
        { label: "Live Inbox", icon: MessageSquare, href: "/dashboard/conversations", badge: null, color: "violet" },
      ]
    },
    {
      title: "Marketing",
      items: [
        { label: "Landing Pages", icon: Layers, href: "/dashboard/landing-pages", badge: "AI", color: "amber" },
        { label: "Funnels", icon: Target, href: "/dashboard/funnels", badge: null, color: "violet" },
        { label: "Leads", icon: Users, href: "/dashboard/leads", badge: null, color: "emerald" },
        { label: "Email Campaigns", icon: Mail, href: "/dashboard/email", badge: null, color: "cyan" },
      ]
    },
    {
      title: "Operations",
      items: [
        { label: "WhatsApp", icon: MessageCircle, href: "/dashboard/whatsapp", badge: "Live", color: "emerald" },
        { label: "Inventory", icon: Package, href: "/dashboard/inventory", badge: null, color: "amber" },
        { label: "Sales", icon: ShoppingBag, href: "/dashboard/sales", badge: null, color: "emerald" },
        { label: "Expenses", icon: Receipt, href: "/dashboard/expenses", badge: null, color: "amber" },
        { label: "Customers", icon: Building2, href: "/dashboard/customers", badge: null, color: "cyan" },
      ]
    },
    {
      title: "System",
      items: [
        { label: "API Keys (BYOK)", icon: Key, href: "/dashboard/api-keys", badge: null, color: "slate" },
        { label: "Settings", icon: Settings, href: "/dashboard/settings", badge: null, color: "slate" },
        ...(isAdmin ? [{ label: "Admin", icon: Shield, href: "/dashboard/admin", badge: "ADMIN", color: "violet" }] : []),
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

  const getColorClasses = (color: string, isActive: boolean) => {
    if (isActive) return "bg-[#0a0a16] text-white border-slate-800 shadow-[0_4px_12px_rgba(0,0,0,0.15)]";
    const map: any = {
      violet: "bg-white text-slate-600 border-slate-200 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700",
      indigo: "bg-white text-slate-600 border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700",
      cyan: "bg-white text-slate-600 border-slate-200 hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700",
      emerald: "bg-white text-slate-600 border-slate-200 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700",
      amber: "bg-white text-slate-600 border-slate-200 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700",
      slate: "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900",
    };
    return map[color] || map.slate;
  };

  return (
    <aside className="w-[300px] bg-[#fefcff] flex flex-col shrink-0 h-screen sticky top-0 border-r-2 border-violet-100 overflow-hidden shadow-[4px_0_24px_rgba(124,58,237,0.06)]">
      {/* Brand - Bright */}
      <div className="h-[72px] px-5 flex items-center justify-between border-b-2 border-violet-100 shrink-0 bg-gradient-to-r from-white via-violet-50/30 to-cyan-50/20">
        <Link href="/dashboard/overview" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[14px] bg-white border-2 border-violet-200 shadow-[0_4px_12px_rgba(124,58,237,0.15)] flex items-center justify-center overflow-hidden">
            <img src="/biztriach-logo.png" alt="Biztriach" className="w-7 h-7 object-contain" />
          </div>
          <div>
            <div className="font-outfit font-bold text-[16px] leading-none text-slate-900">Biztriach</div>
            <div className="text-[10px] text-violet-600 tracking-widest uppercase font-bold mt-0.5">Business OS ✨</div>
          </div>
        </Link>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 border-2 border-violet-200 flex items-center justify-center">
          <Command className="w-4 h-4 text-violet-600" />
        </div>
      </div>

      {/* Agent Selector - Bright */}
      <div className="p-4 border-b-2 border-violet-50 shrink-0 bg-white">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] uppercase tracking-widest font-bold text-violet-600">Active Agent</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 border-2 border-emerald-200 text-emerald-700 font-bold flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Multi-tenant</span>
        </div>
        {activeChatbot ? (
          <button onClick={() => setShowBotDropdown(!showBotDropdown)} className="w-full bg-white hover:bg-violet-50 border-2 border-slate-200 hover:border-violet-200 text-left px-3.5 py-3 rounded-[14px] text-[13px] font-semibold flex items-center justify-between transition shadow-sm hover:shadow">
            <span className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full animate-pulse shadow" style={{ backgroundColor: activeChatbot.themeColor }} />
              <span className="truncate max-w-[150px] text-slate-900">{activeChatbot.name}</span>
            </span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition ${showBotDropdown ? "rotate-180" : ""}`} />
          </button>
        ) : (
          <div className="text-[12px] text-slate-500 py-3 px-3 bg-amber-50 border-2 border-amber-200 rounded-[14px]">No agents yet — create one below ✨</div>
        )}

        {showBotDropdown && (
          <div className="mt-2 bg-white border-2 border-violet-200 rounded-[16px] shadow-[0_12px_32px_rgba(124,58,237,0.15)] p-2 max-h-[260px] overflow-y-auto">
            {chatbots.map((bot) => (
              <button key={bot.id} onClick={() => { setActiveChatbotById(bot.id); setShowBotDropdown(false); }} className={`w-full text-left px-3 py-2.5 rounded-[12px] text-[13px] flex items-center justify-between border-2 ${activeChatbot?.id === bot.id ? "bg-[#0a0a16] text-white border-slate-800 font-bold shadow" : "bg-white text-slate-600 border-slate-100 hover:border-violet-200 hover:bg-violet-50"}`}>
                <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: bot.themeColor }} />{bot.name}</span>
                {activeChatbot?.id === bot.id && <ChevronRight className="w-4 h-4" />}
              </button>
            ))}
            <form onSubmit={handleCreateBot} className="mt-2 pt-2 border-t-2 border-violet-50 flex gap-2">
              <input value={newBotName} onChange={(e) => setNewBotName(e.target.value)} placeholder="New agent name..." className="flex-1 bg-slate-50 border-2 border-slate-200 rounded-[12px] px-3 py-2 text-[12px] placeholder:text-slate-400 focus:outline-none focus:border-violet-300 focus:bg-white" disabled={isCreatingBot} />
              <button type="submit" disabled={isCreatingBot || !newBotName.trim()} className="w-9 h-9 rounded-[12px] bg-[#0a0a16] text-white flex items-center justify-center hover:bg-black disabled:opacity-50 shrink-0 shadow"><Plus className="w-4 h-4" /></button>
            </form>
          </div>
        )}
      </div>

      {/* Nav - Bright */}
      <div className="flex-1 overflow-y-auto p-3 space-y-6 bg-[#fefcff]">
        {sections.map((section) => (
          <div key={section.title}>
            <div className="px-3 mb-2.5 text-[11px] font-bold tracking-widest uppercase text-violet-600 flex items-center gap-2">
              <div className="w-1 h-3 rounded-full bg-violet-600" /> {section.title}
            </div>
            <div className="space-y-1.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/dashboard/overview" && pathname.startsWith(item.href));
                return (
                  <Link key={item.href} href={item.href} className={`group flex items-center justify-between px-3.5 py-3 rounded-[14px] text-[13.5px] font-semibold border-2 transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] ${getColorClasses(item.color, isActive)}`}>
                    <span className="flex items-center gap-3"><item.icon className={`w-[18px] h-[18px] ${isActive ? "text-white" : item.color === "violet" ? "text-violet-600" : item.color === "emerald" ? "text-emerald-600" : item.color === "cyan" ? "text-cyan-600" : item.color === "amber" ? "text-amber-600" : "text-slate-500"}`} /> {item.label}</span>
                    {item.badge && <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border-2 ${item.badge === "NEW" ? "bg-violet-500 text-white border-violet-600" : item.badge === "Live" ? "bg-emerald-500 text-white border-emerald-600 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]" : item.badge === "AI" ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-violet-600" : item.badge === "ADMIN" ? "bg-amber-500 text-white border-amber-600" : "bg-slate-100 text-slate-600 border-slate-200"}`}>{item.badge}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User - Bright */}
      <div className="p-3 border-t-2 border-violet-100 bg-gradient-to-r from-white via-violet-50/20 to-cyan-50/10">
        <div className="flex items-center gap-3 rounded-[16px] bg-white border-2 border-violet-100 p-3 shadow-[0_2px_12px_rgba(124,58,237,0.06)] hover:shadow-[0_4px_16px_rgba(124,58,237,0.1)] transition-shadow">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 flex items-center justify-center font-bold text-white text-[13px] shadow-[0_4px_12px_rgba(124,58,237,0.25)]">{user?.name?.[0]?.toUpperCase() || "U"}</div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-bold truncate leading-tight text-slate-900">{user?.name || "User"}</div>
            <div className="text-[11px] text-slate-500 truncate">{user?.email}</div>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border-2 ${user && (user as any).status === "PENDING" ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-emerald-100 text-emerald-700 border-emerald-200"}`}>{(user as any)?.status || "APPROVED"} ✅</span>
              {isAdmin && <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 text-white border-2 border-violet-600 font-bold shadow">OWNER 👑</span>}
            </div>
          </div>
          <button onClick={logout} className="w-9 h-9 rounded-[12px] bg-white border-2 border-slate-200 hover:border-red-200 hover:bg-red-50 flex items-center justify-center text-slate-400 hover:text-red-500 transition shadow-sm"><LogOut className="w-4 h-4" /></button>
        </div>
        <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-violet-600 font-medium bg-white border-2 border-violet-100 px-3 py-1.5 rounded-full shadow-sm"><Sparkles className="w-3 h-3" /> Biztriach v3 • Brighter UI • biztriach.vercel.app</div>
      </div>
    </aside>
  );
}

function TopBar() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const title = segments[segments.length - 1]?.replace(/-/g, " ") || "Overview";

  return (
    <div className="h-[72px] border-b-2 border-violet-100 bg-white/90 backdrop-blur-xl sticky top-0 z-30 px-6 flex items-center justify-between shadow-[0_2px_12px_rgba(124,58,237,0.05)]">
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2.5 text-[13px] text-slate-500">
          <span className="capitalize font-medium">Dashboard</span>
          <ChevronRight className="w-4 h-4 text-violet-400" />
          <span className="font-bold text-slate-900 capitalize bg-violet-50 border-2 border-violet-200 px-3 py-1 rounded-full text-[13px]">{title}</span>
        </div>
        <div className="md:hidden font-outfit font-bold capitalize flex items-center gap-2"><img src="/biztriach-logo.png" alt="B" className="w-6 h-6" /> {title}</div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2.5 h-10 px-4 rounded-full bg-gradient-to-r from-violet-50 to-indigo-50 border-2 border-violet-200 text-[12px] text-violet-700 font-medium shadow-sm">
          <Search className="w-4 h-4" />
          <span>Search (⌘K)</span>
          <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-white border-2 border-violet-200 font-bold shadow">Soon ✨</span>
        </div>
        <button className="w-10 h-10 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center text-slate-500 hover:text-violet-600 hover:border-violet-200 hover:bg-violet-50 shadow-sm hover:shadow transition-all"><Bell className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

function InnerLayout({ children }: { children: React.ReactNode }) {
  const { activeChatbot } = useDashboard();
  return (
    <div className="flex min-h-screen w-full bg-[#fefcff] bg-biz-mesh">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <TopBar />
        {!activeChatbot && (
          <div className="mx-6 mt-4 rounded-[16px] bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 px-5 py-3.5 text-[13px] text-amber-900 flex items-center gap-3 shadow-[0_4px_12px_rgba(245,158,11,0.1)]">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shrink-0 shadow"><Sparkles className="w-5 h-5 text-white" /></div>
            <div><span className="font-bold">No AI Agent active</span> — Create your first Biztriach employee from sidebar. It will be trained on your business and handle support, inventory, and sales with brighter UI! ✨</div>
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
