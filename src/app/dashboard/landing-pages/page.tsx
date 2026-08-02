"use client";
import React,{useEffect,useState} from "react";
import { Layers, Plus, Globe, Eye, MousePointer, Sparkles } from "lucide-react";

export default function LandingPagesPage(){
  const [pages,setPages]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [showAdd,setShowAdd]=useState(false);
  const [form,setForm]=useState({title:"",slug:"",description:"" , template:"modern"});

  const load=async()=>{ setLoading(true); try{ const r=await fetch("/api/landing-pages"); if(r.ok) setPages(await r.json()); }catch{} setLoading(false); };
  useEffect(()=>{load();},[]);

  const handleCreate=async(e:React.FormEvent)=>{ e.preventDefault(); const res=await fetch("/api/landing-pages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form, content:{sections:[{type:"hero",title:form.title},{type:"features"},{type:"cta"},{type:"faq"}]}})}); if(res.ok){ setShowAdd(false); setForm({title:"",slug:"",description:"",template:"modern"}); load(); } };

  return(
    <div className="space-y-6">
      <div className="flex justify-between items-center"><div><h1 className="font-outfit text-[26px] font-bold">Landing Page Builder</h1><p className="text-[13px] text-slate-500">AI generates copy, UI suggestions, sections. Drag-drop, mobile responsive, embed AI agent.</p></div><button onClick={()=>setShowAdd(true)} className="h-10 px-5 rounded-full bg-[#0a0a16] text-white text-[13px] font-medium flex items-center gap-2"><Plus className="w-4 h-4"/> New Landing Page</button></div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-[18px] bg-white border p-5 flex items-center gap-3"><div className="w-10 h-10 rounded-[12px] bg-violet-100 border border-violet-200 flex items-center justify-center"><Layers className="w-5 h-5 text-violet-600"/></div><div><div className="font-bold text-[16px]">{pages.length} Pages</div><div className="text-[11px] text-slate-500">AI generated & custom</div></div></div>
        <div className="rounded-[18px] bg-white border p-5"><div className="text-[11px] uppercase tracking-widest font-bold text-slate-400">AI Features</div><div className="text-[13px] mt-1 font-medium">Copywriter • UI suggestions • Page planner • Templates • Forms • CTA • FAQ</div></div>
        <div className="rounded-[18px] bg-gradient-to-br from-indigo-600 to-cyan-600 p-5 text-white"><div className="text-[11px] uppercase tracking-widest font-bold text-white/70">Embed Agent</div><div className="font-bold mt-1">Install AI agent directly into any landing page with one click.</div></div>
      </div>

      <div className="rounded-[20px] bg-white border shadow-soft p-6">
        <div className="flex items-center gap-2 mb-4"><Sparkles className="w-4 h-4 text-violet-600"/><span className="font-semibold text-[14px]">Templates - Unique Professional Design</span></div>
        <div className="grid md:grid-cols-4 gap-3">
          {["Modern SaaS","Ecommerce Bold","Minimal Professional","Restaurant Warm"].map(t=><div key={t} className="rounded-[16px] border-2 border-dashed border-slate-200 p-4 text-center hover:border-violet-300 hover:bg-violet-50 transition cursor-pointer"><div className="w-12 h-12 rounded-[12px] bg-slate-100 mx-auto mb-2 flex items-center justify-center"><Globe className="w-6 h-6 text-slate-400"/></div><div className="font-medium text-[13px]">{t}</div><div className="text-[11px] text-slate-500 mt-1">AI copy + responsive</div></div>)}
        </div>
      </div>

      <div className="rounded-[20px] bg-white border shadow-soft overflow-hidden">
        <div className="p-5 border-b font-semibold text-[14px]">Your Landing Pages</div>
        {loading? <div className="p-12 text-center text-[13px] text-slate-400">Loading...</div> : pages.length===0 ? <div className="p-16 text-center text-[13px] text-slate-400">No landing pages yet. Create one with AI - just describe business: “I own supermarket” → AI generates target audience, strategy, page plan.</div> :
        <div className="divide-y">{pages.map((p:any)=><div key={p.id} className="p-4 flex justify-between hover:bg-slate-50"><div><div className="font-medium text-[13px]">{p.title} <span className="text-[11px] text-slate-400">/{p.slug}</span></div><div className="text-[11px] text-slate-500">{p.description?.slice(0,80)} • {p.template} • {p.views} views • {p.conversions} conversions • {p.isPublished?"Published":"Draft"}</div></div><div className="flex gap-2"><button className="h-8 px-3 rounded-full bg-white border text-[12px] flex items-center gap-1"><Eye className="w-3 h-3"/> Preview</button><button className="h-8 px-3 rounded-full bg-[#0a0a16] text-white text-[12px]">Edit Builder</button></div></div>)}</div>}
      </div>

      {showAdd && (<div className="fixed inset-0 z-50 bg-black/50 backdrop-blur flex items-center justify-center p-4"><form onSubmit={handleCreate} className="bg-white rounded-[20px] p-6 w-full max-w-md space-y-4 shadow-2xl"><h3 className="font-outfit font-bold text-[18px]">New Landing Page - AI Generator</h3><p className="text-[12px] text-slate-500">Describe your business and AI will generate page plan, copy, sections.</p><input required placeholder="Page Title e.g. Fresh Rice - Limited Offer" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="w-full h-11 px-4 rounded-[12px] border text-[13px]"/><input required placeholder="Slug e.g. fresh-rice-offer" value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})} className="w-full h-11 px-4 rounded-[12px] border text-[13px]"/><textarea placeholder="Business description for AI copywriter..." value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="w-full h-20 px-4 py-3 rounded-[12px] border text-[13px]"/><select value={form.template} onChange={e=>setForm({...form,template:e.target.value})} className="w-full h-11 px-4 rounded-[12px] border text-[13px]"><option value="modern">Modern SaaS</option><option value="minimal">Minimal</option><option value="bold">Bold Ecommerce</option><option value="restaurant">Restaurant Warm</option></select><div className="flex gap-3 pt-2"><button type="button" onClick={()=>setShowAdd(false)} className="flex-1 h-11 rounded-full border text-[13px]">Cancel</button><button type="submit" className="flex-1 h-11 rounded-full bg-[#0a0a16] text-white text-[13px] font-semibold">Generate with AI</button></div></form></div>)}
    </div>
  );
}
