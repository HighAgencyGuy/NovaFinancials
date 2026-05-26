import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, Bell, Lock, Fingerprint, Globe, CreditCard, ShieldAlert, LogOut } from "lucide-react";
import { NeuCard } from "@/components/neu/NeuCard";
import { NeuToggle } from "@/components/neu/NeuToggle";
import { useCurrentUser, useStore } from "@/lib/store";
import { NeuButton } from "@/components/neu/NeuButton";

export const Route = createFileRoute("/app/settings")({
  component: Settings,
});

function Settings() {
  const u = useCurrentUser();
  const logout = useStore(s => s.logout);
  const [push, setPush] = useState(true);
  const [biometric, setBiometric] = useState(false);
  const [dark, setDark] = useState(false);
  if (!u) return null;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center gap-3">
        <Link to="/app/home" className="neu-raised w-10 h-10 rounded-full grid place-items-center active:[box-shadow:var(--neu-pressed)]"><ChevronLeft size={18} /></Link>
        <h1 className="font-display font-semibold text-lg">Settings</h1>
      </header>

      <NeuCard className="p-5 flex items-center gap-4">
        <div className="neu-pressed rounded-full w-14 h-14 grid place-items-center font-display font-semibold text-lg text-accent">
          {u.fullName.split(" ").map(s => s[0]).slice(0,2).join("")}
        </div>
        <div>
          <p className="font-display font-semibold">{u.fullName}</p>
          <p className="text-xs text-text-muted">{u.email}</p>
          <p className="font-mono text-[10px] text-text-muted mt-0.5">{u.accountNumber}</p>
        </div>
      </NeuCard>

      <div className="flex flex-col gap-3">
        <Row icon={Bell} title="Push Notifications" sub="Alerts on every transaction"><NeuToggle checked={push} onChange={setPush} /></Row>
        <Row icon={Fingerprint} title="Biometric Login" sub="Use Face ID / fingerprint"><NeuToggle checked={biometric} onChange={setBiometric} /></Row>
        <Row icon={Globe} title="Dark Mode" sub="Coming soon"><NeuToggle checked={dark} onChange={setDark} /></Row>
        <Row icon={Lock} title="Change PIN" sub="Update 4-digit transaction PIN"><span className="text-text-muted">›</span></Row>
        <Row icon={CreditCard} title="Manage Cards" sub="Freeze, limits, statements"><span className="text-text-muted">›</span></Row>
      </div>

      <p className="label-caps mt-2">Danger Zone</p>
      <div className="flex flex-col gap-3">
        <Row icon={LogOut} title={<span className="text-negative">Logout</span>} sub="Sign out of this session">
          <NeuButton size="sm" tone="negative" onClick={() => { logout(); window.location.href = "/auth"; }}>Logout</NeuButton>
        </Row>
        <Row icon={ShieldAlert} title={<span className="text-negative">Close Account</span>} sub="Permanently delete your NOVA account">
          <span className="text-text-muted">›</span>
        </Row>
      </div>
    </div>
  );
}

function Row({ icon: Icon, title, sub, children }: { icon: typeof Bell; title: React.ReactNode; sub: string; children: React.ReactNode }) {
  return (
    <NeuCard className="p-4 flex items-center gap-4">
      <div className="neu-pressed rounded-[14px] w-11 h-11 grid place-items-center"><Icon size={16} className="text-accent" /></div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-[11px] text-text-muted">{sub}</p>
      </div>
      {children}
    </NeuCard>
  );
}
