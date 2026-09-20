import { getApplicationSession, signOutApplication } from "@/lib/auth/compat";

export async function auth() { return getApplicationSession(); }
export async function signOut(options?: { redirectTo?: string }) { await signOutApplication(); if (options?.redirectTo) { const { redirect } = await import("next/navigation"); redirect(options.redirectTo); } }
