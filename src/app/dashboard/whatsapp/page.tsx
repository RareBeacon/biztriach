"use client";
import React, { useEffect, useState } from "react";
import { MessageCircle, Smartphone, Settings, CheckCircle, AlertCircle, Bot, Package, ExternalLink, Copy, Check, Send, Zap, BookOpen, Shield } from "lucide-react";

export default function WhatsAppPage() {
  const [account, setAccount] = useState<any>(null);
  const [convs, setConvs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [testForm, setTestForm] = useState({ to: "", message: "Hello! This is a test from Biztriach AI Business Platform 🚀" });
  const [testSending, setTestSending] = useState(false);
  const [form, setForm] = useState({
    phoneNumberId: "",
    businessAccountId: "",
    accessToken: "",
    verifyToken: "biztriach_verify",
    autoReply: true,
    businessParsing: true
  });
  const [showToken, setShowToken] = useState(false);

  const host = typeof window !== 'undefined' ? window.location.origin : "https://supportai-sigma.vercel.app";
  const webhookUrl = `${host}/api/whatsapp/webhook`;

  const load = async () => {
    setLoading(true);
    try {
      const [aRes, cRes] = await Promise.all([fetch("/api/whatsapp/account"), fetch("/api/whatsapp/messages")]);
      if (aRes.ok) {
        const d = await aRes.json();
        setAccount(d);
        if (d) {
          setForm((f: any) => ({
            ...f,
            phoneNumberId: d.phoneNumberId || "",
            businessAccountId: d.businessAccountId || "",
            verifyToken: d.verifyToken || "biztriach_verify",
            autoReply: d.autoReply ?? true,
            businessParsing: d.businessParsing ?? true
          }));
        }
      }
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
      setEsMsg("Embedded Signup isn't fully configured yet — follow the checklist below, or use manual connect.");
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/whatsapp/account", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) {
      alert("✅ WhatsApp account connected! Now set webhook in Meta dashboard.");
      load();
    } else {
      const err = await res.json();
      alert("Failed: " + (err.error || "Unknown"));
    }
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
      {/* Connection status hero — Twilio console style */}
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
                Customers message your number — the AI answers in seconds, in your voice. Owners log business ops by chat: <span className="font-mono text-[11.5px] bg-slate-100 px-1.5 py-0.5 rounded">Sold 3 bags rice for 50000</span>
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
              <div className="text-[10.5px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Webhook URL — paste in Meta → WhatsApp → Configuration</div>
              <button onClick={() => handleCopy(webhookUrl, "wh")} className="copy-block w-full text-left hover:border-violet-400 transition group">
                <span className="truncate flex-1">{webhookUrl}</span>
                {copied === "wh" ? <Check className="w-4 h-4 text-emerald-600 shrink-0" /> : <Copy className="w-4 h-4 text-slate-400 group-hover:text-violet-600 shrink-0" />}
              </button>
            </div>
            <div>
              <div className="text-[10.5px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Verify Token</div>
              <button onClick={() => handleCopy(form.verifyToken || "biztriach_verify", "vt")} className="copy-block w-full text-left hover:border-violet-400 transition group">
                <span className="flex-1">{form.verifyToken || "biztriach_verify"}</span>
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
        {/* Left: Connection Form */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-[20px] bg-white border border-slate-200 shadow-soft p-6">
            <h3 className="font-outfit font-semibold text-[16px] flex items-center gap-2"><Settings className="w-4 h-4" /> Connect Your WhatsApp Business Number</h3>
            <p className="text-[11px] text-slate-500 mt-1">Get credentials from <a href="https://developers.facebook.com" target="_blank" className="text-violet-600 underline flex items-center gap-1 inline-flex">developers.facebook.com <ExternalLink className="w-3 h-3" /></a> → My Apps → Create App → Business → WhatsApp → API Setup</p>

            <form onSubmit={handleSave} className="mt-5 space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Phone Number ID *</label>
                <input required placeholder="e.g. 123456789012345" value={form.phoneNumberId} onChange={e => setForm({ ...form, phoneNumberId: e.target.value })} className="mt-1 w-full h-11 px-4 rounded-[12px] border border-slate-200 text-[13px] font-mono focus:border-violet-300 focus:outline-none" />
                <p className="text-[10px] text-slate-400 mt-1">From WhatsApp → API Setup → Phone Number ID</p>
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">WhatsApp Business Account ID</label>
                <input placeholder="e.g. 123456789012345" value={form.businessAccountId} onChange={e => setForm({ ...form, businessAccountId: e.target.value })} className="mt-1 w-full h-11 px-4 rounded-[12px] border border-slate-200 text-[13px] font-mono focus:border-violet-300 focus:outline-none" />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Permanent Access Token *</label>
                <div className="relative mt-1">
                  <input required type={showToken ? "text" : "password"} placeholder="EAAxxxxxxxx..." value={form.accessToken} onChange={e => setForm({ ...form, accessToken: e.target.value })} className="w-full h-11 px-4 pr-12 rounded-[12px] border border-slate-200 text-[13px] font-mono focus:border-violet-300 focus:outline-none" />
                  <button type="button" onClick={() => setShowToken(!showToken)} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[11px]">{showToken ? "🙈" : "👁️"}</button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">System User Token or Temporary (24h) for testing. Use permanent for production.</p>
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Verify Token</label>
                <input value={form.verifyToken} onChange={e => setForm({ ...form, verifyToken: e.target.value })} className="mt-1 w-full h-11 px-4 rounded-[12px] border border-slate-200 text-[13px] font-mono focus:border-violet-300 focus:outline-none" />
                <p className="text-[10px] text-slate-400 mt-1">Use <code className="bg-slate-100 px-1 rounded">biztriach_verify</code> in Meta dashboard webhook verify field</p>
              </div>

              <div className="rounded-[12px] bg-slate-50 border border-slate-200 p-3 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Webhook Configuration (Set in Meta Dashboard)</div>
                <div className="space-y-2">
                  <div>
                    <div className="text-[11px] text-slate-500">Callback URL (Copy this)</div>
                    <div className="mt-1 flex gap-2">
                      <code className="flex-1 text-[11px] bg-white border px-3 py-2 rounded-[10px] overflow-x-auto font-mono">{webhookUrl}</code>
                      <button type="button" onClick={() => handleCopy(webhookUrl, "url")} className="w-9 h-9 rounded-[10px] bg-violet-600 text-white flex items-center justify-center hover:bg-violet-700">{copied === "url" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</button>
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">Verify Token (Copy this)</div>
                    <div className="mt-1 flex gap-2">
                      <code className="flex-1 text-[11px] bg-white border px-3 py-2 rounded-[10px] font-mono">{form.verifyToken}</code>
                      <button type="button" onClick={() => handleCopy(form.verifyToken, "token")} className="w-9 h-9 rounded-[10px] bg-white border flex items-center justify-center hover:bg-slate-50">{copied === "token" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</button>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500">Subscribe to: <strong>messages</strong></div>
                </div>
              </div>

              <div className="flex gap-3 py-2">
                <label className="flex items-center gap-2 text-[12px] bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-full"><input type="checkbox" checked={form.autoReply} onChange={e => setForm({ ...form, autoReply: e.target.checked })} className="rounded" /> Auto AI Reply</label>
                <label className="flex items-center gap-2 text-[12px] bg-violet-50 border border-violet-200 px-3 py-2 rounded-full"><input type="checkbox" checked={form.businessParsing} onChange={e => setForm({ ...form, businessParsing: e.target.checked })} className="rounded" /> Business Ops Parsing</label>
              </div>

              <button type="submit" className="w-full h-11 rounded-full bg-violet-600 text-white text-[13px] font-semibold hover:bg-violet-700 flex items-center justify-center gap-2">
                {account?.isConnected ? "Update Connection" : "Connect WhatsApp Number"} <CheckCircle className="w-4 h-4" />
              </button>

              {account?.isConnected && (
                <div className="flex items-center gap-2 text-[12px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-[12px]">
                  <CheckCircle className="w-4 h-4" /> Connected! Webhook verified. Any customer number can now message this business number and get AI reply.
                </div>
              )}
            </form>
          </div>

          {/* Test Send */}
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

        {/* Right: Guide + Business Ops + Conversations */}
        <div className="lg:col-span-7 space-y-5">
          {/* Step by step guide */}
          <div className="rounded-[20px] bg-violet-600 text-white p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-violet-600/20 blur-[60px] rounded-full" />
            <div className="relative">
              <h3 className="font-outfit font-bold text-[16px] flex items-center gap-2"><BookOpen className="w-5 h-5 text-violet-400" /> Real WhatsApp Cloud API Setup — 5 Minute Guide (Any Business Number)</h3>
              <div className="mt-5 space-y-4">
                {[
                  { step: 1, title: "Create Meta App", desc: "Go to developers.facebook.com → My Apps → Create App → Business → Next → App Name: Biztriach → Create", link: "https://developers.facebook.com/" },
                  { step: 2, title: "Add WhatsApp Product", desc: "In App Dashboard → Add Product → WhatsApp → Set Up → You'll get Phone Number ID, Business Account ID, and temporary access token", link: null },
                  { step: 3, title: "Configure Webhook", desc: `Go to WhatsApp → Configuration → Webhook → Edit → Paste Callback URL: ${webhookUrl} and Verify Token: ${form.verifyToken} → Verify and Save → Subscribe to messages`, link: null },
                  { step: 4, title: "Get Permanent Token (Production)", desc: "Business Settings → Users → System Users → Create → Assign WhatsApp assets → Generate Token with whatsapp_business_messaging permission → Copy", link: "https://business.facebook.com/settings/system-users" },
                  { step: 5, title: "Connect in Biztriach", desc: "Paste Phone Number ID, Business Account ID, Access Token, Verify Token in left form → Save → Test by sending WhatsApp message to your business number from any customer phone → AI replies!", link: null },
                ].map((s) => (
                  <div key={s.step} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center font-bold text-[12px] shrink-0">{s.step}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-[13px] flex items-center gap-2">{s.title} {s.link && <a href={s.link} target="_blank" className="text-violet-300 hover:text-white"><ExternalLink className="w-3 h-3" /></a>}</div>
                      <div className="text-[12px] text-white/60 mt-1 leading-relaxed">{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-3 rounded-[12px] bg-white/[0.06] border border-white/[0.08] text-[11px] text-white/70">
                <Shield className="w-4 h-4 inline mr-1 text-emerald-400" /> <strong>Multi-tenant:</strong> Each organization in Biztriach connects its own WhatsApp number via this same form. Data isolated by organizationId. Webhook verification accepts ANY valid token from ANY connected account, plus global fallback <code className="bg-white/10 px-1 rounded">biztriach_verify</code>. So any business number can connect, any customer number can message.
              </div>
            </div>
          </div>

          {/* Business Ops Flow */}
          <div className="rounded-[20px] bg-white border border-slate-200 shadow-soft p-6">
            <h3 className="font-semibold text-[14px] flex items-center gap-2"><Package className="w-4 h-4 text-violet-600" /> Business Operations — How AI Acts Well</h3>
            <div className="mt-4 grid gap-2">
              {[
                { input: "Sold 5 bags rice for ₦85,000 each. Customer: John", output: "✅ Sale: 5×Rice @₦85k = ₦425k | Inventory -5 (42 left) | Profit ₦75k | Customer John tagged | Report updated", type: "SALE" },
                { input: "Paid rent ₦150,000", output: "✅ Expense: Rent ₦150k logged | Profit updated | P&L report", type: "EXPENSE" },
                { input: "Bought 100 bags rice at ₦70k each", output: "✅ Purchase: 100×Rice | Stock +100 (142) | Expense ₦7M | Value updated", type: "PURCHASE" },
                { input: "Received payment from John ₦50k", output: "✅ Payment: John ₦50k | Customer history +₦50k | Revenue tracked", type: "PAYMENT" },
              ].map((ex, i) => (
                <div key={i} className="rounded-[14px] bg-slate-50 border border-slate-100 p-3">
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-600 text-white font-bold">{ex.type}</span>
                    <div className="flex-1">
                      <div className="text-[12px] font-medium">You: {ex.input}</div>
                      <div className="text-[11px] text-emerald-700 mt-1 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-[8px]">AI: {ex.output}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-[11px] text-slate-500">Parser supports: ₦85,000, 85k, 85000, 85 thousand, N85k, NGN 85000, pidgin English, quantity: bags, pcs, cartons, units. Auto category detection for expenses: rent, fuel, transport, salary, electricity, purchases.</div>
          </div>

          {/* Conversations */}
          <div className="rounded-[20px] bg-white border border-slate-200 shadow-soft p-6">
            <h3 className="font-semibold text-[14px] mb-3">Live Conversations — Any Customer Number ({convs.length})</h3>
            {loading ? <div className="p-8 text-center text-[13px] text-slate-400">Loading...</div> : convs.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-[16px]">
                <MessageCircle className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                <p className="text-[13px] font-medium">No WhatsApp chats yet</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">Once you connect a business number and a customer (any phone number) messages it, conversation appears here with AI auto-reply and business ops parsing. Test by messaging your business number from your personal WhatsApp.</p>
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
