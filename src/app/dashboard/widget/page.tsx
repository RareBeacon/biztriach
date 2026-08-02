"use client";
import React,{useState} from "react";
import { useDashboard } from "@/context/DashboardContext";
import { Smartphone, Copy, Check, Globe, Palette, MessageSquare } from "lucide-react";

export default function WidgetPage(){
  const { activeChatbot } = useDashboard();
  const [copied,setCopied]=useState(false);
  const host = typeof window !== 'undefined' ? window.location.origin : "https://biztriach.vercel.app";
  const script = activeChatbot ? `<script src="${host}/supportiq-widget.js" data-chatbot-id="${activeChatbot.id}"></script>` : "";

  const copy=()=>{ navigator.clipboard.writeText(script); setCopied(true); setTimeout(()=>setCopied(false),2000); };

  return(
    <div className="space-y-6">
      <div><h1 className="font-outfit text-[26px] font-bold">Website AI Widget</h1><p className="text-[13px] text-slate-500">Install script on any website or landing page. Works with custom theme color, greeting, brand personality. Existing widget remains compatible.</p></div>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-[20px] bg-white border shadow-soft p-6">
          <h3 className="font-semibold text-[14px] flex items-center gap-2"><Globe className="w-4 h-4"/> Installation</h3>
          <p className="text-[12px] text-slate-500 mt-2">Paste this single line before closing &lt;/body&gt; tag. Floating chat bubble appears instantly.</p>
          {activeChatbot ? (
            <div className="mt-4">
              <div className="rounded-[12px] bg-[#0a0a16] text-white p-4 font-mono text-[12px] overflow-x-auto relative"><code>{script}</code><button onClick={copy} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white text-black flex items-center justify-center">{copied? <Check className="w-4 h-4"/> : <Copy className="w-4 h-4"/>}</button></div>
              <div className="mt-4 flex items-center gap-3"><div className="w-3 h-3 rounded-full" style={{backgroundColor:activeChatbot.themeColor}}/><span className="text-[12px]">Theme: {activeChatbot.themeColor}</span><span className="text-[12px] text-slate-500">Agent: {activeChatbot.name}</span></div>
            </div>
          ) : <div className="mt-4 p-8 text-center text-[13px] text-slate-400 border-2 border-dashed rounded-[12px]">Create an AI agent first to get widget script.</div>}
          <div className="mt-6 rounded-[12px] bg-violet-50 border border-violet-200 p-4 text-[12px]"><strong>Biztriach Upgrade:</strong> Widget now supports proactive welcome (delay {activeChatbot ? "customizable" : "3s"}), sound toggle, custom greeting, suggestions chips, human takeover seamless.</div>
        </div>

        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-[20px] bg-[#0a0a16] text-white p-6"><h4 className="font-semibold text-[14px] flex items-center gap-2"><Palette className="w-4 h-4 text-violet-400"/> Brand Customization</h4><div className="mt-4 space-y-3 text-[12px]">
            <div className="flex justify-between"><span className="text-white/60">Brand Color</span><span className="font-medium flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{backgroundColor:activeChatbot?.themeColor || "#7c3aed"}}/>{activeChatbot?.themeColor || "#7c3aed"}</span></div>
            <div className="flex justify-between"><span className="text-white/60">Greeting</span><span className="font-medium max-w-[180px] truncate">{activeChatbot?.greetingMessage?.slice(0,40) || "Hello! How can I help?"}</span></div>
            <div className="flex justify-between"><span className="text-white/60">Personality</span><span className="font-medium">Professional, Friendly</span></div>
          </div><button className="mt-5 w-full h-10 rounded-full bg-white text-black text-[13px] font-semibold">Open Customizer</button></div>
          <div className="rounded-[20px] bg-white border p-6"><h4 className="font-semibold text-[14px] flex items-center gap-2"><MessageSquare className="w-4 h-4"/> Preview</h4><div className="mt-4 rounded-[16px] bg-slate-50 border h-[280px] flex flex-col"><div className="p-3 border-b bg-white rounded-t-[16px] flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-[11px]">B</div><div><div className="text-[12px] font-semibold">{activeChatbot?.name || "Biztriach Assistant"}</div><div className="text-[10px] text-slate-500">Active now • Avg 2s response</div></div></div><div className="flex-1 p-3 space-y-2 text-[12px]"><div className="bg-white border rounded-[12px] rounded-bl-[4px] px-3 py-2 max-w-[80%]">{activeChatbot?.greetingMessage || "Hello! How can I help you today?"}</div><div className="bg-violet-600 text-white rounded-[12px] rounded-br-[4px] px-3 py-2 max-w-[80%] ml-auto">Do you have rice in stock?</div><div className="bg-white border rounded-[12px] rounded-bl-[4px] px-3 py-2 max-w-[80%]">Yes! 42 bags available at ₦85k each. Free delivery for 3+ bags. Want to order?</div></div></div></div>
        </div>
      </div>
    </div>
  );
}
