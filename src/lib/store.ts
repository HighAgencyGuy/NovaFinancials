import { create } from "zustand";
import { persist } from "zustand/middleware";
import { hash, newAccountNumber, newTxnRef, randomId } from "./format";

export type Role = "user" | "admin";
export type AccountType = "Savings" | "Checking" | "Premium" | "Business";
export type AccountStatus = "pending" | "approved" | "suspended" | "rejected";
export type TxnType = "credit" | "debit";
export type TxnCategory =
  | "transfer" | "wire" | "deposit" | "fee" | "investment" | "loan" | "admin";
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

export interface User {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: Role;
  accountNumber: string;
  accountType: AccountType;
  balance: number;
  status: AccountStatus;
  pinHash: string;
  transactions: Transaction[];
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
  // actions
  register: (input: {
    fullName: string; email: string; password: string;
    accountType: AccountType; pin: string;
  }) => { ok: boolean; error?: string };
  login: (email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  verifyPin: (pin: string) => { ok: boolean; error?: string };
  updateUser: (id: string, patch: Partial<User>) => void;
  addTransaction: (userId: string, t: Omit<Transaction, "id" | "reference" | "timestamp" | "balanceBefore" | "balanceAfter">) => Transaction | null;
  approveUser: (id: string) => void;
  rejectUser: (id: string) => void;
  suspendUser: (id: string) => void;
  reinstateUser: (id: string) => void;
  fundAccount: (id: string, amount: number) => void;
  debitAccount: (id: string, amount: number, description: string) => void;
  pushNotif: (userId: string, n: Omit<Notif, "id" | "createdAt" | "read">) => void;
  markNotifRead: (userId: string, id: string) => void;
  deleteNotif: (userId: string, id: string) => void;
  markAllRead: (userId: string) => void;
}

export interface Notif {
  id: string;
  title: string;
  body: string;
  kind: "success" | "info" | "warning" | "error";
  createdAt: string;
  read: boolean;
}

const seedAdmin = (): User => ({
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
  transactions: [],
  createdAt: new Date().toISOString(),
  lastLogin: new Date().toISOString(),
});

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      users: [seedAdmin()],
      notifications: {},
      currentUserId: null,
      pinFailures: 0,
      pinLockUntil: null,

      register: ({ fullName, email, password, accountType, pin }) => {
        const exists = get().users.some(u => u.email.toLowerCase() === email.toLowerCase());
        if (exists) return { ok: false, error: "Email already registered" };
        const user: User = {
          id: randomId(),
          fullName,
          email,
          passwordHash: hash(password),
          role: "user",
          accountNumber: newAccountNumber(),
          accountType,
          balance: 0,
          status: "pending",
          pinHash: hash(pin),
          transactions: [],
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };
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
          body: "Welcome to NOVA. ₦50,000 opening credit applied.",
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
    }),
    {
      name: "nova-bank-store",
      partialize: (s) => ({ users: s.users, notifications: s.notifications, currentUserId: s.currentUserId }),
    }
  )
);

export const useCurrentUser = () => {
  const id = useStore(s => s.currentUserId);
  return useStore(s => s.users.find(u => u.id === id) ?? null);
};
