import Link from "next/link";
import React from "react";

export function LegalShell({
  title,
  updated = "September 14, 2026",
  children,
}: {
  title: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Biztriach" className="w-9 h-9 rounded-xl border border-slate-200 object-cover shadow-sm" />
            <span className="font-outfit font-bold text-[17px] tracking-tight">Biztriach</span>
          </Link>
          <Link href="/login" className="btn-primary">Sign in</Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-5 py-12">
        <div className="text-[11px] font-bold uppercase tracking-widest text-violet-600 mb-2">Legal</div>
        <h1 className="font-outfit text-[32px] font-bold tracking-tight">{title}</h1>
        <p className="text-[13px] text-slate-400 mt-1.5 mb-8">Last updated: {updated}</p>
        <div className="console-card p-7 md:p-9 space-y-8 text-[14.5px] text-slate-600 leading-relaxed [&_h2]:text-[17px] [&_h2]:font-semibold [&_h2]:text-slate-900 [&_h2]:mt-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_a]:text-violet-600 [&_a]:underline [&_strong]:text-slate-800">
          {children}
        </div>
        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-slate-400">
          <Link href="/privacy" className="hover:text-slate-600">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-slate-600">Terms of Service</Link>
          <Link href="/data-deletion" className="hover:text-slate-600">Data Deletion</Link>
          <Link href="/" className="hover:text-slate-600">← Back to home</Link>
        </div>
      </main>
    </div>
  );
}
