/* eslint-disable react/no-unescaped-entities */
"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight, Bot, Database, BarChart3, Shield, Sparkles,
  MessageCircle, Zap, Globe, FileText, ShoppingBag, TrendingUp,
  Package, Receipt, Users, Wallet, MessageSquare, Building2,
  Layers, Target, Mail, Smartphone, ChevronDown, Check, Play,
  ArrowUpRight, Star, Quote
} from "lucide-react";

export default function BiztriachLanding() {
  const [isYearly, setIsYearly] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [activeIndustry, setActiveIndustry] = useState(0);

  const industries = [
    { name: "Supermarket", desc: "Track rice, oil, inventory via WhatsApp. Auto reports.", icon: Building2, metric: "85% less manual work" },
    { name: "Restaurant", desc: "Menu AI, orders, stock alerts, customer follow-up.", icon: ShoppingBag, metric: "3x faster service" },
    { name: "Real Estate", desc: "Property listings, client queries, WhatsApp closings.", icon: Globe, metric: "60% more leads" },
    { name: "Clinic", desc: "Appointments, patient support, inventory for drugs.", icon: Shield, metric: "100% organized" },
  ];

  const plans = [
    {
      name: "Starter",
      desc: "For solo entrepreneurs testing AI business ops.",
      price: 0,
      priceYearly: 0,
      features: ["1 AI Employee", "100 AI conversations/mo", "5 documents", "Inventory (50 products)", "Basic sales tracking", "Website widget", "Email reports"],
      cta: "Start Free",
      popular: false,
      accent: "slate"
    },
    {
      name: "Growth",
      desc: "For growing SMEs ready to automate sales + support.",
      price: 49,
      priceYearly: 39,
      features: ["3 AI Employees", "2,500 conversations/mo", "50 docs + website crawl", "Unlimited products", "WhatsApp business parsing", "Landing page builder", "Funnel builder", "Leads & Email campaigns", "Expense tracking", "Human takeover"],
      cta: "Start Growth",
      popular: true,
      accent: "violet"
    },
    {
      name: "Scale",
      desc: "For agencies managing 10+ client businesses.",
      price: 199,
      priceYearly: 159,
      features: ["Unlimited AI Employees", "15k conversations/mo", "Unlimited knowledge sources incl. OCR", "Advanced analytics + AI reports", "Custom brand voice & tone", "API access + BYOK", "Priority support", "Multi-channel: WA, IG, TG soon", "Team members (5)"],
      cta: "Go Scale",
      popular: false,
      accent: "indigo"
    },
  ];

  const faqs = [
    {
      q: "How does WhatsApp business operations work?",
      a: "Simply send a message like 'Sold 5 bags of rice for ₦85,000 each' to your connected WhatsApp. Biztriach AI parses it automatically — updates inventory, calculates profit (₦425k revenue), logs customer, and generates daily report. No spreadsheets needed. It understands Pidgin, English, and mixed formats like '85k' or '85,000'."
    },
    {
      q: "Can one AI employee handle both support and sales?",
      a: "Yes! That's the core vision of Biztriach. You train your AI once with your product list, price list, policies, and FAQs. It then answers customer questions on website chat, sells via WhatsApp, tracks inventory when you send 'bought 100 bags', and even generates marketing copy. Same brain, multiple channels."
    },
    {
      q: "What knowledge sources can I upload?",
      a: "Everything: PDFs, Word, Excel price lists, CSV sales history, PowerPoint trainings, images of invoices (OCR), product catalogs, website URLs (we crawl and index), FAQs. The AI Knowledge Engine 2.0 processes, chunks, embeds with 384-dim vectors, and builds hybrid semantic + keyword retrieval for 95% accurate answers."
    },
    {
      q: "How is data kept separate for each business?",
      a: "Biztriach is multi-tenant by design. Every business gets completely isolated data — its own AI agents, documents, inventory, sales, customers, landing pages, WhatsApp. No cross-business access ever. We use organizationId isolation on every query plus PostgreSQL row-level security ready."
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a16] text-white overflow-x-hidden selection:bg-violet-500/30">
      {/* Noise texture overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.015]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} />

      {/* HEADER */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-[#0a0a16]/70 border-b border-white/[0.06]">
        <div className="max-w-[1280px] mx-auto px-6 h-[68px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[12px] bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-600/20">
              <span className="font-outfit font-black text-[16px] tracking-tight">B</span>
            </div>
            <span className="font-outfit font-bold text-[19px] tracking-tight">Biztriach</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 font-bold tracking-widest">BETA</span>
          </Link>
          <nav className="hidden lg:flex items-center gap-8 text-[13.5px] font-medium text-white/60">
            <a href="#platform" className="hover:text-white transition">Platform</a>
            <a href="#industries" className="hover:text-white transition">Industries</a>
            <a href="#pricing" className="hover:text-white transition">Pricing</a>
            <a href="#faq" className="hover:text-white transition">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden md:inline-flex text-[13.5px] font-medium text-white/70 hover:text-white px-4 py-2">Sign in</Link>
            <Link href="/register" className="inline-flex items-center gap-2 bg-white text-black font-semibold text-[13.5px] px-[18px] h-9 rounded-full hover:bg-zinc-100 transition">
              Start free <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative pt-16 pb-20 md:pt-28 md:pb-32">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-gradient-to-b from-violet-600/20 via-indigo-600/10 to-transparent blur-[120px] rounded-full" />
          <div className="absolute top-[30%] left-[10%] w-[400px] h-[400px] bg-cyan-500/10 blur-[100px] rounded-full" />
          <div className="absolute top-[20%] right-[10%] w-[350px] h-[350px] bg-fuchsia-500/10 blur-[100px] rounded-full" />
        </div>

        <div className="max-w-[1280px] mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-[12px] font-medium backdrop-blur">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white/80">AI Business Platform v2 — Now with WhatsApp business ops</span>
              <ArrowUpRight className="w-3 h-3 text-white/40" />
            </div>

            <h1 className="font-outfit font-[800] text-[42px] md:text-[68px] leading-[0.9] tracking-[-0.03em] mt-8">
              One <span className="bg-gradient-to-r from-violet-300 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">AI employee</span> for your entire business
            </h1>

            <p className="text-[17px] md:text-[19px] leading-relaxed text-white/60 max-w-[720px] mx-auto mt-6 font-inter">
              Train once, deploy everywhere. Customer support, sales tracking, inventory, WhatsApp ops, landing pages, and daily profit reports — all automated. Built for African SMEs.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-9">
              <Link href="/register" className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white font-semibold text-[15px] shadow-[0_0_50px_rgba(124,58,237,0.35)] hover:shadow-[0_0_70px_rgba(124,58,237,0.5)] transition-all hover:-translate-y-0.5">
                <Sparkles className="w-4 h-4" /> Start your AI business
              </Link>
              <a href="#demo" className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full bg-white/[0.06] border border-white/[0.08] text-white font-medium text-[15px] backdrop-blur hover:bg-white/[0.1] transition">
                <Play className="w-4 h-4" /> Watch 90-sec demo
              </a>
            </div>

            {/* Social proof */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-[12px] text-white/40">
              <span className="flex items-center gap-2"><Users className="w-4 h-4" /> Trusted by 50+ SMEs in Lagos, Abuja, PH</span>
              <span className="hidden sm:flex items-center gap-2">•</span>
              <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> 4.9/5 average CSAT</span>
              <span className="hidden sm:flex items-center gap-2">•</span>
              <span>⚡ 2.1s avg response</span>
            </div>

            {/* Hero Dashboard Preview - Unique Bento */}
            <div id="demo" className="relative max-w-[1100px] mx-auto mt-16">
              <div className="relative rounded-[28px] bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/[0.08] p-2 backdrop-blur-2xl shadow-[0_40px_120px_rgba(0,0,0,0.5)]">
                <div className="rounded-[20px] overflow-hidden bg-[#0f0f1a] border border-white/[0.06]">
                  {/* Mock top bar */}
                  <div className="h-12 flex items-center justify-between px-5 bg-white/[0.02] border-b border-white/[0.06]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/70" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                      <div className="w-3 h-3 rounded-full bg-green-500/70" />
                      <span className="ml-3 text-[11px] font-mono text-white/30">biztriach.com/dashboard</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-6 px-3 rounded-full bg-violet-500/20 border border-violet-500/20 text-[11px] flex items-center text-violet-300">● Live</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-0">
                    {/* Sidebar mock */}
                    <div className="col-span-3 hidden md:flex flex-col gap-6 p-5 border-r border-white/[0.06] bg-white/[0.02]">
                      <div className="space-y-1">
                        {[
                          { icon: BarChart3, label: "Overview", active: true },
                          { icon: Bot, label: "AI Agents" },
                          { icon: Package, label: "Inventory" },
                          { icon: ShoppingBag, label: "Sales" },
                          { icon: Receipt, label: "Expenses" },
                          { icon: MessageSquare, label: "WhatsApp" },
                          { icon: Globe, label: "Landing Pages" },
                          { icon: Mail, label: "Leads" },
                        ].map((it, i) => (
                          <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-[12px] text-[13px] ${it.active ? "bg-white text-black font-semibold" : "text-white/50 hover:text-white/80"}`}>
                            <it.icon className="w-4 h-4" /> {it.label}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Main bento */}
                    <div className="col-span-12 md:col-span-9 p-5 grid grid-cols-12 gap-4 bg-[#0a0a12]">
                      {/* Financial cards */}
                      {[
                        { label: "Today's Revenue", value: "₦485,000", change: "+12%", color: "emerald" },
                        { label: "Profit", value: "₦127,400", change: "+8%", color: "violet" },
                        { label: "Low Stock", value: "3 items", change: "Alert", color: "amber" },
                      ].map((c, i) => (
                        <div key={i} className="col-span-12 md:col-span-4 rounded-[16px] bg-white/[0.04] border border-white/[0.06] p-4">
                          <div className="text-[11px] uppercase tracking-widest text-white/40 mb-1">{c.label}</div>
                          <div className="text-[22px] font-outfit font-bold">{c.value}</div>
                          <div className={`mt-2 inline-flex text-[11px] px-2 py-0.5 rounded-full ${c.color === "emerald" ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20" : c.color === "violet" ? "bg-violet-500/15 text-violet-300 border border-violet-500/20" : "bg-amber-500/15 text-amber-300 border border-amber-500/20"}`}>{c.change}</div>
                        </div>
                      ))}

                      {/* WhatsApp parsing showcase */}
                      <div className="col-span-12 md:col-span-7 rounded-[16px] bg-white/[0.04] border border-white/[0.06] p-4">
                        <div className="text-[12px] font-semibold text-white/80 mb-3 flex items-center gap-2"><Smartphone className="w-4 h-4 text-emerald-400" /> WhatsApp Business Ops — Live parsing</div>
                        <div className="space-y-2.5">
                          <div className="flex gap-2">
                            <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-[11px] font-bold">J</div>
                            <div className="max-w-[80%] rounded-[14px] rounded-tl-[4px] bg-white text-black px-3.5 py-2.5 text-[13px]">Sold 5 bags of rice for ₦85,000 each. Customer: John</div>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <div className="max-w-[80%] rounded-[14px] rounded-tr-[4px] bg-violet-600 text-white px-3.5 py-2.5 text-[13px]">✅ Logged: 5× Rice @ ₦85k = ₦425,000. Inventory updated (42 left). Profit: ₦75,000. Customer John tagged.</div>
                          </div>
                        </div>
                      </div>

                      {/* AI Chat widget */}
                      <div className="col-span-12 md:col-span-5 rounded-[16px] bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/20 p-4">
                        <div className="text-[12px] font-semibold mb-3 flex items-center gap-2"><Bot className="w-4 h-4" /> AI Agent — website widget</div>
                        <div className="space-y-2">
                          <div className="text-[12px] px-3 py-2 rounded-[14px] bg-white/[0.06] border border-white/[0.06]">Hi! Do you have rice in stock?</div>
                          <div className="text-[12px] px-3 py-2 rounded-[14px] bg-white text-black">Yes! We have 42 bags of premium rice at ₦85,000 each. Free delivery in Lagos for 3+ bags. Would you like to order?</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating glow */}
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[80%] h-[100px] bg-violet-600/20 blur-[50px] -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* INDUSTRIES - Bento */}
      <section id="industries" className="py-20 border-t border-white/[0.06] bg-white/[0.01]">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <div className="inline-flex px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-[11px] tracking-widest uppercase text-white/50">Industries</div>
            <h2 className="font-outfit font-bold text-[32px] md:text-[46px] leading-[0.95] tracking-tight mt-4">Built for how <span className="text-white/40">you</span> actually sell</h2>
            <p className="text-white/50 mt-4 text-[16px]">Not generic AI. Purpose-built flows for Nigerian SMEs with WhatsApp-first operations.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            {industries.map((ind, i) => (
              <button key={i} onClick={() => setActiveIndustry(i)} className={`text-left rounded-[20px] p-[1px] transition-all ${activeIndustry === i ? "bg-gradient-to-br from-violet-600 to-indigo-600" : "bg-white/[0.06] hover:bg-white/[0.1]"}`}>
                <div className={`rounded-[19px] p-5 h-full ${activeIndustry === i ? "bg-[#15151f]" : "bg-[#10101a]"} `}>
                  <ind.icon className={`w-8 h-8 ${activeIndustry === i ? "text-violet-400" : "text-white/40"} mb-4`} />
                  <h3 className="font-outfit font-semibold text-[18px]">{ind.name}</h3>
                  <p className="text-[13px] text-white/50 mt-2 leading-relaxed">{ind.desc}</p>
                  <div className="mt-4 inline-flex text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">{ind.metric}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* PLATFORM FEATURES - Massive Bento Grid */}
      <section id="platform" className="py-24">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="grid lg:grid-cols-12 gap-4">
            {/* Big card */}
            <div className="lg:col-span-7 rounded-[28px] bg-gradient-to-br from-[#15151f] to-[#10101a] border border-white/[0.06] p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-violet-600/15 blur-[80px] rounded-full" />
              <div className="relative">
                <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mb-5"><Bot className="w-6 h-6" /></div>
                <h3 className="font-outfit font-bold text-[26px] leading-tight">AI Knowledge Engine 2.0<br />Your business brain</h3>
                <p className="text-white/50 mt-3 text-[14.5px] leading-relaxed max-w-[520px]">Upload price lists, policies, training manuals, Excel sheets, receipts, website. Crawl your site. AI chunks, embeds, hybrid search. Answers like a 5-year employee, not a chatbot.</p>
                <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-2 text-[12px]">
                  {["PDF, DOCX, XLSX, CSV, PPTX", "Image OCR support", "Website crawl + sync", "384-dim hybrid RAG", "Intent + sentiment", "Custom brand voice"].map((f) => (
                    <div key={f} className="flex items-center gap-2 text-white/60"><Check className="w-3.5 h-3.5 text-emerald-400" /> {f}</div>
                  ))}
                </div>
              </div>
            </div>

            {/* Stack */}
            <div className="lg:col-span-5 grid gap-4">
              <div className="rounded-[24px] bg-[#10101a] border border-white/[0.06] p-6">
                <div className="flex items-center gap-3 mb-3"><div className="w-9 h-9 rounded-[10px] bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center"><MessageSquare className="w-4 h-4 text-emerald-400" /></div><h4 className="font-semibold">WhatsApp Business Ops</h4></div>
                <p className="text-[13.5px] text-white/50 leading-relaxed">Parse “Paid rent ₦150k” → expense log, “Bought 100 bags” → inventory + expense. Daily P&L auto.</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {["Sales", "Purchases", "Expenses", "Customers"].map((t) => <span key={t} className="text-[11px] px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-white/60">{t}</span>)}
                </div>
              </div>
              <div className="rounded-[24px] bg-[#10101a] border border-white/[0.06] p-6">
                <div className="flex items-center gap-3 mb-3"><div className="w-9 h-9 rounded-[10px] bg-amber-500/15 border border-amber-500/20 flex items-center justify-center"><Layers className="w-4 h-4 text-amber-400" /></div><h4 className="font-semibold">Landing + Funnels</h4></div>
                <p className="text-[13.5px] text-white/50 leading-relaxed">AI copywriter builds pages, forms capture leads, funnel automates: page → form → email → AI follow-up → customer.</p>
              </div>
            </div>

            {/* Row 2 */}
            <div className="lg:col-span-4 rounded-[24px] bg-[#10101a] border border-white/[0.06] p-6">
              <Package className="w-6 h-6 text-violet-400 mb-3" />
              <h4 className="font-semibold">Inventory that updates itself</h4>
              <p className="text-[13px] text-white/50 mt-2">Low-stock alerts, categories, cost vs selling price, profit per product, WhatsApp-driven restock.</p>
            </div>
            <div className="lg:col-span-4 rounded-[24px] bg-[#10101a] border border-white/[0.06] p-6">
              <Wallet className="w-6 h-6 text-cyan-400 mb-3" />
              <h4 className="font-semibold">Financial dashboard that speaks</h4>
              <p className="text-[13px] text-white/50 mt-2">Today's revenue, expenses, profit, best seller, top customers, inventory value — plus AI daily insight.</p>
            </div>
            <div className="lg:col-span-4 rounded-[24px] bg-gradient-to-br from-violet-600 to-indigo-600 p-6 text-white">
              <TrendingUp className="w-6 h-6 mb-3" />
              <h4 className="font-semibold">For 50-100 businesses</h4>
              <p className="text-[13px] text-white/80 mt-2">Optimized batch embeddings, efficient queries, background jobs, scalable to thousands with no re-architecture.</p>
              <div className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium bg-white text-black px-3 py-1.5 rounded-full">Scale-ready architecture <ArrowRight className="w-3 h-3" /></div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 border-t border-white/[0.06] bg-white/[0.01]">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="font-outfit font-bold text-[36px] md:text-[48px] leading-[0.95] tracking-tight">Manual billing, <span className="text-white/30">human trust</span></h2>
            <p className="text-white/50 mt-4">Sign up → Pending → Pay manually → Admin approves → Full access. Simple for MVP, scales later to auto billing.</p>
            <div className="mt-6 inline-flex items-center gap-1 p-1 rounded-full bg-white/[0.06] border border-white/[0.08]">
              <button onClick={() => setIsYearly(false)} className={`px-4 py-1.5 rounded-full text-[13px] font-medium ${!isYearly ? "bg-white text-black" : "text-white/60"}`}>Monthly</button>
              <button onClick={() => setIsYearly(true)} className={`px-4 py-1.5 rounded-full text-[13px] font-medium ${isYearly ? "bg-white text-black" : "text-white/60"}`}>Yearly -20%</button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-5 max-w-[1100px] mx-auto">
            {plans.map((plan, i) => (
              <div key={i} className={`rounded-[24px] p-[1px] ${plan.popular ? "bg-gradient-to-br from-violet-600 to-indigo-600 shadow-[0_0_80px_rgba(124,58,237,0.25)]" : "bg-white/[0.08]"}`}>
                <div className={`rounded-[23px] p-6 h-full ${plan.popular ? "bg-[#12121f]" : "bg-[#10101a]"} flex flex-col`}>
                  {plan.popular && <div className="inline-flex text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-full bg-violet-500 text-white mb-4">MOST POPULAR</div>}
                  <h3 className="font-outfit font-bold text-[22px]">{plan.name}</h3>
                  <p className="text-[13px] text-white/50 mt-1">{plan.desc}</p>
                  <div className="mt-5 flex items-baseline gap-1"><span className="text-[36px] font-outfit font-bold">${isYearly ? plan.priceYearly : plan.price}</span><span className="text-white/40 text-[13px]">/mo</span></div>
                  <div className="mt-6 space-y-2.5 flex-1">
                    {plan.features.map((f) => (
                      <div key={f} className="flex gap-2.5 text-[13px] text-white/70"><Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> {f}</div>
                    ))}
                  </div>
                  <Link href="/register" className={`mt-7 inline-flex justify-center items-center h-11 rounded-full font-semibold text-[14px] ${plan.popular ? "bg-white text-black hover:bg-zinc-100" : "bg-white/[0.08] border border-white/[0.08] text-white hover:bg-white/[0.12]"} transition`}>
                    {plan.cta} <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 border-t border-white/[0.06]">
        <div className="max-w-[960px] mx-auto px-6">
          <h2 className="font-outfit font-bold text-[30px] md:text-[40px] text-center">Questions? <span className="text-white/30">Answers.</span></h2>
          <div className="mt-10 divide-y divide-white/[0.06] rounded-[20px] border border-white/[0.06] bg-white/[0.02]">
            {faqs.map((f, i) => (
              <div key={i} className="p-0">
                <button onClick={() => setActiveFaq(activeFaq === i ? null : i)} className="w-full flex items-center justify-between text-left p-6">
                  <span className="font-medium text-[15px] pr-6">{f.q}</span>
                  <ChevronDown className={`w-4 h-4 text-white/40 transition ${activeFaq === i ? "rotate-180" : ""}`} />
                </button>
                {activeFaq === i && <div className="px-6 pb-6 text-[14px] leading-relaxed text-white/60">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-600/10 to-transparent" />
        <div className="max-w-[1280px] mx-auto px-6 relative">
          <div className="rounded-[32px] bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.08] p-10 md:p-14 text-center backdrop-blur">
            <div className="inline-flex w-14 h-14 rounded-[16px] bg-gradient-to-br from-violet-600 to-indigo-600 items-center justify-center mb-6 shadow-xl"><Sparkles className="w-7 h-7" /></div>
            <h2 className="font-outfit font-bold text-[34px] md:text-[48px] leading-[0.95] tracking-tight">Ready to hire your<br />AI employee?</h2>
            <p className="text-white/50 max-w-xl mx-auto mt-4 text-[16px]">Join 50+ businesses automating support, inventory, sales, and WhatsApp. Manual approval ensures human quality.</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/register" className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-full bg-white text-black font-semibold hover:bg-zinc-100 transition">Start free account <ArrowRight className="w-4 h-4" /></Link>
              <Link href="/login" className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-full bg-white/[0.06] border border-white/[0.08] text-white font-medium backdrop-blur hover:bg-white/[0.1] transition">Sign in</Link>
            </div>
            <p className="text-[11px] text-white/30 mt-6 tracking-wide">ADMIN: ogungboyeopeyemiphilip@gmail.com • phoslabceo@gmail.com • Manual billing MVP</p>
          </div>
          <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-4 text-[12px] text-white/30">
            <span>© 2026 Biztriach • AI Business Platform • Built in Lagos 🇳🇬</span>
            <span className="flex items-center gap-4"><a href="#" className="hover:text-white/60">Privacy</a><a href="#" className="hover:text-white/60">Terms</a><a href="#" className="hover:text-white/60">Status</a></span>
          </div>
        </div>
      </section>
    </div>
  );
}
