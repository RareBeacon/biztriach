"use client";
import React,{useEffect,useState} from "react";
import { Shield, Users, CheckCircle, XCircle, Ban, Crown, BarChart3 } from "lucide-react";

export default function AdminPage(){
  const [data,setData]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [filter,setFilter]=useState("ALL");

  const load=async()=>{
    setLoading(true);
    try{ const r=await fetch("/api/admin/users"); if(r.ok) setData(await r.json()); else { const d=await r.json(); alert(d.error || "Admin only"); } }catch{} setLoading(false);
  };
  useEffect(()=>{load();},[]);

  const act=async(userId:string, action:string)=>{
    if(!confirm(`Are you sure to ${action} this user?`)) return;
    const res=await fetch("/api/admin/users",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId, action})});
    if(res.ok) load();
  };

  const filtered = data?.users?.filter((u:any)=> filter==="ALL" || u.status===filter) || [];

  return(
    <div className="space-y-6">
      <div className="flex justify-between items-center"><div><h1 className="font-outfit text-[26px] font-bold flex items-center gap-3"><Shield className="w-7 h-7 text-violet-600"/> Admin Dashboard</h1><p className="text-[13px] text-slate-500">Secure admin for platform owner: ogungboyeopeyemiphilip@gmail.com, phoslabceo@gmail.com. Manage users, approvals, billing.</p></div><span className="px-3 py-1 rounded-full bg-violet-600 text-white text-[11px] font-bold tracking-widest">OWNER ONLY</span></div>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="rounded-[18px] bg-white border p-5"><div className="text-[11px] uppercase tracking-widest font-bold text-slate-400">Total Users</div><div className="font-outfit text-[24px] font-bold mt-1">{data?.stats.total || 0}</div></div>
        <div className="rounded-[18px] bg-amber-50 border border-amber-200 p-5"><div className="text-[11px] uppercase tracking-widest font-bold text-amber-700">Pending Approval</div><div className="font-outfit text-[24px] font-bold mt-1 text-amber-900">{data?.stats.pending || 0}</div><div className="text-[11px] text-amber-700 mt-1">Need payment verification</div></div>
        <div className="rounded-[18px] bg-emerald-50 border border-emerald-200 p-5"><div className="text-[11px] uppercase tracking-widest font-bold text-emerald-700">Approved</div><div className="font-outfit text-[24px] font-bold mt-1 text-emerald-900">{data?.stats.approved || 0}</div></div>
        <div className="rounded-[18px] bg-red-50 border border-red-200 p-5"><div className="text-[11px] uppercase tracking-widest font-bold text-red-700">Suspended</div><div className="font-outfit text-[24px] font-bold mt-1 text-red-900">{data?.stats.suspended || 0}</div></div>
      </div>

      <div className="rounded-[20px] bg-white border shadow-soft overflow-hidden">
        <div className="p-5 border-b flex justify-between items-center"><h3 className="font-semibold text-[14px] flex items-center gap-2"><Users className="w-4 h-4"/> All Users - Manual Billing Flow</h3><div className="flex gap-2">{["ALL","PENDING","APPROVED","SUSPENDED","REJECTED"].map(f=><button key={f} onClick={()=>setFilter(f)} className={`h-7 px-3 rounded-full text-[11px] font-medium border ${filter===f?"bg-[#0a0a16] text-white":"bg-white hover:bg-slate-50"}`}>{f}</button>)}</div></div>

        {loading? <div className="p-12 text-center text-[13px] text-slate-400">Loading users...</div> :
        <div className="overflow-x-auto"><table className="w-full text-[13px]"><thead className="bg-slate-50 text-[11px] uppercase tracking-widest text-slate-400"><tr><th className="text-left p-4">User</th><th className="text-left p-4">Org</th><th className="text-left p-4">Status</th><th className="text-left p-4">Role</th><th className="text-left p-4">Joined</th><th className="text-left p-4">Actions</th></tr></thead><tbody className="divide-y">{filtered.map((u:any)=><tr key={u.id} className="hover:bg-slate-50"><td className="p-4"><div className="font-medium">{u.name}</div><div className="text-[11px] text-slate-500">{u.email}</div></td><td className="p-4">{u.organization?.name || "—"}</td><td className="p-4"><span className={`px-2 py-1 rounded-full text-[11px] font-bold border ${u.status==="PENDING"?"bg-amber-100 text-amber-800 border-amber-200":u.status==="APPROVED"?"bg-emerald-100 text-emerald-800 border-emerald-200":u.status==="SUSPENDED"?"bg-red-100 text-red-800 border-red-200":"bg-slate-100"}`}>{u.status}</span></td><td className="p-4"><span className={`px-2 py-1 rounded-full text-[11px] font-bold ${u.role==="ADMIN"?"bg-violet-100 text-violet-700":"bg-slate-100"}`}>{u.role}</span></td><td className="p-4 text-[11px] text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td><td className="p-4"><div className="flex flex-wrap gap-1">{u.status==="PENDING" && <><button onClick={()=>act(u.id,"APPROVE")} className="h-7 px-2.5 rounded-full bg-emerald-600 text-white text-[11px] font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Approve</button><button onClick={()=>act(u.id,"REJECT")} className="h-7 px-2.5 rounded-full bg-white border text-[11px] flex items-center gap-1"><XCircle className="w-3 h-3"/> Reject</button></>}{u.status==="APPROVED" && <button onClick={()=>act(u.id,"SUSPEND")} className="h-7 px-2.5 rounded-full bg-white border text-amber-600 text-[11px] flex items-center gap-1"><Ban className="w-3 h-3"/> Suspend</button>}{u.status==="SUSPENDED" && <button onClick={()=>act(u.id,"REACTIVATE")} className="h-7 px-2.5 rounded-full bg-emerald-600 text-white text-[11px]">Reactivate</button>}<button onClick={()=>act(u.id,"MAKE_ADMIN")} className="h-7 px-2 rounded-full bg-white border text-[11px]"><Crown className="w-3 h-3 inline"/> Admin</button></div></td></tr>)}</tbody></table></div>}
      </div>

      <div className="rounded-[20px] bg-[#0a0a16] text-white p-6"><h3 className="font-semibold">Manual Billing MVP Flow</h3><ol className="mt-3 space-y-2 text-[13px] text-white/70 list-decimal pl-5"><li>User signs up → status PENDING, sees payment instructions, receives pending email</li><li>User makes manual payment (bank transfer, etc), notifies admin</li><li>Admin verifies payment → clicks Approve → user gets approval email + full access</li><li>Future: integrate Paystack / Flutterwave auto billing without changing architecture</li></ol><div className="mt-4 p-3 rounded-[12px] bg-white/[0.06] border border-white/[0.08] text-[11px]"><strong>Admin Gmail:</strong> ogungboyeopeyemiphilip@gmail.com • SMTP configured • Manual verification required for first 50-100 customers • Scalable design</div></div>
    </div>
  );
}
