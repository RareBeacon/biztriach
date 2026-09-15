"use client";

import React, { useEffect, useState } from "react";
import { useDashboard } from "@/context/DashboardContext";
import {
  TrendingUp, Wallet, Package, AlertTriangle, ArrowUpRight, Bot,
  MessageCircle, Database, ShoppingBag, Receipt, Users, ChevronRight,
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

const fmt = (n: number) => `₦${(n || 0).toLocaleString()}`;

export default function BiztriachOverview() {
  const { activeChatbot, user } = useDashboard();
  const [financials, setFinancials] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const finRes = await fetch("/api/reports/financial?period=today");
        if (finRes.ok) {
          const data = await finRes.json();
          setFinancials(data.summary);
          setLowStock(data.lowStock || []);
        }
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

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const stats = [
    { label: "Today's Revenue", value: financials ? fmt(financials.todayRevenue) : "—", sub: `${financials?.totalSalesToday || 0} sales today`, icon: Wallet, tone: "text-emerald-600 bg-emerald-50 border-emerald-100" },
    { label: "Today's Profit", value: financials ? fmt(financials.todayProfit) : "—", sub: `Expenses ${financials ? fmt(financials.todayExpenses) : "—"}`, icon: TrendingUp, tone: "text-violet-600 bg-violet-50 border-violet-100" },
    { label: "Inventory Value", value: financials ? fmt(financials.inventoryValue) : "—", sub: `${financials?.totalProducts || 0} products tracked`, icon: Package, tone: "text-sky-600 bg-sky-50 border-sky-100" },
    { label: "Low Stock", value: financials ? `${financials.lowStockCount} items` : "—", sub: financials?.lowStockCount ? "Needs restock soon" : "All stocked up", icon: AlertTriangle, tone: financials?.lowStockCount ? "text-amber-600 bg-amber-50 border-amber-100" : "text-slate-500 bg-slate-50 border-slate-200" },
  ];

  const quickActions = [
    { label: "WhatsApp Agent", desc: "Your AI replies to customers on WhatsApp, 24/7", href: "/dashboard/whatsapp", icon: MessageCircle, tone: "bg-emerald-500" },
    { label: "Train Knowledge", desc: "Upload documents so the AI speaks your business", href: "/dashboard/documents", icon: Database, tone: "bg-violet-500" },
    { label: "Record a Sale", desc: "Every sale updates stock, profit & reports", href: "/dashboard/sales", icon: ShoppingBag, tone: "bg-sky-500" },
    { label: "Live Inbox", desc: "See every customer conversation as it happens", href: "/dashboard/conversations", icon: Bot, tone: "bg-indigo-500" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-outfit text-[26px] font-bold tracking-tight text-slate-900">
            {greeting}{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-[13.5px] text-slate-500 mt-1">
            {activeChatbot ? <>Agent <span className="font-semibold text-slate-700">{activeChatbot.name}</span> is live • </> : ""}
            Here's what's happening across your business today.
          </p>
        </div>
        <Link href="/dashboard/reports" className="btn-primary">
          View Reports <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="console-card console-card-hover p-5">
            <div className="flex items-center justify-between mb-3">
              <span className={`w-9 h-9 rounded-lg border flex items-center justify-center ${s.tone}`}>
                <s.icon className="w-[17px] h-[17px]" />
              </span>
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{s.label}</div>
            <div className="font-outfit text-[26px] font-bold text-slate-900 mt-1 leading-tight">
              {loading ? <span className="inline-block w-20 h-7 bg-slate-100 rounded animate-pulse" /> : s.value}
            </div>
            <div className="text-[12px] text-slate-500 mt-1.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <div className="section-title">Quick actions</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {quickActions.map((a) => (
            <Link key={a.href} href={a.href} className="console-card console-card-hover p-5 group">
              <div className={`w-9 h-9 rounded-lg ${a.tone} flex items-center justify-center shadow-sm mb-3`}>
                <a.icon className="w-[17px] h-[17px] text-white" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-semibold text-slate-800 group-hover:text-violet-700 transition">{a.label}</span>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">{a.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Activity */}
      <div className="grid lg:grid-cols-12 gap-5">
        {/* Recent sales */}
        <div className="lg:col-span-7 console-card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="text-[13.5px] font-semibold text-slate-800 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-slate-400" /> Recent Sales
            </div>
            <Link href="/dashboard/sales" className="text-[12px] font-semibold text-violet-600 hover:text-violet-700">View all →</Link>
          </div>
          {loading ? (
            <div className="p-10 text-center text-[13px] text-slate-400">Loading…</div>
          ) : recentSales.length === 0 ? (
            <div className="p-10 text-center">
              <div className="text-[28px] mb-2">🧾</div>
              <p className="text-[13.5px] font-semibold text-slate-700">No sales yet</p>
              <p className="text-[12.5px] text-slate-500 mt-1">Record one manually or just WhatsApp: <span className="font-mono text-[11.5px] bg-slate-100 px-1.5 py-0.5 rounded">Sold 3 bags rice for 50000</span></p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr><th className="console-th">Sale</th><th className="console-th">Customer</th><th className="console-th">Items</th><th className="console-th text-right">Amount</th></tr></thead>
                <tbody>
                  {recentSales.map((s: any) => (
                    <tr key={s.id} className="hover:bg-slate-50/70">
                      <td className="console-td font-mono text-[12px] text-slate-500">{s.saleNumber}</td>
                      <td className="console-td font-medium text-slate-700">{s.customer?.name || "Walk-in"}</td>
                      <td className="console-td text-slate-500">{s.items?.map((it: any) => `${it.quantity}× ${it.productName}`).join(", ").slice(0, 40)}</td>
                      <td className="console-td text-right font-bold text-slate-900">{fmt(s.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Low stock + channels */}
        <div className="lg:col-span-5 space-y-5">
          <div className="console-card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="text-[13.5px] font-semibold text-slate-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Low Stock
              </div>
              <Link href="/dashboard/inventory" className="text-[12px] font-semibold text-violet-600">Inventory →</Link>
            </div>
            {lowStock.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-[28px] mb-2">📦</div>
                <p className="text-[13px] text-slate-500">Everything is well stocked{financials?.totalProducts ? ` — ${financials.totalProducts} products` : ""}.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {lowStock.slice(0, 5).map((p: any) => (
                  <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <div className="text-[13px] font-medium text-slate-700">{p.name}</div>
                      <div className="text-[11.5px] text-slate-400">Restock at {p.restockLevel || "—"}</div>
                    </div>
                    <span className="pill-amber">{p.quantity || 0} left</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="console-card p-5">
            <div className="text-[13.5px] font-semibold text-slate-800 flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-slate-400" /> Snapshot
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-3.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Customers</div>
                <div className="font-outfit text-[20px] font-bold text-slate-900 mt-0.5">{financials?.totalCustomers ?? "—"}</div>
              </div>
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-3.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Month Profit</div>
                <div className="font-outfit text-[20px] font-bold text-slate-900 mt-0.5">{financials ? fmt(financials.monthProfit) : "—"}</div>
              </div>
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-3.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Month Revenue</div>
                <div className="font-outfit text-[20px] font-bold text-slate-900 mt-0.5">{financials ? fmt(financials.monthRevenue) : "—"}</div>
              </div>
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-3.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Month Expenses</div>
                <div className="font-outfit text-[20px] font-bold text-slate-900 mt-0.5">{financials ? fmt(financials.monthExpenses) : "—"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
