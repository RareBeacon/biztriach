"use client";
import React, { useEffect, useState } from "react";
import { ShoppingBag, Plus, Search, TrendingUp, Package } from "lucide-react";
import Link from "next/link";

export default function SalesPage() {
  const [sales,setSales]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [showAdd,setShowAdd]=useState(false);
  const [form,setForm]=useState({ customerName:"", productName:"", quantity:"1", unitPrice:"", paymentMethod:"cash" });

  const load=async()=>{
    setLoading(true);
    try{ const r=await fetch("/api/sales"); if(r.ok) setSales(await r.json()); }catch{}
    setLoading(false);
  };
  useEffect(()=>{ load(); },[]);

  const handleCreate=async(e:React.FormEvent)=>{
    e.preventDefault();
    const items=[{ productName:form.productName, quantity:form.quantity, unitPrice:form.unitPrice }];
    const res=await fetch("/api/sales",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({customerName:form.customerName, items, paymentMethod:form.paymentMethod, channel:"manual"})});
    if(res.ok){ setShowAdd(false); setForm({customerName:"",productName:"",quantity:"1",unitPrice:"",paymentMethod:"cash"}); load(); }
  };

  const totalRevenue=sales.reduce((s,sa)=>s+ (sa.totalAmount||0),0);
  const totalProfit=sales.reduce((s,sa)=>s+ (sa.profit||0),0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center"><div><h1 className="font-outfit text-[26px] font-bold">Sales Management</h1><p className="text-[13px] text-slate-500">Every sale updates revenue, profit, inventory, customer history, daily reports automatically.</p></div><button onClick={()=>setShowAdd(true)} className="h-10 px-5 rounded-full bg-[#0a0a16] text-white text-[13px] font-medium flex items-center gap-2"><Plus className="w-4 h-4"/> Record Sale</button></div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-[18px] bg-white border p-5"><div className="text-[11px] uppercase tracking-widest font-bold text-slate-400">Total Revenue</div><div className="font-outfit text-[24px] font-bold mt-1">₦{totalRevenue.toLocaleString()}</div><div className="text-[11px] text-emerald-600 mt-2 flex items-center gap-1"><TrendingUp className="w-3 h-3"/> {sales.length} transactions</div></div>
        <div className="rounded-[18px] bg-white border p-5"><div className="text-[11px] uppercase tracking-widest font-bold text-slate-400">Total Profit</div><div className="font-outfit text-[24px] font-bold mt-1">₦{totalProfit.toLocaleString()}</div><div className="text-[11px] text-slate-500 mt-2">After cost & expenses</div></div>
        <div className="rounded-[18px] bg-gradient-to-br from-violet-600 to-indigo-600 p-5 text-white"><div className="text-[11px] uppercase tracking-widest font-bold text-white/60">WhatsApp Auto</div><div className="font-bold mt-1">“Sold 5 bags rice ₦85k each” → logged instantly</div></div>
      </div>

      <div className="rounded-[20px] bg-white border shadow-soft overflow-hidden">
        <div className="p-5 border-b text-[13px] font-semibold flex items-center gap-2"><ShoppingBag className="w-4 h-4"/> Recent Sales</div>
        {loading? <div className="p-12 text-center text-[13px] text-slate-400">Loading...</div> : sales.length===0 ? <div className="p-16 text-center"><Package className="w-10 h-10 text-slate-200 mx-auto mb-2"/><p className="text-[14px] font-medium">No sales yet</p><p className="text-[12px] text-slate-400">Record manually or via WhatsApp</p></div> :
        <div className="overflow-x-auto"><table className="w-full text-[13px]"><thead className="bg-slate-50 text-[11px] uppercase tracking-widest text-slate-400"><tr><th className="text-left p-4">Sale #</th><th className="text-left p-4">Customer</th><th className="text-left p-4">Items</th><th className="text-right p-4">Amount</th><th className="text-right p-4">Profit</th><th className="text-left p-4">Channel</th><th className="text-left p-4">Date</th></tr></thead><tbody className="divide-y">{sales.map((s:any)=><tr key={s.id} className="hover:bg-slate-50"><td className="p-4 font-mono text-[12px]">{s.saleNumber}</td><td className="p-4 font-medium">{s.customer?.name || s.customerId?.slice(0,6) || "Walk-in"}</td><td className="p-4">{s.items?.map((it:any)=>`${it.quantity}x ${it.productName}`).join(", ").slice(0,60)}</td><td className="p-4 text-right font-bold">₦{s.totalAmount?.toLocaleString()}</td><td className="p-4 text-right text-emerald-600">₦{s.profit?.toLocaleString()}</td><td className="p-4"><span className="px-2 py-1 rounded-full bg-slate-100 text-[11px]">{s.channel}</span></td><td className="p-4 text-[11px] text-slate-500">{new Date(s.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table></div>}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur flex items-center justify-center p-4">
          <form onSubmit={handleCreate} className="bg-white rounded-[20px] p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="font-outfit font-bold text-[18px]">Record New Sale</h3>
            <input placeholder="Customer name (optional)" value={form.customerName} onChange={e=>setForm({...form,customerName:e.target.value})} className="w-full h-11 px-4 rounded-[12px] border text-[13px]"/>
            <input required placeholder="Product name e.g. Rice 50kg" value={form.productName} onChange={e=>setForm({...form,productName:e.target.value})} className="w-full h-11 px-4 rounded-[12px] border text-[13px]"/>
            <div className="grid grid-cols-2 gap-3">
              <input required type="number" placeholder="Qty" value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})} className="h-11 px-4 rounded-[12px] border text-[13px]"/>
              <input required type="number" placeholder="Unit price ₦" value={form.unitPrice} onChange={e=>setForm({...form,unitPrice:e.target.value})} className="h-11 px-4 rounded-[12px] border text-[13px]"/>
            </div>
            <select value={form.paymentMethod} onChange={e=>setForm({...form,paymentMethod:e.target.value})} className="w-full h-11 px-4 rounded-[12px] border text-[13px]"><option value="cash">Cash</option><option value="transfer">Transfer</option><option value="pos">POS</option><option value="card">Card</option></select>
            <div className="flex gap-3 pt-2"><button type="button" onClick={()=>setShowAdd(false)} className="flex-1 h-11 rounded-full border text-[13px]">Cancel</button><button type="submit" className="flex-1 h-11 rounded-full bg-[#0a0a16] text-white text-[13px] font-semibold">Save Sale</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
