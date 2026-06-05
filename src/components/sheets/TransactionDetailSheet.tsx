import { BottomSheet } from "../BottomSheet";
import { NGN } from "@/lib/format";
import { useCurrentUser } from "@/lib/store";
import type { Transaction } from "@/lib/store";

interface Props {
  txn: Transaction | null;
  onClose: () => void;
}

export function TransactionDetailSheet({ txn, onClose }: Props) {
  const u = useCurrentUser();
  return (
    <BottomSheet open={!!txn} onClose={onClose} title="Transaction Details">
      {txn && u && (
        <div className="flex flex-col gap-4">
          <div className="text-center py-2">
            <p className="label-caps">{txn.type === "credit" ? "Received" : "Sent"}</p>
            <p className={`font-mono text-3xl font-semibold mt-2 ${txn.type === "credit" ? "text-positive" : "text-negative"}`}>
              {txn.type === "credit" ? "+" : "-"}{NGN(txn.amount)}
            </p>
            <p className="text-[10px] text-text-muted mt-1 uppercase tracking-wider">{txn.status}</p>
          </div>

          <div className="neu-pressed rounded-[14px] p-4 grid gap-3 text-xs">
            <Row k="Reference" v={txn.reference} mono />
            <Row k={txn.type === "credit" ? "From" : "To"} v={txn.counterparty} />
            <Row k="Description" v={txn.description} />
            <Row k="Category" v={txn.category} />
            <Row k="Date" v={new Date(txn.timestamp).toLocaleString()} />
            <Row k="Balance Before" v={NGN(txn.balanceBefore)} mono />
            <Row k="Balance After" v={NGN(txn.balanceAfter)} mono />
            <Row k="Account" v={u.accountNumber} mono />
          </div>

          <p className="text-[10px] text-text-muted text-center">NOVA Bank • Banking Reimagined</p>
        </div>
      )}
    </BottomSheet>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-text-muted shrink-0">{k}</span>
      <span className={`text-right break-all ${mono ? "font-mono" : ""}`} style={{ color: "var(--text-dark)" }}>{v}</span>
    </div>
  );
}
