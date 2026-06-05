import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCurrentUser, useStore, type Transaction } from "@/lib/store";
import { NGN, greeting, maskAccount, timeAgo } from "@/lib/format";
import { useCountUp } from "@/hooks/useCountUp";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bell, Eye, EyeOff, Copy, ArrowUpRight, Globe, Banknote, TrendingUp, CreditCard, FileText, Wallet, PiggyBank, Briefcase } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { moneyTips } from "@/constants/tips";
import { NeuCard } from "@/components/neu/NeuCard";
import { TransferSheet } from "@/components/sheets/TransferSheet";
import { TransactionDetailSheet } from "@/components/sheets/TransactionDetailSheet";

export const Route = createFileRoute("/app/home")({
  component: Home,
});

function Home() {
  const u = useCurrentUser();
  const unread = useStore(s => (s.notifications[u?.id ?? ""] ?? []).filter(n => !n.read).length);
  const balanceAnim = useCountUp(u?.balance ?? 0);
  const [reveal, setReveal] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [sheet, setSheet] = useState<null | "local" | "wire">(null);
  const [detailTxn, setDetailTxn] = useState<Transaction | null>(null);
  const nav = useNavigate();

  const firstName = u?.fullName.split(" ")[0] ?? "";
  const tip = moneyTips[new Date().getDate() % moneyTips.length];

  const spendByCat = useMemo(() => {
    const map = new Map<string, number>();
    (u?.transactions ?? []).filter(t => t.type === "debit" && t.status === "completed")
      .forEach(t => map.set(t.category, (map.get(t.category) ?? 0) + t.amount));
    return Array.from(map, ([name, value]) => ({ name, value }));
  }, [u]);
  const colors = ["#6c63ff", "#4ecdc4", "#f6ad55", "#fc8181", "#48bb78", "#a78bfa"];

  if (!u) return null;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-text-muted text-xs">{greeting()},</p>
          <h1 className="font-display font-semibold text-xl truncate">{firstName}</h1>
        </div>
        <Link to="/app/notifications" aria-label="Notifications" className="relative shrink-0 ml-3">
          <div className="neu-raised rounded-full w-11 h-11 grid place-items-center active:[box-shadow:var(--neu-pressed)]">
            <Bell size={18} className="text-text-mid" />
          </div>
          {unread > 0 && <span className="absolute -top-1 -right-1 neu-float rounded-full w-5 h-5 grid place-items-center text-[10px] text-negative font-semibold" style={{background:"var(--bg)"}}>{unread}</span>}
        </Link>
      </header>

      <div
        className="rounded-[24px] p-5 sm:p-6 flex flex-col gap-5 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #2C1810 0%, #4A2A1A 55%, #2C1810 100%)",
          boxShadow: "var(--neu-float)",
          color: "#F0EAE0",
        }}
      >
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #C9A66B 0%, transparent 70%)" }} />
        <div className="flex items-start justify-between gap-3 relative">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="uppercase font-semibold" style={{ color: "#C0A888", fontSize: "9px", letterSpacing: "0.15em" }}>Available Balance</p>
              <button
                aria-label={balanceVisible ? "Hide balance" : "Show balance"}
                onClick={() => setBalanceVisible(v => !v)}
                className="rounded-full w-7 h-7 grid place-items-center"
                style={{ background: "rgba(255,248,240,0.08)", color: "#A08060", boxShadow: "inset 1px 1px 3px rgba(0,0,0,0.5), 1px 1px 2px rgba(255,255,255,0.04)" }}
              >
                {balanceVisible ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
            </div>
            <p
              className="font-mono font-semibold mt-2 tabular-nums break-all"
              style={{ color: "#F0EAE0", fontSize: "clamp(1.1rem, 5vw, 1.65rem)", lineHeight: 1.1 }}
              aria-live="polite"
            >
              {balanceVisible ? NGN(balanceAnim) : "••••••••"}
            </p>
            {balanceVisible && (
              <p className="text-[10px] mt-1.5" style={{ color: "#A08060" }}>
                Ledger: <span className="font-mono">{NGN(u.balance)}</span>
              </p>
            )}
          </div>
          <div
            className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider shrink-0"
            style={{ background: "rgba(255,248,240,0.12)", color: "#E8D5B7", boxShadow: "inset 1px 1px 3px rgba(0,0,0,0.4), inset -1px -1px 2px rgba(255,255,255,0.05)" }}
          >
            {u.accountType}
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 text-xs relative">
          <span className="font-mono tracking-widest truncate" style={{ color: "#C0A888" }}>
            {reveal ? u.accountNumber : maskAccount(u.accountNumber)}
          </span>
          <div className="flex gap-2 shrink-0">
            <button aria-label="Toggle reveal" onClick={() => setReveal(r => !r)}
              className="rounded-full w-9 h-9 grid place-items-center"
              style={{ background: "rgba(255,248,240,0.08)", color: "#E8D5B7", boxShadow: "inset 1px 1px 3px rgba(0,0,0,0.5), 1px 1px 2px rgba(255,255,255,0.04)" }}>
              {reveal ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <button aria-label="Copy" onClick={() => navigator.clipboard?.writeText(u.accountNumber)}
              className="rounded-full w-9 h-9 grid place-items-center"
              style={{ background: "rgba(255,248,240,0.08)", color: "#E8D5B7", boxShadow: "inset 1px 1px 3px rgba(0,0,0,0.5), 1px 1px 2px rgba(255,255,255,0.04)" }}>
              <Copy size={14} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 sm:gap-3 pt-2 relative">
          {[
            { icon: ArrowUpRight, label: "Send", on: () => setSheet("local") },
            { icon: Globe, label: "Wire", on: () => setSheet("wire") },
            { icon: Banknote, label: "Save", on: () => nav({ to: "/app/deposit" }) },
            { icon: TrendingUp, label: "Invest", on: () => nav({ to: "/app/investments" }) },
          ].map((a, i) => (
            <motion.button key={a.label}
              initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:0.05*i}}
              whileTap={{ scale: 0.96 }} onClick={a.on}
              className="rounded-[14px] py-3 flex flex-col items-center gap-1.5"
              style={{ background: "rgba(255,248,240,0.08)", color: "#A08060", boxShadow: "inset 1px 1px 3px rgba(0,0,0,0.45), 2px 2px 5px rgba(0,0,0,0.3)" }}>
              <a.icon size={18} style={{ color: "#A08060" }} />
              <span className="text-[10px] font-semibold" style={{ color: "#A08060" }}>{a.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <section>
        <p className="label-caps mb-3">Services</p>
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {[
            { icon: Globe, label: "Wire", to: undefined as string | undefined, on: () => setSheet("wire") },
            { icon: ArrowUpRight, label: "Local", to: undefined, on: () => setSheet("local") },
            { icon: Banknote, label: "Savings", to: "/app/deposit" },
            { icon: FileText, label: "Statement", to: "/app/statements" },
            { icon: Wallet, label: "History", to: "/app/transactions" },
            { icon: CreditCard, label: "Card", to: "/app/card" },
            { icon: PiggyBank, label: "Loans", to: "/app/loans" },
            { icon: Briefcase, label: "Invest", to: "/app/investments" },
          ].map((s, i) => {
            const Inner = (
              <motion.div
                initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:0.04*i}}
                whileTap={{ scale: 0.97 }}
                className="neu-raised rounded-[18px] py-3 sm:py-4 flex flex-col items-center gap-1.5 sm:gap-2 active:[box-shadow:var(--neu-pressed)] cursor-pointer">
                <div className="neu-pressed rounded-full w-9 h-9 sm:w-10 sm:h-10 grid place-items-center">
                  <s.icon size={14} className="text-accent" />
                </div>
                <span className="text-[9px] sm:text-[10px] text-text-muted font-semibold text-center leading-tight">{s.label}</span>
              </motion.div>
            );
            return s.to ? <Link key={s.label} to={s.to as never}>{Inner}</Link> : <button key={s.label} onClick={s.on} className="text-left">{Inner}</button>;
          })}
        </div>
      </section>

      <section>
        <p className="label-caps mb-3">Snapshot</p>
        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5">
          <NeuCard className="p-4 min-w-[180px] flex flex-col gap-2">
            <p className="text-[10px] text-text-muted uppercase">Monthly Spend</p>
            <div className="h-24">
              {spendByCat.length === 0 ? (
                <div className="h-full grid place-items-center text-[10px] text-text-muted">No data</div>
              ) : (
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={spendByCat} dataKey="value" innerRadius={28} outerRadius={42} stroke="none">
                      {spendByCat.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </NeuCard>
          <NeuCard className="p-4 min-w-[200px] flex flex-col gap-3">
            <p className="text-[10px] text-text-muted uppercase">Savings Goal</p>
            <p className="font-mono text-sm">{NGN(u.balance)} <span className="text-text-muted">/ {NGN(500000)}</span></p>
            <div className="neu-deep rounded-full h-3 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${Math.min(100, (u.balance/500000)*100)}%`, background: "var(--accent)" }} />
            </div>
          </NeuCard>
          <NeuCard className="p-4 min-w-[180px] flex flex-col gap-2">
            <p className="text-[10px] text-text-muted uppercase">Next Payment</p>
            <p className="font-mono text-lg">—</p>
            <p className="text-[10px] text-text-muted">No upcoming loans</p>
          </NeuCard>
        </div>
      </section>

      <NeuCard className="p-5 flex gap-4 items-start">
        <div className="neu-pressed rounded-full w-10 h-10 grid place-items-center text-lg shrink-0">💡</div>
        <p className="text-xs text-text-mid leading-relaxed">{tip}</p>
      </NeuCard>

      <section>
        <div className="flex items-center justify-between mb-3">
          <p className="label-caps">Recent Transactions</p>
          <Link to="/app/transactions"><div className="neu-raised rounded-full px-3 py-1 text-[10px] font-semibold text-accent active:[box-shadow:var(--neu-pressed)]">View All</div></Link>
        </div>
        <div className="flex flex-col gap-3">
          {u.transactions.length === 0 && (
            <NeuCard className="p-8 text-center text-xs text-text-muted">
              No transactions yet. Make your first transfer to begin.
            </NeuCard>
          )}
          {u.transactions.slice(0, 5).map((t, i) => (
            <motion.button key={t.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
              onClick={() => setDetailTxn(t)} className="text-left w-full">
              <NeuCard className="p-4 flex items-center gap-3 active:[box-shadow:var(--neu-pressed)]">
                <div className="neu-pressed rounded-full w-11 h-11 grid place-items-center text-base shrink-0">
                  {t.category === "transfer" ? "↗" : t.category === "wire" ? "🌐" : t.category === "deposit" ? "↘" : t.category === "investment" ? "📈" : t.category === "loan" ? "🏦" : "•"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{t.description}</p>
                  <p className="text-[10px] text-text-muted truncate">{timeAgo(t.timestamp)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`font-mono text-sm font-semibold ${t.type === "credit" ? "text-positive" : "text-negative"}`}>
                    {t.type === "credit" ? "+" : "-"}{NGN(t.amount)}
                  </p>
                  <p className="text-[9px] text-text-muted uppercase">{t.status}</p>
                </div>
              </NeuCard>
            </motion.button>
          ))}
        </div>
      </section>

      <TransferSheet open={sheet !== null} kind={sheet ?? "local"} onClose={() => setSheet(null)} />
      <TransactionDetailSheet txn={detailTxn} onClose={() => setDetailTxn(null)} />
    </div>
  );
}
