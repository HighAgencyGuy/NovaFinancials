import { createFileRoute, Link } from "@tanstack/react-router";
import { useCurrentUser, useStore, CARD_TIERS, type CardTier, type VirtualCard, type PendingRequest } from "@/lib/store";
import { NeuCard } from "@/components/neu/NeuCard";
import { NeuButton } from "@/components/neu/NeuButton";
import { NGN, maskAccount } from "@/lib/format";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Snowflake, Eye, EyeOff, Plus } from "lucide-react";
import { FeePaymentSheet } from "@/components/sheets/FeePaymentSheet";

export const Route = createFileRoute("/app/card")({
  component: CardScreen,
});

function CardScreen() {
  const u = useCurrentUser();
  const update = useStore(s => s.updateUser);
  const request = useStore(s => s.requestVirtualCard);
  const freeze = useStore(s => s.freezeVirtualCard);
  const [flipped, setFlipped] = useState(false);
  const [activeReq, setActiveReq] = useState<PendingRequest | null>(null);
  
  if (!u) return null;

  const frozen = !!u.cardFrozen;
  const cardNumber = useMemo(() => {
    const base = u.accountNumber.replace(/\D/g, "").padEnd(16, "0").slice(0, 16);
    return base.replace(/(.{4})/g, "$1 ").trim();
  }, [u.accountNumber]);
  const last4 = cardNumber.slice(-4);

  const cardRequests = u.pendingRequests.filter(r => r.kind === "virtual_card");
  const openCardReq = cardRequests.find(r => r.status === "awaiting_fee" || r.status === "fee_paid");

  return (
    <div className="flex flex-col gap-6 pb-8">
      <header className="flex items-center gap-3">
        <Link to="/app/home" className="neu-raised w-10 h-10 rounded-full grid place-items-center active:[box-shadow:var(--neu-pressed)]"><ChevronLeft size={18} /></Link>
        <h1 className="font-display font-semibold text-lg">Card</h1>
      </header>

      <div style={{ perspective: 1000 }}>
        <motion.div
          onClick={() => setFlipped(f => !f)}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.6 }}
          style={{ transformStyle: "preserve-3d", filter: frozen ? "grayscale(1)" : undefined }}
          className="relative w-full aspect-[1.6/1] cursor-pointer"
        >
          <div className="absolute inset-0 neu-float rounded-[24px] p-6 flex flex-col justify-between text-white"
            style={{
              background: "linear-gradient(135deg, #2c3e7b, #1a2548)",
              backfaceVisibility: "hidden",
            }}>
            <div className="flex justify-between items-start">
              <span className="font-display font-bold tracking-[0.4em] text-lg">NOVA</span>
              <span className="text-[10px] uppercase tracking-widest opacity-70">{u.accountType}</span>
            </div>
            <p className="font-mono text-xl tracking-[0.2em]">{flipped ? cardNumber : `•••• •••• •••• ${last4}`}</p>
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
          <div className="absolute inset-0 neu-float rounded-[24px] p-6 text-white flex flex-col gap-4"
            style={{
              background: "linear-gradient(135deg, #1a2548, #2c3e7b)",
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}>
            <div className="neu-pressed h-10 mt-2 rounded" style={{ background: "#111" }} />
            <div className="bg-white/90 rounded p-3 text-right">
            <span className="font-mono text-black text-sm tracking-widest">•••</span>
            </div>
            <p className="text-[10px] opacity-70 mt-auto">Primary debit card. Tap to flip.</p>
          </div>
        </motion.div>
      </div>

      <NeuCard className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="neu-pressed rounded-full w-10 h-10 grid place-items-center"><Snowflake size={16} className="text-accent" /></div>
          <div>
            <p className="text-sm font-semibold">Freeze Primary Card</p>
            <p className="text-[10px] text-text-muted">{frozen ? "Card is frozen" : "Block all transactions"}</p>
          </div>
        </div>
        <NeuButton tone={frozen ? "negative" : "accent"} size="sm" active={frozen} onClick={() => update(u.id, { cardFrozen: !frozen })}>
          {frozen ? "Unfreeze" : "Freeze"}
        </NeuButton>
      </NeuCard>

      <p className="text-[10px] text-text-muted text-center">Card: {maskAccount(cardNumber.replace(/ /g, ""))}</p>

      {/* Virtual Cards */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-base">Virtual Cards</h2>
          <span className="text-[10px] text-text-muted">{u.virtualCards.length} issued</span>
        </div>

        {u.virtualCards.length === 0 && (
          <NeuCard className="p-5 text-center text-xs text-text-muted">No virtual cards yet. Choose a tier below to request one.</NeuCard>
        )}

        <div className="flex flex-col gap-3">
          {u.virtualCards.map(c => <VirtualCardRow key={c.id} card={c} onFreeze={(f) => freeze(u.id, c.id, f)} />)}
        </div>
      </section>

      {/* Tier picker */}
      <section className="flex flex-col gap-3">
        <h2 className="font-display font-semibold text-base">Request New Virtual Card</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(Object.keys(CARD_TIERS) as CardTier[]).map(tier => {
            const meta = CARD_TIERS[tier];
            const accent = tier === "Standard" ? "#8B5A2B" : tier === "Ruby" ? "#B5524A" : "#B8894A";
            return (
              <NeuCard key={tier} variant="float" className="p-5 flex flex-col gap-3">
                <div>
                  <p className="font-display font-bold text-lg" style={{ color: accent }}>{tier}</p>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">Virtual Card</p>
                </div>
                <div className="neu-pressed rounded-[12px] p-3">
                  <p className="text-[10px] text-text-muted">Spending limit</p>
                  <p className="font-mono font-semibold mt-1">{NGN(meta.limit)}</p>
                </div>
                <div className="flex items-baseline justify-between">
                  <p className="text-[10px] text-text-muted uppercase">Fee</p>
                  <p className="font-mono font-bold text-xl">{NGN(meta.fee)}</p>
                </div>
                <NeuButton tone="accent" size="sm" className="w-full" disabled={!!openCardReq}
                  onClick={() => { request(u.id, tier); }}>
                  <Plus size={14} /> Request
                </NeuButton>
              </NeuCard>
            );
          })}
        </div>
        {openCardReq && (
          <NeuCard className="p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold">{openCardReq.tier} card • {openCardReq.status === "awaiting_fee" ? "Awaiting fee" : "Awaiting admin"}</p>
              <p className="text-[10px] text-text-muted">Fee {NGN(openCardReq.fee)}</p>
            </div>
            <NeuButton size="sm" tone="accent" onClick={() => setActiveReq(openCardReq)}>
              {openCardReq.status === "awaiting_fee" ? "Pay fee" : "View"}
            </NeuButton>
          </NeuCard>
        )}
      </section>

      <FeePaymentSheet request={activeReq} onClose={() => setActiveReq(null)} />
    </div>
  );
}

function VirtualCardRow({ card, onFreeze }: { card: VirtualCard; onFreeze: (frozen: boolean) => void }) {
  const [reveal, setReveal] = useState(false);
  const accent = card.tier === "Standard" ? "#8B5A2B" : card.tier === "Ruby" ? "#B5524A" : "#B8894A";
  return (
    <NeuCard variant="float" className="p-5 flex flex-col gap-3" style={{ filter: card.frozen ? "grayscale(0.7)" : undefined }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display font-bold" style={{ color: accent }}>{card.tier} Virtual</p>
          <p className="text-[10px] text-text-muted">Issued {new Date(card.createdAt).toLocaleDateString()} • Limit {NGN(card.limit)}</p>
        </div>
        <button onClick={() => setReveal(r => !r)} className="neu-raised w-9 h-9 rounded-full grid place-items-center active:[box-shadow:var(--neu-pressed)]">
          {reveal ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
      <div className="neu-pressed rounded-[14px] p-4 grid gap-2 text-xs">
        <Row k="Number" v={reveal ? card.number : `•••• •••• •••• ${card.number.slice(-4)}`} mono />
        <Row k="CVV" v={reveal ? card.cvv : "•••"} mono />
        <Row k="PIN" v={reveal ? card.pin : "••••"} mono />
        <Row k="Expiry" v={card.expiry} mono />
      </div>
      <NeuButton size="sm" tone={card.frozen ? "negative" : "default"} active={card.frozen} onClick={() => onFreeze(!card.frozen)}>
        <Snowflake size={12} /> {card.frozen ? "Frozen — Unfreeze" : "Freeze"}
      </NeuButton>
    </NeuCard>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-text-muted">{k}</span>
      <span className={`text-right break-all ${mono ? "font-mono" : ""}`} style={{ color: "var(--text-dark)" }}>{v}</span>
    </div>
  );
}
