"use client";

import React, { useEffect, useState } from "react";
import { Package, Plus, AlertTriangle, TrendingUp, Search, Edit3, Trash2, Boxes } from "lucide-react";

export default function InventoryPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", sku: "", sellingPrice: "", costPrice: "", quantity: "", categoryId: "" });

  const load = async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([fetch(`/api/inventory?search=${search}`), fetch("/api/inventory/categories")]);
      if (pRes.ok) setProducts(await pRes.json());
      if (cRes.ok) setCategories(await cRes.json());
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { const d = setTimeout(load, 400); return () => clearTimeout(d); }, [search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/inventory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) {
      setShowAdd(false);
      setForm({ name: "", sku: "", sellingPrice: "", costPrice: "", quantity: "", categoryId: "" });
      load();
    }
  };

  const inventoryValue = products.reduce((s, p) => s + (p.quantity * (p.costPrice || 0)), 0);
  const lowStock = products.filter(p => p.quantity <= p.lowStockThreshold);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-outfit text-[26px] font-bold">Inventory Management</h1>
          <p className="text-[13px] text-slate-500 mt-1">Track products, auto-updates via WhatsApp: “Sold 5 bags rice for ₦85k” → inventory reduces automatically.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-[#0a0a16] text-white text-[13px] font-medium hover:bg-black"><Plus className="w-4 h-4" /> Add Product</button>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="rounded-[18px] bg-white border border-slate-200 p-5"><div className="text-[11px] uppercase tracking-widest font-bold text-slate-400">Total Products</div><div className="font-outfit text-[24px] font-bold mt-1">{products.length}</div><div className="mt-2 flex items-center gap-1 text-[11px] text-violet-600"><Boxes className="w-3 h-3" /> {categories.length} categories</div></div>
        <div className="rounded-[18px] bg-white border border-slate-200 p-5"><div className="text-[11px] uppercase tracking-widest font-bold text-slate-400">Inventory Value (cost)</div><div className="font-outfit text-[24px] font-bold mt-1">₦{inventoryValue.toLocaleString()}</div><div className="mt-2 text-[11px] text-slate-500">Based on cost price × quantity</div></div>
        <div className="rounded-[18px] bg-amber-50 border border-amber-200 p-5"><div className="text-[11px] uppercase tracking-widest font-bold text-amber-700">Low Stock</div><div className="font-outfit text-[24px] font-bold mt-1 text-amber-900">{lowStock.length} items</div><div className="mt-2 flex items-center gap-1 text-[11px] text-amber-700"><AlertTriangle className="w-3 h-3" /> Needs restock</div></div>
        <div className="rounded-[18px] bg-gradient-to-br from-violet-600 to-indigo-600 p-5 text-white"><div className="text-[11px] uppercase tracking-widest font-bold text-white/60">WhatsApp Ops</div><div className="font-outfit text-[18px] font-bold mt-1">Auto-updates live</div><div className="mt-2 text-[11px] text-white/70">“Bought 100 bags rice” → stock +100</div></div>
      </div>

      <div className="rounded-[20px] bg-white border border-slate-200 shadow-soft overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <div className="flex-1 relative"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products, SKU..." className="w-full h-10 pl-10 pr-4 rounded-full bg-slate-50 border border-slate-200 text-[13px] focus:outline-none focus:border-violet-300" /></div>
        </div>

        {loading ? <div className="p-12 text-center text-[13px] text-slate-400">Loading inventory...</div> :
          products.length === 0 ? (
            <div className="p-16 text-center">
              <Package className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="font-medium">No products yet</p>
              <p className="text-[13px] text-slate-400 mt-1 max-w-sm mx-auto">Add products manually or send WhatsApp: “Bought 50 bags of rice at ₦70k each” and Biztriach will create it automatically.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-widest font-bold text-slate-400">
                  <tr><th className="text-left p-4">Product</th><th className="text-left p-4">SKU</th><th className="text-left p-4">Category</th><th className="text-right p-4">Qty</th><th className="text-right p-4">Selling</th><th className="text-right p-4">Cost</th><th className="text-right p-4">Value</th><th className="p-4">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="p-4"><div className="font-semibold">{p.name}</div><div className="text-[11px] text-slate-500">{p.quantity <= p.lowStockThreshold && <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded-full text-[10px] font-bold"><AlertTriangle className="w-3 h-3" /> Low</span>}</div></td>
                      <td className="p-4 text-slate-500 font-mono text-[12px]">{p.sku}</td>
                      <td className="p-4"><span className="px-2 py-1 rounded-full bg-slate-100 border text-[11px]">{p.category?.name || "General"}</span></td>
                      <td className="p-4 text-right font-bold">{p.quantity}</td>
                      <td className="p-4 text-right">₦{p.sellingPrice?.toLocaleString()}</td>
                      <td className="p-4 text-right text-slate-500">₦{p.costPrice?.toLocaleString()}</td>
                      <td className="p-4 text-right font-medium">₦{(p.quantity * p.sellingPrice).toLocaleString()}</td>
                      <td className="p-4"><div className="flex gap-1 justify-end"><button className="w-7 h-7 rounded-full bg-white border hover:bg-slate-50 flex items-center justify-center"><Edit3 className="w-3.5 h-3.5" /></button><button onClick={async () => { if (confirm("Delete?")) { await fetch(`/api/inventory?id=${p.id}`, { method: "DELETE" }); load(); } }} className="w-7 h-7 rounded-full bg-white border hover:bg-red-50 text-red-500 flex items-center justify-center"><Trash2 className="w-3.5 h-3.5" /></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur flex items-center justify-center p-4">
          <form onSubmit={handleCreate} className="bg-white rounded-[20px] p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="font-outfit font-bold text-[18px]">Add Product</h3>
            <input required placeholder="Product name e.g. Rice - 50kg" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full h-11 px-4 rounded-[12px] border border-slate-200 text-[13px]" />
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Cost price" type="number" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} className="h-11 px-4 rounded-[12px] border text-[13px]" />
              <input required placeholder="Selling price" type="number" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} className="h-11 px-4 rounded-[12px] border text-[13px]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Quantity" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="h-11 px-4 rounded-[12px] border text-[13px]" />
              <input placeholder="SKU (optional)" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="h-11 px-4 rounded-[12px] border text-[13px]" />
            </div>
            <div className="flex gap-3 pt-2"><button type="button" onClick={() => setShowAdd(false)} className="flex-1 h-11 rounded-full border text-[13px] font-medium">Cancel</button><button type="submit" className="flex-1 h-11 rounded-full bg-[#0a0a16] text-white text-[13px] font-semibold">Create Product</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
