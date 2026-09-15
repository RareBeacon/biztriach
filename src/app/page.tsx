"use client";

import React from "react";
import Link from "next/link";
import {
  MessageCircle, Bot, Database, Globe, ShoppingBag, Wallet,
  ArrowRight, Check, Menu, X, Smartphone, MessageSquare, Sparkles,
} from "lucide-react";

/* Biztriach — production landing. Twilio-clean × Zapier-warm. Self-contained (no external assets). */

const features = [
  {
    icon: MessageCircle,
    tone: "bg-emerald-500",
    title: "WhatsApp AI Agent",
    desc: "Your number, your voice. The AI replies to customers in seconds — supports them, pitches your services, captures leads. Even while you sleep.",
  },
  {
    icon: MessageSquare,
    tone: "bg-violet-500",
    title: "Website Chat Widget",
    desc: "The same brain, embedded on your website. One line of code. Trained on your documents, products and tone.",
  },
  {
    icon: Database,
    tone: "bg-indigo-500",
    title: "Knowledge Base (RAG)",
    desc: "Upload PDFs, docs, prices — your AI learns your business and answers from it. No more generic bot replies.",
  },
  {
    icon: ShoppingBag,
    tone: "bg-sky-500",
    title: "Sales & Inventory",
    desc: "Text \"Sold 3 bags of rice for 50000\" — the sale logs itself, stock drops, profit updates. Zero data entry.",
  },
  {
    icon: Wallet,
    tone: "bg-amber-500",
    title: "Expenses & Reports",
    desc: "Track every naira in and out. Daily, weekly and monthly reports generated for you automatically.",
  },
  {
    icon: Globe,
    tone: "bg-rose-500",
    title: "Website Sources",
    desc: "Point it at your website and it crawls your pages — pricing, FAQs, policies — straight into the AI's brain.",
  },
];

const steps = [
  { n: "01", title: "Connect your number", desc: "Paste three credentials from Meta, or one click with Embedded Signup. Two minutes, tops." },
  { n: "02", title: "Train your agent", desc: "Upload your price list, product docs, or just describe your business. The AI adapts to your voice." },
  { n: "03", title: "Watch it work", desc: "Customers get instant answers. You get sales logged, stock updated, and reports — automatically." },
];

const chatScript = [
  { from: "customer", text: "Hello, what do you sell?" },
  { from: "agent", text: "Hey! 👋 I'm Philip's AI assistant. We build AI automations & agents — WhatsApp agents like this one, website chat, workflow automation. What are you looking to automate?" },
  { from: "customer", text: "Sold 3 bags of rice for 50000" },
  { from: "agent", text: "✅ Sale Recorded!\n\n📦 3 × Rice\n💰 ₦50,000\n\n✓ Inventory updated\n✓ Profit calculated" },
];

export default function Landing() {
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* ── Nav ── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-sm">
              <span className="text-white font-outfit font-black text-[15px] leading-none">B</span>
            </div>
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
            <div className="pill-violet mb-5"><Sparkles className="w-3.5 h-3.5" /> AI employees for real businesses</div>
            <h1 className="font-outfit text-[40px] lg:text-[52px] font-bold leading-[1.05] tracking-tight">
              One AI employee for your{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-500">entire business</span>
            </h1>
            <p className="text-[16.5px] text-slate-600 mt-5 leading-relaxed max-w-lg">
              Biztriach answers your customers on WhatsApp and your website, logs your sales and expenses, keeps your inventory honest — and reports it all. While you run the business.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-8">
              <Link href="/login" className="btn-primary !h-12 !px-6 !text-[14.5px]">Start free <ArrowRight className="w-4 h-4" /></Link>
              <a href="#whatsapp" className="btn-white !h-12 !px-6 !text-[14.5px]">See it in action</a>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-7 text-[13px] text-slate-500">
              {["No credit card to try", "Works with your number", "Talks like you"].map((t) => (
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
                  {["Overview", "AI Agents", "WhatsApp", "Inventory", "Sales"].map((s, i) => (
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
                      <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Revenue</div>
                      <div className="font-outfit font-bold text-[18px] mt-0.5">₦128,500</div>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-3">
                      <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">AI Replies</div>
                      <div className="font-outfit font-bold text-[18px] mt-0.5">37</div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-3">
                    <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">Latest WhatsApp conversation</div>
                    <div className="text-[12px] text-slate-600 leading-relaxed">
                      <span className="text-slate-400">Customer:</span> Do you deliver to Lagos Island?<br />
                      <span className="text-violet-600 font-medium">Agent:</span> Yes we do! 🚚 Orders before 2pm arrive same day. Want me to place one for you?
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
            <h2 className="font-outfit text-[32px] font-bold tracking-tight">Six products. One login. Zero busywork.</h2>
            <p className="text-[15px] text-slate-600 mt-3">Every part talks to the others — a WhatsApp sale updates inventory, inventory informs answers, reports tie it all together.</p>
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
              It talks like a human.<br />It books like an assistant.<br />It books <span className="text-emerald-600">your</span> business like a partner.
            </h2>
            <p className="text-[15px] text-slate-600 mt-4 leading-relaxed max-w-md">
              Customers can't tell it's AI. It mirrors their energy, remembers the conversation, and knows your prices, products and policies — because you trained it.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Replies in under 5 seconds, 24/7",
                "Answers from YOUR documents & prices",
                "Logs sales, expenses & stock from chat",
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
              <p className="text-slate-400 text-[15px] mt-4 max-w-lg mx-auto">Create your AI employee today. Free to start, two minutes to connect, and it never calls in sick.</p>
              <Link href="/login" className="btn-primary !h-12 !px-7 !text-[15px] mt-8">Get started free <ArrowRight className="w-4 h-4" /></Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-5 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <span className="text-white font-outfit font-black text-[13px] leading-none">B</span>
            </div>
            <span className="font-outfit font-bold text-[14px]">Biztriach</span>
          </div>
          <div className="flex items-center gap-6 text-[13px] text-slate-500">
            <Link href="/login" className="hover:text-slate-900">Sign in</Link>
            <a href="#features" className="hover:text-slate-900">Features</a>
            <span className="flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5" /> WhatsApp AI</span>
            <span className="flex items-center gap-1.5"><Bot className="w-3.5 h-3.5" /> Website AI</span>
          </div>
          <div className="text-[12.5px] text-slate-400">© {new Date().getFullYear()} Biztriach. Built for ambitious businesses.</div>
        </div>
      </footer>
    </div>
  );
}
