import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Home, Settings, LifeBuoy, LogOut } from "lucide-react";
import { useState } from "react";
import { NeuButton } from "./neu/NeuButton";
import { useStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";

const items = [
  { to: "/app/settings", label: "Settings", icon: Settings },
  { to: "/app/notifications", label: "Alerts", icon: Bell },
  { to: "/app/home", label: "Home", icon: Home, center: true },
  { to: "/app/support", label: "Support", icon: LifeBuoy },
  { to: "__logout", label: "Logout", icon: LogOut },
] as const;

export function BottomNav() {
  const path = useRouterState({ select: s => s.location.pathname });
  const logout = useStore(s => s.logout);
  const [confirm, setConfirm] = useState(false);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-30 neu-nav px-4 pt-3 pb-5" style={{ background: "var(--bg)" }}>
        <div className="max-w-md mx-auto flex items-end justify-between">
          {items.map(item => {
            const Icon = item.icon;
            const active = item.to !== "__logout" && path.startsWith(item.to);
            if (item.center) {
              return (
                <Link key={item.to} to={item.to} className="-mt-8">
                  <div className="neu-float w-16 h-16 rounded-full grid place-items-center" style={{ background: "var(--bg)" }}>
                    <Icon size={26} className="text-accent" />
                  </div>
                </Link>
              );
            }
            if (item.to === "__logout") {
              return (
                <button key="logout" onClick={() => setConfirm(true)} className="flex flex-col items-center gap-1.5 py-1 px-2">
                  <div className="w-9 h-9 rounded-full grid place-items-center text-text-muted">
                    <Icon size={18} />
                  </div>
                  <span className="text-[10px] text-text-muted">{item.label}</span>
                </button>
              );
            }
            return (
              <Link key={item.to} to={item.to} className="flex flex-col items-center gap-1.5 py-1 px-2">
                <div className={`w-9 h-9 rounded-full grid place-items-center ${active ? "neu-pressed" : ""}`}>
                  <Icon size={18} className={active ? "text-accent" : "text-text-muted"} />
                </div>
                <span className={`text-[10px] ${active ? "text-accent font-semibold" : "text-text-muted"}`}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <AnimatePresence>
        {confirm && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="fixed inset-0 bg-black/20 z-40" onClick={() => setConfirm(false)} />
            <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.9,opacity:0}}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="fixed inset-0 z-50 grid place-items-center p-6 pointer-events-none">
              <div className="neu-float rounded-[24px] p-6 max-w-sm w-full pointer-events-auto" style={{background: "var(--bg)"}}>
                <h3 className="font-semibold text-lg mb-2">Log out?</h3>
                <p className="text-sm text-text-muted mb-6">You'll need to sign in again to access your account.</p>
                <div className="flex gap-3">
                  <NeuButton className="flex-1" onClick={() => setConfirm(false)}>Cancel</NeuButton>
                  <NeuButton tone="negative" className="flex-1" onClick={() => { setConfirm(false); logout(); window.location.href = "/auth"; }}>Logout</NeuButton>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
