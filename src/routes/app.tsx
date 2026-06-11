import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { BottomNav } from "@/components/BottomNav";
import { useIdle } from "@/hooks/useIdle";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { NeuButton } from "@/components/neu/NeuButton";

export const Route = createFileRoute("/app")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem("nova-bank-store");
    if (!raw) throw redirect({ to: "/auth" });
    try {
      const s = JSON.parse(raw);
      if (!s.state?.currentUserId) throw redirect({ to: "/auth" });
    } catch {
      throw redirect({ to: "/auth" });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  const u = useStore(s => s.currentUser);
  const logout = useStore(s => s.logout);
  const nav = useNavigate();
  const { warn, expired, dismiss } = useIdle(15 * 60_000, 60_000);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (!u) { nav({ to: "/auth" }); return; }
    if (u.role === "admin") { nav({ to: "/admin" }); return; }
    if (u.status !== "approved") { nav({ to: "/locked" }); return; }
  }, [u, nav]);

  useEffect(() => {
    if (!warn) { setCountdown(60); return; }
    setCountdown(60);
    const t = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [warn]);

  useEffect(() => {
    if (expired) { logout(); nav({ to: "/auth" }); }
  }, [expired, logout, nav]);

  return (
    <div className="min-h-dvh pb-32" style={{ background: "var(--bg)" }}>
      <main className="max-w-md mx-auto px-5 pt-8">
        <Outlet />
      </main>
      <BottomNav />

      <AnimatePresence>
        {warn && !expired && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/20 z-40" />
            <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.9,opacity:0}}
              className="fixed inset-0 z-50 grid place-items-center p-6 pointer-events-none">
              <div className="neu-float rounded-[24px] p-6 max-w-sm w-full pointer-events-auto" style={{background:"var(--bg)"}}>
                <h3 className="font-display font-semibold text-lg">Still there?</h3>
                <p className="text-sm text-text-muted mt-2">You'll be signed out for inactivity in {countdown}s.</p>
                <div className="neu-deep rounded-full h-2 mt-4 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(countdown/60)*100}%`, background: "var(--accent)", transition: "width 1s linear" }} />
                </div>
                <div className="flex gap-3 mt-6">
                  <NeuButton className="flex-1" tone="negative" onClick={() => { logout(); nav({ to: "/auth" }); }}>Sign Out</NeuButton>
                  <NeuButton className="flex-1" tone="accent" onClick={dismiss}>Stay Active</NeuButton>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
