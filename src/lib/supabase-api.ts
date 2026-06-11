import { supabase } from "./supabase";
import {
  PROFILE_PUBLIC_COLUMNS,
  dbNotifToNotif,
  dbTxnToTransaction,
  fromKobo,
  profileToUser,
  toKobo,
} from "./profile-mapper";
import type { Profile } from "./database.types";
import type { LocalUserExtras, Notif, Transaction, User } from "./store";
import { newTxnRef } from "./format";

export async function fetchProfileById(
  id: string,
): Promise<Omit<Profile, "password_hash"> | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_PUBLIC_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export async function fetchTransactions(userId: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map(dbTxnToTransaction);
}

export async function fetchNotifications(userId: string): Promise<Notif[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map(dbNotifToNotif);
}

export async function hydrateUser(
  profile: Omit<Profile, "password_hash">,
  extras?: LocalUserExtras,
): Promise<User> {
  const user = profileToUser(profile, extras);
  user.transactions = await fetchTransactions(profile.id);
  return user;
}

export async function fetchApprovedUsers(excludeId?: string): Promise<User[]> {
  let query = supabase
    .from("profiles")
    .select(PROFILE_PUBLIC_COLUMNS)
    .eq("role", "user")
    .eq("status", "approved");

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data.map(p => profileToUser(p));
}

export async function findUserByAccountNumber(
  accountNumber: string,
): Promise<Omit<Profile, "password_hash"> | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_PUBLIC_COLUMNS)
    .eq("account_number", accountNumber.trim())
    .eq("status", "approved")
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export async function fetchAllUserProfiles(): Promise<User[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_PUBLIC_COLUMNS)
    .neq("role", "admin")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map(p => profileToUser(p));
}

export async function fetchAdminStats() {
  const [usersRes, pendingRes] = await Promise.all([
    supabase.from("profiles").select("balance").neq("role", "admin"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  const balances = usersRes.data ?? [];
  return {
    totalAccounts: balances.length,
    pendingCount: pendingRes.count ?? 0,
    systemBalance: balances.reduce((s, r) => s + fromKobo(r.balance), 0),
  };
}

export async function transferFunds(input: {
  senderId: string;
  recipientId: string;
  amount: number;
  description: string;
}) {
  const reference = newTxnRef();
  const { data, error } = await supabase.rpc("transfer_funds", {
    sender_id: input.senderId,
    recipient_id: input.recipientId,
    amount_kobo: toKobo(input.amount),
    description: input.description,
    reference,
  });

  if (error) return { ok: false as const, error: error.message };
  const result = data as { error?: string; success?: boolean; sender_balance?: number };
  if (result?.error) return { ok: false as const, error: result.error };
  return { ok: true as const, reference, senderBalance: fromKobo(result.sender_balance ?? 0) };
}

export async function approveAccount(userId: string) {
  const { error: updateErr } = await supabase
    .from("profiles")
    .update({ status: "approved", balance: 5_000_000 })
    .eq("id", userId);

  if (updateErr) return { ok: false, error: updateErr.message };

  await supabase.from("transactions").insert({
    user_id: userId,
    type: "credit",
    category: "admin",
    amount: 5_000_000,
    balance_before: 0,
    balance_after: 5_000_000,
    description: "Account opening credit",
    reference: newTxnRef(),
    counterparty: "NOVA Bank",
    status: "completed",
  });

  await supabase.from("notifications").insert({
    user_id: userId,
    title: "Account approved",
    message: "Welcome to NOVA. $50,000 opening credit applied.",
    type: "credit",
    read: false,
  });

  return { ok: true };
}

export async function updateAccountStatus(
  userId: string,
  status: Profile["status"],
) {
  const { error } = await supabase
    .from("profiles")
    .update({ status })
    .eq("id", userId);
  return { ok: !error, error: error?.message };
}

export async function adminFundAccount(userId: string, amount: number) {
  const profile = await fetchProfileById(userId);
  if (!profile) return { ok: false, error: "User not found" };

  const amountKobo = toKobo(amount);
  const balanceBefore = profile.balance;
  const balanceAfter = balanceBefore + amountKobo;

  const { error: updateErr } = await supabase
    .from("profiles")
    .update({ balance: balanceAfter })
    .eq("id", userId);

  if (updateErr) return { ok: false, error: updateErr.message };

  await supabase.from("transactions").insert({
    user_id: userId,
    type: "credit",
    category: "admin",
    amount: amountKobo,
    balance_before: balanceBefore,
    balance_after: balanceAfter,
    description: "Admin credit",
    reference: newTxnRef(),
    counterparty: "NOVA Admin",
    status: "completed",
  });

  await supabase.from("notifications").insert({
    user_id: userId,
    title: "Account funded",
    message: "Your account was credited.",
    type: "credit",
    read: false,
  });

  return { ok: true, balance: fromKobo(balanceAfter) };
}

export async function adminDebitAccount(
  userId: string,
  amount: number,
  description: string,
) {
  const profile = await fetchProfileById(userId);
  if (!profile) return { ok: false, error: "User not found" };

  const amountKobo = toKobo(amount);
  if (profile.balance < amountKobo) {
    return { ok: false, error: "Insufficient balance" };
  }

  const balanceBefore = profile.balance;
  const balanceAfter = balanceBefore - amountKobo;

  const { error: updateErr } = await supabase
    .from("profiles")
    .update({ balance: balanceAfter })
    .eq("id", userId);

  if (updateErr) return { ok: false, error: updateErr.message };

  await supabase.from("transactions").insert({
    user_id: userId,
    type: "debit",
    category: "admin",
    amount: amountKobo,
    balance_before: balanceBefore,
    balance_after: balanceAfter,
    description,
    reference: newTxnRef(),
    counterparty: "NOVA Admin",
    status: "completed",
  });

  return { ok: true, balance: fromKobo(balanceAfter) };
}

export async function insertNotification(
  userId: string,
  input: { title: string; message: string; type: "credit" | "debit" | "info" | "warning" },
) {
  await supabase.from("notifications").insert({
    user_id: userId,
    title: input.title,
    message: input.message,
    type: input.type,
    read: false,
  });
}

export async function markNotificationRead(userId: string, id: string) {
  await supabase.from("notifications").update({ read: true }).eq("id", id).eq("user_id", userId);
}

export async function markAllNotificationsRead(userId: string) {
  await supabase.from("notifications").update({ read: true }).eq("user_id", userId);
}

export async function deleteNotification(userId: string, id: string) {
  await supabase.from("notifications").delete().eq("id", id).eq("user_id", userId);
}
