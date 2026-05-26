import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCurrentUser, useStore, type Notif } from "@/lib/store";
import { NeuCard } from "@/components/neu/NeuCard";
import { NeuButton } from "@/components/neu/NeuButton";
import { timeAgo } from "@/lib/format";
import { useMemo } from "react";

export const Route = createFileRoute("/app/notifications")({
  component: Notifs,
});

function Notifs() {
  const u = useCurrentUser();
  const notifs = useStore(s => s.notifications[u?.id ?? ""] ?? []);
  const markAll = useStore(s => s.markAllRead);
  const markRead = useStore(s => s.markNotifRead);
  const del = useStore(s => s.deleteNotif);

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

  if (!u) return null;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/app/home" className="neu-raised w-10 h-10 rounded-full grid place-items-center active:[box-shadow:var(--neu-pressed)]"><ChevronLeft size={18} /></Link>
          <h1 className="font-display font-semibold text-lg">Notifications</h1>
        </div>
        <NeuButton size="sm" onClick={() => markAll(u.id)}>Mark All Read</NeuButton>
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
                  <SwipeRow key={n.id} n={n} onRead={() => markRead(u.id, n.id)} onDelete={() => del(u.id, n.id)} />
                ))}
              </AnimatePresence>
            </div>
          </section>
        );
      })}
    </div>
  );
}

function SwipeRow({ n, onRead, onDelete }: { n: Notif; onRead: () => void; onDelete: () => void }) {
  const tone = n.kind === "success" ? "var(--positive)" : n.kind === "warning" ? "var(--gold)" : n.kind === "error" ? "var(--negative)" : "var(--accent)";
  return (
    <motion.div layout exit={{ opacity: 0, x: -100 }} className="relative">
      <div className="absolute inset-y-0 right-0 flex items-center gap-2 pr-2 pointer-events-none">
        <div className="neu-raised rounded-full px-3 h-8 grid place-items-center text-[10px] font-semibold text-accent">Mark Read</div>
        <div className="neu-raised rounded-full px-3 h-8 grid place-items-center text-[10px] font-semibold text-negative">Delete</div>
      </div>
      <motion.div
        drag="x" dragConstraints={{ left: -180, right: 0 }} dragElastic={0.2}
        onDragEnd={(_e, info) => {
          if (info.offset.x < -140) onDelete();
          else if (info.offset.x < -60) onRead();
        }}
        className="relative"
      >
        <NeuCard className="p-4 flex items-start gap-3 bg-bg" style={{ background: "var(--bg)" }}>
          <div className={`w-3 h-3 rounded-full mt-1 ${n.read ? "neu-pressed" : "neu-float"}`} style={!n.read ? { background: tone } : undefined} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{n.title}</p>
            <p className="text-xs text-text-muted mt-1">{n.body}</p>
            <p className="text-[10px] text-text-muted mt-1">{timeAgo(n.createdAt)}</p>
          </div>
        </NeuCard>
      </motion.div>
    </motion.div>
  );
}
