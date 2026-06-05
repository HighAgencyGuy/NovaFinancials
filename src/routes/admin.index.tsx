import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { NeuCard } from "@/components/neu/NeuCard";
import { NeuButton } from "@/components/neu/NeuButton";
import { NeuInput } from "@/components/neu/NeuInput";
import { NGN } from "@/lib/format";
import { useCountUp } from "@/hooks/useCountUp";

export const Route = createFileRoute("/admin/")({
  component: AdminHome,
});

function AdminHome() {
  const allUsers = useStore(s => s.users);
  const users = useMemo(() => allUsers.filter(u => u.role === "user"), [allUsers]);
  const approve = useStore(s => s.approveUser);
  const reject = useStore(s => s.rejectUser);
  const suspend = useStore(s => s.suspendUser);
  const reinstate = useStore(s => s.reinstateUser);
  const fund = useStore(s => s.fundAccount);

  const pending = useMemo(() => users.filter(u => u.status === "pending"), [users]);
  const total = users.length;
  const sysBalance = useMemo(() => users.reduce((s, u) => s + u.balance, 0), [users]);
  const a1 = useCountUp(total, 700), a2 = useCountUp(pending.length, 700), a3 = useCountUp(sysBalance, 900);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{ k: "fullName" | "balance" | "createdAt"; dir: 1 | -1 }>({ k: "createdAt", dir: -1 });
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users
      .filter(u => !q || u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.accountNumber.includes(q))
      .sort((a, b) => {
        const av = a[sort.k] as string | number, bv = b[sort.k] as string | number;
        return av > bv ? sort.dir : av < bv ? -sort.dir : 0;
      });
  }, [users, search, sort]);

  const [fundId, setFundId] = useState("");
  const [fundAmt, setFundAmt] = useState("");

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { l: "Total Accounts", v: Math.round(a1).toString() },
          { l: "Pending Approval", v: Math.round(a2).toString() },
          { l: "System Balance", v: NGN(a3) },
        ].map(s => (
          <NeuCard key={s.l} variant="float" radius="xl" className="p-5">
            <p className="label-caps">{s.l}</p>
            <p className="font-mono text-lg sm:text-xl md:text-2xl font-semibold mt-2 break-all">{s.v}</p>
          </NeuCard>
        ))}
      </div>

      {pending.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display font-semibold">Pending Approvals</h2>
          {pending.map(p => (
            <NeuCard key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="neu-pressed rounded-full w-11 h-11 grid place-items-center text-accent font-semibold shrink-0">{p.fullName.split(" ").map(s => s[0]).slice(0,2).join("")}</div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{p.fullName}</p>
                  <p className="text-[11px] text-text-muted truncate">{p.email} • {p.accountType}</p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <NeuButton size="sm" tone="positive" onClick={() => approve(p.id)}>Approve</NeuButton>
                <NeuButton size="sm" tone="negative" onClick={() => reject(p.id)}>Reject</NeuButton>
              </div>
            </NeuCard>
          ))}
        </section>
      )}

      <NeuCard variant="float" className="p-5 flex flex-col gap-3">
        <h2 className="font-display font-semibold">Fund Account</h2>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px_auto] gap-3 items-end">
          <div>
            <p className="label-caps mb-2">Account</p>
            <select value={fundId} onChange={e => setFundId(e.target.value)} className="neu-deep rounded-[14px] h-12 px-4 w-full bg-transparent outline-none">
              <option value="">Select</option>
              {users.filter(u => u.status === "approved").map(u => <option key={u.id} value={u.id}>{u.fullName} • {u.accountNumber}</option>)}
            </select>
          </div>
          <NeuInput label="Amount" prefix="$" mono value={fundAmt} onChange={e => setFundAmt(e.target.value.replace(/[^\d.]/g,""))} />
          <NeuButton tone="accent" className="w-full sm:w-auto" disabled={!fundId || !Number(fundAmt)} onClick={() => { fund(fundId, Number(fundAmt)); setFundAmt(""); }}>Fund</NeuButton>
        </div>
      </NeuCard>

      <section className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="font-display font-semibold shrink-0">Accounts</h2>
          <div className="w-full sm:w-64"><NeuInput placeholder="Search name, email, account" value={search} onChange={e => setSearch(e.target.value)} /></div>
        </div>
        <div className="hidden md:grid grid-cols-[1.5fr_1fr_1fr_120px_auto] gap-3 px-4 label-caps">
          {(["fullName","email","balance","status"] as const).map(k => (
            <button key={k} onClick={() => setSort(s => ({ k: (k === "email" ? "fullName" : k) as typeof sort.k, dir: s.dir === 1 ? -1 : 1 }))} className="text-left">
              {k} {sort.k === k && (sort.dir === 1 ? "↑" : "↓")}
            </button>
          ))}
          <span>Actions</span>
        </div>
        <div className="flex flex-col gap-2">
          {filtered.map(u => (
            <NeuCard key={u.id} className="p-4 grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_120px_auto] gap-3 items-center">
              <div>
                <p className="font-semibold text-sm">{u.fullName}</p>
                <p className="font-mono text-[10px] text-text-muted">{u.accountNumber}</p>
              </div>
              <p className="text-xs text-text-muted">{u.email}</p>
              <p className="font-mono text-sm font-semibold">{NGN(u.balance)}</p>
              <span className={`neu-pressed rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider justify-self-start ${
                u.status === "approved" ? "text-positive" :
                u.status === "pending" ? "text-gold" :
                u.status === "suspended" ? "text-negative" : "text-text-muted"
              }`}>{u.status}</span>
              <div className="flex flex-wrap gap-2">
                <Link to="/admin/account/$id" params={{ id: u.id }}><NeuButton size="sm">View</NeuButton></Link>
                {u.status === "approved"
                  ? <NeuButton size="sm" tone="negative" onClick={() => suspend(u.id)}>Suspend</NeuButton>
                  : u.status === "suspended"
                    ? <NeuButton size="sm" tone="positive" onClick={() => reinstate(u.id)}>Reinstate</NeuButton>
                    : null}
              </div>
            </NeuCard>
          ))}
          {filtered.length === 0 && <NeuCard className="p-8 text-center text-xs text-text-muted">No accounts found.</NeuCard>}
        </div>
      </section>
    </div>
  );
}
