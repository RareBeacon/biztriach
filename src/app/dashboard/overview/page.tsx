"use client";

import React, { useEffect, useState } from "react";
import { useDashboard } from "@/context/DashboardContext";
import {
  TrendingUp, MessageCircle, Bot, Clock, ArrowUpRight,
  Database, Users, ChevronRight, Zap, Star, CheckCircle2, XCircle,
} from "lucide-react";
import Link from "next/link";

interface AgentMetrics {
  totalConversations: number;
  totalMessages: number;
  averageRating: number | null;
  avgResponseTimeSec: number;
}

export default function BiztriachOverview() {
  const { activeChatbot, user } = useDashboard();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<AgentMetrics | null>(null);
  const [convs, setConvs] = useState<any[]>([]);
  const [waConnected, setWaConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const waRes = await fetch("/api/whatsapp/account");
        if (waRes.ok) {
          const a = await waRes.json();
          setWaConnected(Boolean(a?.account?.isConnected));
        } else if (waRes.status === 404) {
          setWaConnected(false);
        }
        if (activeChatbot?.id) {
          const anRes = await fetch(`/api/analytics?chatbotId=${activeChatbot.id}`);
          if (anRes.ok) {
            const d = await anRes.json();
            setMetrics(d.summary || null);
          }
          const convRes = await fetch(`/api/conversations?chatbotId=${activeChatbot.id}`);
          if (convRes.ok) {
            const list = await convRes.json();
            setConvs(Array.isArray(list) ? list.slice(0, 5) : []);
          }
        }
      } catch (e) {
        console.error("Overview load error", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [activeChatbot]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const stats = [
    { label: "Conversations", value: metrics ? metrics.totalConversations.toLocaleString() : "—", sub: "Total customer chats handled", icon: MessageCircle, tone: "text-violet-600 bg-violet-50 border-violet-100" },
    { label: "Messages", value: metrics ? metrics.totalMessages.toLocaleString() : "—", sub: "AI + customer messages exchanged", icon: Bot, tone: "text-indigo-600 bg-indigo-50 border-indigo-100" },
    { label: "Avg Response", value: metrics ? `${metrics.avgResponseTimeSec || 12}s` : "—", sub: "How fast your AI replies", icon: Clock, tone: "text-cyan-600 bg-cyan-50 border-cyan-100" },
    { label: "WhatsApp", value: waConnected === null ? "…" : waConnected ? "Connected" : "Not connected", sub: waConnected ? "AI answering on your number" : "Connect it in 3 clicks", icon: waConnected ? CheckCircle2 : XCircle, tone: waConnected ? "text-emerald-600 bg-emerald-50 border-emerald-100" : "text-slate-500 bg-slate-50 border-slate-200" },
  ];

  const quickActions = [
    { label: "WhatsApp Agent", desc: "Your AI replies to customers on WhatsApp, 24/7", href: "/dashboard/whatsapp", icon: MessageCircle, tone: "bg-emerald-500" },
    { label: "Train Knowledge", desc: "Upload documents so the AI speaks your business", href: "/dashboard/documents", icon: Database, tone: "bg-violet-500" },
    { label: "Customize Agent", desc: "Tune your agent's personality and instructions", href: "/dashboard/chatbots", icon: Zap, tone: "bg-sky-500" },
    { label: "Live Inbox", desc: "See every customer conversation as it happens", href: "/dashboard/conversations", icon: Bot, tone: "bg-indigo-500" },
  ];

  const lastMsg = (c: any) => {
    const msgs = c?.messages || [];
    const m = msgs[msgs.length - 1];
    return m?.content || c?.lastMessage || "";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-outfit text-[26px] font-bold tracking-tight text-slate-900">
            {greeting}{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-[13.5px] text-slate-500 mt-1">
            {activeChatbot ? <>Agent <span className="font-semibold text-slate-700">{activeChatbot.name}</span> is live • </> : ""}
            Here's what's happening across your business today.
          </p>
        </div>
        <Link href="/dashboard/analytics" className="btn-primary">
          View Analytics <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="console-card console-card-hover p-5">
            <div className="flex items-center justify-between mb-3">
              <span className={`w-9 h-9 rounded-lg border flex items-center justify-center ${s.tone}`}>
                <s.icon className="w-[17px] h-[17px]" />
              </span>
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{s.label}</div>
            <div className="font-outfit text-[26px] font-bold text-slate-900 mt-1 leading-tight">
              {loading ? <span className="inline-block w-20 h-7 bg-slate-100 rounded animate-pulse" /> : s.value}
            </div>
            <div className="text-[12px] text-slate-500 mt-1.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <div className="section-title">Quick actions</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {quickActions.map((a) => (
            <Link key={a.href} href={a.href} className="console-card console-card-hover p-5 group">
              <div className={`w-9 h-9 rounded-lg ${a.tone} flex items-center justify-center shadow-sm mb-3`}>
                <a.icon className="w-[17px] h-[17px] text-white" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-semibold text-slate-800 group-hover:text-violet-700 transition">{a.label}</span>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">{a.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Activity */}
      <div className="grid lg:grid-cols-12 gap-5">
        {/* Recent conversations */}
        <div className="lg:col-span-7 console-card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="text-[13.5px] font-semibold text-slate-800 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-slate-400" /> Recent Conversations
            </div>
            <Link href="/dashboard/conversations" className="text-[12px] font-semibold text-violet-600 hover:text-violet-700">View all →</Link>
          </div>
          {loading ? (
            <div className="p-10 text-center text-[13px] text-slate-400">Loading…</div>
          ) : convs.length === 0 ? (
            <div className="p-10 text-center">
              <div className="text-[28px] mb-2">💬</div>
              <p className="text-[13.5px] font-semibold text-slate-700">No conversations yet</p>
              <p className="text-[12.5px] text-slate-500 mt-1">Connect WhatsApp and message your business number — chats appear here with AI auto-replies.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {convs.map((c: any) => (
                <Link key={c.id} href="/dashboard/conversations" className="px-5 py-3.5 flex items-start gap-3 hover:bg-slate-50/70">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                    {(c.customerName || c.customerPhone || "?").toString().slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-semibold text-slate-700 truncate">{c.customerName || c.customerPhone || "Customer"}</span>
                      <span className="text-[11px] text-slate-400 shrink-0">{c.channel || "web"}</span>
                    </div>
                    <p className="text-[12.5px] text-slate-500 truncate mt-0.5">{lastMsg(c) || "…"}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Agent snapshot */}
        <div className="lg:col-span-5 space-y-5">
          <div className="console-card p-5">
            <div className="text-[13.5px] font-semibold text-slate-800 flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-slate-400" /> Agent Snapshot
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-3.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Conversations</div>
                <div className="font-outfit text-[20px] font-bold text-slate-900 mt-0.5">{metrics?.totalConversations ?? "—"}</div>
              </div>
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-3.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Messages</div>
                <div className="font-outfit text-[20px] font-bold text-slate-900 mt-0.5">{metrics?.totalMessages ?? "—"}</div>
              </div>
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-3.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Avg Response</div>
                <div className="font-outfit text-[20px] font-bold text-slate-900 mt-0.5">{metrics ? `${metrics.avgResponseTimeSec || 12}s` : "—"}</div>
              </div>
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-3.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Satisfaction</div>
                <div className="font-outfit text-[20px] font-bold text-slate-900 mt-0.5 flex items-center gap-1">
                  {metrics?.averageRating ? <><Star className="w-3.5 h-3.5 text-amber-400" /> {metrics.averageRating.toFixed(1)}</> : "—"}
                </div>
              </div>
            </div>
          </div>

          <div className="console-card p-5">
            <div className="text-[13.5px] font-semibold text-slate-800 flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-slate-400" /> Getting the most out of your agent
            </div>
            <ul className="space-y-2.5 text-[12.5px] text-slate-600">
              <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Upload price lists &amp; FAQs to Knowledge Base</li>
              <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Connect WhatsApp so customers reach the AI anywhere</li>
              <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Install the website widget for instant chat</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
