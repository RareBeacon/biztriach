"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Bot, KeyRound, Mail, ArrowRight, ShieldAlert, CheckCircle } from "lucide-react";
import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import { getFirebaseAuth, isFirebaseClientConfigured } from "@/lib/firebase-client";

function friendlyFirebaseError(err: any): string {
  const code = err?.code || "";
  switch (code) {
    case "auth/invalid-email":
      return "That email address doesn't look right.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    default:
      return err?.message || "Authentication failed";
  }
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Read URL params if redirected from dashboard or registered
  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setSuccess("Account created successfully! Please sign in below.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    if (!isFirebaseClientConfigured()) {
      setError("Authentication is not configured. Set the Firebase environment variables.");
      setIsLoading(false);
      return;
    }

    try {
      // 1. Firebase credential sign-in (browser <-> Firebase directly)
      const auth = getFirebaseAuth();
      const cred = await signInWithEmailAndPassword(auth, email, password);

      // 2. Complete login server-side: approval workflow + session user payload.
      //    The fetch patch attaches the ID token automatically.
      const response = await fetch("/api/auth/login", { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        // Not approved / no profile — end the Firebase session before showing why.
        await signOut(auth).catch(() => {});
        throw new Error(data.error || "Authentication failed");
      }

      setSuccess("Sign-in successful! Redirecting you...");

      // Delay slightly for smooth transition
      setTimeout(() => {
        const from = searchParams.get("from") || "/dashboard/overview";
        router.push(from);
        router.refresh();
      }, 800);
    } catch (err: any) {
      setError(friendlyFirebaseError(err));
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError(null);
    setSuccess(null);
    if (!email) {
      setError("Enter your email address above first, then tap Forgot password.");
      return;
    }
    try {
      const auth = getFirebaseAuth();
      await sendPasswordResetEmail(auth, email);
      setSuccess("Password reset email sent! Check your inbox (and spam folder).");
    } catch (err: any) {
      setError(friendlyFirebaseError(err));
    }
  };

  return (
    <div className="w-full max-w-md bg-white border border-slate-200 shadow-xl rounded-2xl p-8">
      {/* Logo Header */}
      <div className="text-center mb-8 flex flex-col items-center">
        <Link href="/" className="flex items-center gap-2 mb-4">
          <span className="bg-violet-600 rounded-lg p-1.5 flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5 text-white" />
          </span>
          <span className="font-outfit font-extrabold text-lg tracking-tight text-slate-800">
            SupportIQ <span className="text-blue-600 font-bold">AI</span>
          </span>
        </Link>
        <h2 className="text-xl font-bold font-outfit text-slate-800">Sign in to your account</h2>
        <p className="text-xs text-slate-500 mt-1">Manage your customer support automation</p>
      </div>

      {/* Banners */}
      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex gap-2.5 items-start">
          <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex gap-2.5 items-start">
          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1.5">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-violet-600 focus:bg-white transition"
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">Password</label>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-[11px] text-blue-600 font-semibold hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-violet-600 focus:bg-white transition"
              disabled={isLoading}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl text-sm transition flex items-center justify-center gap-1.5 mt-6 shadow"
        >
          {isLoading ? "Signing In..." : "Sign In"}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Footer Links */}
      <div className="mt-8 text-center border-t border-slate-100 pt-6 text-xs text-slate-500">
        New to SupportIQ?{" "}
        <Link href="/register" className="text-blue-600 font-semibold hover:underline">
          Create an account
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#f6f7f8] lg:grid lg:grid-cols-2 flex items-center justify-center py-12 px-6">
      {/* Brand panel (desktop) */}
      <div className="hidden lg:flex flex-col justify-between bg-[#0b0d13] p-12 h-screen sticky top-0">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <span className="text-white font-outfit font-black text-[16px] leading-none">B</span>
          </div>
          <span className="font-outfit font-bold text-white text-[17px]">Biztriach</span>
        </Link>
        <div>
          <h2 className="font-outfit text-[34px] font-bold text-white leading-tight tracking-tight">
            One AI employee.<br />Your entire business.
          </h2>
          <p className="text-slate-400 text-[14.5px] mt-4 max-w-md leading-relaxed">
            WhatsApp agents that talk like you, live chat on your website, sales &amp; inventory that update themselves — all from one console.
          </p>
          <div className="flex items-center gap-6 mt-8">
            <div><div className="text-[22px] font-bold text-white">24/7</div><div className="text-[11.5px] text-slate-500">AI availability</div></div>
            <div className="w-px h-8 bg-white/10" />
            <div><div className="text-[22px] font-bold text-white">&lt; 5s</div><div className="text-[11.5px] text-slate-500">Reply time</div></div>
            <div className="w-px h-8 bg-white/10" />
            <div><div className="text-[22px] font-bold text-white">∞</div><div className="text-[11.5px] text-slate-500">Patience</div></div>
          </div>
        </div>
        <div className="text-[12px] text-slate-600">© {new Date().getFullYear()} Biztriach — Built for ambitious businesses.</div>
      </div>

      {/* Form side */}
      <div className="w-full flex items-center justify-center">
        <Suspense fallback={
          <div className="w-full max-w-md bg-white border border-slate-200 shadow-xl rounded-2xl p-8 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-500 font-medium">Loading session parameters...</p>
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
