"use client";
import React,{useEffect,useState} from "react";
import { Globe, Plus, RefreshCw, CheckCircle, AlertTriangle, Link as LinkIcon } from "lucide-react";

export default function WebsiteKnowledgePage(){
  const [sources,setSources]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [url,setUrl]=useState("");
  const [busy,setBusy]=useState(false);

  const load=async()=>{ setLoading(true); try{ const r=await fetch("/api/knowledge/website"); if(r.ok) setSources(await r.json()); }catch{} setLoading(false); };
  useEffect(()=>{load();},[]);

  const handleAdd=async(e:React.FormEvent)=>{
    e.preventDefault();
    setBusy(true);
    try{ const r=await fetch("/api/knowledge/website",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url})}); if(r.ok){ setUrl(""); load(); } else { const d=await r.json(); alert(d.error || "Failed"); } }catch{} setBusy(false);
  };

  return(
    <div className="space-y-6">
      <div className="flex justify-between items-center"><div><h1 className="font-outfit text-[26px] font-bold flex items-center gap-3"><Globe className="w-7 h-7 text-violet-600"/> Website Knowledge Import</h1><p className="text-[13px] text-slate-500">Enter website URL → crawl, extract useful business info, ignore nav/duplicate, organize into private knowledge base. Select pages include/exclude, manual sync, scheduled auto sync, incremental updates.</p></div></div>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 rounded-[20px] bg-white border shadow-soft p-6">
          <h3 className="font-semibold text-[14px]">Add Website Source</h3>
          <form onSubmit={handleAdd} className="mt-4 space-y-3">
            <input required type="url" placeholder="https://yourbusiness.com" value={url} onChange={e=>setUrl(e.target.value)} className="w-full h-11 px-4 rounded-[12px] border text-[13px]"/>
            <div className="rounded-[12px] bg-violet-50 border border-violet-200 p-3 text-[11px] text-violet-800"><strong>What we extract:</strong> Product pages, FAQs, policies, about, services, blog (selective). We ignore navigation, footer, duplicate content. Auto-chunk + embed.</div>
            <button disabled={busy} className="w-full h-11 rounded-full bg-[#0a0a16] text-white text-[13px] font-semibold disabled:opacity-50">{busy? "Crawling & Indexing..." : "Crawl & Index Website"}</button>
          </form>
          <div className="mt-6 space-y-2 text-[12px]">
            <h4 className="font-semibold text-[13px]">Knowledge Sources Supported</h4>
            <div className="grid grid-cols-2 gap-2">{["PDF","DOCX","XLSX (price lists)","CSV","PPTX","TXT/MD","Images OCR","Website URLs","Help center","Product catalogs"].map(s=><span key={s} className="px-2.5 py-1 rounded-full bg-slate-100 border text-[11px]">{s}</span>)}</div>
          </div>
        </div>
        <div className="lg:col-span-7 rounded-[20px] bg-white border shadow-soft p-6">
          <h3 className="font-semibold text-[14px] flex items-center gap-2"><LinkIcon className="w-4 h-4"/> Website Sources ({sources.length})</h3>
          {loading? <div className="p-12 text-center text-[13px] text-slate-400">Loading...</div> : sources.length===0 ? <div className="p-16 text-center text-[13px] text-slate-400">No website sources yet. Add your business website to auto-train AI on your public content.</div> :
          <div className="mt-4 divide-y">{sources.map((s:any)=><div key={s.id} className="py-4 flex justify-between"><div><div className="font-medium text-[13px] flex items-center gap-2">{s.url} {s.status==="TRAINED"? <CheckCircle className="w-4 h-4 text-emerald-500"/> : s.status==="FAILED"? <AlertTriangle className="w-4 h-4 text-amber-500"/> : <RefreshCw className="w-4 h-4 animate-spin text-violet-500"/>}</div><div className="text-[11px] text-slate-500 mt-1">{s.pagesCrawled} pages • Last sync: {s.lastSyncedAt ? new Date(s.lastSyncedAt).toLocaleDateString() : "Never"} • Auto sync: {s.autoSync?"Yes":"No"}</div></div><div className="flex items-center gap-2"><span className={`text-[11px] px-2 py-1 rounded-full font-bold ${s.status==="TRAINED"?"bg-emerald-100 text-emerald-700":s.status==="CRAWLING"?"bg-violet-100 text-violet-700":"bg-amber-100 text-amber-700"}`}>{s.status}</span></div></div>)}</div>}
        </div>
      </div>

      <div className="rounded-[20px] bg-gradient-to-br from-[#0a0a16] to-[#1a1a2e] text-white p-6"><h3 className="font-semibold">Knowledge Synchronization</h3><p className="text-[13px] text-white/60 mt-2">Manual sync, scheduled auto sync (daily/weekly), incremental updates (only changed content reprocessed). Version history, re-indexing, search across docs, duplicate detection, quality monitoring. Businesses can update/remove knowledge anytime, AI uses latest approved.</p></div>
    </div>
  );
}
