/* eslint-disable react/no-unescaped-entities */
"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, Bot, BarChart3, Shield, Sparkles,
  MessageCircle, Zap, Globe, FileText, ShoppingBag, TrendingUp,
  Package, Receipt, Users, Wallet, MessageSquare, Building2,
  Layers, Target, Mail, Smartphone, ChevronDown, Check, Play,
  ArrowUpRight, Star
} from "lucide-react";

export default function BiztriachLandingBright() {
  const [isYearly, setIsYearly] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [activeIndustry, setActiveIndustry] = useState(0);

  const industries = [
    { name: "Supermarket", desc: "Track rice, oil, inventory via WhatsApp. Auto reports daily.", icon: Building2, metric: "85% less manual work", color: "violet" },
    { name: "Restaurant", desc: "Menu AI, orders, stock alerts, customer follow-up automation.", icon: ShoppingBag, metric: "3x faster service", color: "emerald" },
    { name: "Real Estate", desc: "Property listings, client queries, WhatsApp closings.", icon: Globe, metric: "60% more leads", color: "cyan" },
    { name: "Clinic", desc: "Appointments, patient support, inventory for drugs.", icon: Shield, metric: "100% organized", color: "amber" },
  ];

  const plans = [
    {
      name: "Starter", desc: "For solo entrepreneurs testing AI business ops.", price: 0, priceYearly: 0,
      features: ["1 AI Employee", "100 AI conversations/mo", "5 documents", "Inventory (50 products)", "Basic sales tracking", "Website widget", "Email reports"],
      cta: "Start Free", popular: false, color: "slate"
    },
    {
      name: "Growth", desc: "For growing SMEs ready to automate sales + support.", price: 49, priceYearly: 39,
      features: ["3 AI Employees", "2,500 conversations/mo", "50 docs + website crawl", "Unlimited products", "WhatsApp business parsing", "Landing page builder", "Funnel builder", "Leads & Email campaigns", "Expense tracking", "Human takeover"],
      cta: "Start Growth", popular: true, color: "violet"
    },
    {
      name: "Scale", desc: "For agencies managing 10+ client businesses.", price: 199, priceYearly: 159,
      features: ["Unlimited AI Employees", "15k conversations/mo", "Unlimited knowledge sources incl. OCR", "Advanced analytics + AI reports", "Custom brand voice & tone", "API access + BYOK", "Priority support", "Multi-channel: WA, IG, TG soon", "Team members (5)"],
      cta: "Go Scale", popular: false, color: "indigo"
    },
  ];

  const faqs = [
    { q: "How does WhatsApp business operations work?", a: "Simply send a message like 'Sold 5 bags of rice for ₦85,000 each' to your connected WhatsApp. Biztriach AI parses it automatically — updates inventory, calculates profit (₦425k revenue), logs customer, and generates daily report. No spreadsheets needed. It understands Pidgin, English, and mixed formats like '85k' or '85,000'." },
    { q: "Can one AI employee handle both support and sales?", a: "Yes! That's the core vision of Biztriach. You train your AI once with your product list, price list, policies, and FAQs. It then answers customer questions on website chat, sells via WhatsApp, tracks inventory when you send 'bought 100 bags', and even generates marketing copy. Same brain, multiple channels." },
    { q: "What knowledge sources can I upload?", a: "Everything: PDFs, Word, Excel price lists, CSV sales history, PowerPoint trainings, images of invoices (OCR), product catalogs, website URLs (we crawl and index), FAQs. The AI Knowledge Engine 2.0 processes, chunks, embeds with 384-dim vectors, and builds hybrid semantic + keyword retrieval for 95% accurate answers." },
    { q: "How is data kept separate for each business?", a: "Biztriach is multi-tenant by design. Every business gets completely isolated data — its own AI agents, documents, inventory, sales, customers, landing pages, WhatsApp. No cross-business access ever. We use organizationId isolation on every query plus PostgreSQL row-level security ready." },
  ];

  return (
    <div className="min-h-screen bg-[#fefcff] text-slate-900 overflow-x-hidden selection:bg-violet-500/20">
      {/* Bright Mesh Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-gradient-to-b from-violet-100 via-indigo-50 to-transparent blur-[80px] rounded-full opacity-60" />
        <div className="absolute top-[20%] left-[5%] w-[400px] h-[400px] bg-gradient-to-br from-cyan-100 to-teal-100 blur-[60px] rounded-full opacity-40" />
        <div className="absolute top-[30%] right-[5%] w-[350px] h-[350px] bg-gradient-to-br from-emerald-100 to-green-100 blur-[60px] rounded-full opacity-40" />
        <div className="absolute bottom-[20%] left-[20%] w-[300px] h-[300px] bg-gradient-to-br from-amber-100 to-orange-100 blur-[60px] rounded-full opacity-30" />
      </div>

      {/* HEADER - Bright */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-white/80 border-b border-slate-200/60">
        <div className="max-w-[1280px] mx-auto px-6 h-[72px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[14px] bg-white border-2 border-violet-200 shadow-[0_4px_12px_rgba(124,58,237,0.15)] flex items-center justify-center overflow-hidden">
              <img src="/biztriach-logo.png" alt="Biztriach" className="w-7 h-7 object-contain" />
            </div>
            <span className="font-outfit font-bold text-[20px] tracking-tight text-slate-900">Biztriach</span>
            <span className="ml-1 text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-bold tracking-widest shadow">BETA</span>
          </Link>
          <nav className="hidden lg:flex items-center gap-8 text-[14px] font-medium text-slate-600">
            <a href="#platform" className="hover:text-violet-600 transition font-medium">Platform</a>
            <a href="#industries" className="hover:text-violet-600 transition">Industries</a>
            <a href="#pricing" className="hover:text-violet-600 transition">Pricing</a>
            <a href="#faq" className="hover:text-violet-600 transition">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden md:inline-flex text-[14px] font-medium text-slate-600 hover:text-slate-900 px-4 py-2 rounded-full hover:bg-slate-100 transition">Sign in</Link>
            <Link href="/register" className="inline-flex items-center gap-2 bg-[#0a0a16] text-white font-semibold text-[14px] px-5 h-10 rounded-full hover:bg-black transition shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.2)] hover:-translate-y-0.5">
              Start free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* HERO - Bright */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="max-w-[1280px] mx-auto px-6 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border-2 border-violet-200 shadow-[0_4px_12px_rgba(124,58,237,0.08)] text-[13px] font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-slate-700 font-medium">AI Business Platform v2 — WhatsApp business ops live</span>
              <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 text-white text-[10px] font-bold">NEW</span>
            </div>

            <h1 className="font-outfit font-[800] text-[40px] md:text-[64px] leading-[0.9] tracking-[-0.03em] mt-8 text-slate-900">
              One <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">AI employee</span> for your entire business
            </h1>

            <p className="text-[17px] md:text-[19px] leading-relaxed text-slate-600 max-w-[720px] mx-auto mt-6 font-inter">
              Train once, deploy everywhere. Customer support, sales tracking, inventory, WhatsApp ops, landing pages, and daily profit reports — all automated. Built for African SMEs with brighter future.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
              <Link href="/register" className="inline-flex items-center justify-center gap-2 h-[52px] px-8 rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white font-bold text-[16px] shadow-[0_8px_24px_rgba(124,58,237,0.3)] hover:shadow-[0_12px_32px_rgba(124,58,237,0.4)] transition-all hover:-translate-y-1">
                <Sparkles className="w-5 h-5" /> Start your AI business
              </Link>
              <a href="#demo" className="inline-flex items-center justify-center gap-2 h-[52px] px-8 rounded-full bg-white border-2 border-slate-200 text-slate-700 font-semibold text-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 transition-all">
                <Play className="w-5 h-5" /> Watch 90-sec demo
              </a>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-[13px] text-slate-500">
              <span className="flex items-center gap-2 bg-white border-2 border-slate-200 px-3 py-1.5 rounded-full shadow-sm"><Users className="w-4 h-4 text-violet-600" /> Trusted by 50+ SMEs in Lagos, Abuja, PH</span>
              <span className="flex items-center gap-2 bg-white border-2 border-amber-200 px-3 py-1.5 rounded-full shadow-sm"><Star className="w-4 h-4 fill-amber-500 text-amber-500" /> 4.9/5 average CSAT</span>
              <span className="flex items-center gap-2 bg-white border-2 border-emerald-200 px-3 py-1.5 rounded-full shadow-sm">⚡ 2.1s avg response</span>
            </div>

            {/* Hero Dashboard Preview - BRIGHT Bento */}
            <div id="demo" className="relative max-w-[1100px] mx-auto mt-16">
              <div className="relative rounded-[32px] bg-gradient-to-br from-white via-violet-50/30 to-cyan-50/20 border-2 border-violet-200/50 p-3 backdrop-blur-2xl shadow-[0_24px_64px_rgba(124,58,237,0.15)]">
                <div className="rounded-[24px] overflow-hidden bg-white border-2 border-slate-200/60 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
                  <div className="h-14 flex items-center justify-between px-6 bg-gradient-to-r from-slate-50 to-violet-50/50 border-b-2 border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-[12px] bg-white border-2 border-violet-200 shadow flex items-center justify-center overflow-hidden"><img src="/biztriach-logo.png" alt="B" className="w-6 h-6" /></div>
                      <span className="font-outfit font-bold text-slate-900">Biztriach Dashboard</span>
                      <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-100 border-2 border-emerald-200 text-emerald-700 font-bold flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> LIVE</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-300 border-2 border-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-300 border-2 border-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-300 border-2 border-green-400"></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-0">
                    <div className="col-span-3 hidden md:flex flex-col gap-2 p-4 border-r-2 border-slate-100 bg-slate-50/50">
                      {[
                        { icon: BarChart3, label: "Overview", active: true, color: "violet" },
                        { icon: Bot, label: "AI Agents", color: "indigo" },
                        { icon: Package, label: "Inventory", color: "emerald" },
                        { icon: ShoppingBag, label: "Sales", color: "cyan" },
                        { icon: MessageSquare, label: "WhatsApp", color: "emerald", badge: "Live" },
                      ].map((it, i) => (
                        <div key={i} className={`flex items-center gap-3 px-3 py-2.5 rounded-[14px] text-[13px] font-semibold border-2 ${it.active ? "bg-[#0a0a16] text-white border-slate-800 shadow" : "bg-white text-slate-600 border-slate-200 hover:border-violet-200 hover:bg-violet-50"}`}>
                          <it.icon className={`w-4 h-4 ${it.active ? "text-white" : it.color === "violet" ? "text-violet-600" : it.color === "emerald" ? "text-emerald-600" : "text-slate-500"}`} /> {it.label}
                          {it.badge && <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500 text-white font-bold">{it.badge}</span>}
                        </div>
                      ))}
                    </div>

                    <div className="col-span-12 md:col-span-9 p-5 grid grid-cols-12 gap-4 bg-gradient-to-br from-white via-violet-50/20 to-cyan-50/10">
                      {[
                        { label: "Today's Revenue", value: "₦485,000", change: "+12%", color: "emerald", bg: "from-emerald-50 to-teal-50", border: "border-emerald-200", text: "text-emerald-700" },
                        { label: "Profit", value: "₦127,400", change: "+8%", color: "violet", bg: "from-violet-50 to-indigo-50", border: "border-violet-200", text: "text-violet-700" },
                        { label: "Low Stock", value: "3 items", change: "Alert", color: "amber", bg: "from-amber-50 to-orange-50", border: "border-amber-200", text: "text-amber-700" },
                      ].map((c, i) => (
                        <div key={i} className={`col-span-12 md:col-span-4 rounded-[18px] bg-gradient-to-br ${c.bg} border-2 ${c.border} p-4 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all`}>
                          <div className="text-[11px] uppercase tracking-widest font-bold text-slate-500 mb-1">{c.label}</div>
                          <div className={`text-[22px] font-outfit font-bold ${c.text}`}>{c.value}</div>
                          <div className={`mt-2 inline-flex text-[11px] px-2.5 py-1 rounded-full font-bold border-2 ${c.color === "emerald" ? "bg-emerald-500 text-white border-emerald-600" : c.color === "violet" ? "bg-violet-500 text-white border-violet-600" : "bg-amber-500 text-white border-amber-600"}`}>{c.change}</div>
                        </div>
                      ))}

                      <div className="col-span-12 md:col-span-7 rounded-[18px] bg-white border-2 border-emerald-200 p-4 shadow-[0_4px_16px_rgba(16,185,129,0.1)]">
                        <div className="text-[13px] font-bold text-slate-800 mb-3 flex items-center gap-2"><Smartphone className="w-4 h-4 text-emerald-600" /> WhatsApp Business Ops — Live parsing ✨</div>
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-[12px] shadow">J</div>
                            <div className="max-w-[80%] rounded-[16px] rounded-tl-[6px] bg-slate-900 text-white px-4 py-3 text-[13px] shadow">Sold 5 bags of rice for ₦85,000 each. Customer: John</div>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <div className="max-w-[80%] rounded-[16px] rounded-tr-[6px] bg-gradient-to-br from-violet-600 to-indigo-600 text-white px-4 py-3 text-[13px] shadow-[0_4px_12px_rgba(124,58,237,0.2)]">✅ Logged: 5× Rice @ ₦85k = ₦425,000. Inventory updated (42 left). Profit: ₦75,000. Customer John tagged.</div>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-12 md:col-span-5 rounded-[18px] bg-gradient-to-br from-violet-500 to-indigo-600 border-2 border-violet-600 p-4 shadow-[0_8px_24px_rgba(124,58,237,0.2)] text-white">
                        <div className="text-[13px] font-bold mb-3 flex items-center gap-2"><Bot className="w-4 h-4" /> AI Agent — website widget 💬</div>
                        <div className="space-y-2">
                          <div className="text-[12px] px-3 py-2.5 rounded-[14px] bg-white/20 backdrop-blur border border-white/20">Hi! Do you have rice in stock?</div>
                          <div className="text-[12px] px-3 py-2.5 rounded-[14px] bg-white text-slate-900 shadow font-medium">Yes! 42 bags at ₦85k each. Free delivery Lagos for 3+ bags. Order? 🚀</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[80%] h-[80px] bg-gradient-to-r from-violet-200 via-indigo-200 to-cyan-200 blur-[40px] -z-10 rounded-full opacity-60" />
            </div>
          </div>
        </div>
      </section>

      {/* INDUSTRIES - Bright */}
      <section id="industries" className="py-20 border-y-2 border-violet-100 bg-gradient-to-b from-white to-violet-50/30">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <div className="inline-flex px-4 py-1.5 rounded-full bg-white border-2 border-violet-200 shadow-sm text-[12px] font-bold tracking-widest uppercase text-violet-700">Industries • Bright Future</div>
            <h2 className="font-outfit font-bold text-[32px] md:text-[46px] leading-[0.95] tracking-tight mt-4 text-slate-900">Built for how <span className="bg-gradient-to-r from-violet-600 to-cyan-500 bg-clip-text text-transparent">you</span> actually sell</h2>
            <p className="text-slate-600 mt-4 text-[16px]">Not generic AI. Bright, purpose-built flows for Nigerian SMEs with WhatsApp-first operations.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-5">
            {industries.map((ind, i) => (
              <button key={i} onClick={() => setActiveIndustry(i)} className={`text-left rounded-[24px] p-[3px] transition-all ${activeIndustry === i ? "bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 shadow-[0_8px_32px_rgba(124,58,237,0.25)]" : "bg-slate-200 hover:bg-violet-200"}`}>
                <div className={`rounded-[21px] p-6 h-full ${activeIndustry === i ? "bg-white" : "bg-white"} `}>
                  <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center mb-4 border-2 ${ind.color === "violet" ? "bg-violet-100 border-violet-200 text-violet-600" : ind.color === "emerald" ? "bg-emerald-100 border-emerald-200 text-emerald-600" : ind.color === "cyan" ? "bg-cyan-100 border-cyan-200 text-cyan-600" : "bg-amber-100 border-amber-200 text-amber-600"}`}>
                    <ind.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-outfit font-bold text-[18px] text-slate-900">{ind.name}</h3>
                  <p className="text-[13px] text-slate-600 mt-2 leading-relaxed">{ind.desc}</p>
                  <div className={`mt-4 inline-flex text-[11px] px-3 py-1 rounded-full font-bold border-2 ${ind.color === "emerald" ? "bg-emerald-500 text-white border-emerald-600" : ind.color === "violet" ? "bg-violet-500 text-white border-violet-600" : ind.color === "cyan" ? "bg-cyan-500 text-white border-cyan-600" : "bg-amber-500 text-white border-amber-600"}`}>{ind.metric}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* PLATFORM FEATURES - Bright Bento */}
      <section id="platform" className="py-24 bg-white">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="grid lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 rounded-[32px] bg-gradient-to-br from-violet-50 via-indigo-50 to-cyan-50 border-2 border-violet-200 p-8 relative overflow-hidden shadow-[0_8px_32px_rgba(124,58,237,0.08)]">
              <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-gradient-to-br from-violet-200/50 to-indigo-200/30 blur-[60px] rounded-full" />
              <div className="relative">
                <div className="w-14 h-14 rounded-[18px] bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mb-5 shadow-[0_8px_20px_rgba(124,58,237,0.3)]"><Bot className="w-7 h-7 text-white" /></div>
                <h3 className="font-outfit font-bold text-[28px] leading-tight text-slate-900">AI Knowledge Engine 2.0<br />Your business brain 🧠</h3>
                <p className="text-slate-600 mt-3 text-[15px] leading-relaxed max-w-[520px]">Upload price lists, policies, training manuals, Excel sheets, receipts, website. Crawl your site. AI chunks, embeds, hybrid search. Answers like a 5-year employee, not a chatbot.</p>
                <div className="mt-6 grid grid-cols-2 gap-3 text-[13px]">
                  {["PDF, DOCX, XLSX, CSV, PPTX", "Image OCR support", "Website crawl + sync", "384-dim hybrid RAG", "Intent + sentiment", "Custom brand voice"].map((f) => (
                    <div key={f} className="flex items-center gap-2.5 bg-white border-2 border-slate-200 px-3 py-2 rounded-full text-slate-700 font-medium shadow-sm"><Check className="w-4 h-4 text-emerald-500" /> {f}</div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 grid gap-5">
              <div className="rounded-[24px] bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 p-6 shadow-[0_4px_16px_rgba(16,185,129,0.08)] hover:shadow-[0_8px_32px_rgba(16,185,129,0.15)] hover:-translate-y-1 transition-all">
                <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-[14px] bg-emerald-500 border-2 border-emerald-600 flex items-center justify-center shadow"><MessageSquare className="w-5 h-5 text-white" /></div><h4 className="font-bold text-slate-900">WhatsApp Business Ops 🚀</h4></div>
                <p className="text-[14px] text-slate-600 leading-relaxed">Parse "Paid rent ₦150k" → expense log, "Bought 100 bags" → inventory + expense. Daily P&L auto.</p>
                <div className="mt-4 flex flex-wrap gap-2">{["Sales", "Purchases", "Expenses", "Customers"].map((t) => <span key={t} className="text-[11px] px-3 py-1 rounded-full bg-white border-2 border-emerald-200 text-emerald-700 font-bold shadow-sm">{t}</span>)}</div>
              </div>
              <div className="rounded-[24px] bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 p-6 shadow-[0_4px_16px_rgba(245,158,11,0.08)] hover:shadow-[0_8px_32px_rgba(245,158,11,0.15)] hover:-translate-y-1 transition-all">
                <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-[14px] bg-amber-500 border-2 border-amber-600 flex items-center justify-center shadow"><Layers className="w-5 h-5 text-white" /></div><h4 className="font-bold text-slate-900">Landing + Funnels ✨</h4></div>
                <p className="text-[14px] text-slate-600 leading-relaxed">AI copywriter builds pages, forms capture leads, funnel automates: page → form → email → AI follow-up → customer.</p>
              </div>
            </div>

            <div className="lg:col-span-4 rounded-[24px] bg-white border-2 border-violet-200 p-6 shadow-[0_4px_16px_rgba(124,58,237,0.08)] hover:shadow-[0_12px_32px_rgba(124,58,237,0.12)] hover:-translate-y-1 transition-all">
              <div className="w-10 h-10 rounded-[14px] bg-violet-100 border-2 border-violet-200 flex items-center justify-center mb-3"><Package className="w-5 h-5 text-violet-600" /></div>
              <h4 className="font-bold text-slate-900">Inventory that updates itself 📦</h4>
              <p className="text-[13px] text-slate-600 mt-2">Low-stock alerts, categories, cost vs selling price, profit per product, WhatsApp-driven restock.</p>
            </div>
            <div className="lg:col-span-4 rounded-[24px] bg-white border-2 border-cyan-200 p-6 shadow-[0_4px_16px_rgba(6,182,214,0.08)] hover:shadow-[0_12px_32px_rgba(6,182,214,0.12)] hover:-translate-y-1 transition-all">
              <div className="w-10 h-10 rounded-[14px] bg-cyan-100 border-2 border-cyan-200 flex items-center justify-center mb-3"><Wallet className="w-5 h-5 text-cyan-600" /></div>
              <h4 className="font-bold text-slate-900">Financial dashboard that speaks 💰</h4>
              <p className="text-[13px] text-slate-600 mt-2">Today's revenue, expenses, profit, best seller, top customers, inventory value — plus AI daily insight.</p>
            </div>
            <div className="lg:col-span-4 rounded-[24px] bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 border-2 border-violet-600 p-6 text-white shadow-[0_8px_32px_rgba(124,58,237,0.3)] hover:shadow-[0_16px_48px_rgba(124,58,237,0.4)] hover:-translate-y-1 transition-all">
              <TrendingUp className="w-6 h-6 mb-3" />
              <h4 className="font-bold">For 50-100 businesses 📈</h4>
              <p className="text-[13px] text-white/90 mt-2">Optimized batch embeddings, efficient queries, background jobs, scalable to thousands with no re-architecture.</p>
              <div className="mt-4 inline-flex items-center gap-2 text-[12px] font-bold bg-white text-violet-600 px-4 py-2 rounded-full shadow">Scale-ready architecture <ArrowRight className="w-4 h-4" /></div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING - Bright */}
      <section id="pricing" className="py-24 border-y-2 border-violet-100 bg-gradient-to-b from-violet-50/50 to-white">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <div className="inline-flex px-4 py-1.5 rounded-full bg-white border-2 border-violet-200 shadow-sm text-[12px] font-bold tracking-widest uppercase text-violet-700">Pricing • Bright & Fair</div>
            <h2 className="font-outfit font-bold text-[36px] md:text-[48px] leading-[0.95] tracking-tight mt-4 text-slate-900">Manual billing, <span className="bg-gradient-to-r from-violet-600 to-cyan-500 bg-clip-text text-transparent">human trust</span> 🤝</h2>
            <p className="text-slate-600 mt-4">Sign up → Pending → Pay manually → Admin approves → Full access. Simple for MVP, scales later to auto billing.</p>
            <div className="mt-6 inline-flex items-center gap-1 p-1.5 rounded-full bg-white border-2 border-slate-200 shadow-sm">
              <button onClick={() => setIsYearly(false)} className={`px-5 py-2 rounded-full text-[13px] font-bold transition-all ${!isYearly ? "bg-[#0a0a16] text-white shadow" : "text-slate-600 hover:text-slate-900"}`}>Monthly</button>
              <button onClick={() => setIsYearly(true)} className={`px-5 py-2 rounded-full text-[13px] font-bold transition-all ${isYearly ? "bg-[#0a0a16] text-white shadow" : "text-slate-600 hover:text-slate-900"}`}>Yearly -20% 🎉</button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-[1100px] mx-auto">
            {plans.map((plan, i) => (
              <div key={i} className={`rounded-[32px] p-[3px] ${plan.popular ? "bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 shadow-[0_16px_48px_rgba(124,58,237,0.25)]" : "bg-slate-200"}`}>
                <div className={`rounded-[29px] p-7 h-full ${plan.popular ? "bg-white" : "bg-white"} flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.04)]`}>
                  {plan.popular && <div className="inline-flex text-[11px] font-bold tracking-widest px-3 py-1 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white mb-4 shadow">⭐ MOST POPULAR</div>}
                  <h3 className="font-outfit font-bold text-[24px] text-slate-900">{plan.name}</h3>
                  <p className="text-[13px] text-slate-600 mt-1">{plan.desc}</p>
                  <div className="mt-6 flex items-baseline gap-2"><span className="text-[40px] font-outfit font-bold text-slate-900">${isYearly ? plan.priceYearly : plan.price}</span><span className="text-slate-500 text-[14px]">/mo</span></div>
                  <div className="mt-6 space-y-3 flex-1">
                    {plan.features.map((f) => (
                      <div key={f} className="flex gap-3 text-[13px] text-slate-700"><div className="w-5 h-5 rounded-full bg-emerald-100 border-2 border-emerald-200 flex items-center justify-center shrink-0 mt-0.5"><Check className="w-3 h-3 text-emerald-600" /></div> {f}</div>
                    ))}
                  </div>
                  <Link href="/register" className={`mt-8 inline-flex justify-center items-center h-12 rounded-full font-bold text-[14px] transition-all hover:-translate-y-0.5 ${plan.popular ? "bg-[#0a0a16] text-white shadow-[0_8px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.25)]" : "bg-white border-2 border-slate-200 text-slate-700 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"}`}>
                    {plan.cta} <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ - Bright */}
      <section id="faq" className="py-20 bg-white">
        <div className="max-w-[960px] mx-auto px-6">
          <h2 className="font-outfit font-bold text-[32px] md:text-[42px] text-center text-slate-900">Questions? <span className="bg-gradient-to-r from-violet-600 to-cyan-500 bg-clip-text text-transparent">Answers.</span> 💡</h2>
          <div className="mt-10 divide-y-2 divide-slate-100 rounded-[24px] border-2 border-slate-200 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.04)] overflow-hidden">
            {faqs.map((f, i) => (
              <div key={i} className="p-0">
                <button onClick={() => setActiveFaq(activeFaq === i ? null : i)} className="w-full flex items-center justify-between text-left p-6 hover:bg-violet-50/50 transition">
                  <span className="font-semibold text-[15px] pr-6 text-slate-900">{f.q}</span>
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition ${activeFaq === i ? "bg-violet-600 border-violet-600 text-white rotate-180" : "bg-white border-slate-200 text-slate-400"}`}><ChevronDown className="w-4 h-4" /></div>
                </button>
                {activeFaq === i && <div className="px-6 pb-6 text-[14px] leading-relaxed text-slate-600 bg-violet-50/30">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER CTA - Bright */}
      <section className="py-24 relative overflow-hidden bg-gradient-to-br from-violet-50 via-indigo-50 to-cyan-50">
        <div className="absolute inset-0 bg-biz-mesh opacity-50" />
        <div className="max-w-[1280px] mx-auto px-6 relative">
          <div className="rounded-[40px] bg-gradient-to-br from-[#0a0a16] via-[#1a1a2e] to-[#0a0a16] border-2 border-violet-500/20 p-10 md:p-16 text-center shadow-[0_24px_64px_rgba(0,0,0,0.2)] relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-violet-600/20 to-transparent blur-[60px] rounded-full" />
            <div className="relative">
              <div className="inline-flex w-16 h-16 rounded-[20px] bg-white border-2 border-violet-200 items-center justify-center mb-6 shadow-[0_8px_24px_rgba(124,58,237,0.2)] overflow-hidden"><img src="/biztriach-logo.png" alt="Biztriach" className="w-10 h-10" /></div>
              <h2 className="font-outfit font-bold text-[36px] md:text-[52px] leading-[0.9] tracking-tight text-white">Ready to hire your<br />AI employee? 🚀</h2>
              <p className="text-white/70 max-w-xl mx-auto mt-4 text-[17px]">Join 50+ businesses automating support, inventory, sales, and WhatsApp. Manual approval ensures human quality with brighter future.</p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register" className="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-full bg-white text-black font-bold text-[16px] shadow-[0_8px_24px_rgba(255,255,255,0.2)] hover:shadow-[0_12px_32px_rgba(255,255,255,0.3)] hover:-translate-y-1 transition-all">Start free account <ArrowRight className="w-5 h-5" /></Link>
                <Link href="/login" className="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-full bg-white/10 border-2 border-white/20 text-white font-semibold backdrop-blur hover:bg-white/20 transition-all">Sign in</Link>
              </div>
              <p className="text-[12px] text-white/40 mt-8 tracking-wide">ADMIN: ogungboyeopeyemiphilip@gmail.com • phoslabceo@gmail.com • Manual billing MVP • Bright UI/UX v3.0</p>
            </div>
          </div>
          <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-4 text-[13px] text-slate-500">
            <span className="flex items-center gap-3"><img src="/biztriach-logo.png" alt="B" className="w-6 h-6 rounded-[8px] border border-violet-200" /> © 2026 Biztriach • AI Business Platform • Built in Lagos 🇳🇬 • Brighter Future</span>
            <span className="flex items-center gap-6 font-medium"><a href="#" className="hover:text-violet-600 transition">Privacy</a><a href="#" className="hover:text-violet-600 transition">Terms</a><a href="#" className="hover:text-violet-600 transition">Status</a><span className="px-3 py-1 rounded-full bg-emerald-100 border-2 border-emerald-200 text-emerald-700 font-bold">● Live on Biztriach.vercel.app</span></span>
          </div>
        </div>
      </section>
    </div>
  );
}
