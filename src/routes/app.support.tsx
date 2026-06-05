import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Mail, MessageCircle, Phone, Send } from "lucide-react";
import { NeuCard } from "@/components/neu/NeuCard";
import { NeuButton } from "@/components/neu/NeuButton";
import { NeuInput } from "@/components/neu/NeuInput";
import { BottomSheet } from "@/components/BottomSheet";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/app/support")({
  component: Support,
});

interface ChatMsg { id: string; from: "you" | "nova"; text: string; t: number }

function Support() {
  const [chat, setChat] = useState(false);
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    { id: "w", from: "nova", text: "Hi! I'm NOVA's support assistant. How can I help?", t: Date.now() },
  ]);
  const [input, setInput] = useState("");

  const send = () => {
    const text = input.trim();
    if (!text) return;
    const id = String(Date.now());
    setMsgs(m => [...m, { id, from: "you", text, t: Date.now() }]);
    setInput("");
    setTimeout(() => {
      setMsgs(m => [...m, { id: id + "-r", from: "nova", text: "Thanks — an agent will follow up shortly. Is there anything else?", t: Date.now() }]);
    }, 900);
  };

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center gap-3">
        <Link to="/app/home" className="neu-raised w-10 h-10 rounded-full grid place-items-center active:[box-shadow:var(--neu-pressed)] shrink-0"><ChevronLeft size={18} /></Link>
        <h1 className="font-display font-semibold text-lg truncate">Support</h1>
      </header>

      <NeuCard variant="float" className="p-6">
        <p className="font-display font-semibold text-lg">We're here 24/7</p>
        <p className="text-xs text-text-muted mt-1">Choose a channel and we'll respond fast.</p>
      </NeuCard>

      <div className="flex flex-col gap-3">
        <button onClick={() => setChat(true)} className="text-left">
          <NeuCard className="p-4 flex items-center gap-4 active:[box-shadow:var(--neu-pressed)]">
            <div className="neu-pressed rounded-[14px] w-11 h-11 grid place-items-center shrink-0"><MessageCircle size={16} className="text-accent" /></div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Live Chat</p>
              <p className="text-[11px] text-text-muted">Avg response 1 min</p>
            </div>
          </NeuCard>
        </button>

        <a href="tel:+18008006282" className="block">
          <NeuCard className="p-4 flex items-center gap-4 active:[box-shadow:var(--neu-pressed)]">
            <div className="neu-pressed rounded-[14px] w-11 h-11 grid place-items-center shrink-0"><Phone size={16} className="text-accent" /></div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">+1 800 800 NOVA</p>
              <p className="text-[11px] text-text-muted">Free for NOVA customers</p>
            </div>
          </NeuCard>
        </a>

        <a href="mailto:support@novabank.com" className="block">
          <NeuCard className="p-4 flex items-center gap-4 active:[box-shadow:var(--neu-pressed)]">
            <div className="neu-pressed rounded-[14px] w-11 h-11 grid place-items-center shrink-0"><Mail size={16} className="text-accent" /></div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">support@novabank.com</p>
              <p className="text-[11px] text-text-muted">Replies within 4 hours</p>
            </div>
          </NeuCard>
        </a>
      </div>

      <BottomSheet open={chat} onClose={() => setChat(false)} title="Live Chat">
        <div className="flex flex-col gap-3">
          <div className="neu-pressed rounded-[14px] p-3 h-72 overflow-y-auto flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {msgs.map(m => (
                <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className={`max-w-[80%] rounded-[12px] px-3 py-2 text-xs ${m.from === "you" ? "self-end neu-raised" : "self-start"}`}
                  style={m.from === "nova" ? { background: "var(--bg-light)", boxShadow: "var(--neu-raised)" } : undefined}>
                  {m.text}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex-1"><NeuInput value={input} onChange={e => setInput(e.target.value)} placeholder="Type a message..." onKeyDown={e => { if (e.key === "Enter") send(); }} /></div>
            <NeuButton tone="accent" onClick={send}><Send size={14} /></NeuButton>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
