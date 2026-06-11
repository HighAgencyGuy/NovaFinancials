import { useEffect, useState } from "react";
import { BottomSheet } from "../BottomSheet";
import { NeuButton } from "../neu/NeuButton";
import { NeuInput, NeuSelect } from "../neu/NeuInput";
import { useStore, type Transaction, type TxnCategory, type TxnStatus, type TxnType } from "@/lib/store";

interface Props {
  userId: string;
  txn: Transaction | null;
  onClose: () => void;
}

const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function EditTransactionSheet({ userId, txn, onClose }: Props) {
  const edit = useStore(s => s.editTransaction);
  const del = useStore(s => s.deleteTransaction);
  const [form, setForm] = useState<Transaction | null>(txn);

  useEffect(() => { setForm(txn); }, [txn]);
  if (!form) return null;

  const save = () => {
    edit(userId, form.id, {
      type: form.type, category: form.category, amount: Number(form.amount),
      description: form.description, counterparty: form.counterparty,
      reference: form.reference, status: form.status, timestamp: form.timestamp,
      balanceBefore: Number(form.balanceBefore), balanceAfter: Number(form.balanceAfter),
    });
    onClose();
  };

  const remove = () => {
    if (confirm("Delete this transaction permanently?")) {
      del(userId, form.id);
      onClose();
    }
  };

  return (
    <BottomSheet open={!!txn} onClose={onClose} title="Edit Transaction">
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <NeuSelect label="Type" value={form.type} onChange={e => setForm({ ...form, type: e.target.value as TxnType })}
            options={[{ value: "credit", label: "Credit" }, { value: "debit", label: "Debit" }]} />
          <NeuSelect label="Status" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as TxnStatus })}
            options={[{ value: "completed", label: "Completed" }, { value: "pending", label: "Pending" }, { value: "failed", label: "Failed" }]} />
        </div>
        <NeuSelect label="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value as TxnCategory })}
          options={["transfer","wire","deposit","fee","investment","loan","admin","savings","card"].map(v => ({ value: v, label: v }))} />
        <NeuInput label="Amount" prefix="$" mono value={String(form.amount)} onChange={e => setForm({ ...form, amount: Number(e.target.value.replace(/[^\d.]/g, "")) || 0 })} />
        <NeuInput label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        <NeuInput label="Counterparty" value={form.counterparty} onChange={e => setForm({ ...form, counterparty: e.target.value })} />
        <NeuInput label="Reference" mono value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} />
        <div className="flex flex-col gap-2 w-full">
          <span className="label-caps">Date & Time</span>
          <div className="neu-deep rounded-[10px] flex items-center px-4 h-12">
            <input type="datetime-local" value={toLocalInput(form.timestamp)}
              onChange={e => setForm({ ...form, timestamp: new Date(e.target.value).toISOString() })}
              className="flex-1 bg-transparent outline-none text-text-dark" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NeuInput label="Balance Before" prefix="$" mono value={String(form.balanceBefore)} onChange={e => setForm({ ...form, balanceBefore: Number(e.target.value.replace(/[^\d.-]/g, "")) || 0 })} />
          <NeuInput label="Balance After" prefix="$" mono value={String(form.balanceAfter)} onChange={e => setForm({ ...form, balanceAfter: Number(e.target.value.replace(/[^\d.-]/g, "")) || 0 })} />
        </div>
        <div className="flex gap-3 mt-2">
          <NeuButton tone="negative" onClick={remove}>Delete</NeuButton>
          <NeuButton className="flex-1" onClick={onClose}>Cancel</NeuButton>
          <NeuButton tone="accent" className="flex-1" onClick={save}>Save</NeuButton>
        </div>
      </div>
    </BottomSheet>
  );
}
