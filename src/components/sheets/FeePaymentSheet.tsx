import { useMemo } from "react";
import { BottomSheet } from "../BottomSheet";
import { NeuButton } from "../neu/NeuButton";
import { useCurrentUser, useStore, CARD_TIERS, type PendingRequest } from "@/lib/store";
import { NGN } from "@/lib/format";
import { Copy } from "lucide-react";

interface Props {
  request: PendingRequest | null;
  onClose: () => void;
}

export function FeePaymentSheet({ request, onClose }: Props) {
  const u = useCurrentUser();
  const global = useStore(s => s.globalPayoutDetails);
  const markPaid = useStore(s => s.markFeePaid);
  const details = useMemo(() => {
    const merged = { ...global, ...(u?.payoutDetails ?? {}) };
    return merged;
  }, [u, global]);

  if (!u || !request) return null;

  const title =
    request.kind === "ledger_release"
      ? "Pay Release Fee"
      : `Pay ${request.tier ?? ""} Card Fee`.trim();

  const sub =
    request.kind === "ledger_release"
      ? `10% release fee on ${NGN(request.amount)}`
      : `Issuance fee for ${request.tier} (limit ${NGN(CARD_TIERS[request.tier ?? "Standard"].limit)})`;

  const isPaid = request.status === "fee_paid";
  const isApproved = request.status === "approved";
  const isRejected = request.status === "rejected";

  return (
    <BottomSheet open={!!request} onClose={onClose} title={title}>
      <div className="flex flex-col gap-4">
        <div className="neu-pressed rounded-[14px] p-4 text-center">
          <p className="label-caps">Fee Due</p>
          <p className="font-mono text-3xl font-semibold mt-2" style={{ color: "var(--accent-2)" }}>{NGN(request.fee)}</p>
          <p className="text-[11px] text-text-muted mt-1">{sub}</p>
        </div>
        
        {(isApproved || isRejected) ? (
          <div className={`neu-pressed rounded-[14px] p-4 text-center text-xs ${isApproved ? "text-positive" : "text-negative"}`}>
            {isApproved ? "Approved & released." : "Rejected by admin."}
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              <p className="label-caps">Pay via Direct Deposit</p>
              <PayoutRow label="Bank Details" value={details.directDeposit ?? "Not configured"} />

              <p className="label-caps mt-2">Or Pay via Crypto</p>
              <PayoutRow label={`Wallet (${details.cryptoNetwork ?? "BTC"})`} value={details.cryptoWallet ?? "Not configured"} mono />
            </div>

            <div className="neu-pressed rounded-[14px] p-3 text-[11px] text-text-mid leading-relaxed">
              Send <span className="font-mono font-semibold">{NGN(request.fee)}</span> using either method above.
              Once submitted, tap <b>I have paid</b>. Admin will verify and release within 30 minutes.
            </div>

            {isPaid ? (
              <NeuButton size="lg" disabled className="w-full">Awaiting admin verification…</NeuButton>
            ) : (
              <NeuButton size="lg" tone="accent" className="w-full" onClick={() => { markPaid(u.id, request.id); }}>
                I have paid
              </NeuButton>
            )}
          </>
        )}
      </div>
    </BottomSheet>
  );
}

function PayoutRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="neu-deep rounded-[10px] p-3 flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-text-muted uppercase tracking-wider">{label}</p>
        <p className={`text-xs mt-1 break-all ${mono ? "font-mono" : ""}`} style={{ color: "var(--text-dark)" }}>{value}</p>
      </div>
      <button
        onClick={() => navigator.clipboard?.writeText(value)}
        aria-label="Copy"
        className="neu-raised w-8 h-8 rounded-full grid place-items-center shrink-0 active:[box-shadow:var(--neu-pressed)]"
      >
        <Copy size={12} />
      </button>
    </div>
  );
}
