"use client";
import React,{useEffect,useState} from "react";
import { Target, Plus, Layers, Mail, ArrowRight, Sparkles } from "lucide-react";

export default function FunnelsPage(){
  const [funnels,setFunnels]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [showAdd,setShowAdd]=useState(false);
  const [name,setName]=useState("");

  const load=async()=>{ setLoading(true); try{ const r=await fetch("/api/funnels"); if(r.ok) setFunnels(await r.json()); }catch{} setLoading(false); };
  useEffect(()=>{load();},[]);

  const handleCreate=async(e:React.FormEvent)=>{ e.preventDefault(); const res=await fetch("/api/funnels",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name})}); if(res.ok){ setShowAdd(false); setName(""); load(); } };

  return(
    <div className="space-y-6">
      <div className="flex justify-between items-center"><div><h1 className="font-outfit text-[26px] font-bold">Funnel Builder</h1><p className="text-[13px] text-slate-500">Landing → Lead Form → Thank You → Email Sequence → AI Follow-up → Customer. AI auto-generates strategy.</p></div><button onClick={()=>setShowAdd(true)} className="h-10 px-5 rounded-full bg-[#0a0a16] text-white text-[13px] font-medium flex items-center gap-2"><Plus className="w-4 h-4"/> New Funnel</button></div>

      <div className="rounded-[20px] bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-600 p-[1px]"><div className="rounded-[19px] bg-[#0a0a16] p-6 text-white"><div className="flex items-center gap-2 mb-3"><Sparkles className="w-5 h-5 text-violet-300"/><span className="font-semibold">AI Marketing Planner Example</span></div><p className="text-[13px] text-white/70">Business: “I own a supermarket” → AI generates: Target audience (families, bulk buyers), Marketing strategy (WhatsApp broadcast + landing), Funnel plan (rice offer page → form → thank you → email 3-day sequence → AI WhatsApp follow-up), Sales strategy.</p><div className="mt-4 flex items-center gap-2 text-[12px]"><span className="px-3 py-1.5 rounded-full bg-white/[0.1] border border-white/[0.1]">Landing Page</span><ArrowRight className="w-4 h-4 text-white/40"/><span className="px-3 py-1.5 rounded-full bg-white/[0.1] border border-white/[0.1]">Lead Form</span><ArrowRight className="w-4 h-4 text-white/40"/><span className="px-3 py-1.5 rounded-full bg-white/[0.1] border border-white/[0.1]">Email</span><ArrowRight className="w-4 h-4 text-white/40"/><span className="px-3 py-1.5 rounded-full bg-white text-black">AI Follow-up</span></div></div></div>

      <div className="rounded-[20px] bg-white border shadow-soft overflow-hidden">
        <div className="p-5 border-b font-semibold text-[14px] flex items-center gap-2"><Target className="w-4 h-4"/> Your Funnels</div>
        {loading? <div className="p-12 text-center text-[13px] text-slate-400">Loading...</div> : funnels.length===0 ? <div className="p-16 text-center text-[13px] text-slate-400">No funnels yet. Create your first sales funnel with AI.</div> :
        <div className="divide-y">{funnels.map((f:any)=><div key={f.id} className="p-5 hover:bg-slate-50"><div className="flex justify-between items-start"><div><div className="font-medium text-[14px]">{f.name}</div><div className="text-[11px] text-slate-500 mt-1">{f.description || "Auto-generated funnel"} • {f.steps?.length || 5} steps • {f.totalViews} views • {f.totalConversions} conversions</div><div className="mt-3 flex items-center gap-2">{f.steps?.map((s:any,i:number)=><span key={s.id} className="flex items-center gap-2 text-[11px]"><span className="w-6 h-6 rounded-full bg-slate-100 border flex items-center justify-center font-bold">{s.order}</span> {s.title} {i < (f.steps.length-1) && <ArrowRight className="w-3 h-3 text-slate-300"/>}</span>)}</div></div><button className="h-8 px-3 rounded-full bg-[#0a0a16] text-white text-[12px]">Open Builder</button></div></div>)}</div>}
      </div>

      {showAdd && (<div className="fixed inset-0 z-50 bg-black/50 backdrop-blur flex items-center justify-center p-4"><form onSubmit={handleCreate} className="bg-white rounded-[20px] p-6 w-full max-w-md space-y-4"><h3 className="font-outfit font-bold text-[18px]">New Funnel - AI Strategy</h3><input required placeholder="Funnel name e.g. Rice Bulk Buyers Funnel" value={name} onChange={e=>setName(e.target.value)} className="w-full h-11 px-4 rounded-[12px] border text-[13px]"/><p className="text-[11px] text-slate-500">AI will generate target audience, landing page plan, email sequence, sales strategy based on your business profile.</p><div className="flex gap-3 pt-2"><button type="button" onClick={()=>setShowAdd(false)} className="flex-1 h-11 rounded-full border text-[13px]">Cancel</button><button type="submit" className="flex-1 h-11 rounded-full bg-[#0a0a16] text-white text-[13px] font-semibold">Generate Funnel</button></div></form></div>)}
    </div>
  );
}
