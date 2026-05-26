import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { useMemo, useState } from "react";
import { NeuCard } from "@/components/neu/NeuCard";
import { NeuButton } from "@/components/neu/NeuButton";
import { NeuInput } from "@/components/neu/NeuInput";
import { NGN, timeAgo } from "@/lib/format";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ChevronLeft, Download } from "lucide-react";

export const Route = createFileRoute("/admin/account/$id")({
  component: AcctDetail,
});

function AcctDetail() {
  const { id } = Route.useParams();
  const u = useStore(s => s.users.find(x => x.id === id));
  const fund = useStore(s => s.fundAccount);
  const debit = useStore(s => s.debitAccount);
  const update = useStore(s => s.updateUser);
  const [amt, setAmt] = useState("");
  const [desc, setDesc] = useState("Admin adjustment");
  const [page, setPage] = useState(0);
  const PER = 10;

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

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(u, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `account-${u.accountNumber}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/admin" className="neu-raised w-10 h-10 rounded-full grid place-items-center active:[box-shadow:var(--neu-pressed)]"><ChevronLeft size={18} /></Link>
          <div>
            <h1 className="font-display font-semibold text-lg">{u.fullName}</h1>
            <p className="text-[11px] text-text-muted font-mono">{u.accountNumber} • {u.email}</p>
          </div>
        </div>
        <NeuButton size="sm" onClick={exportJson}><Download size={14} /> Export JSON</NeuButton>
      </header>

      <NeuCard variant="float" radius="xl" className="p-5">
        <p className="label-caps">Balance</p>
        <p className="font-mono text-3xl font-semibold mt-2">{NGN(u.balance)}</p>
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
        <NeuInput label="Amount" prefix="₦" mono value={amt} onChange={e => setAmt(e.target.value.replace(/[^\d.]/g,""))} />
        <NeuInput label="Description" value={desc} onChange={e => setDesc(e.target.value)} />
        <NeuButton tone="positive" disabled={!Number(amt)} onClick={() => { fund(u.id, Number(amt)); setAmt(""); }}>Credit</NeuButton>
        <NeuButton tone="negative" disabled={!Number(amt) || Number(amt) > u.balance} onClick={() => { debit(u.id, Number(amt), desc); setAmt(""); }}>Debit</NeuButton>
        <div className="md:col-span-4 flex gap-3">
          <NeuButton size="sm" onClick={() => update(u.id, { pinHash: "00000" })}>Reset PIN to 0000</NeuButton>
        </div>
      </NeuCard>

      <section>
        <h2 className="font-display font-semibold mb-3">Transactions</h2>
        <div className="flex flex-col gap-2">
          {slice.map(t => (
            <NeuCard key={t.id} className="p-3 flex items-center justify-between gap-3 text-xs">
              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate">{t.description}</p>
                <p className="text-text-muted">{timeAgo(t.timestamp)} • {t.reference} • {t.counterparty}</p>
              </div>
              <p className={`font-mono font-semibold ${t.type === "credit" ? "text-positive" : "text-negative"}`}>{t.type === "credit" ? "+" : "-"}{NGN(t.amount)}</p>
            </NeuCard>
          ))}
          {txns.length === 0 && <NeuCard className="p-6 text-center text-xs text-text-muted">No transactions yet.</NeuCard>}
        </div>
        {pages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {Array.from({ length: pages }, (_, i) => (
              <NeuButton key={i} size="sm" active={i === page} tone={i === page ? "accent" : "default"} onClick={() => setPage(i)}>{i + 1}</NeuButton>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
