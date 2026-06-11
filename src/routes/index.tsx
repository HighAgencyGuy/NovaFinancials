import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  component: Splash,
});

function Splash() {
  const navigate = useNavigate();
  const currentUser = useStore(s => s.currentUser);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 2800);
      setPct(t * 100);
      if (t < 1) raf = requestAnimationFrame(tick);
      else {
        const u = currentUser;
        if (!u) navigate({ to: "/auth" });
        else if (u.status === "suspended" || u.status === "pending") navigate({ to: "/locked" });
        else if (u.role === "admin") navigate({ to: "/admin" });
        else navigate({ to: "/app/home" });
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <main className="min-h-dvh grid place-items-center" style={{ background: "var(--bg)" }}>
      <div className="flex flex-col items-center gap-12">
        <div className="relative w-48 h-48 grid place-items-center">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.3 }}
              className="absolute rounded-full neu-raised"
              style={{
                width: `${100 - i * 28}%`,
                height: `${100 - i * 28}%`,
                background: "var(--bg)",
              }}
            />
          ))}
        </div>
        <div className="text-center">
          <h1 className="neu-text-extrude font-display font-bold text-5xl tracking-[0.6em] pl-3">NOVA</h1>
          <p className="label-caps mt-4 tracking-[0.4em]">Banking Reimagined</p>
        </div>
        <div className="w-64 neu-deep rounded-full h-2 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(90deg, var(--accent), var(--accent-2))",
              boxShadow: "-1px -1px 2px rgba(255,255,255,0.6), 1px 1px 2px rgba(108,99,255,0.3)",
              transition: "width 0.08s linear",
            }}
          />
        </div>
      </div>
    </main>
  );
}
