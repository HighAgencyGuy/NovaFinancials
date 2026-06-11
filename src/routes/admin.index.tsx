import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { NeuCard } from "@/components/neu/NeuCard";
import { NeuButton } from "@/components/neu/NeuButton";
import { NeuInput, NeuTextarea } from "@/components/neu/NeuInput";
import { NGN, timeAgo } from "@/lib/format";
import { useCountUp } from "@/hooks/useCountUp";

export const Route = createFileRoute("/admin/")({
  component: AdminHome,
});

function AdminHome() {
  const allUsers = useStore(s => s.users);
  const users = useMemo(() => allUsers.filter(u => u.role === "user"), [allUsers]);
  const approveUser = useStore(s => s.approveUser);
  const reject = useStore(s => s.rejectUser);
  const suspend = useStore(s => s.suspendUser);
  const reinstate = useStore(s => s.reinstateUser);
  const fund = useStore(s => s.fundAccount);
  const fundLedger = useStore(s => s.fundLedger);
  const approveReq = useStore(s => s.approveRequest);
  const rejectReq = useStore(s => s.rejectRequest);
  const globalPayout = useStore(s => s.globalPayoutDetails);
  const setGlobalPayout = useStore(s => s.setGlobalPayoutDetails);

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
  const [fundTarget, setFundTarget] = useState<"main" | "ledger">("main");

  const [gDirect, setGDirect] = useState(globalPayout.directDeposit ?? "");
  const [gWallet, setGWallet] = useState(globalPayout.cryptoWallet ?? "");
  const [gNet, setGNet] = useState(globalPayout.cryptoNetwork ?? "");

  // Aggregated open requests across all users
  const openRequests = useMemo(() => {
    const out: { user: typeof users[number]; req: typeof users[number]["pendingRequests"][number] }[] = [];
    for (const u of users) {
      for (const r of u.pendingRequests) {
        if (r.status === "awaiting_fee" || r.status === "fee_paid") out.push({ user: u, req: r });
      }
    }
    return out.sort((a, b) => +new Date(b.req.createdAt) - +new Date(a.req.createdAt));
  }, [users]);

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
                <NeuButton size="sm" tone="positive" onClick={() => approveUser(p.id)}>Approve</NeuButton>
                <NeuButton size="sm" tone="negative" onClick={() => reject(p.id)}>Reject</NeuButton>
              </div>
            </NeuCard>
          ))}
        </section>
      )}

{openRequests.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display font-semibold">Open Fee Requests ({openRequests.length})</h2>
          {openRequests.map(({ user, req }) => (
            <NeuCard key={req.id} className="p-4 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px]">
                <p className="font-semibold text-sm">
                  {user.fullName} <span className="text-text-muted font-normal text-[11px]">• {user.accountNumber}</span>
                </p>
                <p className="text-[11px] text-text-muted">
                  {req.kind === "ledger_release" ? `Release ${NGN(req.amount)} (fee ${NGN(req.fee)})` : `${req.tier} card (fee ${NGN(req.fee)})`}
                  {" • "}{timeAgo(req.createdAt)}
                </p>
                {req.note && <p className="text-[10px] text-text-muted italic">"{req.note}"</p>}
              </div>
              <span className={`neu-pressed rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${req.status === "fee_paid" ? "text-positive" : "text-gold"}`}>
                {req.status === "fee_paid" ? "Fee paid" : "Awaiting fee"}
              </span>
              <Link to="/admin/account/$id" params={{ id: user.id }}><NeuButton size="sm">View</NeuButton></Link>
              <NeuButton size="sm" tone="positive" disabled={req.status !== "fee_paid"} onClick={() => approveReq(user.id, req.id)}>Approve</NeuButton>
              <NeuButton size="sm" tone="negative" onClick={() => rejectReq(user.id, req.id)}>Reject</NeuButton>
            </NeuCard>
          ))}
        </section>
      )}

      <NeuCard variant="float" className="p-5 flex flex-col gap-3">
        <h2 className="font-display font-semibold">Fund Account</h2>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_140px_auto] gap-3 items-end">
          <div>
            <p className="label-caps mb-2">Account</p>
            <select value={fundId} onChange={e => setFundId(e.target.value)} className="neu-deep rounded-[14px] h-12 px-4 w-full bg-transparent outline-none">
              <option value="">Select</option>
              {users.filter(u => u.status === "approved").map(u => <option key={u.id} value={u.id}>{u.fullName} • {u.accountNumber}</option>)}
            </select>
          </div>
          <NeuInput label="Amount" prefix="$" mono value={fundAmt} onChange={e => setFundAmt(e.target.value.replace(/[^\d.]/g,""))} />
          <div>
            <p className="label-caps mb-2">Target</p>
            <select value={fundTarget} onChange={e => setFundTarget(e.target.value as "main" | "ledger")} className="neu-deep rounded-[14px] h-12 px-4 w-full bg-transparent outline-none">
              <option value="main">Main (instant)</option>
              <option value="ledger">Ledger (10% fee)</option>
            </select>
          </div>
          <NeuButton tone="accent" disabled={!fundId || !Number(fundAmt)} onClick={() => {
            if (fundTarget === "main") fund(fundId, Number(fundAmt));
            else fundLedger(fundId, Number(fundAmt), "Incoming transfer");
            setFundAmt("");
          }}>Send</NeuButton>
        </div>
      </NeuCard>
      <NeuCard variant="float" className="p-5 flex flex-col gap-3">
        <h2 className="font-display font-semibold">Global Payout Details (Fee Collection)</h2>
        <p className="text-[11px] text-text-muted">Used when a user has no custom payout details set.</p>
        <NeuTextarea label="Direct Deposit" rows={2} value={gDirect} onChange={e => setGDirect(e.target.value)} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <NeuInput label="Crypto Network" value={gNet} onChange={e => setGNet(e.target.value)} />
          <div className="md:col-span-2"><NeuInput label="Crypto Wallet" mono value={gWallet} onChange={e => setGWallet(e.target.value)} /></div>
        </div>
        <NeuButton tone="accent" onClick={() => setGlobalPayout({ directDeposit: gDirect, cryptoWallet: gWallet, cryptoNetwork: gNet })}>
          Save Global Payout Details
        </NeuButton>
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
              <div>
                <p className="font-mono text-sm font-semibold">{NGN(u.balance)}</p>
                {u.ledgerBalance > 0 && <p className="font-mono text-[10px] text-gold">Ledger {NGN(u.ledgerBalance)}</p>}
              </div>
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
