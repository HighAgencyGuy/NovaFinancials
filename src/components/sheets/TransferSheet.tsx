import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BottomSheet } from "../BottomSheet";
import { NeuInput, NeuSelect, NeuTextarea } from "../neu/NeuInput";
import { NeuButton } from "../neu/NeuButton";
import { PinPad } from "../PinPad";
import { ReceiptCard } from "../ReceiptCard";
import { useCurrentUser, useStore } from "@/lib/store";
import { NGN } from "@/lib/format";
import { banks, banksByCountry, countries, currencies } from "@/constants/tips";
import html2canvas from "html2canvas";

type Kind = "local" | "wire";
interface Props { open: boolean; kind: Kind; onClose: () => void; }
type Step = "form" | "pin" | "success";

export function TransferSheet({ open, kind, onClose }: Props) {
  const u = useCurrentUser();
  const addTxn = useStore(s => s.addTransaction);
  const pushNotif = useStore(s => s.pushNotif);
  const allUsers = useStore(s => s.users);
  const otherUsers = useMemo(
    () => allUsers.filter(x => x.role === "user" && x.id !== u?.id && x.status === "approved"),
    [allUsers, u?.id]
  );

  const [step, setStep] = useState<Step>("form");
  const [recipientMode, setRecipientMode] = useState<"select" | "manual">("manual");
  const [recipient, setRecipient] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [country, setCountry] = useState("United States");
  const countryBanks = useMemo(() => banksByCountry[country] ?? banks, [country]);
  const [bank, setBank] = useState(countryBanks[0]);
  const [swift, setSwift] = useState("");
  const [iban, setIban] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [amount, setAmount] = useState("");
  const [narration, setNarration] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [txnId, setTxnId] = useState<string | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  // Auto-resolve recipient name from manually entered account number
  const verifiedUser = useMemo(() => {
    if (kind !== "local" || recipientMode !== "manual") return null;
    const clean = accountNumber.trim();
    if (clean.length < 4) return null;
    return otherUsers.find(x => x.accountNumber.toLowerCase() === clean.toLowerCase()) ?? null;
  }, [accountNumber, otherUsers, recipientMode, kind]);

  const reset = () => {
    setStep("form"); setRecipient(""); setAccountNumber(""); setRecipientName("");
    setCountry("United States"); setBank((banksByCountry["United States"] ?? banks)[0]);
    setSwift(""); setIban(""); setCurrency("USD");
    setAmount(""); setNarration(""); setErr(null); setTxnId(null);
    setRecipientMode("manual");
  };
  const close = () => { reset(); onClose(); };

  const submit = () => {
    setErr(null);
    const amt = Number(amount);
    if (!amt || amt <= 0) return setErr("Enter a valid amount");
    if (!u) return;
    const fee = kind === "wire" ? 2500 : 0;
    if (amt + fee > u.balance) return setErr("Insufficient balance");
    if (kind === "local") {
      if (recipientMode === "select") {
        if (!recipient) return setErr("Select a recipient");
      } else {
        if (!verifiedUser) return setErr("Account number not found or not yet approved");
      }
    } else {
      if (!recipientName || !swift || !iban) return setErr("Fill all wire details");
    }
    setStep("pin");
  };

  const finalize = () => {
    if (!u) return;
    const amt = Number(amount);
    const fee = kind === "wire" ? 2500 : 0;
    const localRecipient = recipientMode === "select"
      ? otherUsers.find(x => x.id === recipient)
      : verifiedUser;
    const counterparty = kind === "local"
      ? (localRecipient?.fullName ?? "Recipient")
      : `${recipientName} (${bank})`;
    const txn = addTxn(u.id, {
      type: "debit",
      category: kind === "local" ? "transfer" : "wire",
      amount: amt,
      description: narration || (kind === "local" ? "Local transfer" : "Wire transfer"),
      counterparty,
      status: kind === "wire" ? "pending" : "completed",
    });
    if (fee > 0) {
      addTxn(u.id, { type: "debit", category: "fee", amount: fee, description: "Wire transfer fee", counterparty: "NOVA Bank", status: "completed" });
    }
    if (kind === "local" && txn && localRecipient) {
      const rtxn = addTxn(localRecipient.id, { type: "credit", category: "transfer", amount: amt, description: narration || "Transfer received", counterparty: u.fullName, status: "completed" });
      pushNotif(localRecipient.id, { title: "Money received", body: `${u.fullName} sent you ${NGN(amt)}`, kind: "success", txnId: rtxn?.id });
    }
    pushNotif(u.id, { title: kind === "wire" ? "Wire submitted" : "Transfer sent", body: `${NGN(amt)} to ${counterparty}`, kind: "success", txnId: txn?.id });
    setTxnId(txn?.id ?? null);
    setStep("success");
  };

  const downloadReceipt = async () => {
    const el = receiptRef.current;
    if (!el) return;
    const canvas = await html2canvas(el, { backgroundColor: "#dde1e7", scale: 2 });
    const link = document.createElement("a");
    link.download = `nova-receipt-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const txn = u?.transactions.find(t => t.id === txnId);

  return (
    <BottomSheet open={open} onClose={close} title={kind === "local" ? "Local Transfer" : "Wire Transfer"}>
      <AnimatePresence mode="wait">
        {step === "form" && (
          <motion.div key="form" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="flex flex-col gap-4">
            {kind === "local" ? (
              <div className="flex flex-col gap-3">
                <div className="neu-deep rounded-full p-1 flex">
                  {(["manual", "select"] as const).map(m => (
                    <button key={m} onClick={() => setRecipientMode(m)} type="button"
                      className={`flex-1 h-8 text-[10px] font-semibold uppercase tracking-wider rounded-full ${recipientMode === m ? "neu-raised text-accent" : "text-text-muted"}`}>
                      {m === "manual" ? "Account #" : "Saved"}
                    </button>
                  ))}
                </div>
                {recipientMode === "manual" ? (
                  <div className="flex flex-col gap-2">
                    <NeuInput label="Recipient Account Number" mono value={accountNumber}
                      onChange={e => setAccountNumber(e.target.value.trim())}
                      placeholder="NOVA-XXXXXXXXXX" />
                    {accountNumber.length >= 4 && (
                      verifiedUser ? (
                        <div className="neu-pressed rounded-[12px] px-4 py-3 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full grid place-items-center text-[11px] font-semibold neu-raised text-accent shrink-0">
                            {verifiedUser.fullName.split(" ").map(s => s[0]).slice(0,2).join("")}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold truncate" style={{ color: "var(--positive)" }}>✓ {verifiedUser.fullName}</p>
                            <p className="text-[10px] text-text-muted truncate">{verifiedUser.accountType} • Verified</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-negative px-2">Account not found</p>
                      )
                    )}
                  </div>
                ) : (
                  <NeuSelect
                    label="Recipient"
                    value={recipient}
                    onChange={e => setRecipient(e.target.value)}
                    options={[{ value: "", label: "Select recipient" }, ...otherUsers.map(x => ({ value: x.id, label: `${x.fullName} • ${x.accountNumber}` }))]}
                  />
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><NeuInput label="Recipient Name" value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="John Smith" /></div>
                <NeuSelect label="Country" value={country} onChange={e => { const c = e.target.value; setCountry(c); setBank((banksByCountry[c] ?? banks)[0]); }} options={countries.map(c => ({ value: c, label: c }))} />
                <NeuSelect label="Bank" value={bank} onChange={e => setBank(e.target.value)} options={countryBanks.map(b => ({ value: b, label: b }))} />
                <NeuInput label="SWIFT" value={swift} mono onChange={e => setSwift(e.target.value.toUpperCase())} placeholder="GTBINGLA" />
                <NeuInput label="IBAN" value={iban} mono onChange={e => setIban(e.target.value.toUpperCase())} placeholder="GB29 ..." />
                <div className="col-span-2"><NeuSelect label="Currency" value={currency} onChange={e => setCurrency(e.target.value)} options={currencies.map(c => ({ value: c, label: c }))} /></div>
              </div>
            )}
            <NeuInput label="Amount" prefix="$" mono inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value.replace(/[^\d.]/g, ""))} placeholder="0.00" hint={u ? `Available: ${NGN(u.balance)}` : ""} />
            <NeuTextarea label="Narration" rows={2} maxLength={80} value={narration} onChange={e => setNarration(e.target.value)} placeholder="What's it for?" />
            {kind === "wire" && (
              <div className="neu-pressed rounded-full px-4 py-2 text-xs text-text-muted self-start">Fee: {NGN(2500)}</div>
            )}
            {err && <p className="text-xs text-negative text-center">{err}</p>}
            <NeuButton size="lg" tone="accent" onClick={submit} className="w-full mt-2">
              Send {amount ? NGN(Number(amount) || 0) : ""}
            </NeuButton>
          </motion.div>
        )}

        {step === "pin" && (
          <motion.div key="pin" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
            <PinPad onSuccess={finalize} onCancel={() => setStep("form")} />
          </motion.div>
        )}

        {step === "success" && txn && (
          <motion.div key="ok" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
            <div className="flex flex-col items-center gap-3 py-2">
              <motion.svg width="64" height="64" viewBox="0 0 48 48">
                <motion.path d="M12 24 L20 32 L36 16" fill="none" stroke="var(--positive)" strokeWidth="4" strokeLinecap="round"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4 }} />
              </motion.svg>
              <p className="font-display font-semibold">{kind === "wire" ? "Wire submitted" : "Transfer complete"}</p>
            </div>
            {u && <ReceiptCard ref={receiptRef} txn={txn} from={u.fullName} fromAccount={u.accountNumber} />}
            <div className="flex gap-3">
              <NeuButton className="flex-1" onClick={downloadReceipt}>Download PNG</NeuButton>
              <NeuButton className="flex-1" tone="accent" onClick={close}>Done</NeuButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </BottomSheet>
  );
}
