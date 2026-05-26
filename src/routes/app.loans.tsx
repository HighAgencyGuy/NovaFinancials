import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { NeuCard } from "@/components/neu/NeuCard";
import { NeuButton } from "@/components/neu/NeuButton";
import { NeuSlider } from "@/components/neu/NeuSlider";
import { loanProducts } from "@/constants/tips";
import { NGN } from "@/lib/format";
import { motion, AnimatePresence } from "framer-motion";
import { PinPad } from "@/components/PinPad";
import { useCurrentUser, useStore } from "@/lib/store";
import { BottomSheet } from "@/components/BottomSheet";

export const Route = createFileRoute("/app/loans")({
  component: Loans,
});

function Loans() {
  const [selected, setSelected] = useState<typeof loanProducts[number] | null>(null);
  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center gap-3">
        <Link to="/app/home" className="neu-raised w-10 h-10 rounded-full grid place-items-center active:[box-shadow:var(--neu-pressed)]"><ChevronLeft size={18} /></Link>
        <h1 className="font-display font-semibold text-lg">Loans</h1>
      </header>
      <div className="flex flex-col gap-3">
        {loanProducts.map(p => (
          <NeuCard key={p.id} className="p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display font-semibold">{p.name}</p>
                <p className="text-[11px] text-text-muted mt-1">{p.rate}% p.a. • Up to {NGN(p.max)}</p>
              </div>
              <span className="neu-pressed rounded-full px-3 py-1 text-[10px] font-semibold text-positive uppercase tracking-wider">Active</span>
            </div>
            <NeuButton tone="accent" onClick={() => setSelected(p)}>Apply</NeuButton>
          </NeuCard>
        ))}
      </div>

      <ApplySheet product={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function ApplySheet({ product, onClose }: { product: typeof loanProducts[number] | null; onClose: () => void }) {
  const u = useCurrentUser();
  const addTxn = useStore(s => s.addTransaction);
  const pushNotif = useStore(s => s.pushNotif);
  const [step, setStep] = useState(0);
  const [amount, setAmount] = useState(0);
  const [tenure, setTenure] = useState(0);
  const [done, setDone] = useState(false);

  if (!product) return null;
  const min = product.min, max = product.max;
  if (!amount) setAmount(Math.round((min + max) / 4));
  if (!tenure) setTenure(product.tenureMonths[1] ?? product.tenureMonths[0]);
  const monthlyRate = product.rate / 100 / 12;
  const n = tenure;
  const monthly = amount * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1) || 0;
  const total = monthly * n;
  const interest = total - amount;

  const close = () => { setStep(0); setAmount(0); setTenure(0); setDone(false); onClose(); };

  const confirm = () => {
    if (!u) return;
    addTxn(u.id, {
      type: "credit", category: "loan", amount,
      description: `${product.name} disbursement`, counterparty: "NOVA Loans", status: "completed",
    });
    pushNotif(u.id, { title: "Loan disbursed", body: `${NGN(amount)} added to your balance.`, kind: "success" });
    setDone(true);
  };

  return (
    <BottomSheet open={!!product} onClose={close} title={`Apply: ${product.name}`}>
      {done ? (
        <div className="flex flex-col items-center gap-4 py-6">
          <motion.svg width="64" height="64" viewBox="0 0 48 48">
            <motion.path d="M12 24 L20 32 L36 16" fill="none" stroke="var(--positive)" strokeWidth="4" strokeLinecap="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4 }} />
          </motion.svg>
          <p className="font-display font-semibold">Loan approved instantly</p>
          <p className="text-xs text-text-muted">{NGN(amount)} credited to your account.</p>
          <NeuButton tone="accent" className="w-full" onClick={close}>Done</NeuButton>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-6">
            {[0, 1, 2].map(i => (
              <div key={i} className={`w-8 h-8 rounded-full grid place-items-center text-xs font-semibold ${i <= step ? "neu-pressed text-accent" : "neu-raised text-text-muted"}`}>{i + 1}</div>
            ))}
          </div>
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="amount" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex flex-col gap-6">
                <div>
                  <div className="flex justify-between mb-3">
                    <span className="label-caps">Amount</span>
                    <span className="font-mono font-semibold">{NGN(amount)}</span>
                  </div>
                  <NeuSlider value={amount} onChange={setAmount} min={min} max={max} step={1000} />
                  <div className="flex justify-between text-[10px] text-text-muted mt-2 font-mono">
                    <span>{NGN(min)}</span><span>{NGN(max)}</span>
                  </div>
                </div>
                <div>
                  <p className="label-caps mb-2">Tenure (months)</p>
                  <div className="flex gap-2 flex-wrap">
                    {product.tenureMonths.map(t => (
                      <NeuButton key={t} size="sm" active={t === tenure} tone={t === tenure ? "accent" : "default"} onClick={() => setTenure(t)}>{t}m</NeuButton>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { l: "Monthly", v: NGN(monthly) },
                    { l: "Interest", v: NGN(interest) },
                    { l: "Total", v: NGN(total) },
                  ].map(s => (
                    <div key={s.l} className="neu-pressed rounded-[14px] p-3">
                      <p className="text-[9px] text-text-muted uppercase tracking-wider">{s.l}</p>
                      <p className="font-mono text-xs font-semibold mt-1">{s.v}</p>
                    </div>
                  ))}
                </div>
                <NeuButton size="lg" tone="accent" onClick={() => setStep(1)}>Continue</NeuButton>
              </motion.div>
            )}
            {step === 1 && (
              <motion.div key="review" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex flex-col gap-4">
                <NeuCard className="p-4 grid gap-2 text-xs">
                  <Row k="Product" v={product.name} />
                  <Row k="Amount" v={NGN(amount)} />
                  <Row k="Rate" v={`${product.rate}% p.a.`} />
                  <Row k="Tenure" v={`${tenure} months`} />
                  <Row k="Monthly" v={NGN(monthly)} />
                  <Row k="Total Repayable" v={NGN(total)} />
                </NeuCard>
                <NeuButton size="lg" tone="accent" onClick={() => setStep(2)}>Confirm with PIN</NeuButton>
              </motion.div>
            )}
            {step === 2 && (
              <motion.div key="pin" initial={{opacity:0}} animate={{opacity:1}}>
                <PinPad onSuccess={confirm} onCancel={() => setStep(1)} title="Authorize loan" />
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </BottomSheet>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between"><span className="text-text-muted">{k}</span><span className="font-mono">{v}</span></div>;
}
