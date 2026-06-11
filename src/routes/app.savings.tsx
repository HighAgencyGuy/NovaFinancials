import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, ArrowDownLeft, ArrowUpRight, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { NeuCard } from "@/components/neu/NeuCard";
import { NeuButton } from "@/components/neu/NeuButton";
import { NeuInput } from "@/components/neu/NeuInput";
import { BottomSheet } from "@/components/BottomSheet";
import { useCurrentUser, useStore, SAVINGS_APY } from "@/lib/store";
import { NGN, timeAgo } from "@/lib/format";
import { motion } from "framer-motion";
import { useCountUp } from "@/hooks/useCountUp";

export const Route = createFileRoute("/app/savings")({
  component: Savings,
});

function Savings() {
  const u = useCurrentUser();
  const accrue = useStore(s => s.accrueSavingsInterest);
  const deposit = useStore(s => s.depositToSavings);
  const withdraw = useStore(s => s.withdrawFromSavings);
  const [mode, setMode] = useState<null | "deposit" | "withdraw">(null);
  const [amt, setAmt] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!u) return;
    accrue(u.id);
    const t = setInterval(() => accrue(u.id), 30_000);
    return () => clearInterval(t);
  }, [u?.id, accrue]);

  const bal = useCountUp(u?.savingsBalance ?? 0, 600);
  const interestEarned = (u?.savingsTxns ?? []).filter(t => t.description.startsWith("Interest")).reduce((s, t) => s + t.amount, 0);

  if (!u) return null;

  const submit = () => {
    setErr("");
    const n = Number(amt);
    if (!n) return setErr("Enter a valid amount");
    const r = mode === "deposit" ? deposit(u.id, n) : withdraw(u.id, n);
    if (!r.ok) return setErr(r.error || "Failed");
    setAmt(""); setMode(null);
  };

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center gap-3">
        <Link to="/app/home" className="neu-raised w-10 h-10 rounded-full grid place-items-center active:[box-shadow:var(--neu-pressed)]"><ChevronLeft size={18} /></Link>
        <h1 className="font-display font-semibold text-lg">Savings</h1>
      </header>

      <div
        className="rounded-[24px] p-6 flex flex-col gap-4 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #2C1810 0%, #4A2A1A 55%, #2C1810 100%)",
          boxShadow: "var(--neu-float)", color: "#F0EAE0",
        }}
      >
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #C9A66B 0%, transparent 70%)" }} />
        <div className="flex items-start justify-between relative">
          <div>
            <p className="uppercase font-semibold" style={{ color: "#C0A888", fontSize: "9px", letterSpacing: "0.15em" }}>Savings Balance</p>
            <p className="font-mono font-semibold mt-2 tabular-nums" style={{ color: "#F0EAE0", fontSize: "clamp(1.6rem, 8vw, 2.4rem)" }}>{NGN(bal)}</p>
          </div>
          <div className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider"
            style={{ background: "rgba(255,248,240,0.12)", color: "#E8D5B7", boxShadow: "inset 1px 1px 3px rgba(0,0,0,0.4)" }}>
            <Sparkles size={10} className="inline mr-1" />{(SAVINGS_APY * 100).toFixed(2)}% APY
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 relative">
          <div className="rounded-[12px] p-3" style={{ background: "rgba(255,248,240,0.08)", boxShadow: "inset 1px 1px 3px rgba(0,0,0,0.4)" }}>
            <p className="text-[10px]" style={{ color: "#C0A888" }}>Interest Earned</p>
            <p className="font-mono mt-1 font-semibold" style={{ color: "#E8D5B7" }}>{NGN(interestEarned)}</p>
          </div>
          <div className="rounded-[12px] p-3" style={{ background: "rgba(255,248,240,0.08)", boxShadow: "inset 1px 1px 3px rgba(0,0,0,0.4)" }}>
            <p className="text-[10px]" style={{ color: "#C0A888" }}>Main Balance</p>
            <p className="font-mono mt-1 font-semibold" style={{ color: "#E8D5B7" }}>{NGN(u.balance)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <NeuButton size="lg" tone="accent" onClick={() => { setMode("deposit"); setErr(""); }}>
          <ArrowDownLeft size={16} /> Deposit
        </NeuButton>
        <NeuButton size="lg" onClick={() => { setMode("withdraw"); setErr(""); }}>
          <ArrowUpRight size={16} /> Withdraw
        </NeuButton>
      </div>

      <section>
        <p className="label-caps mb-3">Savings History</p>
        <div className="flex flex-col gap-2">
          {u.savingsTxns.length === 0 && (
            <NeuCard className="p-6 text-center text-xs text-text-muted">No savings activity yet.</NeuCard>
          )}
          {u.savingsTxns.slice(0, 30).map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <NeuCard className="p-4 flex items-center gap-3">
                <div className="neu-pressed rounded-full w-10 h-10 grid place-items-center text-base shrink-0">
                  {t.description.startsWith("Interest") ? "✨" : t.type === "credit" ? "↘" : "↗"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{t.description}</p>
                  <p className="text-[10px] text-text-muted">{timeAgo(t.timestamp)} • Bal {NGN(t.balanceAfter)}</p>
                </div>
                <p className={`font-mono text-sm font-semibold ${t.type === "credit" ? "text-positive" : "text-negative"}`}>
                  {t.type === "credit" ? "+" : "-"}{NGN(t.amount)}
                </p>
              </NeuCard>
            </motion.div>
          ))}
        </div>
      </section>

      <BottomSheet open={mode !== null} onClose={() => setMode(null)} title={mode === "deposit" ? "Deposit to Savings" : "Withdraw to Main"}>
        <div className="flex flex-col gap-4">
          <NeuInput label="Amount" prefix="$" mono inputMode="decimal" value={amt}
            onChange={e => { setAmt(e.target.value.replace(/[^\d.]/g, "")); setErr(""); }} />
          <p className="text-[11px] text-text-muted">
            Available: <span className="font-mono">{NGN(mode === "deposit" ? u.balance : u.savingsBalance)}</span>
          </p>
          {err && <p className="text-xs text-negative">{err}</p>}
          <NeuButton size="lg" tone="accent" onClick={submit} disabled={!Number(amt)}>
            Confirm {mode === "deposit" ? "Deposit" : "Withdrawal"}
          </NeuButton>
        </div>
      </BottomSheet>
    </div>
  );
}
