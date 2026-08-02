"use client";
import React,{useEffect,useState} from "react";
import { Key, Shield, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";

export default function ApiKeysPage(){
  const [data,setData]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [form,setForm]=useState({provider:"openai",apiKey:"",preference:"PLATFORM"});
  const [show,setShow]=useState(false);

  const load=async()=>{ setLoading(true); try{ const r=await fetch("/api/api-keys"); if(r.ok) setData(await r.json()); }catch{} setLoading(false); };
  useEffect(()=>{load();},[]);

  const handleSave=async(e:React.FormEvent)=>{
    e.preventDefault();
    const res=await fetch("/api/api-keys",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
    if(res.ok){ setForm({...form,apiKey:""}); load(); }
  };

  const handlePref=async(pref:string)=>{
    await fetch("/api/api-keys",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({preference:pref})});
    load();
  };

  return(
    <div className="space-y-6">
      <div><h1 className="font-outfit text-[26px] font-bold flex items-center gap-3"><Key className="w-7 h-7"/> API Management - BYOK</h1><p className="text-[13px] text-slate-500">Option 1: Use platform shared AI API (admin assigns). Option 2: Bring Your Own API keys securely.</p></div>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-[20px] bg-white border shadow-soft p-6">
          <h3 className="font-semibold text-[14px]">Your API Keys</h3>
          {loading? <div className="p-8 text-center text-[13px] text-slate-400">Loading...</div> : (
            <div className="mt-4 space-y-3">
              <div className="rounded-[12px] bg-slate-50 border p-4 flex justify-between items-center"><div><div className="text-[11px] uppercase tracking-widest font-bold text-slate-400">Preference</div><div className="font-medium text-[13px] mt-1">{data?.preference === "BYOK" ? "Using Your Own Keys" : "Using Platform Shared API"}</div></div><div className="flex gap-2"><button onClick={()=>handlePref("PLATFORM")} className={`h-8 px-3 rounded-full text-[12px] font-medium ${data?.preference==="PLATFORM"?"bg-[#0a0a16] text-white":"bg-white border"}`}>Platform</button><button onClick={()=>handlePref("BYOK")} className={`h-8 px-3 rounded-full text-[12px] font-medium ${data?.preference==="BYOK"?"bg-[#0a0a16] text-white":"bg-white border"}`}>BYOK</button></div></div>

              {data?.byok && Object.entries(data.byok).map(([prov,val]:any)=><div key={prov} className="flex justify-between items-center p-3 rounded-[12px] bg-white border"><span className="text-[13px] font-medium capitalize">{prov} {val? <CheckCircle className="w-4 h-4 text-emerald-500 inline ml-2"/> : <AlertCircle className="w-4 h-4 text-slate-300 inline ml-2"/>}</span><span className="text-[12px] font-mono text-slate-500">{val || "Not set"}</span></div>)}

              <form onSubmit={handleSave} className="pt-4 border-t space-y-3">
                <h4 className="font-semibold text-[13px]">Add / Update API Key</h4>
                <select value={form.provider} onChange={e=>setForm({...form,provider:e.target.value})} className="w-full h-11 px-4 rounded-[12px] border text-[13px]"><option value="openai">OpenAI (GPT-4o)</option><option value="openrouter">OpenRouter (Gemini, Claude, etc)</option><option value="gemini">Google Gemini</option><option value="claude">Anthropic Claude</option></select>
                <div className="relative"><input required type={show?"text":"password"} placeholder="sk-..." value={form.apiKey} onChange={e=>setForm({...form,apiKey:e.target.value})} className="w-full h-11 px-4 pr-10 rounded-[12px] border text-[13px] font-mono"/><button type="button" onClick={()=>setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2">{show? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}</button></div>
                <button type="submit" className="w-full h-11 rounded-full bg-[#0a0a16] text-white text-[13px] font-semibold">Save Encrypted Securely</button>
                <p className="text-[11px] text-slate-500">Keys are encrypted at rest (base64 for MVP, AES in production). Validated securely. Only used for your organization requests.</p>
              </form>
            </div>
          )}
        </div>

        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-[20px] bg-[#0a0a16] text-white p-6"><h4 className="font-semibold flex items-center gap-2"><Shield className="w-4 h-4 text-violet-400"/> Secure by Design</h4><ul className="mt-3 space-y-2 text-[12px] text-white/60"><li>• Keys validated before save</li><li>• Encrypted storage</li><li>• Org isolation - no cross access</li><li>• Platform fallback if BYOK fails</li><li>• Usage logged (future)</li></ul></div>
          <div className="rounded-[20px] bg-white border p-6"><h4 className="font-semibold text-[13px]">Supported Providers</h4><div className="mt-3 space-y-2 text-[12px]"><div className="p-3 rounded-[12px] bg-slate-50 border"><strong>OpenAI:</strong> GPT-4o, GPT-4o-mini - best for support + business parsing</div><div className="p-3 rounded-[12px] bg-slate-50 border"><strong>OpenRouter:</strong> Gemini 2.5 Flash, Claude 3.5, Llama - cost effective</div><div className="p-3 rounded-[12px] bg-slate-50 border"><strong>Gemini:</strong> Google - fast + multimodal + OCR</div><div className="p-3 rounded-[12px] bg-slate-50 border"><strong>Claude:</strong> Anthropic - best reasoning for business reports</div></div></div>
        </div>
      </div>
    </div>
  );
}
