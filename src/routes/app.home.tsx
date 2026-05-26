import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCurrentUser, useStore } from "@/lib/store";
import { NGN, greeting, maskAccount, timeAgo } from "@/lib/format";
import { useCountUp } from "@/hooks/useCountUp";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bell, Eye, EyeOff, Copy, ArrowUpRight, Globe, Banknote, TrendingUp, CreditCard, FileText, Wallet, PiggyBank, Briefcase } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { moneyTips } from "@/constants/tips";
import { NeuCard } from "@/components/neu/NeuCard";
import { TransferSheet } from "@/components/sheets/TransferSheet";

export const Route = createFileRoute("/app/home")({
  component: Home,
});

function Home() {
  const u = useCurrentUser();
  const unread = useStore(s => (s.notifications[u?.id ?? ""] ?? []).filter(n => !n.read).length);
  const balanceAnim = useCountUp(u?.balance ?? 0);
  const [reveal, setReveal] = useState(false);
  const [sheet, setSheet] = useState<null | "local" | "wire">(null);
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
        <div>
          <p className="text-text-muted text-xs">{greeting()},</p>
          <h1 className="font-display font-semibold text-xl">{firstName}</h1>
        </div>
        <Link to="/app/notifications" aria-label="Notifications" className="relative">
          <div className="neu-raised rounded-full w-11 h-11 grid place-items-center active:[box-shadow:var(--neu-pressed)]">
            <Bell size={18} className="text-text-mid" />
          </div>
          {unread > 0 && <span className="absolute -top-1 -right-1 neu-float rounded-full w-5 h-5 grid place-items-center text-[10px] text-negative font-semibold" style={{background:"var(--bg)"}}>{unread}</span>}
        </Link>
      </header>

      <NeuCard variant="float" radius="xl" className="p-6 flex flex-col gap-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="label-caps">Available Balance</p>
            <p className="font-mono text-4xl font-semibold mt-2" aria-live="polite">{NGN(balanceAnim)}</p>
          </div>
          <div className="neu-pressed rounded-full px-3 py-1 text-[10px] font-semibold text-accent uppercase tracking-wider">{u.accountType}</div>
        </div>
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-mono text-text-muted tracking-widest">{reveal ? u.accountNumber : maskAccount(u.accountNumber)}</span>
          <div className="flex gap-2">
            <button aria-label="Toggle reveal" onClick={() => setReveal(r => !r)} className="neu-raised rounded-full w-9 h-9 grid place-items-center active:[box-shadow:var(--neu-pressed)]">
              {reveal ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <button aria-label="Copy" onClick={() => navigator.clipboard?.writeText(u.accountNumber)} className="neu-raised rounded-full w-9 h-9 grid place-items-center active:[box-shadow:var(--neu-pressed)]">
              <Copy size={14} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3 pt-2">
          {[
            { icon: ArrowUpRight, label: "Send", on: () => setSheet("local") },
            { icon: Globe, label: "Wire", on: () => setSheet("wire") },
            { icon: Banknote, label: "Deposit", on: () => nav({ to: "/app/deposit" }) },
            { icon: TrendingUp, label: "Invest", on: () => nav({ to: "/app/investments" }) },
          ].map((a, i) => (
            <motion.button key={a.label}
              initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:0.05*i}}
              whileTap={{ scale: 0.97 }} onClick={a.on}
              className="neu-raised rounded-[14px] py-3 flex flex-col items-center gap-1.5 active:[box-shadow:var(--neu-pressed)]">
              <a.icon size={18} className="text-accent" />
              <span className="text-[10px] font-semibold">{a.label}</span>
            </motion.button>
          ))}
        </div>
      </NeuCard>

      <section>
        <p className="label-caps mb-3">Services</p>
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: Globe, label: "Wire", to: undefined as string | undefined, on: () => setSheet("wire") },
            { icon: ArrowUpRight, label: "Local", to: undefined, on: () => setSheet("local") },
            { icon: Banknote, label: "Deposit", to: "/app/deposit" },
            { icon: FileText, label: "Savings", to: "/app/statements" },
            { icon: Wallet, label: "Checking", to: "/app/statements" },
            { icon: CreditCard, label: "Card", to: "/app/card" },
            { icon: PiggyBank, label: "Loans", to: "/app/loans" },
            { icon: Briefcase, label: "Invest", to: "/app/investments" },
          ].map((s, i) => {
            const Inner = (
              <motion.div
                initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:0.04*i}}
                whileTap={{ scale: 0.97 }}
                className="neu-raised rounded-[18px] py-4 flex flex-col items-center gap-2 active:[box-shadow:var(--neu-pressed)] cursor-pointer">
                <div className="neu-pressed rounded-full w-10 h-10 grid place-items-center">
                  <s.icon size={16} className="text-accent" />
                </div>
                <span className="text-[10px] text-text-muted font-semibold">{s.label}</span>
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
            <motion.div key={t.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}>
              <NeuCard className="p-4 flex items-center gap-3">
                <div className="neu-pressed rounded-full w-11 h-11 grid place-items-center text-base">
                  {t.category === "transfer" ? "↗" : t.category === "wire" ? "🌐" : t.category === "deposit" ? "↘" : t.category === "investment" ? "📈" : t.category === "loan" ? "🏦" : "•"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{t.description}</p>
                  <p className="text-[10px] text-text-muted">{timeAgo(t.timestamp)}</p>
                </div>
                <div className="text-right">
                  <p className={`font-mono text-sm font-semibold ${t.type === "credit" ? "text-positive" : "text-negative"}`}>
                    {t.type === "credit" ? "+" : "-"}{NGN(t.amount)}
                  </p>
                  <p className="text-[9px] text-text-muted uppercase">{t.status}</p>
                </div>
              </NeuCard>
            </motion.div>
          ))}
        </div>
      </section>

      <TransferSheet open={sheet !== null} kind={sheet ?? "local"} onClose={() => setSheet(null)} />
    </div>
  );
}
