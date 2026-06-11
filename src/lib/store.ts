import { create } from "zustand";
import { persist } from "zustand/middleware";
import { hash, newTxnRef, randomDigits, randomId } from "./format";
import { changePinFn, signInFn, signUpFn, verifyPinFn } from "./auth.server";
import {
  adminDebitAccount,
  adminFundAccount,
  approveAccount,
  deleteNotification,
  fetchNotifications,
  fetchProfileById,
  fetchTransactions,
  hydrateUser,
  insertNotification,
  markAllNotificationsRead,
  markNotificationRead,
  updateAccountStatus,
} from "./supabase-api";
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
  category: TxnCategory | "savings" | "card";
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
  Ruby: { fee: 275, limit: 25_000 },
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
  amount: number;
  fee: number;
  tier?: CardTier;
  note?: string;
  createdAt: string;
}

export interface PayoutDetails {
  directDeposit?: string;
  cryptoWallet?: string;
  cryptoNetwork?: string;
}

export interface LocalUserExtras {
  ledgerBalance: number;
  savingsBalance: number;
  savingsTxns: SavingsTxn[];
  virtualCards: VirtualCard[];
  pendingRequests: PendingRequest[];
  payoutDetails?: PayoutDetails;
  savingsAccruedAt?: string;
  cardFrozen?: boolean;
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
  currentUser: User | null;
  pinFailures: number;
  pinLockUntil: number | null;
}

interface AppState extends AuthState {
  extrasByUserId: Record<string, LocalUserExtras>;
  notifications: Record<string, Notif[]>;
  globalPayoutDetails: PayoutDetails;

  setCurrentUser: (user: User | null) => void;
  clearSession: () => void;
  refreshCurrentUser: () => Promise<void>;

  register: (input: {
    fullName: string; email: string; password: string;
    accountType: AccountType; pin: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  verifyPin: (pin: string) => Promise<{ ok: boolean; error?: string }>;
  updateUser: (id: string, patch: Partial<User>) => void;
  addTransaction: (userId: string, t: Omit<Transaction, "id" | "reference" | "timestamp" | "balanceBefore" | "balanceAfter">) => Transaction | null;
  editTransaction: (userId: string, txnId: string, patch: Partial<Transaction>) => void;
  deleteTransaction: (userId: string, txnId: string) => void;
  approveUser: (id: string) => Promise<{ ok: boolean; error?: string }>;
  rejectUser: (id: string) => Promise<{ ok: boolean; error?: string }>;
  suspendUser: (id: string) => Promise<{ ok: boolean; error?: string }>;
  reinstateUser: (id: string) => Promise<{ ok: boolean; error?: string }>;
  fundAccount: (id: string, amount: number) => Promise<{ ok: boolean; error?: string }>;
  debitAccount: (id: string, amount: number, description: string) => Promise<{ ok: boolean; error?: string }>;

  fundLedger: (id: string, amount: number, note?: string) => void;
  markFeePaid: (userId: string, reqId: string) => void;
  approveRequest: (userId: string, reqId: string) => void;
  rejectRequest: (userId: string, reqId: string) => void;
  requestVirtualCard: (userId: string, tier: CardTier) => void;
  freezeVirtualCard: (userId: string, cardId: string, frozen: boolean) => void;
  setUserPayoutDetails: (userId: string, details: PayoutDetails) => void;
  setGlobalPayoutDetails: (details: PayoutDetails) => void;
  depositToSavings: (userId: string, amount: number) => { ok: boolean; error?: string };
  withdrawFromSavings: (userId: string, amount: number) => { ok: boolean; error?: string };
  accrueSavingsInterest: (userId: string) => void;
  pushNotif: (userId: string, n: Omit<Notif, "id" | "createdAt" | "read">) => void;
  markNotifRead: (userId: string, id: string) => void;
  deleteNotif: (userId: string, id: string) => void;
  markAllRead: (userId: string) => void;
  changePin: (userId: string, oldPin: string, newPin: string) => Promise<{ ok: boolean; error?: string }>;
  syncNotifications: (userId: string) => Promise<void>;
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

const defaultExtras = (): LocalUserExtras => ({
  ledgerBalance: 0,
  savingsBalance: 0,
  savingsTxns: [],
  virtualCards: [],
  pendingRequests: [],
});

const getExtras = (state: AppState, userId: string): LocalUserExtras =>
  state.extrasByUserId[userId] ?? defaultExtras();

const patchExtras = (
  state: AppState,
  userId: string,
  patch: Partial<LocalUserExtras>,
): Record<string, LocalUserExtras> => ({
  ...state.extrasByUserId,
  [userId]: { ...getExtras(state, userId), ...patch },
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
      currentUser: null,
      currentUserId: null,
      extrasByUserId: {},
      notifications: {},
      globalPayoutDetails: {
        directDeposit: "NOVA Holdings • Routing 026073150 • Acct 8821-559014",
        cryptoWallet: "bc1qx2v8nova7demo9wallet0addrxxxxxxxxxxxx",
        cryptoNetwork: "Bitcoin (BTC)",
      },
      pinFailures: 0,
      pinLockUntil: null,

      setCurrentUser: user =>
        set({ currentUser: user, currentUserId: user?.id ?? null }),

      clearSession: () =>
        set({ currentUser: null, currentUserId: null, pinFailures: 0, pinLockUntil: null }),

      refreshCurrentUser: async () => {
        const id = get().currentUserId;
        if (!id) return;
        const profile = await fetchProfileById(id);
        if (!profile) return;
        const user = await hydrateUser(profile, getExtras(get(), id));
        const notifs = await fetchNotifications(id);
        set(s => ({
          currentUser: user,
          notifications: { ...s.notifications, [id]: notifs },
        }));
      },

      register: async ({ fullName, email, password, accountType, pin }) => {
        return signUpFn({ data: { fullName, email, password, accountType, pin } });
      },

      login: async (email, password) => {
        const result = await signInFn({ data: { email, password } });
        if (!result.ok) return result;

        const extras = getExtras(get(), result.profile.id);
        const user = await hydrateUser(result.profile, extras);
        const notifs = await fetchNotifications(result.profile.id);
        get().accrueSavingsInterest(user.id);

        set(s => ({
          currentUserId: result.profile.id,
          currentUser: user,
          pinFailures: 0,
          pinLockUntil: null,
          notifications: { ...s.notifications, [result.profile.id]: notifs },
        }));

        return { ok: true };
      },

      logout: () => get().clearSession(),

      verifyPin: async pin => {
        const { currentUserId, pinFailures, pinLockUntil } = get();
        if (pinLockUntil && Date.now() < pinLockUntil) {
          const s = Math.ceil((pinLockUntil - Date.now()) / 1000);
          return { ok: false, error: `Locked. Try again in ${s}s` };
        }
        if (!currentUserId) return { ok: false, error: "No session" };

        const result = await verifyPinFn({ data: { userId: currentUserId, pin } });
        if (!result.ok) {
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

      updateUser: (id, patch) => {
        const localKeys: (keyof LocalUserExtras)[] = [
          "ledgerBalance", "savingsBalance", "savingsTxns", "virtualCards",
          "pendingRequests", "payoutDetails", "savingsAccruedAt", "cardFrozen",
        ];
        const extrasPatch: Partial<LocalUserExtras> = {};
        const userPatch: Partial<User> = {};

        for (const [k, v] of Object.entries(patch)) {
          if (localKeys.includes(k as keyof LocalUserExtras)) {
            (extrasPatch as Record<string, unknown>)[k] = v;
          } else {
            (userPatch as Record<string, unknown>)[k] = v;
          }
        }

        set(s => {
          const next: Partial<AppState> = {};
          if (Object.keys(extrasPatch).length) {
            next.extrasByUserId = patchExtras(s, id, extrasPatch);
          }
          if (s.currentUser?.id === id && Object.keys(userPatch).length) {
            next.currentUser = { ...s.currentUser, ...userPatch };
          }
          if (s.currentUser?.id === id && Object.keys(extrasPatch).length) {
            next.currentUser = {
              ...(next.currentUser as User ?? s.currentUser),
              ...extrasPatch,
            };
          }
          return next;
        });
      },

      addTransaction: (userId, t) => {
        const u = get().currentUser?.id === userId ? get().currentUser : null;
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
        const u = get().currentUser;
        if (!u || u.id !== userId) return;
        get().updateUser(userId, {
          transactions: u.transactions.map(t => (t.id === txnId ? { ...t, ...patch } : t)),
        });
      },

      deleteTransaction: (userId, txnId) => {
        const u = get().currentUser;
        if (!u || u.id !== userId) return;
        get().updateUser(userId, {
          transactions: u.transactions.filter(t => t.id !== txnId),
        });
      },

      approveUser: async id => {
        const r = await approveAccount(id);
        if (get().currentUserId === id) await get().refreshCurrentUser();
        return r;
      },
      rejectUser: async id => updateAccountStatus(id, "rejected"),
      suspendUser: async id => updateAccountStatus(id, "suspended"),
      reinstateUser: async id => updateAccountStatus(id, "approved"),

      fundAccount: async (id, amount) => {
        const r = await adminFundAccount(id, amount);
        if (r.ok && get().currentUserId === id) await get().refreshCurrentUser();
        return r;
      },

      debitAccount: async (id, amount, description) => {
        const r = await adminDebitAccount(id, amount, description);
        if (r.ok && get().currentUserId === id) await get().refreshCurrentUser();
        return r;
      },

      fundLedger: (id, amount, note) => {
        const extras = getExtras(get(), id);
        const fee = Math.round(amount * 0.1 * 100) / 100;
        const req: PendingRequest = {
          id: randomId(), kind: "ledger_release", status: "awaiting_fee",
          amount, fee, note, createdAt: new Date().toISOString(),
        };
        get().updateUser(id, {
          ledgerBalance: extras.ledgerBalance + amount,
          pendingRequests: [req, ...extras.pendingRequests],
        });
        get().pushNotif(id, {
          title: "Incoming funds in ledger",
          body: `$${amount.toLocaleString()} pending. Pay 10% fee ($${fee.toLocaleString()}) to release.`,
          kind: "info",
          requestId: req.id,
        });
      },

      markFeePaid: (userId, reqId) => {
        const extras = getExtras(get(), userId);
        get().updateUser(userId, {
          pendingRequests: extras.pendingRequests.map(r =>
            r.id === reqId ? { ...r, status: "fee_paid" as PendingStatus } : r),
        });
        get().pushNotif(userId, {
          title: "Fee payment submitted",
          body: "Awaiting admin verification.",
          kind: "info",
          requestId: reqId,
        });
      },

      approveRequest: (userId, reqId) => {
        const extras = getExtras(get(), userId);
        const req = extras.pendingRequests.find(r => r.id === reqId);
        if (!req) return;

        if (req.kind === "ledger_release") {
          get().updateUser(userId, { ledgerBalance: Math.max(0, extras.ledgerBalance - req.amount) });
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
          const fresh = getExtras(get(), userId);
          get().updateUser(userId, { virtualCards: [card, ...fresh.virtualCards] });
          get().pushNotif(userId, {
            title: `${req.tier} card issued`,
            body: `Your new virtual card ending ${card.number.slice(-4)} is ready.`,
            kind: "success",
          });
        }

        const freshExtras = getExtras(get(), userId);
        get().updateUser(userId, {
          pendingRequests: freshExtras.pendingRequests.map(r =>
            r.id === reqId ? { ...r, status: "approved" as PendingStatus } : r),
        });
      },

      rejectRequest: (userId, reqId) => {
        const extras = getExtras(get(), userId);
        const req = extras.pendingRequests.find(r => r.id === reqId);
        if (!req) return;
        const patch: Partial<LocalUserExtras> = {
          pendingRequests: extras.pendingRequests.map(r =>
            r.id === reqId ? { ...r, status: "rejected" as PendingStatus } : r),
        };
        if (req.kind === "ledger_release") {
          patch.ledgerBalance = Math.max(0, extras.ledgerBalance - req.amount);
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
        const extras = getExtras(get(), userId);
        const fee = CARD_TIERS[tier].fee;
        const req: PendingRequest = {
          id: randomId(), kind: "virtual_card", tier, status: "awaiting_fee",
          amount: 0, fee, createdAt: new Date().toISOString(),
        };
        get().updateUser(userId, { pendingRequests: [req, ...extras.pendingRequests] });
        get().pushNotif(userId, {
          title: `${tier} card requested`,
          body: `Pay $${fee} processing fee to issue your card.`,
          kind: "info",
          requestId: req.id,
        });
      },

      freezeVirtualCard: (userId, cardId, frozen) => {
        const extras = getExtras(get(), userId);
        get().updateUser(userId, {
          virtualCards: extras.virtualCards.map(c => (c.id === cardId ? { ...c, frozen } : c)),
        });
      },

      setUserPayoutDetails: (userId, details) => {
        get().updateUser(userId, { payoutDetails: details });
      },

      setGlobalPayoutDetails: details => set({ globalPayoutDetails: details }),

      depositToSavings: (userId, amount) => {
        const u = get().currentUser;
        if (!u || u.id !== userId) return { ok: false, error: "No user" };
        if (amount <= 0) return { ok: false, error: "Invalid amount" };
        if (u.balance < amount) return { ok: false, error: "Insufficient main balance" };
        get().accrueSavingsInterest(userId);
        const fresh = get().currentUser!;
        const extras = getExtras(get(), userId);
        const newSavings = extras.savingsBalance + amount;
        const stxn: SavingsTxn = {
          id: randomId(), type: "credit", amount,
          description: "Deposit from main", timestamp: new Date().toISOString(),
          balanceAfter: newSavings,
        };
        get().updateUser(userId, {
          balance: fresh.balance - amount,
          savingsBalance: newSavings,
          savingsTxns: [stxn, ...extras.savingsTxns],
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
        const u = get().currentUser;
        if (!u || u.id !== userId) return { ok: false, error: "No user" };
        if (amount <= 0) return { ok: false, error: "Invalid amount" };
        get().accrueSavingsInterest(userId);
        const extras = getExtras(get(), userId);
        if (extras.savingsBalance < amount) return { ok: false, error: "Insufficient savings" };
        const newSavings = extras.savingsBalance - amount;
        const stxn: SavingsTxn = {
          id: randomId(), type: "debit", amount,
          description: "Withdrawal to main", timestamp: new Date().toISOString(),
          balanceAfter: newSavings,
        };
        get().updateUser(userId, {
          savingsBalance: newSavings,
          savingsTxns: [stxn, ...extras.savingsTxns],
          savingsAccruedAt: new Date().toISOString(),
        });
        get().addTransaction(userId, {
          type: "credit", category: "savings", amount,
          description: "Transfer from Savings", counterparty: "NOVA Savings",
          status: "completed",
        });
        return { ok: true };
      },

      accrueSavingsInterest: userId => {
        const u = get().currentUser;
        if (!u || u.id !== userId) return;
        const extras = getExtras(get(), userId);
        if (extras.savingsBalance <= 0) {
          if (!extras.savingsAccruedAt) {
            get().updateUser(userId, { savingsAccruedAt: new Date().toISOString() });
          }
          return;
        }
        const last = extras.savingsAccruedAt ? new Date(extras.savingsAccruedAt).getTime() : Date.now();
        const days = (Date.now() - last) / (1000 * 60 * 60 * 24);
        if (days < 0.001) return;
        const interest = extras.savingsBalance * SAVINGS_APY * (days / 365);
        if (interest < 0.01) {
          get().updateUser(userId, { savingsAccruedAt: new Date().toISOString() });
          return;
        }
        const newSavings = extras.savingsBalance + interest;
        const stxn: SavingsTxn = {
          id: randomId(), type: "credit", amount: interest,
          description: `Interest @ ${(SAVINGS_APY * 100).toFixed(2)}% APY`,
          timestamp: new Date().toISOString(),
          balanceAfter: newSavings,
        };
        get().updateUser(userId, {
          savingsBalance: newSavings,
          savingsTxns: [stxn, ...extras.savingsTxns],
          savingsAccruedAt: new Date().toISOString(),
        });
      },

      syncNotifications: async userId => {
        const notifs = await fetchNotifications(userId);
        set(s => ({ notifications: { ...s.notifications, [userId]: notifs } }));
      },

      pushNotif: (userId, n) => {
        const kindToType = { success: "credit", error: "debit", info: "info", warning: "warning" } as const;
        void insertNotification(userId, {
          title: n.title,
          message: n.body,
          type: kindToType[n.kind],
        });
        set(s => ({
          notifications: {
            ...s.notifications,
            [userId]: [
              { ...n, id: randomId(), createdAt: new Date().toISOString(), read: false },
              ...(s.notifications[userId] ?? []),
            ],
          },
        }));
      },

      markNotifRead: (userId, id) => {
        void markNotificationRead(userId, id);
        set(s => ({
          notifications: {
            ...s.notifications,
            [userId]: (s.notifications[userId] ?? []).map(n => (n.id === id ? { ...n, read: true } : n)),
          },
        }));
      },

      deleteNotif: (userId, id) => {
        void deleteNotification(userId, id);
        set(s => ({
          notifications: {
            ...s.notifications,
            [userId]: (s.notifications[userId] ?? []).filter(n => n.id !== id),
          },
        }));
      },

      markAllRead: userId => {
        void markAllNotificationsRead(userId);
        set(s => ({
          notifications: {
            ...s.notifications,
            [userId]: (s.notifications[userId] ?? []).map(n => ({ ...n, read: true })),
          },
        }));
      },

      changePin: async (userId, oldPin, newPin) => {
        const u = get().currentUser;
        if (!u || u.id !== userId) return { ok: false, error: "No user" };
        const result = await changePinFn({ data: { userId, oldPin, newPin } });
        if (result.ok) {
          get().updateUser(userId, { pinHash: "updated" });
        }
        return result;
      },
    }),
    {
      name: "nova-bank-store",
      partialize: s => ({
        currentUserId: s.currentUserId,
        currentUser: s.currentUser,
        extrasByUserId: s.extrasByUserId,
        notifications: s.notifications,
        globalPayoutDetails: s.globalPayoutDetails,
      }),
      merge: (persisted, current) => ({
        ...current,
        ...(persisted ?? {}),
      }),
    },
  ),
);

export const useCurrentUser = () => useStore(s => s.currentUser);
