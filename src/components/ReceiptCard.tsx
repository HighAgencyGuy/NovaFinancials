import { forwardRef } from "react";
import { NGN } from "@/lib/format";
import type { Transaction } from "@/lib/store";

interface Props {
  txn: Transaction;
  from: string;
  fromAccount: string;
}

export const ReceiptCard = forwardRef<HTMLDivElement, Props>(
  ({ txn, from, fromAccount }, ref) => (
    <div
      ref={ref}
      className="neu-float rounded-[24px] p-6 flex flex-col gap-4"
      style={{ background: "var(--bg)" }}
    >
      <div className="flex items-center justify-between">
        <span className="neu-text-extrude font-display text-xl tracking-[0.3em] font-semibold">NOVA</span>
        <span className="neu-pressed rounded-full px-3 py-1 text-[10px] label-caps !text-positive">
          {txn.status}
        </span>
      </div>

      <div className="text-center py-4">
        <p className="label-caps">Amount</p>
        <p className="font-mono text-3xl font-semibold mt-2">{NGN(txn.amount)}</p>
      </div>

      <div className="neu-pressed rounded-[14px] p-4 grid gap-3 text-xs">
        <Row k="Reference" v={txn.reference} mono />
        <Row k="From" v={`${from}`} />
        <Row k="Source A/C" v={fromAccount} mono />
        <Row k="To" v={txn.counterparty} />
        <Row k="Category" v={txn.category} />
        <Row k="Description" v={txn.description} />
        <Row k="Date" v={new Date(txn.timestamp).toLocaleString()} />
      </div>

      <p className="text-[10px] text-text-muted text-center mt-2">
        NOVA Bank • Banking Reimagined
      </p>
    </div>
  )
);
ReceiptCard.displayName = "ReceiptCard";

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-text-muted">{k}</span>
      <span className={`text-text-dark text-right ${mono ? "font-mono" : ""}`}>{v}</span>
    </div>
  );
}
