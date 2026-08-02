"use client";
import React,{useEffect,useState} from "react";
import { MessageCircle, Smartphone, Settings, CheckCircle, AlertCircle, Bot, Package } from "lucide-react";

export default function WhatsAppPage(){
  const [account,setAccount]=useState<any>(null);
  const [convs,setConvs]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [form,setForm]=useState({phoneNumberId:"",businessAccountId:"",accessToken:"",verifyToken:"biztriach_verify",autoReply:true,businessParsing:true});

  const load=async()=>{
    setLoading(true);
    try{
      const [aRes,cRes]=await Promise.all([fetch("/api/whatsapp/account"), fetch("/api/whatsapp/messages")]);
      if(aRes.ok){ const d=await aRes.json(); setAccount(d); if(d && d.phoneNumberId) setForm((f:any)=>({...f, phoneNumberId:d.phoneNumberId, businessAccountId:d.businessAccountId || "", verifyToken:d.verifyToken || "biztriach_verify"})); }
      if(cRes.ok) setConvs(await cRes.json());
    }catch{}
    setLoading(false);
  };
  useEffect(()=>{load();},[]);

  const handleSave=async(e:React.FormEvent)=>{
    e.preventDefault();
    const res=await fetch("/api/whatsapp/account",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
    if(res.ok){ load(); }
  };

  return(
    <div className="space-y-6">
      <div className="flex justify-between items-center"><div><h1 className="font-outfit text-[26px] font-bold flex items-center gap-3"><MessageCircle className="w-7 h-7 text-emerald-600"/> WhatsApp Business Integration</h1><p className="text-[13px] text-slate-500">Connect Meta WhatsApp Cloud API. Same AI answers website + WhatsApp. Business ops parsing: sales, inventory, expenses via natural messages.</p></div>{account?.isConnected && <span className="px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 text-[12px] font-bold flex items-center gap-1"><CheckCircle className="w-4 h-4"/> Connected</span>}</div>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 rounded-[20px] bg-white border shadow-soft p-6">
          <h3 className="font-semibold text-[14px] flex items-center gap-2"><Settings className="w-4 h-4"/> Connect WhatsApp Cloud API</h3>
          <p className="text-[11px] text-slate-500 mt-1">Get credentials from developers.facebook.com → WhatsApp → API Setup</p>
          <form onSubmit={handleSave} className="mt-5 space-y-3">
            <input placeholder="Phone Number ID (e.g. 123456789)" value={form.phoneNumberId} onChange={e=>setForm({...form,phoneNumberId:e.target.value})} className="w-full h-11 px-4 rounded-[12px] border text-[13px]"/>
            <input placeholder="WhatsApp Business Account ID" value={form.businessAccountId} onChange={e=>setForm({...form,businessAccountId:e.target.value})} className="w-full h-11 px-4 rounded-[12px] border text-[13px]"/>
            <input placeholder="Access Token (Permanent)" value={form.accessToken} onChange={e=>setForm({...form,accessToken:e.target.value})} className="w-full h-11 px-4 rounded-[12px] border text-[13px]"/>
            <input placeholder="Verify Token" value={form.verifyToken} onChange={e=>setForm({...form,verifyToken:e.target.value})} className="w-full h-11 px-4 rounded-[12px] border text-[13px]"/>
            <div className="flex gap-4 py-2">
              <label className="flex items-center gap-2 text-[12px]"><input type="checkbox" checked={form.autoReply} onChange={e=>setForm({...form,autoReply:e.target.checked})} className="rounded"/> Auto AI Reply</label>
              <label className="flex items-center gap-2 text-[12px]"><input type="checkbox" checked={form.businessParsing} onChange={e=>setForm({...form,businessParsing:e.target.checked})} className="rounded"/> Business Ops Parsing</label>
            </div>
            <div className="rounded-[12px] bg-slate-50 border p-3 text-[11px] text-slate-600"><strong>Webhook URL to set in Meta:</strong><br/><code className="text-[10px] bg-white border px-1.5 py-0.5 rounded">{typeof window !== 'undefined' ? window.location.origin : "https://biztriach.vercel.app"}/api/whatsapp/webhook</code><br/>Verify Token: {form.verifyToken}</div>
            <button type="submit" className="w-full h-11 rounded-full bg-[#0a0a16] text-white text-[13px] font-semibold">Save & Connect</button>
          </form>
        </div>

        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-[20px] bg-gradient-to-br from-emerald-600 to-teal-600 p-[1px]"><div className="rounded-[19px] bg-[#0a0a16] p-5 text-white"><h4 className="font-semibold flex items-center gap-2"><Bot className="w-4 h-4 text-emerald-300"/> Business Operations Flow</h4><p className="text-[12px] text-white/60 mt-2">Customer/You → WhatsApp → Meta Cloud API → Webhook → Backend → Existing AI Engine → AI Response → Customer. Plus auto inventory update.</p><div className="mt-4 grid grid-cols-1 gap-2 text-[12px]">
            <div className="rounded-[12px] bg-white/[0.06] border border-white/[0.08] p-3 flex justify-between"><span>Sold 5 bags rice @ ₦85k</span><span className="text-emerald-300">→ Sale + Inventory -5 + Profit calc</span></div>
            <div className="rounded-[12px] bg-white/[0.06] border border-white/[0.08] p-3 flex justify-between"><span>Paid rent ₦150k</span><span className="text-amber-300">→ Expense logged (Rent)</span></div>
            <div className="rounded-[12px] bg-white/[0.06] border border-white/[0.08] p-3 flex justify-between"><span>Bought 100 bags rice at ₦70k</span><span className="text-blue-300">→ Inventory +100 + Expense ₦7M</span></div>
          </div></div></div>

          <div className="rounded-[20px] bg-white border shadow-soft p-5">
            <h4 className="font-semibold text-[14px] mb-3">WhatsApp Conversations ({convs.length})</h4>
            {loading? <div className="text-[13px] text-slate-400">Loading...</div> : convs.length===0 ? <div className="p-8 text-center text-[13px] text-slate-400 border-2 border-dashed rounded-[12px]">No WhatsApp chats yet. Connect account and customers will appear here. AI will answer automatically.</div> :
            <div className="divide-y max-h-[400px] overflow-y-auto">{convs.map((c:any)=><div key={c.id} className="py-3 flex justify-between"><div><div className="font-medium text-[13px]">{c.customerName || c.phoneNumber}</div><div className="text-[11px] text-slate-500">{c.messages?.[0]?.content?.slice(0,60) || "No messages"} • {new Date(c.updatedAt).toLocaleDateString()}</div></div><span className="text-[11px] px-2 py-1 rounded-full bg-slate-100">{c.status}</span></div>)}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
