"use client";
import React, { useEffect, useState } from "react";
import { Users, Plus, Phone, Mail, ShoppingBag } from "lucide-react";

export default function CustomersPage(){
  const [customers,setCustomers]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [showAdd,setShowAdd]=useState(false);
  const [form,setForm]=useState({name:"",email:"",phone:"",address:""});

  const load=async()=>{ setLoading(true); try{ const r=await fetch("/api/customers"); if(r.ok) setCustomers(await r.json()); }catch{} setLoading(false); };
  useEffect(()=>{load();},[]);

  const handleCreate=async(e:React.FormEvent)=>{ e.preventDefault(); const res=await fetch("/api/customers",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)}); if(res.ok){ setShowAdd(false); setForm({name:"",email:"",phone:"",address:""}); load(); } };

  return(
    <div className="space-y-6">
      <div className="flex justify-between items-center"><div><h1 className="font-outfit text-[26px] font-bold">Customers</h1><p className="text-[13px] text-slate-500">Track top customers, spending, outstanding payments.</p></div><button onClick={()=>setShowAdd(true)} className="h-10 px-5 rounded-full bg-[#0a0a16] text-white text-[13px] font-medium flex items-center gap-2"><Plus className="w-4 h-4"/> Add Customer</button></div>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-[18px] bg-white border p-5"><div className="text-[11px] uppercase tracking-widest font-bold text-slate-400">Total Customers</div><div className="font-outfit text-[24px] font-bold mt-1">{customers.length}</div></div>
        <div className="rounded-[18px] bg-white border p-5"><div className="text-[11px] uppercase tracking-widest font-bold text-slate-400">Top Spender</div><div className="font-outfit text-[16px] font-bold mt-1">{customers[0]?.name || "—"} {customers[0] && `₦${customers[0].totalSpent.toLocaleString()}`}</div></div>
        <div className="rounded-[18px] bg-gradient-to-br from-blue-500 to-cyan-600 p-5 text-white"><div className="text-[11px] uppercase tracking-widest font-bold text-white/70">Auto Tagged</div><div className="font-bold mt-1">From sales & WhatsApp customer names</div></div>
      </div>
      <div className="rounded-[20px] bg-white border shadow-soft overflow-hidden">
        <div className="p-5 border-b font-semibold text-[14px]"><Users className="w-4 h-4 inline mr-2"/>Customer List</div>
        {loading? <div className="p-12 text-center text-[13px] text-slate-400">Loading...</div> : customers.length===0 ? <div className="p-16 text-center text-[13px] text-slate-400">No customers yet. Sales will auto-create customers.</div> :
        <div className="divide-y">{customers.map((c:any)=><div key={c.id} className="p-4 flex justify-between hover:bg-slate-50"><div><div className="font-medium text-[13px]">{c.name}</div><div className="text-[11px] text-slate-500 flex items-center gap-3 mt-1"><span className="flex items-center gap-1"><Phone className="w-3 h-3"/>{c.phone || "No phone"}</span><span className="flex items-center gap-1"><Mail className="w-3 h-3"/>{c.email || "No email"}</span></div></div><div className="text-right"><div className="font-bold text-[13px]">₦{c.totalSpent.toLocaleString()}</div><div className="text-[11px] text-slate-500">{c.totalOrders} orders • Last: {c.lastPurchaseAt ? new Date(c.lastPurchaseAt).toLocaleDateString() : "—"}</div></div></div>)}</div>}
      </div>
      {showAdd && (<div className="fixed inset-0 z-50 bg-black/50 backdrop-blur flex items-center justify-center p-4"><form onSubmit={handleCreate} className="bg-white rounded-[20px] p-6 w-full max-w-md space-y-4"><h3 className="font-outfit font-bold text-[18px]">Add Customer</h3><input required placeholder="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full h-11 px-4 rounded-[12px] border text-[13px]"/><input placeholder="Phone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="w-full h-11 px-4 rounded-[12px] border text-[13px]"/><input placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="w-full h-11 px-4 rounded-[12px] border text-[13px]"/><div className="flex gap-3 pt-2"><button type="button" onClick={()=>setShowAdd(false)} className="flex-1 h-11 rounded-full border text-[13px]">Cancel</button><button type="submit" className="flex-1 h-11 rounded-full bg-[#0a0a16] text-white text-[13px] font-semibold">Save</button></div></form></div>)}
    </div>
  );
}
