import type { DbNotification, DbTransaction, Profile } from "./database.types";
import type {
  LocalUserExtras,
  Notif,
  Transaction,
  User,
} from "./store";

/** Balance in DB is kobo (smallest unit); app displays major currency units. */
export const fromKobo = (kobo: number) => kobo / 100;
export const toKobo = (amount: number) => Math.round(amount * 100);

export function dbTxnToTransaction(row: DbTransaction): Transaction {
  return {
    id: row.id,
    type: row.type,
    category: row.category,
    amount: fromKobo(row.amount),
    balanceBefore: fromKobo(row.balance_before),
    balanceAfter: fromKobo(row.balance_after),
    description: row.description,
    reference: row.reference,
    counterparty: row.counterparty ?? "",
    status: row.status,
    timestamp: row.created_at,
  };
}

export function dbNotifToNotif(row: DbNotification): Notif {
  return {
    id: row.id,
    title: row.title,
    body: row.message,
    kind:
      row.type === "warning"
        ? "warning"
        : row.type === "credit"
          ? "success"
          : row.type === "debit"
            ? "error"
            : "info",
    createdAt: row.created_at,
    read: row.read,
  };
}

export function profileToUser(
  profile: Omit<Profile, "password_hash">,
  extras?: LocalUserExtras,
): User {
  return {
    id: profile.id,
    fullName: profile.full_name,
    email: profile.email,
    passwordHash: "",
    role: profile.role,
    accountNumber: profile.account_number,
    accountType: profile.account_type,
    balance: fromKobo(profile.balance),
    ledgerBalance: extras?.ledgerBalance ?? 0,
    savingsBalance: extras?.savingsBalance ?? 0,
    savingsTxns: extras?.savingsTxns ?? [],
    status: profile.status,
    pinHash: profile.pin_hash ?? "",
    transactions: [],
    virtualCards: extras?.virtualCards ?? [],
    pendingRequests: extras?.pendingRequests ?? [],
    payoutDetails: extras?.payoutDetails,
    savingsAccruedAt: extras?.savingsAccruedAt,
    createdAt: profile.created_at,
    lastLogin: profile.last_login ?? profile.created_at,
    cardFrozen: extras?.cardFrozen,
  };
}

export const PROFILE_PUBLIC_COLUMNS =
  "id, created_at, full_name, email, account_number, account_type, balance, status, role, pin_hash, last_login";
