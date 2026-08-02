"use client";
import React,{useEffect,useState} from "react";
import { BarChart3, Download, TrendingUp, Wallet, Package, Users } from "lucide-react";

export default function ReportsPage(){
  const [data,setData]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{ (async()=>{ try{ const r=await fetch("/api/reports/financial?period=month"); if(r.ok) setData(await r.json()); }catch{} setLoading(false); })(); },[]);

  return(
    <div className="space-y-6">
      <div className="flex justify-between items-center"><div><h1 className="font-outfit text-[26px] font-bold">AI Reports & Financial Dashboard</h1><p className="text-[13px] text-slate-500">Daily, monthly, AI-generated insights, downloadable reports.</p></div><button className="h-10 px-5 rounded-full bg-white border text-[13px] font-medium flex items-center gap-2"><Download className="w-4 h-4"/> Download PDF</button></div>

      {loading? <div className="p-12 text-center text-[13px] text-slate-400">Generating AI reports...</div> : data ? (
        <>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="rounded-[18px] bg-white border p-5"><div className="text-[11px] uppercase tracking-widest font-bold text-slate-400">Month Revenue</div><div className="font-outfit text-[22px] font-bold mt-1">₦{data.summary.monthRevenue?.toLocaleString()}</div><div className="text-[11px] text-emerald-600 mt-2 flex items-center gap-1"><TrendingUp className="w-3 h-3"/> Based on {data.summary.totalSalesMonth} sales</div></div>
            <div className="rounded-[18px] bg-white border p-5"><div className="text-[11px] uppercase tracking-widest font-bold text-slate-400">Month Profit</div><div className="font-outfit text-[22px] font-bold mt-1">₦{data.summary.monthProfit?.toLocaleString()}</div></div>
            <div className="rounded-[18px] bg-white border p-5"><div className="text-[11px] uppercase tracking-widest font-bold text-slate-400">Inventory Value</div><div className="font-outfit text-[22px] font-bold mt-1">₦{data.summary.inventoryValue?.toLocaleString()}</div></div>
            <div className="rounded-[18px] bg-[#0a0a16] text-white p-5"><div className="text-[11px] uppercase tracking-widest font-bold text-white/50">AI Insight</div><div className="text-[13px] mt-2 leading-relaxed">{data.insight}</div></div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-[20px] bg-white border p-6 shadow-soft"><h3 className="font-semibold text-[14px] mb-4 flex items-center gap-2"><Package className="w-4 h-4"/> Top Products (Sales Qty)</h3>{data.saleItems?.length? <div className="space-y-3">{data.saleItems.map((it:any,i:number)=><div key={i} className="flex justify-between text-[13px]"><span>{i+1}. {it.productName}</span><span className="font-bold">{it._sum.quantity} sold • ₦{it._sum.totalPrice?.toLocaleString()}</span></div>)}</div> : <div className="text-[13px] text-slate-400">No sales data yet</div>}</div>
            <div className="rounded-[20px] bg-white border p-6 shadow-soft"><h3 className="font-semibold text-[14px] mb-4 flex items-center gap-2"><Users className="w-4 h-4"/> Top Customers</h3>{data.topCustomers?.length? <div className="space-y-3">{data.topCustomers.map((c:any)=><div key={c.id} className="flex justify-between text-[13px]"><span>{c.name}</span><span className="font-bold">₦{c.totalSpent.toLocaleString()} • {c.totalOrders} orders</span></div>)}</div> : <div className="text-[13px] text-slate-400">No customer data yet</div>}</div>
          </div>

          <div className="rounded-[20px] bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-600 p-[1px]"><div className="rounded-[19px] bg-white p-6"><h3 className="font-outfit font-bold text-[18px]">📊 Daily AI Report Example</h3><div className="mt-4 grid md:grid-cols-2 gap-4 text-[13px]"><div className="space-y-2"><div><strong>Daily Sales:</strong> {data.summary.totalSalesToday} transactions</div><div><strong>Revenue:</strong> ₦{data.summary.todayRevenue?.toLocaleString()}</div><div><strong>Expenses:</strong> ₦{data.summary.todayExpenses?.toLocaleString()}</div><div><strong>Profit:</strong> ₦{data.summary.todayProfit?.toLocaleString()}</div></div><div className="space-y-2"><div><strong>Inventory Remaining:</strong> {data.summary.totalProducts} products, value ₦{data.summary.inventoryValue?.toLocaleString()}</div><div><strong>Low Stock Alerts:</strong> {data.summary.lowStockCount} items — {data.lowStock?.map((p:any)=>p.name).join(", ") || "None"}</div><div><strong>Customers Served:</strong> {data.summary.totalCustomers}</div></div></div><div className="mt-6 p-4 rounded-[12px] bg-slate-50 border text-[12px] text-slate-600"><strong>AI Recommendation:</strong> {data.insight} Consider creating a landing page for best seller and broadcast to WhatsApp leads.</div></div></div>
        </>
      ): <div className="text-[13px] text-slate-400">No data</div>}
    </div>
  );
}
