import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NeuButton } from "@/components/neu/NeuButton";
import { NeuInput, NeuSelect } from "@/components/neu/NeuInput";
import { useStore, type AccountType } from "@/lib/store";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

type Tab = "signin" | "register";

function AuthPage() {
  const [tab, setTab] = useState<Tab>("signin");
  const navigate = useNavigate();
  const login = useStore(s => s.login);
  const register = useStore(s => s.register);
  const users = useStore(s => s.users);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("Savings");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const strength = pwStrength(password);

  const handleSignIn = () => {
    setErr(null);
    const r = login(email, password);
    if (!r.ok) return setErr(r.error!);
    const u = users.find(x => x.email.toLowerCase() === email.toLowerCase());
    if (u?.role === "admin") navigate({ to: "/admin" });
    else if (u?.status === "suspended" || u?.status === "pending") navigate({ to: "/locked" });
    else navigate({ to: "/app/home" });
  };

  const handleRegister = () => {
    setErr(null);
    if (!fullName.trim()) return setErr("Enter your full name");
    if (!/^.+@.+\..+$/.test(email)) return setErr("Enter a valid email");
    if (strength < 2) return setErr("Password too weak");
    if (password !== confirmPassword) return setErr("Passwords do not match");
    if (!/^\d{4}$/.test(pin)) return setErr("PIN must be 4 digits");
    if (pin !== confirmPin) return setErr("PINs do not match");
    const r = register({ fullName, email, password, accountType, pin });
    if (!r.ok) return setErr(r.error!);
    setSuccess(true);
    setTimeout(() => { setSuccess(false); setTab("signin"); }, 1600);
  };

  const fillAdmin = () => {
    setTab("signin"); setEmail("admin@novabank.com"); setPassword("Admin@2025");
  };

  return (
    <main className="min-h-dvh grid place-items-center p-6" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="neu-text-extrude font-display font-bold text-3xl tracking-[0.2em] pl-1">NOVA</h1>
          <p className="mt-2 uppercase font-semibold" style={{ color: "var(--text-muted)", fontSize: "9px", letterSpacing: "0.15em" }}>Banking Reimagined</p>
        </div>

        <div className="neu-deep rounded-[12px] p-1 flex w-full relative">
          {(["signin", "register"] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setErr(null); }}
              className="relative flex-1 h-10 text-xs font-semibold uppercase tracking-wider"
            >
              {tab === t && (
                <motion.div
                  layoutId="tab-pill"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="absolute inset-0 rounded-[9px]"
                  style={{ background: "var(--text-dark)", boxShadow: "var(--neu-raised)" }}
                />
              )}
              <span className="relative" style={{ color: tab === t ? "var(--bg)" : "var(--text-muted)" }}>
                {t === "signin" ? "Sign In" : "Register"}
              </span>
            </button>
          ))}
        </div>

        <div className="w-full neu-float rounded-[16px] p-6 flex flex-col gap-4">
          <AnimatePresence mode="wait">
            {tab === "signin" ? (
              <motion.div key="si" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex flex-col gap-4">
                <NeuInput label="Email" type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} />
                <NeuInput label="Password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
                <NeuButton size="lg" className="w-full mt-2 rounded-[12px]" style={{ background: "var(--text-dark)", color: "var(--bg)", letterSpacing: "0.05em" }} onClick={handleSignIn}>Sign In</NeuButton>
              </motion.div>

            ) : (
              <motion.div key="rg" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-4">
                <NeuInput label="Full Name" placeholder="Jane Doe" value={fullName} onChange={e => setFullName(e.target.value)} />
                <NeuInput label="Email" type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} />
                <NeuInput label="Password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
                <div className="neu-deep rounded-full h-2 overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{
                      width: `${(strength / 4) * 100}%`,
                      background: strength < 2 ? "var(--negative)" : strength < 3 ? "var(--gold)" : "var(--positive)",
                    }} />
                </div>
                <NeuSelect
                  label="Account Type"
                  value={accountType}
                  onChange={e => setAccountType(e.target.value as AccountType)}
                  options={[
                    { value: "Savings", label: "Savings" },
                    { value: "Checking", label: "Checking" },
                    { value: "Premium", label: "Premium" },
                    { value: "Business", label: "Business" },
                  ]}
                />
                <NeuInput label="4-Digit Transaction PIN" type="password" inputMode="numeric" maxLength={4} placeholder="••••" value={pin} mono onChange={e => setPin(e.target.value.replace(/\D/g, ""))} />
                <NeuButton size="lg" className="w-full mt-2 rounded-[12px]" style={{ background: "var(--text-dark)", color: "var(--bg)", letterSpacing: "0.05em" }} onClick={handleRegister}>Create Account</NeuButton>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {err && <motion.p initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="text-xs text-negative text-center font-semibold">{err}</motion.p>}
            {success && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex flex-col items-center gap-2">
                <motion.svg width="48" height="48" viewBox="0 0 48 48">
                  <motion.path
                    d="M12 24 L20 32 L36 16" fill="none" stroke="var(--positive)" strokeWidth="4" strokeLinecap="round"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4 }}
                  />
                </motion.svg>
                <p className="text-xs text-positive font-semibold">Application submitted — awaiting approval</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button onClick={fillAdmin} className="text-[10px] underline" style={{ color: "var(--text-placeholder)" }}>
          Admin portal access
        </button>
      </div>
    </main>
  );
}

function pwStrength(p: string): number {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
}
