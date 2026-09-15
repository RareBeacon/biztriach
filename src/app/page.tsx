"use client";

import React from "react";
import Link from "next/link";
import {
  MessageCircle, Bot, Database, Globe, Wallet, Users,
  ArrowRight, Check, Menu, X, Smartphone, MessageSquare, Sparkles,
} from "lucide-react";

/* Biztriach — production landing. Twilio-clean × Zapier-warm. Self-contained (no external assets). */

const features = [
  {
    icon: MessageCircle,
    tone: "bg-emerald-500",
    title: "WhatsApp AI Agent",
    desc: "Your number, your voice. The AI replies in seconds — supporting customers, pitching your services, booking appointments. Even at 2am.",
  },
  {
    icon: MessageSquare,
    tone: "bg-violet-500",
    title: "Website Chat Widget",
    desc: "The same brain, embedded on your site with one line of code. It answers like your best employee — because you trained it.",
  },
  {
    icon: Database,
    tone: "bg-indigo-500",
    title: "Knowledge Base (RAG)",
    desc: "Upload your services, prices, FAQs and docs — the AI learns your business and answers from it. No generic bot replies, ever.",
  },
  {
    icon: Users,
    tone: "bg-sky-500",
    title: "Lead Capture",
    desc: "Every chat becomes a record — names, needs, phone numbers. Leads land in your dashboard, ready for follow-up while they're still hot.",
  },
  {
    icon: Wallet,
    tone: "bg-amber-500",
    title: "Sales & Reports",
    desc: "Text \"Sold 3 bags of rice for 50000\" and it logs itself. Revenue, expenses and reports — updated automatically, zero data entry.",
  },
  {
    icon: Globe,
    tone: "bg-rose-500",
    title: "Website Sources",
    desc: "Point it at your website and it crawls your pages — pricing, services, policies — straight into the agent's brain.",
  },
];

const steps = [
  { n: "01", title: "Connect your number", desc: "Paste three credentials from Meta, or one click with Embedded Signup. Ten minutes, tops." },
  { n: "02", title: "Train your agent", desc: "Upload your services, prices and FAQs — or just describe your business. The AI adapts to your voice." },
  { n: "03", title: "Watch it work", desc: "Customers get instant answers, leads flow in, sales log themselves — all visible in one console." },
];

const chatScript = [
  { from: "customer", text: "Hello, what do you sell?" },
  { from: "agent", text: "Hey! 👋 I'm Philip's AI assistant. We build AI agents & automations — WhatsApp agents like this one, website chat, and workflow automation. What are you trying to automate?" },
  { from: "customer", text: "Can you build one for my shop?" },
  { from: "agent", text: "Absolutely! 🚀 Drop your name and what you sell, and I'll book you a free consultation with Philip right away." },
];

export default function Landing() {
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* ── Nav ── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Biztriach" className="w-9 h-9 rounded-xl border border-slate-200 object-cover shadow-sm" />
            <span className="font-outfit font-bold text-[17px] tracking-tight">Biztriach</span>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-[13.5px] font-medium text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition">Features</a>
            <a href="#how" className="hover:text-slate-900 transition">How it works</a>
            <a href="#whatsapp" className="hover:text-slate-900 transition">WhatsApp AI</a>
          </nav>
          <div className="hidden md:flex items-center gap-2.5">
            <Link href="/login" className="btn-ghost">Sign in</Link>
            <Link href="/login" className="btn-primary">Get started free <ArrowRight className="w-4 h-4" /></Link>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden w-10 h-10 rounded-lg flex items-center justify-center text-slate-600" aria-label="Menu">
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-5 py-4 flex flex-col gap-3 text-[14px] font-medium text-slate-700">
            <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#how" onClick={() => setMenuOpen(false)}>How it works</a>
            <a href="#whatsapp" onClick={() => setMenuOpen(false)}>WhatsApp AI</a>
            <Link href="/login" className="btn-primary mt-2">Get started free</Link>
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(124,58,237,0.07),transparent)]" />
        <div className="relative max-w-6xl mx-auto px-5 pt-16 pb-20 lg:pt-24 lg:pb-28 grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <div className="pill-violet mb-5"><Sparkles className="w-3.5 h-3.5" /> AI agents · trained on your business</div>
            <h1 className="font-outfit text-[40px] lg:text-[52px] font-bold leading-[1.05] tracking-tight">
              AI agents that sell,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-500">support & never sleep</span>
            </h1>
            <p className="text-[16.5px] text-slate-600 mt-5 leading-relaxed max-w-lg">
              Biztriach puts an AI agent on your WhatsApp and your website — trained on your business, fluent in your voice. It answers customers in seconds, captures every lead, and reports everything back to you.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-8">
              <Link href="/login" className="btn-primary !h-12 !px-6 !text-[14.5px]">Launch your agent <ArrowRight className="w-4 h-4" /></Link>
              <a href="#whatsapp" className="btn-white !h-12 !px-6 !text-[14.5px]">See it in action</a>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-7 text-[13px] text-slate-500">
              {["Live in under 10 minutes", "Trained on your business", "Sounds human, not robotic"].map((t) => (
                <span key={t} className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-600" /> {t}</span>
              ))}
            </div>
          </div>

          {/* Console mock */}
          <div className="relative">
            <div className="console-card !rounded-2xl overflow-hidden shadow-[0_24px_60px_-12px_rgba(16,24,40,0.18)] border-slate-200">
              <div className="h-10 bg-slate-50 border-b border-slate-200 flex items-center gap-2 px-4">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="ml-3 text-[11px] text-slate-400 font-mono">biztriach — console</span>
              </div>
              <div className="flex">
                <div className="w-[130px] bg-[#0b0d13] p-3.5 hidden sm:block">
                  {["Overview", "AI Agents", "WhatsApp", "Inbox", "Reports"].map((s, i) => (
                    <div key={s} className={`text-[11.5px] px-2.5 py-2 rounded-md mb-0.5 ${i === 2 ? "bg-white/10 text-white font-semibold" : "text-slate-500"}`}>{s}</div>
                  ))}
                </div>
                <div className="flex-1 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Today</span>
                    <span className="pill-green"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Agent live</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-slate-200 p-3">
                      <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Leads</div>
                      <div className="font-outfit font-bold text-[18px] mt-0.5">12</div>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-3">
                      <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">AI Replies</div>
                      <div className="font-outfit font-bold text-[18px] mt-0.5">37</div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-3">
                    <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">Latest WhatsApp conversation</div>
                    <div className="text-[12px] text-slate-600 leading-relaxed">
                      <span className="text-slate-400">Customer:</span> Can you automate orders for my shop?<br />
                      <span className="text-violet-600 font-medium">Agent:</span> Yes! 🤖 Want me to book you a free demo this week?
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="border-t border-slate-200 bg-slate-50/60">
        <div className="max-w-6xl mx-auto px-5 py-20">
          <div className="max-w-2xl">
            <div className="section-title">Everything included</div>
            <h2 className="font-outfit text-[32px] font-bold tracking-tight">Six products. One agent brain.</h2>
            <p className="text-[15px] text-slate-600 mt-3">Every part works together — one AI brain across every channel, with every conversation, lead and sale in one place.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
            {features.map((f) => (
              <div key={f.title} className="console-card console-card-hover p-6">
                <div className={`w-10 h-10 rounded-lg ${f.tone} flex items-center justify-center shadow-sm mb-4`}>
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-[15.5px] font-semibold text-slate-900">{f.title}</h3>
                <p className="text-[13.5px] text-slate-500 mt-2 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WhatsApp demo ── */}
      <section id="whatsapp" className="border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-5 py-20 grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <div className="section-title">The WhatsApp agent</div>
            <h2 className="font-outfit text-[32px] font-bold tracking-tight leading-tight">
              It talks like a human.<br />It sells like your best rep.<br />It works <span className="text-emerald-600">for you</span>, forever.
            </h2>
            <p className="text-[15px] text-slate-600 mt-4 leading-relaxed max-w-md">
              Customers can't tell it's AI. It mirrors their energy, remembers the conversation, and knows your services and prices — because you trained it.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Replies in under 5 seconds, 24/7",
                "Answers from YOUR services & prices",
                "Captures leads & books appointments",
                "Hands off to you when it matters",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-[14px] text-slate-700">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5"><Check className="w-3 h-3 text-emerald-700" /></span>
                  {t}
                </li>
              ))}
            </ul>
            <Link href="/login" className="btn-primary mt-8">Connect your number <ArrowRight className="w-4 h-4" /></Link>
          </div>

          {/* Phone mock */}
          <div className="flex justify-center">
            <div className="w-[300px] rounded-[36px] border-[10px] border-slate-900 bg-slate-900 shadow-2xl overflow-hidden">
              <div className="bg-[#075E54] px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-[13px]">AI</div>
                <div>
                  <div className="text-white text-[13.5px] font-semibold leading-none">Your Business</div>
                  <div className="text-emerald-100/80 text-[10.5px] mt-1">online • AI agent</div>
                </div>
              </div>
              <div className="bg-[#ECE5DD] p-3.5 space-y-2.5 min-h-[380px]">
                {chatScript.map((m, i) => (
                  <div key={i} className={`flex ${m.from === "customer" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[82%] px-3 py-2 rounded-xl text-[12px] leading-relaxed whitespace-pre-line shadow-sm ${m.from === "customer" ? "bg-[#DCF8C6] rounded-br-sm" : "bg-white rounded-bl-sm"}`}>
                      {m.text}
                    </div>
                  </div>
                ))}
                <div className="flex justify-start">
                  <div className="bg-white/70 px-3 py-1.5 rounded-xl text-[10.5px] text-slate-400 italic">typing…</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="border-t border-slate-200 bg-slate-50/60">
        <div className="max-w-6xl mx-auto px-5 py-20">
          <div className="max-w-2xl">
            <div className="section-title">How it works</div>
            <h2 className="font-outfit text-[32px] font-bold tracking-tight">Live in three steps</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5 mt-10">
            {steps.map((s) => (
              <div key={s.n} className="console-card p-6">
                <div className="font-mono text-[12px] font-bold text-violet-600 mb-3">{s.n}</div>
                <h3 className="text-[15.5px] font-semibold text-slate-900">{s.title}</h3>
                <p className="text-[13.5px] text-slate-500 mt-2 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-5 py-20">
          <div className="rounded-2xl bg-[#0b0d13] px-8 py-14 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_0%,rgba(124,58,237,0.25),transparent)]" />
            <div className="relative">
              <h2 className="font-outfit text-[30px] lg:text-[36px] font-bold text-white tracking-tight">Your competitors reply in hours.<br />You'll reply in seconds.</h2>
              <p className="text-slate-400 text-[15px] mt-4 max-w-lg mx-auto">Launch your AI agent today. Ten minutes to connect, one afternoon to train — working for you 24/7, forever.</p>
              <Link href="/login" className="btn-primary !h-12 !px-7 !text-[15px] mt-8">Get started free <ArrowRight className="w-4 h-4" /></Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-5 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Biztriach" className="w-8 h-8 rounded-lg border border-slate-200 object-cover" />
            <span className="font-outfit font-bold text-[14px]">Biztriach</span>
          </div>
          <div className="flex items-center gap-6 text-[13px] text-slate-500">
            <Link href="/login" className="hover:text-slate-900">Sign in</Link>
            <a href="#features" className="hover:text-slate-900">Features</a>
            <Link href="/privacy" className="hover:text-slate-900">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-900">Terms</Link>
            <Link href="/data-deletion" className="hover:text-slate-900">Data Deletion</Link>
          </div>
          <div className="text-[12.5px] text-slate-400">© {new Date().getFullYear()} Biztriach. Built for ambitious businesses.</div>
        </div>
      </footer>
    </div>
  );
}
