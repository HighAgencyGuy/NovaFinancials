import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { useEffect } from "react";
import { NeuButton } from "@/components/neu/NeuButton";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem("nova-bank-store");
    if (!raw) throw redirect({ to: "/auth" });
    try {
      const s = JSON.parse(raw);
      const id = s.state?.currentUserId;
      const u = (s.state?.users ?? []).find((x: { id: string }) => x.id === id);
      if (!u || u.role !== "admin") throw redirect({ to: "/auth" });
    } catch { throw redirect({ to: "/auth" }); }
  },
  component: AdminLayout,
});

function AdminLayout() {
  const u = useStore(s => s.users.find(x => x.id === s.currentUserId));
  const logout = useStore(s => s.logout);
  const nav = useNavigate();
  useEffect(() => { if (!u || u.role !== "admin") nav({ to: "/auth" }); }, [u]);

  return (
    <div className="min-h-dvh pb-8" style={{ background: "var(--bg)" }}>
      <header className="sticky top-0 z-20 px-6 py-4 flex items-center justify-between neu-nav" style={{ background: "var(--bg)" }}>
        <div className="flex items-center gap-3">
          <Link to="/admin" className="font-display font-bold tracking-[0.3em] neu-text-extrude">NOVA</Link>
          <span className="neu-pressed rounded-full px-3 py-1 text-[10px] uppercase tracking-wider text-gold font-semibold">Master Control</span>
        </div>
        <NeuButton size="sm" tone="negative" onClick={() => { logout(); nav({ to: "/auth" }); }}>Sign Out</NeuButton>
      </header>
      <main className="max-w-5xl mx-auto px-6 pt-6">
        <Outlet />
      </main>
    </div>
  );
}
