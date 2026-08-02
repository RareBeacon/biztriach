"use client";
import React,{useEffect,useState} from "react";
import { Users, Mail, Phone, Target } from "lucide-react";

export default function LeadsPage(){
  const [leads,setLeads]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const load=async()=>{ setLoading(true); try{ const r=await fetch("/api/leads"); if(r.ok) setLeads(await r.json()); }catch{} setLoading(false); };
  useEffect(()=>{load();},[]);
  const newLeads=leads.filter(l=>l.status==="NEW").length;
  return(
    <div className="space-y-6">
      <div className="flex justify-between items-center"><div><h1 className="font-outfit text-[26px] font-bold">Leads & Email Capture</h1><p className="text-[13px] text-slate-500">Forms from landing pages, funnels, website widget. Export, analytics.</p></div><button className="h-10 px-5 rounded-full bg-white border text-[13px] font-medium">Export CSV</button></div>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-[18px] bg-white border p-5"><div className="text-[11px] uppercase tracking-widest font-bold text-slate-400">Total Leads</div><div className="font-outfit text-[24px] font-bold mt-1">{leads.length}</div></div>
        <div className="rounded-[18px] bg-violet-50 border border-violet-200 p-5"><div className="text-[11px] uppercase tracking-widest font-bold text-violet-700">New</div><div className="font-outfit text-[24px] font-bold mt-1 text-violet-900">{newLeads}</div></div>
        <div className="rounded-[18px] bg-gradient-to-br from-violet-600 to-indigo-600 p-5 text-white"><div className="text-[11px] uppercase tracking-widest font-bold text-white/70">Conversion Funnel</div><div className="font-bold mt-1">Landing → Form → Email → AI follow-up → Customer</div></div>
      </div>
      <div className="rounded-[20px] bg-white border shadow-soft overflow-hidden">
        <div className="p-5 border-b font-semibold text-[14px] flex items-center gap-2"><Target className="w-4 h-4"/> Leads Inbox</div>
        {loading? <div className="p-12 text-center text-[13px] text-slate-400">Loading...</div> : leads.length===0 ? <div className="p-16 text-center text-[13px] text-slate-400">No leads yet. Create landing page with form to start capturing.</div> :
        <div className="divide-y">{leads.map((l:any)=><div key={l.id} className="p-4 flex justify-between hover:bg-slate-50"><div><div className="font-medium text-[13px]">{l.name || "Anonymous"} • {l.email}</div><div className="text-[11px] text-slate-500">{l.source} {l.phone && `• ${l.phone}`} • {new Date(l.createdAt).toLocaleDateString()}</div></div><div><span className={`text-[11px] px-2 py-1 rounded-full font-bold ${l.status==="NEW"?"bg-violet-100 text-violet-700 border border-violet-200":l.status==="CONVERTED"?"bg-emerald-100 text-emerald-700":"bg-slate-100"}`}>{l.status}</span></div></div>)}</div>}
      </div>
    </div>
  );
}
