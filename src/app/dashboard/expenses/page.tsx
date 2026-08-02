"use client";
import React, { useEffect, useState } from "react";
import { Receipt, Plus, TrendingDown, Wallet } from "lucide-react";

export default function ExpensesPage(){
  const [expenses,setExpenses]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [showAdd,setShowAdd]=useState(false);
  const [form,setForm]=useState({title:"",amount:"",description:"",paymentMethod:"cash"});

  const load=async()=>{ setLoading(true); try{ const r=await fetch("/api/expenses"); if(r.ok) setExpenses(await r.json()); }catch{} setLoading(false); };
  useEffect(()=>{load();},[]);

  const handleCreate=async(e:React.FormEvent)=>{ e.preventDefault(); const res=await fetch("/api/expenses",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)}); if(res.ok){ setShowAdd(false); setForm({title:"",amount:"",description:"",paymentMethod:"cash"}); load(); } };

  const total=expenses.reduce((s,e)=>s+(e.amount||0),0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><div><h1 className="font-outfit text-[26px] font-bold">Expense Tracking</h1><p className="text-[13px] text-slate-500">Track rent, fuel, transport, salary, electricity, purchases. AI auto-reports.</p></div><button onClick={()=>setShowAdd(true)} className="h-10 px-5 rounded-full bg-[#0a0a16] text-white text-[13px] font-medium flex items-center gap-2"><Plus className="w-4 h-4"/> Add Expense</button></div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-[18px] bg-white border p-5"><div className="text-[11px] uppercase tracking-widest font-bold text-slate-400">Total Expenses</div><div className="font-outfit text-[24px] font-bold mt-1">₦{total.toLocaleString()}</div></div>
        <div className="rounded-[18px] bg-white border p-5"><div className="text-[11px] uppercase tracking-widest font-bold text-slate-400">This Month</div><div className="font-outfit text-[24px] font-bold mt-1">₦{expenses.filter(e=> new Date(e.date).getMonth()===new Date().getMonth()).reduce((s,e)=>s+e.amount,0).toLocaleString()}</div></div>
        <div className="rounded-[18px] bg-gradient-to-br from-amber-500 to-orange-600 p-5 text-white"><div className="text-[11px] uppercase tracking-widest font-bold text-white/70">WhatsApp</div><div className="font-bold mt-1">“Paid rent ₦150k” → expense logged</div></div>
      </div>

      <div className="rounded-[20px] bg-white border shadow-soft overflow-hidden">
        <div className="p-5 border-b font-semibold text-[14px] flex items-center gap-2"><Receipt className="w-4 h-4"/> All Expenses</div>
        {loading? <div className="p-12 text-center text-[13px] text-slate-400">Loading...</div> : expenses.length===0 ? <div className="p-16 text-center text-[13px] text-slate-400">No expenses yet. Track via dashboard or WhatsApp.</div> :
        <div className="divide-y">{expenses.map((ex:any)=><div key={ex.id} className="p-4 flex justify-between hover:bg-slate-50"><div><div className="font-medium text-[13px]">{ex.title}</div><div className="text-[11px] text-slate-500">{ex.description?.slice(0,60)} • {new Date(ex.date).toLocaleDateString()} • {ex.paymentMethod}</div></div><div className="text-right"><div className="font-bold text-[14px]">₦{ex.amount.toLocaleString()}</div><div className="text-[11px]"><span className="px-2 py-0.5 rounded-full bg-slate-100">{ex.category?.name || "General"}</span></div></div></div>)}</div>}
      </div>

      {showAdd && (<div className="fixed inset-0 z-50 bg-black/50 backdrop-blur flex items-center justify-center p-4"><form onSubmit={handleCreate} className="bg-white rounded-[20px] p-6 w-full max-w-md space-y-4 shadow-2xl"><h3 className="font-outfit font-bold text-[18px]">Add Expense</h3><input required placeholder="Title e.g. Shop Rent" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="w-full h-11 px-4 rounded-[12px] border text-[13px]"/><input required type="number" placeholder="Amount ₦" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} className="w-full h-11 px-4 rounded-[12px] border text-[13px]"/><input placeholder="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="w-full h-11 px-4 rounded-[12px] border text-[13px]"/><div className="flex gap-3 pt-2"><button type="button" onClick={()=>setShowAdd(false)} className="flex-1 h-11 rounded-full border text-[13px]">Cancel</button><button type="submit" className="flex-1 h-11 rounded-full bg-[#0a0a16] text-white text-[13px] font-semibold">Save</button></div></form></div>)}
    </div>
  );
}
