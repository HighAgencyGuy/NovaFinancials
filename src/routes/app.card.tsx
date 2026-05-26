import { createFileRoute, Link } from "@tanstack/react-router";
import { useCurrentUser, useStore } from "@/lib/store";
import { NeuCard } from "@/components/neu/NeuCard";
import { NeuButton } from "@/components/neu/NeuButton";
import { NGN, maskAccount } from "@/lib/format";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Snowflake } from "lucide-react";

export const Route = createFileRoute("/app/card")({
  component: CardScreen,
});

function CardScreen() {
  const u = useCurrentUser();
  const update = useStore(s => s.updateUser);
  const [flipped, setFlipped] = useState(false);
  if (!u) return null;

  const frozen = !!u.cardFrozen;
  const cardNumber = useMemo(() => {
    const base = u.accountNumber.replace(/\D/g, "").padEnd(16, "0").slice(0, 16);
    return base.replace(/(.{4})/g, "$1 ").trim();
  }, [u.accountNumber]);
  const last4 = cardNumber.slice(-4);
  const cvv = "•••";
  const limit = 250_000, used = Math.min(limit, Math.max(0, limit - u.balance / 4));
  const available = limit - used;
  const minDue = Math.round(used * 0.05);
  const utilPct = (used / limit) * 100;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center gap-3">
        <Link to="/app/home" className="neu-raised w-10 h-10 rounded-full grid place-items-center active:[box-shadow:var(--neu-pressed)]"><ChevronLeft size={18} /></Link>
        <h1 className="font-display font-semibold text-lg">Credit Card</h1>
      </header>

      <div style={{ perspective: 1000 }}>
        <motion.div
          onClick={() => setFlipped(f => !f)}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.6 }}
          style={{ transformStyle: "preserve-3d", filter: frozen ? "grayscale(1)" : undefined }}
          className="relative w-full aspect-[1.6/1] cursor-pointer"
        >
          {/* Front */}
          <div className="absolute inset-0 neu-float rounded-[24px] p-6 flex flex-col justify-between text-white"
            style={{
              background: "linear-gradient(135deg, #2c3e7b, #1a2548)",
              backfaceVisibility: "hidden",
              boxShadow: "-10px -10px 24px rgba(255,255,255,0.92), 10px 10px 24px rgba(163,177,198,0.78), inset 0 0 0 1px rgba(255,255,255,0.05)",
            }}>
            <div className="flex justify-between items-start">
              <span className="font-display font-bold tracking-[0.4em] text-lg">NOVA</span>
              <span className="text-[10px] uppercase tracking-widest opacity-70">{u.accountType}</span>
            </div>
            <div>
              <p className="font-mono text-xl tracking-[0.2em]">{flipped ? cardNumber : `•••• •••• •••• ${last4}`}</p>
            </div>
            <div className="flex justify-between text-xs">
              <div>
                <p className="opacity-60 text-[9px] uppercase tracking-widest">Cardholder</p>
                <p className="font-display font-semibold mt-1">{u.fullName.toUpperCase()}</p>
              </div>
              <div className="text-right">
                <p className="opacity-60 text-[9px] uppercase tracking-widest">Expires</p>
                <p className="font-mono mt-1">12/29</p>
              </div>
            </div>
            {frozen && (
              <div className="absolute inset-0 grid place-items-center pointer-events-none">
                <span className="text-negative font-display font-bold text-2xl tracking-[0.4em] bg-black/30 px-4 py-2 rounded">FROZEN</span>
              </div>
            )}
          </div>
          {/* Back */}
          <div className="absolute inset-0 neu-float rounded-[24px] p-6 text-white flex flex-col gap-4"
            style={{
              background: "linear-gradient(135deg, #1a2548, #2c3e7b)",
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}>
            <div className="neu-pressed h-10 mt-2 rounded" style={{background:"#111"}} />
            <div className="bg-white/90 rounded p-3 text-right">
              <span className="font-mono text-black text-sm tracking-widest">{cvv}</span>
            </div>
            <p className="text-[10px] opacity-70 mt-auto">This card is property of NOVA Bank. Tap to flip.</p>
          </div>
        </motion.div>
      </div>

      <NeuCard className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="neu-pressed rounded-full w-10 h-10 grid place-items-center"><Snowflake size={16} className="text-accent" /></div>
          <div>
            <p className="text-sm font-semibold">Freeze Card</p>
            <p className="text-[10px] text-text-muted">{frozen ? "Card is frozen" : "Block all transactions"}</p>
          </div>
        </div>
        <NeuButton tone={frozen ? "negative" : "accent"} size="sm" active={frozen} onClick={() => update(u.id, { cardFrozen: !frozen })}>
          {frozen ? "Unfreeze" : "Freeze"}
        </NeuButton>
      </NeuCard>

      <div className="grid grid-cols-2 gap-3">
        {[
          { l: "Credit Limit", v: NGN(limit) },
          { l: "Available", v: NGN(available) },
          { l: "Used", v: NGN(used) },
          { l: "Min Due", v: NGN(minDue) },
        ].map(s => (
          <div key={s.l} className="neu-pressed rounded-[18px] p-4">
            <p className="label-caps">{s.l}</p>
            <p className="font-mono text-base font-semibold mt-1">{s.v}</p>
          </div>
        ))}
      </div>

      <NeuCard className="p-5 flex items-center gap-5">
        <div className="relative w-24 h-24">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="42" stroke="#c8cdd5" strokeWidth="10" fill="none" opacity="0.4" />
            <circle cx="50" cy="50" r="42" stroke="var(--accent)" strokeWidth="10" fill="none"
              strokeDasharray={`${(utilPct / 100) * 264} 264`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <span className="font-mono text-lg font-semibold">{utilPct.toFixed(0)}%</span>
          </div>
        </div>
        <div>
          <p className="label-caps">Utilization</p>
          <p className="text-sm text-text-mid mt-1">Keep below 30% for best score.</p>
        </div>
      </NeuCard>

      <p className="text-[10px] text-text-muted text-center">Card: {maskAccount(cardNumber.replace(/ /g, ""))}</p>
    </div>
  );
}
