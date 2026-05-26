import { createFileRoute, Link } from "@tanstack/react-router";
import { useCurrentUser } from "@/lib/store";
import { NGN, timeAgo } from "@/lib/format";
import { NeuCard } from "@/components/neu/NeuCard";
import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/app/transactions")({
  component: All,
});

function All() {
  const u = useCurrentUser();
  const [filter, setFilter] = useState<"all" | "credit" | "debit">("all");
  if (!u) return null;
  const items = u.transactions.filter(t => filter === "all" ? true : t.type === filter);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center gap-3">
        <Link to="/app/home" className="neu-raised w-10 h-10 rounded-full grid place-items-center active:[box-shadow:var(--neu-pressed)]"><ChevronLeft size={18} /></Link>
        <h1 className="font-display font-semibold text-lg">All Transactions</h1>
      </header>

      <div className="neu-deep rounded-full p-1.5 flex relative">
        {(["all","credit","debit"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className="relative flex-1 h-9 text-xs font-semibold uppercase tracking-wider">
            {filter === f && <motion.div layoutId="tx-pill" className="absolute inset-0 neu-raised rounded-full" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
            <span className={`relative ${filter === f ? "text-accent" : "text-text-muted"}`}>{f}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {items.length === 0 && <NeuCard className="p-8 text-center text-xs text-text-muted">Nothing here yet.</NeuCard>}
        {items.map(t => (
          <NeuCard key={t.id} className="p-4 flex items-center gap-3">
            <div className="neu-pressed rounded-full w-11 h-11 grid place-items-center text-base">
              {t.type === "credit" ? "↘" : "↗"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{t.description}</p>
              <p className="text-[10px] text-text-muted">{t.counterparty} • {timeAgo(t.timestamp)}</p>
              <p className="text-[9px] text-text-muted font-mono mt-0.5">{t.reference}</p>
            </div>
            <div className="text-right">
              <p className={`font-mono text-sm font-semibold ${t.type === "credit" ? "text-positive" : "text-negative"}`}>
                {t.type === "credit" ? "+" : "-"}{NGN(t.amount)}
              </p>
              <p className="text-[9px] text-text-muted uppercase">{t.status}</p>
            </div>
          </NeuCard>
        ))}
      </div>
    </div>
  );
}
