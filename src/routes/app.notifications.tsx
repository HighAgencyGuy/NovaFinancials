import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCurrentUser, useStore, type Notif, type Transaction } from "@/lib/store";
import { NeuCard } from "@/components/neu/NeuCard";
import { NeuButton } from "@/components/neu/NeuButton";
import { BottomSheet } from "@/components/BottomSheet";
import { TransactionDetailSheet } from "@/components/sheets/TransactionDetailSheet";
import { timeAgo } from "@/lib/format";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/app/notifications")({
  component: Notifs,
});

function Notifs() {
  const u = useCurrentUser();
  const notifs = useStore(s => s.notifications[u?.id ?? ""] ?? []);
  const markAll = useStore(s => s.markAllRead);
  const markRead = useStore(s => s.markNotifRead);
  const del = useStore(s => s.deleteNotif);

  const [openNotif, setOpenNotif] = useState<Notif | null>(null);
  const [openTxn, setOpenTxn] = useState<Transaction | null>(null);

  const groups = useMemo(() => {
    const today: Notif[] = [], week: Notif[] = [], earlier: Notif[] = [];
    const now = Date.now();
    notifs.forEach(n => {
      const d = now - new Date(n.createdAt).getTime();
      if (d < 86400000) today.push(n);
      else if (d < 604800000) week.push(n);
      else earlier.push(n);
    });
    return { today, week, earlier };
  }, [notifs]);

  const linkedTxn = useMemo(() => {
    if (!openNotif || !u) return null;
    if (openNotif.txnId) return u.transactions.find(t => t.id === openNotif.txnId) ?? null;
    return null;
  }, [openNotif, u]);

  if (!u) return null;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/app/home" className="neu-raised w-10 h-10 rounded-full grid place-items-center active:[box-shadow:var(--neu-pressed)] shrink-0"><ChevronLeft size={18} /></Link>
          <h1 className="font-display font-semibold text-lg truncate">Notifications</h1>
        </div>
        <NeuButton size="sm" onClick={() => markAll(u.id)}>Mark Read</NeuButton>
      </header>

      {notifs.length === 0 && <NeuCard className="p-8 text-center text-xs text-text-muted">You're all caught up.</NeuCard>}

      {(["today", "week", "earlier"] as const).map(key => {
        const arr = groups[key];
        if (arr.length === 0) return null;
        const title = key === "today" ? "Today" : key === "week" ? "This Week" : "Earlier";
        return (
          <section key={key}>
            <p className="label-caps mb-3">{title}</p>
            <div className="flex flex-col gap-3">
              <AnimatePresence>
                {arr.map(n => (
                  <Row key={n.id} n={n} onOpen={() => { markRead(u.id, n.id); setOpenNotif(n); }} onDelete={() => del(u.id, n.id)} />
                ))}
              </AnimatePresence>
            </div>
          </section>
        );
      })}

      <BottomSheet open={!!openNotif} onClose={() => setOpenNotif(null)} title={openNotif?.title ?? ""}>
        {openNotif && (
          <div className="flex flex-col gap-4">
            <NeuCard className="p-4">
              <p className="text-sm leading-relaxed">{openNotif.body}</p>
              <p className="text-[10px] text-text-muted mt-3">{new Date(openNotif.createdAt).toLocaleString()}</p>
            </NeuCard>
            {linkedTxn && (
              <NeuButton tone="accent" className="w-full" onClick={() => { setOpenTxn(linkedTxn); setOpenNotif(null); }}>
                View Transaction
              </NeuButton>
            )}
            <NeuButton tone="negative" className="w-full" onClick={() => { del(u.id, openNotif.id); setOpenNotif(null); }}>
              Delete
            </NeuButton>
          </div>
        )}
      </BottomSheet>

      <TransactionDetailSheet txn={openTxn} onClose={() => setOpenTxn(null)} />
    </div>
  );
}

function Row({ n, onOpen, onDelete }: { n: Notif; onOpen: () => void; onDelete: () => void }) {
  const tone = n.kind === "success" ? "var(--positive)" : n.kind === "warning" ? "var(--gold)" : n.kind === "error" ? "var(--negative)" : "var(--accent)";
  return (
    <motion.div layout exit={{ opacity: 0, x: -100 }} className="relative">
      <motion.div
        drag="x" dragConstraints={{ left: -100, right: 0 }} dragElastic={0.2}
        onDragEnd={(_e, info) => { if (info.offset.x < -80) onDelete(); }}
      >
        <button onClick={onOpen} className="w-full text-left">
          <NeuCard className="p-4 flex items-start gap-3 active:[box-shadow:var(--neu-pressed)]" style={{ background: "var(--bg)" }}>
            <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${n.read ? "neu-pressed" : "neu-float"}`} style={!n.read ? { background: tone } : undefined} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{n.title}</p>
              <p className="text-xs text-text-muted mt-1 line-clamp-2">{n.body}</p>
              <p className="text-[10px] text-text-muted mt-1">{timeAgo(n.createdAt)}</p>
            </div>
          </NeuCard>
        </button>
      </motion.div>
    </motion.div>
  );
}
