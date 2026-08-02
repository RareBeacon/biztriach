"use client";
import React from "react";
import { Mail, Plus, Send, Users, BarChart3 } from "lucide-react";

export default function EmailPage(){
  return(
    <div className="space-y-6">
      <div className="flex justify-between items-center"><div><h1 className="font-outfit text-[26px] font-bold">Email Campaigns</h1><p className="text-[13px] text-slate-500">Build email sequences that plug into funnels: Landing → Form → Email → AI Follow-up → Customer.</p></div><button className="h-10 px-5 rounded-full bg-[#0a0a16] text-white text-[13px] font-medium flex items-center gap-2"><Plus className="w-4 h-4"/> New Campaign</button></div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-[18px] bg-white border p-5"><div className="text-[11px] uppercase tracking-widest font-bold text-slate-400">AI Copywriter</div><div className="text-[13px] mt-2 font-medium">Headlines • Sales copy • Landing content • Product descriptions • FAQs • Marketing copy • Email campaigns • CTAs</div></div>
        <div className="rounded-[18px] bg-white border p-5"><div className="text-[11px] uppercase tracking-widest font-bold text-slate-400">Flow Example</div><div className="text-[13px] mt-2">Landing Page → Lead Form → Thank You → Email (3 seq) → AI WhatsApp follow-up → Sale</div></div>
        <div className="rounded-[18px] bg-gradient-to-br from-violet-600 to-indigo-600 p-5 text-white"><div className="text-[11px] uppercase tracking-widest font-bold text-white/70">Powered by Resend/SMTP</div><div className="font-bold mt-1">SMTP Host: smtp.gmail.com:587 • ogungboye...@gmail.com — Configured</div></div>
      </div>

      <div className="rounded-[20px] bg-white border shadow-soft p-8 text-center">
        <Mail className="w-12 h-12 text-slate-200 mx-auto mb-3"/>
        <h3 className="font-semibold">Email Campaign Builder - Coming in full</h3>
        <p className="text-[13px] text-slate-500 mt-2 max-w-lg mx-auto">Create campaigns: Welcome sequence (Day 1, Day 3, Day 7), Product launch, Re-engagement. AI generates subject lines, body copy, CTA. Integrates with Leads & Funnels. For MVP, emails use Gmail SMTP configured.</p>
        <div className="mt-6 grid md:grid-cols-3 gap-3 text-left max-w-3xl mx-auto text-[12px]">
          <div className="rounded-[12px] bg-slate-50 border p-3"><strong>Day 1:</strong> Welcome + value prop</div>
          <div className="rounded-[12px] bg-slate-50 border p-3"><strong>Day 3:</strong> Social proof + features</div>
          <div className="rounded-[12px] bg-slate-50 border p-3"><strong>Day 7:</strong> Offer + urgency + AI follow-up</div>
        </div>
      </div>
    </div>
  );
}
