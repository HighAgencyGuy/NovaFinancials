import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, Bell, Lock, CreditCard, ShieldAlert, LogOut } from "lucide-react";
import { NeuCard } from "@/components/neu/NeuCard";
import { NeuToggle } from "@/components/neu/NeuToggle";
import { NeuInput } from "@/components/neu/NeuInput";
import { useCurrentUser, useStore } from "@/lib/store";
import { NeuButton } from "@/components/neu/NeuButton";
import { BottomSheet } from "@/components/BottomSheet";

export const Route = createFileRoute("/app/settings")({
  component: Settings,
});

function Settings() {
  const u = useCurrentUser();
  const logout = useStore(s => s.logout);
  const changePin = useStore(s => s.changePin);
  const nav = useNavigate();
  const [push, setPush] = useState(true);
  const [pinSheet, setPinSheet] = useState(false);
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinMsg, setPinMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (!u) return null;

  const submitPin = () => {
    setPinMsg(null);
    if (newPin !== confirmPin) return setPinMsg({ ok: false, text: "PINs do not match" });
    const r = changePin(u.id, oldPin, newPin);
    if (!r.ok) return setPinMsg({ ok: false, text: r.error ?? "Failed" });
    setPinMsg({ ok: true, text: "PIN updated" });
    setOldPin(""); setNewPin(""); setConfirmPin("");
    setTimeout(() => { setPinSheet(false); setPinMsg(null); }, 900);
  };

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center gap-3">
        <Link to="/app/home" className="neu-raised w-10 h-10 rounded-full grid place-items-center active:[box-shadow:var(--neu-pressed)] shrink-0"><ChevronLeft size={18} /></Link>
        <h1 className="font-display font-semibold text-lg truncate">Settings</h1>
      </header>

      <NeuCard className="p-5 flex items-center gap-4">
        <div className="neu-pressed rounded-full w-14 h-14 grid place-items-center font-display font-semibold text-lg text-accent shrink-0">
          {u.fullName.split(" ").map(s => s[0]).slice(0,2).join("")}
        </div>
        <div className="min-w-0">
          <p className="font-display font-semibold truncate">{u.fullName}</p>
          <p className="text-xs text-text-muted truncate">{u.email}</p>
          <p className="font-mono text-[10px] text-text-muted mt-0.5 truncate">{u.accountNumber}</p>
        </div>
      </NeuCard>

      <div className="flex flex-col gap-3">
        <Row icon={Bell} title="Push Notifications" sub="Alerts on every transaction"><NeuToggle checked={push} onChange={setPush} /></Row>
        <ClickRow icon={Lock} title="Change PIN" sub="Update 4-digit transaction PIN" onClick={() => setPinSheet(true)} />
        <ClickRow icon={CreditCard} title="Manage Cards" sub="Freeze, virtual cards, limits" onClick={() => nav({ to: "/app/card" })} />
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

      <BottomSheet open={pinSheet} onClose={() => { setPinSheet(false); setPinMsg(null); }} title="Change PIN">
        <div className="flex flex-col gap-4">
          <NeuInput label="Current PIN" type="password" inputMode="numeric" maxLength={4} mono value={oldPin} onChange={e => setOldPin(e.target.value.replace(/\D/g, ""))} placeholder="••••" />
          <NeuInput label="New PIN" type="password" inputMode="numeric" maxLength={4} mono value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, ""))} placeholder="••••" />
          <NeuInput label="Confirm New PIN" type="password" inputMode="numeric" maxLength={4} mono value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ""))} placeholder="••••" />
          {pinMsg && <p className={`text-xs text-center font-semibold ${pinMsg.ok ? "text-positive" : "text-negative"}`}>{pinMsg.text}</p>}
          <NeuButton tone="accent" size="lg" onClick={submitPin} className="w-full">Update PIN</NeuButton>
        </div>
      </BottomSheet>
    </div>
  );
}

function Row({ icon: Icon, title, sub, children }: { icon: typeof Bell; title: React.ReactNode; sub: string; children: React.ReactNode }) {
  return (
    <NeuCard className="p-4 flex items-center gap-4">
      <div className="neu-pressed rounded-[14px] w-11 h-11 grid place-items-center shrink-0"><Icon size={16} className="text-accent" /></div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{title}</p>
        <p className="text-[11px] text-text-muted truncate">{sub}</p>
      </div>
      {children}
    </NeuCard>
  );
}

function ClickRow({ icon: Icon, title, sub, onClick }: { icon: typeof Bell; title: string; sub: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-left w-full">
      <NeuCard className="p-4 flex items-center gap-4 active:[box-shadow:var(--neu-pressed)]">
        <div className="neu-pressed rounded-[14px] w-11 h-11 grid place-items-center shrink-0"><Icon size={16} className="text-accent" /></div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{title}</p>
          <p className="text-[11px] text-text-muted truncate">{sub}</p>
        </div>
        <span className="text-text-muted">›</span>
      </NeuCard>
    </button>
  );
}
