// Node.js server functions only — bcryptjs is incompatible with Vercel Edge runtime.
import { createServerFn } from "@tanstack/react-start";
import bcrypt from "bcryptjs";
import { getServiceSupabase } from "./supabase.server";
import { PROFILE_PUBLIC_COLUMNS } from "./profile-mapper";
import { newAccountNumber } from "./format";
import type { Profile } from "./database.types";

type AuthProfile = Omit<Profile, "password_hash">;

export const signInFn = createServerFn({ method: "POST" })
  .inputValidator((data: { email: string; password: string }) => data)
  .handler(async ({ data }): Promise<{ ok: true; profile: AuthProfile } | { ok: false; error: string }> => {
    const db = getServiceSupabase();
    const { data: row, error } = await db
      .from("profiles")
      .select("*")
      .eq("email", data.email.toLowerCase())
      .maybeSingle();

    if (error || !row) {
      return { ok: false, error: "Invalid email or password" };
    }

    const match = await bcrypt.compare(data.password, row.password_hash);
    if (!match) {
      return { ok: false, error: "Invalid email or password" };
    }

    if (row.status === "pending") {
      return { ok: false, error: "Your account is pending approval." };
    }
    if (row.status === "suspended") {
      return { ok: false, error: "Your account has been suspended." };
    }
    if (row.status === "rejected") {
      return { ok: false, error: "Application rejected" };
    }

    await db
      .from("profiles")
      .update({ last_login: new Date().toISOString() })
      .eq("id", row.id);

    const { password_hash: _pw, ...profile } = row;
    return { ok: true, profile };
  });

export const signUpFn = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      fullName: string;
      email: string;
      password: string;
      accountType: Profile["account_type"];
      pin: string;
    }) => data,
  )
  .handler(async ({ data }): Promise<{ ok: true } | { ok: false; error: string }> => {
    const db = getServiceSupabase();
    const email = data.email.toLowerCase();

    const { data: existing } = await db
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      return { ok: false, error: "Email already registered" };
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const pinHash = await bcrypt.hash(data.pin, 12);

    const { data: profile, error } = await db
      .from("profiles")
      .insert({
        full_name: data.fullName,
        email,
        password_hash: passwordHash,
        account_number: newAccountNumber(),
        account_type: data.accountType,
        balance: 0,
        status: "pending",
        role: "user",
        pin_hash: pinHash,
      })
      .select("id")
      .single();

    if (error || !profile) {
      return { ok: false, error: error?.message ?? "Registration failed" };
    }

    await db.from("notifications").insert({
      user_id: profile.id,
      title: "Welcome to NOVA",
      message: "Your application has been received and is awaiting approval.",
      type: "info",
      read: false,
    });

    return { ok: true };
  });

export const verifyPinFn = createServerFn({ method: "POST" })
  .inputValidator((data: { userId: string; pin: string }) => data)
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    const db = getServiceSupabase();
    const { data: row, error } = await db
      .from("profiles")
      .select("pin_hash")
      .eq("id", data.userId)
      .maybeSingle();

    if (error || !row?.pin_hash) {
      return { ok: false, error: "No session" };
    }

    const match = await bcrypt.compare(data.pin, row.pin_hash);
    if (!match) {
      return { ok: false, error: "Wrong PIN" };
    }

    return { ok: true };
  });

export const changePinFn = createServerFn({ method: "POST" })
  .inputValidator((data: { userId: string; oldPin: string; newPin: string }) => data)
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    if (!/^\d{4}$/.test(data.newPin)) {
      return { ok: false, error: "PIN must be 4 digits" };
    }
    const db = getServiceSupabase();
    const { data: row, error } = await db
      .from("profiles")
      .select("pin_hash")
      .eq("id", data.userId)
      .maybeSingle();

    if (error || !row?.pin_hash) {
      return { ok: false, error: "No user" };
    }

    const match = await bcrypt.compare(data.oldPin, row.pin_hash);
    if (!match) {
      return { ok: false, error: "Current PIN incorrect" };
    }

    const pinHash = await bcrypt.hash(data.newPin, 12);
    await db.from("profiles").update({ pin_hash: pinHash }).eq("id", data.userId);
    return { ok: true };
  });
