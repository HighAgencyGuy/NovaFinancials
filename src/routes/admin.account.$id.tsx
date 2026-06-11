import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { useMemo, useState } from "react";
import { NeuCard } from "@/components/neu/NeuCard";
import { NeuButton } from "@/components/neu/NeuButton";
import { NeuInput, NeuTextarea } from "@/components/neu/NeuInput";
import { NGN, timeAgo } from "@/lib/format";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ChevronLeft, Download, Pencil } from "lucide-react";
import { EditTransactionSheet } from "@/components/sheets/EditTransactionSheet";
import type { Transaction } from "@/lib/store";

export const Route = createFileRoute("/admin/account/$id")({
  component: AcctDetail,
});

function AcctDetail() {
  const { id } = Route.useParams();
  const u = useStore(s => s.users.find(x => x.id === id));
  const fund = useStore(s => s.fundAccount);
  const debit = useStore(s => s.debitAccount);
  const fundLedger = useStore(s => s.fundLedger);
  const update = useStore(s => s.updateUser);
  const setPayout = useStore(s => s.setUserPayoutDetails);
  const approve = useStore(s => s.approveRequest);
  const reject = useStore(s => s.rejectRequest);
  const [amt, setAmt] = useState("");
  const [desc, setDesc] = useState("Admin adjustment");
  const [ledgerAmt, setLedgerAmt] = useState("");
  const [ledgerNote, setLedgerNote] = useState("Incoming wire transfer");
  const [page, setPage] = useState(0);
  const [editTxn, setEditTxn] = useState<Transaction | null>(null);
  const PER = 10;

  const [pDirect, setPDirect] = useState(u?.payoutDetails?.directDeposit ?? "");
  const [pWallet, setPWallet] = useState(u?.payoutDetails?.cryptoWallet ?? "");
  const [pNetwork, setPNetwork] = useState(u?.payoutDetails?.cryptoNetwork ?? "");

  const series = useMemo(() => {
    if (!u) return [];
    const reversed = [...u.transactions].reverse();
    let bal = 0;
    return reversed.map((t, i) => {
      bal = t.balanceAfter ?? bal + (t.type === "credit" ? t.amount : -t.amount);
      return { i, balance: bal, label: new Date(t.timestamp).toLocaleDateString() };
    });
  }, [u]);

  if (!u) return <p className="p-8 text-center text-text-muted">Account not found.</p>;

  const txns = u.transactions;
  const pages = Math.max(1, Math.ceil(txns.length / PER));
  const slice = txns.slice(page * PER, page * PER + PER);
  const openReqs = u.pendingRequests.filter(r => r.status !== "approved" && r.status !== "rejected");

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(u, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `account-${u.accountNumber}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/admin" className="neu-raised w-10 h-10 rounded-full grid place-items-center shrink-0 active:[box-shadow:var(--neu-pressed)]"><ChevronLeft size={18} /></Link>
          <div className="min-w-0">
            <h1 className="font-display font-semibold text-lg truncate">{u.fullName}</h1>
            <p className="text-[11px] text-text-muted font-mono truncate">{u.accountNumber} • {u.email}</p>
          </div>
        </div>
        <NeuButton size="sm" className="shrink-0 self-start sm:self-auto" onClick={exportJson}><Download size={14} /> Export JSON</NeuButton>
      </header>

      <NeuCard variant="float" radius="xl" className="p-5">
      <div className="grid grid-cols-3 gap-3">
          <div className="neu-pressed rounded-[14px] p-3">
            <p className="label-caps">Main</p>
            <p className="font-mono text-base font-semibold mt-1">{NGN(u.balance)}</p>
          </div>
          <div className="neu-pressed rounded-[14px] p-3">
            <p className="label-caps">Ledger</p>
            <p className="font-mono text-base font-semibold mt-1 text-gold">{NGN(u.ledgerBalance)}</p>
          </div>
          <div className="neu-pressed rounded-[14px] p-3">
            <p className="label-caps">Savings</p>
            <p className="font-mono text-base font-semibold mt-1 text-positive">{NGN(u.savingsBalance)}</p>
          </div>
        </div>
        <div className="neu-pressed rounded-[14px] mt-4 h-44 p-3">
          {series.length > 1 ? (
            <ResponsiveContainer>
              <LineChart data={series}>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#8a9bb0" }} />
                <YAxis tick={{ fontSize: 10, fill: "#8a9bb0" }} width={60} />
                <Tooltip contentStyle={{ background: "var(--bg)", border: "none", borderRadius: 12, boxShadow: "var(--neu-raised)", fontSize: 12 }} />
                <Line type="monotone" dataKey="balance" stroke="var(--accent)" strokeWidth={2} dot={{ r: 3, fill: "var(--bg)", stroke: "var(--accent)", strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <div className="h-full grid place-items-center text-xs text-text-muted">Not enough history</div>}
        </div>
      </NeuCard>

      <NeuCard className="p-5 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <NeuInput label="Amount" prefix="$" mono value={amt} onChange={e => setAmt(e.target.value.replace(/[^\d.]/g,""))} />
        <NeuInput label="Description" value={desc} onChange={e => setDesc(e.target.value)} />
        <NeuButton tone="positive" disabled={!Number(amt)} onClick={() => { fund(u.id, Number(amt)); setAmt(""); }}>Credit Main</NeuButton>
        <NeuButton tone="negative" disabled={!Number(amt) || Number(amt) > u.balance} onClick={() => { debit(u.id, Number(amt), desc); setAmt(""); }}>Debit Main</NeuButton>
        <div className="md:col-span-4 flex gap-3">
          <NeuButton size="sm" onClick={() => update(u.id, { pinHash: "00000" })}>Reset PIN to 0000</NeuButton>
          </div>
      </NeuCard>

      <NeuCard className="p-5 flex flex-col gap-3">
        <h3 className="font-display font-semibold">Send to Ledger (10% fee gated)</h3>
        <p className="text-[11px] text-text-muted">Funds will sit in user's ledger balance until they pay the 10% fee and you approve release to main.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <NeuInput label="Incoming Amount" prefix="$" mono value={ledgerAmt} onChange={e => setLedgerAmt(e.target.value.replace(/[^\d.]/g,""))} />
          <NeuInput label="Note (e.g. sender)" value={ledgerNote} onChange={e => setLedgerNote(e.target.value)} />
          <NeuButton tone="accent" disabled={!Number(ledgerAmt)} onClick={() => { fundLedger(u.id, Number(ledgerAmt), ledgerNote); setLedgerAmt(""); }}>
            Send to Ledger
          </NeuButton>
        </div>
      </NeuCard>

      {openReqs.length > 0 && (
        <NeuCard className="p-5 flex flex-col gap-3">
          <h3 className="font-display font-semibold">Pending Requests</h3>
          {openReqs.map(r => (
            <div key={r.id} className="neu-pressed rounded-[14px] p-3 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[180px]">
                <p className="text-sm font-semibold">
                  {r.kind === "ledger_release" ? `Release ${NGN(r.amount)}` : `${r.tier} virtual card`}
                </p>
                <p className="text-[10px] text-text-muted">
                  Fee {NGN(r.fee)} • {r.status.replace("_", " ")} • {timeAgo(r.createdAt)}
                </p>
                {r.note && <p className="text-[10px] text-text-muted italic">"{r.note}"</p>}
              </div>
              <NeuButton size="sm" tone="positive" disabled={r.status !== "fee_paid"} onClick={() => approve(u.id, r.id)}>Approve</NeuButton>
              <NeuButton size="sm" tone="negative" onClick={() => reject(u.id, r.id)}>Reject</NeuButton>
            </div>
          ))}
        </NeuCard>
      )}

      <NeuCard className="p-5 flex flex-col gap-3">
        <h3 className="font-display font-semibold">Per-User Payout Details</h3>
        <p className="text-[11px] text-text-muted">Overrides global details when this user pays processing fees.</p>
        <NeuTextarea label="Direct Deposit" rows={2} value={pDirect} onChange={e => setPDirect(e.target.value)} placeholder="Bank • Routing • Account" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <NeuInput label="Crypto Network" value={pNetwork} onChange={e => setPNetwork(e.target.value)} placeholder="Bitcoin (BTC)" />
          <div className="md:col-span-2"><NeuInput label="Crypto Wallet" mono value={pWallet} onChange={e => setPWallet(e.target.value)} /></div>
        </div>
        <div className="flex gap-3">
          <NeuButton tone="accent" onClick={() => setPayout(u.id, { directDeposit: pDirect, cryptoWallet: pWallet, cryptoNetwork: pNetwork })}>
            Save Payout Details
          </NeuButton>
          <NeuButton onClick={() => { setPDirect(""); setPWallet(""); setPNetwork(""); setPayout(u.id, {}); }}>Clear</NeuButton>
        </div>
      </NeuCard>

      <section>
        <h2 className="font-display font-semibold mb-3">Transactions</h2>
        <div className="flex flex-col gap-2">
          {slice.map(t => (
            <NeuCard key={t.id} className="p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 text-xs">
              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate">{t.description}</p>
                <p className="text-text-muted truncate">{new Date(t.timestamp).toLocaleString()} • {t.reference} • {t.counterparty}</p>
              </div>
              <p className={`font-mono font-semibold shrink-0 ${t.type === "credit" ? "text-positive" : "text-negative"}`}>{t.type === "credit" ? "+" : "-"}{NGN(t.amount)}</p>
              <NeuButton size="sm" onClick={() => setEditTxn(t)}><Pencil size={12} /> Edit</NeuButton>
            </NeuCard>
          ))}
          {txns.length === 0 && <NeuCard className="p-6 text-center text-xs text-text-muted">No transactions yet.</NeuCard>}
        </div>
        {pages > 1 && (
          <div className="flex justify-center gap-2 mt-4 flex-wrap">
            {Array.from({ length: pages }, (_, i) => (
              <NeuButton key={i} size="sm" active={i === page} tone={i === page ? "accent" : "default"} onClick={() => setPage(i)}>{i + 1}</NeuButton>
            ))}
          </div>
        )}
      </section>
      <EditTransactionSheet userId={u.id} txn={editTxn} onClose={() => setEditTxn(null)} />
    </div>
  );
}
