import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { NeuButton } from "./neu/NeuButton";
import { useStore } from "@/lib/store";

interface Props {
  onSuccess: () => void;
  onCancel?: () => void;
  title?: string;
}

export function PinPad({ onSuccess, onCancel, title = "Enter Transaction PIN" }: Props) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const verify = useStore(s => s.verifyPin);
  const lockUntil = useStore(s => s.pinLockUntil);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);
  const locked = lockUntil && now < lockUntil;
  const lockSec = locked ? Math.ceil((lockUntil! - now) / 1000) : 0;

  useEffect(() => {
    if (pin.length !== 4) return;
    void verify(pin).then(r => {
      if (r.ok) {
        navigator.vibrate?.([80, 40, 80]);
        onSuccess();
      } else {
        navigator.vibrate?.(200);
        setError(r.error ?? "Invalid PIN");
        setShake(s => s + 1);
        setTimeout(() => setPin(""), 250);
      }
    });
  }, [pin, verify, onSuccess]);

  const press = (n: string) => {
    if (locked) return;
    navigator.vibrate?.(8);
    setError(null);
    setPin(p => (p.length < 4 ? p + n : p));
  };
  const back = () => setPin(p => p.slice(0, -1));

  return (
    <motion.div
      key={shake}
      animate={shake ? { x: [-8, 8, -6, 6, -4, 4, 0] } : undefined}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center gap-8 py-4"
    >
      <div className="text-center">
        <p className="label-caps">{title}</p>
        <p className="text-xs text-text-muted mt-2">Required for every money movement</p>
      </div>

      <div className="flex gap-5">
        {[0, 1, 2, 3].map(i => {
          const filled = i < pin.length;
          return (
            <motion.div
              key={i}
              animate={{ scale: filled ? 1 : 0.85 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
              className={`w-5 h-5 rounded-full ${filled ? "neu-pressed" : "neu-raised"}`}
              style={filled ? { background: "var(--accent)" } : undefined}
            />
          );
        })}
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-xs text-negative font-semibold"
          >{error}</motion.p>
        )}
        {locked && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-negative">
            Locked: {lockSec}s
          </motion.p>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-3 gap-4 w-64">
        {["1","2","3","4","5","6","7","8","9"].map(n => (
          <NeuButton key={n} variant="icon" size="lg" onClick={() => press(n)} className="!w-16 !h-16 text-xl font-mono">
            {n}
          </NeuButton>
        ))}
        {onCancel ? (
          <NeuButton variant="icon" size="lg" tone="negative" onClick={onCancel} className="!w-16 !h-16 text-xs">
            Cancel
          </NeuButton>
        ) : <div />}
        <NeuButton variant="icon" size="lg" onClick={() => press("0")} className="!w-16 !h-16 text-xl font-mono">0</NeuButton>
        <NeuButton variant="icon" size="lg" onClick={back} className="!w-16 !h-16 text-sm">⌫</NeuButton>
      </div>
    </motion.div>
  );
}
