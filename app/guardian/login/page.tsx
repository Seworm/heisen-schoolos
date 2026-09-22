"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

export default function GuardianLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/guardian/resolve-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          password,
        }),
      });

      const resolved = await response.json();

      if (!response.ok || !resolved.email) {
        setError(resolved.error || "Invalid guardian login details.");
        return;
      }

      const result = await authClient.signIn.email({
        email: resolved.email,
        password,
      });

      if (result.error) {
        setError("Invalid guardian login details.");
        return;
      }

      router.replace("/guardian");
      router.refresh();
    } catch {
      setError("Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f8faf7] px-4 py-10">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#fcd116]/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-[#006b3f]/15 blur-3xl" />
      <form onSubmit={submit} className="relative w-full max-w-md rounded-2xl border border-[#dfe7df] bg-white p-8 shadow-[0_20px_60px_rgba(0,61,34,0.12)]">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#006b3f] text-lg font-bold text-[#fcd116]">H</span>
          <p className="text-sm font-bold tracking-wide text-[#006b3f]">Heisen SMS</p>
        </div>
        <h1 className="mt-1 text-2xl font-semibold">Parent / Guardian Portal</h1>
        <p className="mt-2 text-sm text-slate-500">
          Sign in with your registered email and phone number to view your child&apos;s academic information.
        </p>

        <div className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Temporary password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-[#006b3f] focus:ring-2 focus:ring-[#fcd116]/60"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Email address
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              placeholder="parent@email.com"
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-[#006b3f] focus:ring-2 focus:ring-[#fcd116]/60"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Phone number
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              required
              autoComplete="tel"
              placeholder="024 123 4567"
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-[#006b3f] focus:ring-2 focus:ring-[#fcd116]/60"
            />
          </label>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#006b3f] px-4 py-2.5 font-semibold text-white transition hover:bg-[#005530] focus:outline-none focus:ring-2 focus:ring-[#fcd116] focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </div>
      </form>
    </main>
  );
}
