import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { NeuCard } from "@/components/neu/NeuCard";
import { NeuButton } from "@/components/neu/NeuButton";
import { NeuSlider } from "@/components/neu/NeuSlider";
import { investmentProducts } from "@/constants/tips";
import { NGN } from "@/lib/format";
import { motion, AnimatePresence } from "framer-motion";
import { PinPad } from "@/components/PinPad";
import { useCurrentUser, useStore } from "@/lib/store";
import { BottomSheet } from "@/components/BottomSheet";

export const Route = createFileRoute("/app/investments")({
  component: Invest,
});

function Invest() {
  const u = useCurrentUser();
  const [selected, setSelected] = useState<typeof investmentProducts[number] | null>(null);
  const invested = useMemo(() => (u?.transactions ?? []).filter(t => t.category === "investment" && t.type === "debit").reduce((s, t) => s + t.amount, 0), [u]);
  const returns = invested * 0.12;
  const roi = invested > 0 ? (returns / invested) * 100 : 0;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center gap-3">
        <Link to="/app/home" className="neu-raised w-10 h-10 rounded-full grid place-items-center active:[box-shadow:var(--neu-pressed)]"><ChevronLeft size={18} /></Link>
        <h1 className="font-display font-semibold text-lg">Investments</h1>
      </header>

      <NeuCard variant="float" radius="xl" className="p-5 grid grid-cols-3 gap-3">
        {[
          { l: "Invested", v: NGN(invested) },
          { l: "Returns", v: NGN(returns) },
          { l: "ROI", v: `${roi.toFixed(1)}%` },
        ].map(s => (
          <div key={s.l} className="neu-pressed rounded-[14px] p-3">
            <p className="label-caps">{s.l}</p>
            <p className="font-mono text-sm font-semibold mt-1">{s.v}</p>
          </div>
        ))}
      </NeuCard>

      <div className="flex flex-col gap-3">
        {investmentProducts.map(p => (
          <NeuCard key={p.id} className="p-5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-display font-semibold">{p.name}</p>
                <p className="text-[11px] text-text-muted mt-1 font-mono">{p.rate}% p.a. • {p.tenorDays}d</p>
              </div>
              <span className={`neu-pressed rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${p.risk === "Low" ? "text-positive" : p.risk === "Medium" ? "text-gold" : "text-negative"}`}>{p.risk}</span>
            </div>
            <p className="text-[11px] text-text-muted">Min: <span className="font-mono">{NGN(p.min)}</span></p>
            <NeuButton tone="accent" size="sm" className="mt-3 w-full" onClick={() => setSelected(p)}>Invest</NeuButton>
          </NeuCard>
        ))}
      </div>

      <BookSheet product={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function BookSheet({ product, onClose }: { product: typeof investmentProducts[number] | null; onClose: () => void }) {
  const u = useCurrentUser();
  const addTxn = useStore(s => s.addTransaction);
  const pushNotif = useStore(s => s.pushNotif);
  const [amount, setAmount] = useState(0);
  const [step, setStep] = useState<"form" | "pin" | "done">("form");

  if (!product) return null;
  if (!amount) setAmount(product.min);
  const payout = amount + amount * (product.rate / 100) * (product.tenorDays / 365);

  const close = () => { setAmount(0); setStep("form"); onClose(); };
  const confirm = () => {
    if (!u) return;
    addTxn(u.id, { type: "debit", category: "investment", amount, description: `${product.name} subscription`, counterparty: "NOVA Invest", status: "completed" });
    pushNotif(u.id, { title: "Investment booked", body: `${NGN(amount)} in ${product.name}.`, kind: "success" });
    setStep("done");
  };

  return (
    <BottomSheet open={!!product} onClose={close} title={`Invest: ${product.name}`}>
      <AnimatePresence mode="wait">
        {step === "form" && (
          <motion.div key="f" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex flex-col gap-6">
            <div>
              <div className="flex justify-between mb-3">
                <span className="label-caps">Amount</span>
                <span className="font-mono font-semibold">{NGN(amount)}</span>
              </div>
              <NeuSlider value={amount} onChange={setAmount} min={product.min} max={Math.max(product.min * 50, u?.balance ?? product.min * 10)} step={1000} />
              <p className="text-[10px] text-text-muted mt-2">Available: <span className="font-mono">{NGN(u?.balance ?? 0)}</span></p>
            </div>
            <div className="neu-pressed rounded-[14px] p-4">
              <p className="label-caps">Projected Payout ({product.tenorDays}d)</p>
              <p className="font-mono text-2xl font-semibold mt-1">{NGN(payout)}</p>
            </div>
            <NeuButton size="lg" tone="accent" disabled={amount > (u?.balance ?? 0)} onClick={() => setStep("pin")}>
              {amount > (u?.balance ?? 0) ? "Insufficient balance" : "Confirm with PIN"}
            </NeuButton>
          </motion.div>
        )}
        {step === "pin" && (
          <motion.div key="p" initial={{opacity:0}} animate={{opacity:1}}>
            <PinPad onSuccess={confirm} onCancel={() => setStep("form")} title="Authorize investment" />
          </motion.div>
        )}
        {step === "done" && (
          <motion.div key="d" initial={{opacity:0}} animate={{opacity:1}} className="flex flex-col items-center gap-4 py-6">
            <motion.svg width="64" height="64" viewBox="0 0 48 48">
              <motion.path d="M12 24 L20 32 L36 16" fill="none" stroke="var(--positive)" strokeWidth="4" strokeLinecap="round"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4 }} />
            </motion.svg>
            <p className="font-display font-semibold">Investment booked</p>
            <NeuButton tone="accent" className="w-full" onClick={close}>Done</NeuButton>
          </motion.div>
        )}
      </AnimatePresence>
    </BottomSheet>
  );
}
