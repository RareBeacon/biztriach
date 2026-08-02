"use client";

import React, { useEffect, useState } from "react";
import { useDashboard } from "@/context/DashboardContext";
import {
  TrendingUp, TrendingDown, Wallet, ShoppingBag, Package, Users,
  AlertTriangle, ArrowUpRight, Bot, MessageSquare, Globe, Mail,
  DollarSign, Receipt, Target
} from "lucide-react";
import Link from "next/link";

interface FinancialSummary {
  todayRevenue: number;
  todayExpenses: number;
  todayProfit: number;
  monthRevenue: number;
  monthExpenses: number;
  monthProfit: number;
  inventoryValue: number;
  lowStockCount: number;
  totalProducts: number;
  totalCustomers: number;
  totalSalesToday: number;
}

export default function BiztriachOverview() {
  const { activeChatbot } = useDashboard();
  const [financials, setFinancials] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load financial overview
        const finRes = await fetch("/api/reports/financial?period=today");
        if (finRes.ok) {
          const data = await finRes.json();
          setFinancials(data.summary);
          setLowStock(data.lowStock || []);
        }
        // Load recent sales
        const salesRes = await fetch("/api/sales?limit=5");
        if (salesRes.ok) {
          const sData = await salesRes.json();
          setRecentSales(Array.isArray(sData) ? sData : sData.sales || []);
        }
      } catch (e) {
        console.error("Overview load error", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [activeChatbot]);

  const statCards = [
    {
      label: "Today's Revenue",
      value: financials ? `₦${financials.todayRevenue.toLocaleString()}` : "₦0",
      change: "+12%",
      trend: "up",
      icon: Wallet,
      gradient: "from-emerald-500 to-teal-600",
      bg: "bg-emerald-50 border-emerald-200",
    },
    {
      label: "Today's Profit",
      value: financials ? `₦${financials.todayProfit.toLocaleString()}` : "₦0",
      change: financials && financials.todayProfit > 0 ? "+8%" : "—",
      trend: "up",
      icon: TrendingUp,
      gradient: "from-violet-500 to-indigo-600",
      bg: "bg-violet-50 border-violet-200",
    },
    {
      label: "Inventory Value",
      value: financials ? `₦${financials.inventoryValue.toLocaleString()}` : "₦0",
      change: `${financials?.totalProducts || 0} products`,
      trend: "neutral",
      icon: Package,
      gradient: "from-blue-500 to-cyan-600",
      bg: "bg-blue-50 border-blue-200",
    },
    {
      label: "Low Stock Alert",
      value: financials ? `${financials.lowStockCount} items` : "0 items",
      change: financials?.lowStockCount ? "Needs restock" : "All good",
      trend: financials?.lowStockCount ? "down" : "up",
      icon: AlertTriangle,
      gradient: "from-amber-500 to-orange-600",
      bg: "bg-amber-50 border-amber-200",
    },
  ];

  const quickMetrics = [
    { label: "AI Conversations", value: "1,282", icon: Bot, sub: "Website + WhatsApp" },
    { label: "Leads", value: "86", icon: Users, sub: "From landing pages" },
    { label: "Sales Today", value: String(financials?.totalSalesToday || 0), icon: ShoppingBag, sub: "Via all channels" },
    { label: "Expenses Today", value: financials ? `₦${financials.todayExpenses.toLocaleString()}` : "₦0", icon: Receipt, sub: "Tracked automatically" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-outfit text-[28px] font-bold tracking-tight">Business Overview</h1>
          <p className="text-[14px] text-slate-500 mt-1">
            {activeChatbot ? `Managing ${activeChatbot.name} • ` : ""}Welcome to Biztriach — One AI employee, full business control.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/reports" className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-[#0a0a16] text-white text-[13px] font-medium hover:bg-black">
            View AI Reports <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Financial Bento */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className={`rounded-[20px] border bg-white p-5 shadow-soft hover:shadow-biz transition-all ${card.bg} group`}>
            <div className="flex items-start justify-between">
              <div className={`w-10 h-10 rounded-[12px] bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${card.trend === "up" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : card.trend === "down" ? "bg-red-100 text-red-700 border border-red-200" : "bg-slate-100 text-slate-600"}`}>
                {card.trend === "up" ? <TrendingUp className="w-3 h-3" /> : card.trend === "down" ? <TrendingDown className="w-3 h-3" /> : null}
                {card.change}
              </span>
            </div>
            <div className="mt-4">
              <div className="text-[12px] font-bold uppercase tracking-widest text-slate-400">{card.label}</div>
              <div className="font-outfit text-[26px] font-bold tracking-tight mt-1">{loading ? "..." : card.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick metrics + Agent Status */}
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 grid sm:grid-cols-2 gap-4">
          {quickMetrics.map((qm) => (
            <div key={qm.label} className="rounded-[18px] bg-white border border-slate-200 p-4 flex items-center gap-4 hover:shadow-soft transition">
              <div className="w-12 h-12 rounded-[14px] bg-slate-50 border border-slate-200 flex items-center justify-center">
                <qm.icon className="w-5 h-5 text-slate-700" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-widest font-bold text-slate-400">{qm.label}</div>
                <div className="font-outfit font-bold text-[18px]">{loading ? "..." : qm.value}</div>
                <div className="text-[11px] text-slate-500">{qm.sub}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-4 rounded-[20px] bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-600 p-[1px]">
          <div className="rounded-[19px] bg-[#0a0a16] p-5 h-full text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center font-outfit font-black">B</div>
              <div>
                <div className="font-semibold text-[14px]">Biztriach AI Employee</div>
                <div className="text-[11px] text-white/50">Active • Website + WhatsApp</div>
              </div>
              <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.6)]" />
            </div>
            <p className="text-[13px] text-white/60 leading-relaxed mt-4">
              Your AI trained on {activeChatbot ? activeChatbot.name : "your business"} is handling support, sales tracking, and inventory updates via WhatsApp parsing.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-[10px] bg-white/[0.06] border border-white/[0.08] p-2.5"><div className="text-white/40">Avg Response</div><div className="font-bold text-[13px]">2.1s</div></div>
              <div className="rounded-[10px] bg-white/[0.06] border border-white/[0.08] p-2.5"><div className="text-white/40">CSAT</div><div className="font-bold text-[13px]">4.9/5</div></div>
            </div>
            <Link href="/dashboard/chatbots" className="mt-4 inline-flex w-full justify-center items-center gap-2 h-10 rounded-full bg-white text-black font-semibold text-[13px] hover:bg-zinc-100">Configure AI <Bot className="w-4 h-4" /></Link>
          </div>
        </div>
      </div>

      {/* Recent Activity Bento */}
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-[20px] bg-white border border-slate-200 p-6 shadow-soft">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-outfit font-semibold text-[16px]">Recent Sales</h3>
            <Link href="/dashboard/sales" className="text-[12px] font-medium text-violet-600 hover:underline flex items-center gap-1">View all <ArrowUpRight className="w-3 h-3" /></Link>
          </div>
          {loading ? (
            <div className="py-12 text-center text-[13px] text-slate-400">Loading sales...</div>
          ) : recentSales.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-[16px]">
              <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-[14px] font-medium text-slate-600">No sales yet</p>
              <p className="text-[12px] text-slate-400 mt-1 max-w-sm mx-auto">Start selling and tracking via dashboard or WhatsApp: “Sold 5 bags of rice for ₦85k each”</p>
              <Link href="/dashboard/sales" className="inline-flex mt-4 h-9 px-4 rounded-full bg-slate-900 text-white text-[13px] font-medium">Record Sale</Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentSales.map((sale: any) => (
                <div key={sale.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-violet-100 border border-violet-200 flex items-center justify-center"><ShoppingBag className="w-4 h-4 text-violet-600" /></div>
                    <div>
                      <div className="text-[13px] font-semibold">{sale.saleNumber || sale.id.slice(0, 8)} • {sale.items?.[0]?.productName || "Sale"}</div>
                      <div className="text-[11px] text-slate-500">{new Date(sale.createdAt).toLocaleString()} • {sale.channel}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[13px] font-bold">₦{sale.totalAmount?.toLocaleString()}</div>
                    <div className="text-[11px] text-emerald-600 font-medium">Profit ₦{sale.profit?.toLocaleString() || 0}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-[20px] bg-white border border-slate-200 p-6 shadow-soft">
            <h3 className="font-outfit font-semibold text-[15px] flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /> Low Stock Alerts</h3>
            {lowStock.length === 0 ? (
              <p className="text-[13px] text-slate-400 py-6 text-center">All inventory levels healthy ✅</p>
            ) : (
              <div className="mt-4 space-y-2">
                {lowStock.slice(0, 5).map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-2.5 rounded-[12px] bg-amber-50 border border-amber-200">
                    <span className="text-[13px] font-medium">{p.name}</span>
                    <span className="text-[12px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">{p.quantity} left</span>
                  </div>
                ))}
                <Link href="/dashboard/inventory" className="block text-center mt-3 text-[12px] font-medium text-violet-600 hover:underline">Restock now →</Link>
              </div>
            )}
          </div>

          <div className="rounded-[20px] bg-[#0a0a16] border border-white/[0.06] p-5 text-white">
            <h3 className="font-outfit font-semibold text-[14px] flex items-center gap-2"><Globe className="w-4 h-4 text-violet-400" /> Deploy Your AI Everywhere</h3>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                { icon: Globe, label: "Website", status: "Active" },
                { icon: MessageSquare, label: "WhatsApp", status: "Connect" },
                { icon: Mail, label: "Instagram", status: "Soon" },
              ].map((ch) => (
                <div key={ch.label} className="rounded-[14px] bg-white/[0.06] border border-white/[0.08] p-3">
                  <ch.icon className="w-5 h-5 mx-auto mb-1 text-white/60" />
                  <div className="text-[11px] font-semibold">{ch.label}</div>
                  <div className={`mt-1 text-[10px] px-1.5 py-0.5 rounded-full inline-block ${ch.status === "Active" ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-white/40"}`}>{ch.status}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
