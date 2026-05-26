import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useState } from "react";
import { NeuCard } from "@/components/neu/NeuCard";
import { NeuInput } from "@/components/neu/NeuInput";
import { NeuButton } from "@/components/neu/NeuButton";
import { useCurrentUser, useStore } from "@/lib/store";
import { NGN } from "@/lib/format";
import { PinPad } from "@/components/PinPad";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/app/deposit")({
  component: Deposit,
});

function Deposit() {
  const u = useCurrentUser();
  const addTxn = useStore(s => s.addTransaction);
  const pushNotif = useStore(s => s.pushNotif);
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("Cash deposit");
  const [step, setStep] = useState<"form" | "pin" | "done">("form");

  if (!u) return null;

  const submit = () => {
    if (!u || !Number(amount)) return;
    addTxn(u.id, { type: "credit", category: "deposit", amount: Number(amount), description: source, counterparty: "NOVA Deposit", status: "completed" });
    pushNotif(u.id, { title: "Deposit received", body: `${NGN(Number(amount))} credited.`, kind: "success" });
    setStep("done");
  };

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center gap-3">
        <Link to="/app/home" className="neu-raised w-10 h-10 rounded-full grid place-items-center active:[box-shadow:var(--neu-pressed)]"><ChevronLeft size={18} /></Link>
        <h1 className="font-display font-semibold text-lg">Check Deposit</h1>
      </header>

      <AnimatePresence mode="wait">
        {step === "form" && (
          <motion.div key="f" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex flex-col gap-4">
            <NeuCard className="p-5 flex flex-col gap-4">
              <NeuInput label="Amount" prefix="₦" mono inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value.replace(/[^\d.]/g,""))} />
              <NeuInput label="Source" value={source} onChange={e => setSource(e.target.value)} />
            </NeuCard>
            <NeuButton size="lg" tone="accent" disabled={!Number(amount)} onClick={() => setStep("pin")}>Deposit</NeuButton>
          </motion.div>
        )}
        {step === "pin" && <motion.div key="p" initial={{opacity:0}} animate={{opacity:1}}><PinPad onSuccess={submit} onCancel={() => setStep("form")} /></motion.div>}
        {step === "done" && (
          <motion.div key="d" initial={{opacity:0}} animate={{opacity:1}} className="flex flex-col items-center gap-4 py-8">
            <motion.svg width="64" height="64" viewBox="0 0 48 48">
              <motion.path d="M12 24 L20 32 L36 16" fill="none" stroke="var(--positive)" strokeWidth="4" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4 }} />
            </motion.svg>
            <p className="font-display font-semibold">{NGN(Number(amount))} deposited</p>
            <Link to="/app/home"><NeuButton tone="accent">Back to Home</NeuButton></Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
