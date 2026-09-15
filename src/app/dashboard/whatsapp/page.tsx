"use client";
import React, { useEffect, useState } from "react";
import { MessageCircle, CheckCircle, AlertCircle, ExternalLink, Copy, Check, Send, Zap } from "lucide-react";

export default function WhatsAppPage() {
  const [account, setAccount] = useState<any>(null);
  const [convs, setConvs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [testForm, setTestForm] = useState({ to: "", message: "Hello! This is a test from your Biztriach AI agent 🚀" });
  const [testSending, setTestSending] = useState(false);

  const host = typeof window !== 'undefined' ? window.location.origin : "https://biztriach.vercel.app";
  const webhookUrl = `${host}/api/whatsapp/webhook`;

  const load = async () => {
    setLoading(true);
    try {
      const [aRes, cRes] = await Promise.all([fetch("/api/whatsapp/account"), fetch("/api/whatsapp/messages")]);
      if (aRes.ok) setAccount(await aRes.json());
      if (cRes.ok) setConvs(await cRes.json());
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // ── Embedded Signup (self-serve connection, no copy-pasting) ──
  const [esStatus, setEsStatus] = useState<any>(null);
  const [esBusy, setEsBusy] = useState(false);
  const [esMsg, setEsMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/whatsapp/embedded-signup")
      .then((r) => r.json())
      .then(setEsStatus)
      .catch(() => {});
  }, []);

  const launchEmbeddedSignup = () => {
    const appId = esStatus?.appId;
    const configId = esStatus?.configId;
    if (!appId || !configId) {
      setEsMsg("Embedded Signup isn't fully configured yet — follow the checklist below.");
      return;
    }
    setEsBusy(true);
    setEsMsg(null);
    const doLogin = () => {
      (window as any).FB.login(async (response: any) => {
        if (response?.authResponse?.code) {
          try {
            const res = await fetch("/api/whatsapp/embedded-signup", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ code: response.authResponse.code }),
            });
            const data = await res.json();
            if (res.ok && data.connected) {
              setEsMsg(`✅ Connected ${data.phone || "your number"}! Webhooks subscribed automatically.`);
              load();
            } else {
              setEsMsg("⚠️ " + (data.error || "Signup failed. Please try again."));
            }
          } catch (e: any) {
            setEsMsg("⚠️ " + e.message);
          }
        } else {
          setEsMsg("Signup cancelled.");
        }
        setEsBusy(false);
      }, {
        config_id: configId,
        response_type: "code",
        override_default_response_type: true,
        extras: { setup: {}, featureType: "", sessionInfoVersion: "3" },
      });
    };
    if ((window as any).FB) { doLogin(); return; }
    (window as any).fbAsyncInit = () => doLogin();
    const s = document.createElement("script");
    s.src = "https://connect.facebook.net/en_US/sdk.js";
    s.async = true;
    s.crossOrigin = "anonymous";
    document.body.appendChild(s);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleTestSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestSending(true);
    try {
      const res = await fetch("/api/whatsapp/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(testForm) });
      const data = await res.json();
      if (res.ok) {
        alert(`✅ Test message sent! Message ID: ${data.messageId || "sent"}\n\nCheck WhatsApp on ${testForm.to}`);
      } else {
        alert(`❌ Failed: ${data.error}\n\nDetails: ${JSON.stringify(data.details || {}).slice(0, 300)}`);
      }
    } catch (e) {
      alert("Error: " + (e as Error).message);
    }
    setTestSending(false);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-[1200px]">
      {/* Connection status hero */}
      <div className="console-card overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-white to-slate-50/80">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-sm">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-outfit text-[22px] font-bold tracking-tight text-slate-900">WhatsApp Agent</h1>
                {account?.isConnected
                  ? <span className="pill-green"><CheckCircle className="w-3.5 h-3.5" /> Connected</span>
                  : <span className="pill-amber"><AlertCircle className="w-3.5 h-3.5" /> Not connected</span>}
              </div>
              <p className="text-[13px] text-slate-500 mt-1 max-w-2xl">
                Customers message your number — the AI answers in seconds, in your voice, 24/7.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer" className="btn-white">
              Meta Dashboard <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
        {account?.isConnected && (
          <div className="px-6 py-4 grid md:grid-cols-2 gap-4 bg-slate-50/60">
            <div>
              <div className="text-[10.5px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Webhook URL (auto-configured — for reference)</div>
              <button onClick={() => handleCopy(webhookUrl, "wh")} className="copy-block w-full text-left hover:border-violet-400 transition group">
                <span className="truncate flex-1">{webhookUrl}</span>
                {copied === "wh" ? <Check className="w-4 h-4 text-emerald-600 shrink-0" /> : <Copy className="w-4 h-4 text-slate-400 group-hover:text-violet-600 shrink-0" />}
              </button>
            </div>
            <div>
              <div className="text-[10.5px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Verify Token</div>
              <button onClick={() => handleCopy(account?.verifyToken || "biztriach_verify", "vt")} className="copy-block w-full text-left hover:border-violet-400 transition group">
                <span className="flex-1">{account?.verifyToken || "biztriach_verify"}</span>
                {copied === "vt" ? <Check className="w-4 h-4 text-emerald-600 shrink-0" /> : <Copy className="w-4 h-4 text-slate-400 group-hover:text-violet-600 shrink-0" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Embedded Signup — self-serve connection */}
      <div className="console-card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-outfit text-[16px] font-semibold flex items-center gap-2">
              <Zap className="w-4 h-4 text-violet-600" /> Connect your WhatsApp in 3 clicks
            </h3>
            <p className="text-[12.5px] text-slate-500 mt-1 max-w-xl">
              Log in with Facebook, pick your business, verify your number by SMS — tokens, webhooks and routing are handled automatically. No developer dashboard needed.
            </p>
          </div>
          {esStatus?.configured ? (
            <button onClick={launchEmbeddedSignup} disabled={esBusy} className="btn-primary shrink-0">
              {esBusy ? "Connecting…" : account?.isConnected ? "Connect a different number" : "Connect WhatsApp"}
            </button>
          ) : (
            <span className="pill-amber shrink-0">One-time setup needed</span>
          )}
        </div>
        {esMsg && (
          <div className="mt-3 text-[12.5px] rounded-lg bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-slate-700">{esMsg}</div>
        )}
        {esStatus && !esStatus.configured && (
          <div className="mt-4 rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Finish activation (one-time, in Meta + Vercel)</div>
            <ol className="text-[12.5px] text-slate-600 space-y-1.5 list-decimal pl-5">
              <li>Meta dashboard → your app → add the product <strong>Facebook Login for Business</strong> → create an Embedded Signup config → set its Config ID as the env var <code className="font-mono text-[11px] bg-white border border-slate-200 px-1 rounded">NEXT_PUBLIC_ES_CONFIG_ID</code> on Vercel.</li>
              <li>Set <code className="font-mono text-[11px] bg-white border border-slate-200 px-1 rounded">META_APP_SECRET</code> on Vercel (App Dashboard → Settings → Basic → App secret).</li>
              <li>Add <code className="font-mono text-[11px] bg-white border border-slate-200 px-1 rounded">{esStatus.redirectUri}</code> under Facebook Login → Settings → Valid OAuth Redirect URIs.</li>
              <li>Redeploy on Vercel — this card becomes a one-click connect button for every customer.</li>
            </ol>
            <div className="text-[11.5px] text-slate-400 pt-1 border-t border-slate-200">
              App ID: <span className="font-mono">{esStatus.appId || "—"}</span> · App secret: {esStatus.hasSecret ? "✅ set" : "❌ missing"} · Signup config: {esStatus.configId ? "✅ set" : "❌ missing"}
            </div>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left: Test Send */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-[20px] bg-white border border-slate-200 shadow-soft p-6">
            <h3 className="font-semibold text-[14px] flex items-center gap-2"><Send className="w-4 h-4" /> Test Send (Real WhatsApp Cloud API)</h3>
            <p className="text-[11px] text-slate-500 mt-1">Send a real WhatsApp message to any number (must have opted in, or use your own number for testing)</p>
            <form onSubmit={handleTestSend} className="mt-4 space-y-3">
              <input required placeholder="Recipient phone e.g. 2348012345678 (no +)" value={testForm.to} onChange={e => setTestForm({ ...testForm, to: e.target.value })} className="w-full h-11 px-4 rounded-[12px] border text-[13px] font-mono" />
              <textarea required placeholder="Message" value={testForm.message} onChange={e => setTestForm({ ...testForm, message: e.target.value })} className="w-full h-20 px-4 py-3 rounded-[12px] border text-[13px]" />
              <button disabled={testSending || !account?.isConnected} className="w-full h-11 rounded-full bg-emerald-600 text-white text-[13px] font-semibold disabled:opacity-50 flex items-center justify-center gap-2">{testSending ? "Sending..." : "Send Test WhatsApp"} <Send className="w-4 h-4" /></button>
              {!account?.isConnected && <p className="text-[11px] text-amber-600">Connect WhatsApp account first to enable test send</p>}
            </form>
          </div>
        </div>

        {/* Right: Conversations */}
        <div className="lg:col-span-7 space-y-5">
          <div className="rounded-[20px] bg-white border border-slate-200 shadow-soft p-6">
            <h3 className="font-semibold text-[14px] mb-3">Live Conversations ({convs.length})</h3>
            {loading ? <div className="p-8 text-center text-[13px] text-slate-400">Loading...</div> : convs.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-[16px]">
                <MessageCircle className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                <p className="text-[13px] font-medium">No WhatsApp chats yet</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">Once your number is connected, every customer chat appears here with AI auto-replies. Test it: message your business number from your personal WhatsApp.</p>
              </div>
            ) : (
              <div className="divide-y max-h-[400px] overflow-y-auto">
                {convs.map((c: any) => (
                  <div key={c.id} className="py-3 flex justify-between hover:bg-slate-50 px-2 rounded-[10px]">
                    <div>
                      <div className="font-medium text-[13px] flex items-center gap-2">{c.customerName || c.phoneNumber} <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100">{c.phoneNumber}</span></div>
                      <div className="text-[11px] text-slate-500 mt-1">{c.messages?.[0]?.content?.slice(0, 80) || "No messages"} • {new Date(c.updatedAt).toLocaleString()}</div>
                    </div>
                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold h-fit ${c.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-slate-100"}`}>{c.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
