import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Download } from "lucide-react";
import { useCurrentUser } from "@/lib/store";
import { NeuCard } from "@/components/neu/NeuCard";
import { NeuButton } from "@/components/neu/NeuButton";
import { NGN, timeAgo } from "@/lib/format";

export const Route = createFileRoute("/app/statements")({
  component: Statements,
});

function Statements() {
  const u = useCurrentUser();
  if (!u) return null;
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(u.transactions, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `statement-${u.accountNumber}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/app/home" className="neu-raised w-10 h-10 rounded-full grid place-items-center active:[box-shadow:var(--neu-pressed)]"><ChevronLeft size={18} /></Link>
          <h1 className="font-display font-semibold text-lg">Statement</h1>
        </div>
        <NeuButton size="sm" onClick={exportJson}><Download size={14} /> Export</NeuButton>
      </header>

      <NeuCard variant="float" className="p-5">
        <p className="label-caps">Balance</p>
        <p className="font-mono text-2xl font-semibold mt-1">{NGN(u.balance)}</p>
        <p className="text-[10px] text-text-muted mt-2">{u.transactions.length} transactions</p>
      </NeuCard>

      <div className="flex flex-col gap-2">
        {u.transactions.map(t => (
          <NeuCard key={t.id} className="p-3 flex items-center justify-between gap-3 text-xs">
            <div className="min-w-0 flex-1">
              <p className="font-semibold truncate">{t.description}</p>
              <p className="text-text-muted">{timeAgo(t.timestamp)} • {t.reference}</p>
            </div>
            <p className={`font-mono font-semibold ${t.type === "credit" ? "text-positive" : "text-negative"}`}>{t.type === "credit" ? "+" : "-"}{NGN(t.amount)}</p>
          </NeuCard>
        ))}
      </div>
    </div>
  );
}
