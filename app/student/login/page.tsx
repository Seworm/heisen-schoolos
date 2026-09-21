"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

export default function StudentLoginPage() {
  const router = useRouter();
  const [studentNumber, setStudentNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/student/resolve-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentNumber: studentNumber.trim().toUpperCase(),
          password,
        }),
      });
      const resolved = await response.json();

      if (!response.ok || !resolved.email) {
        setError("Invalid student login details.");
        return;
      }

      const result = await authClient.signIn.email({
        email: resolved.email,
        password,
      });
      if (result.error) {
        setError("Invalid student login details.");
        return;
      }

      router.replace("/student/dashboard");
      router.refresh();
    } catch {
      setError("Invalid student login details.");
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
          <div>
            <p className="text-sm font-bold tracking-wide text-[#006b3f]">Heisen SchoolOS</p>
            <p className="text-xs text-slate-500">Ghanaian school management</p>
          </div>
        </div>
        <h1 className="mt-1 text-2xl font-semibold">Student Portal</h1>
        <p className="mt-2 text-sm text-slate-500">
          Sign in with your student ID and temporary password. You will set a private password after your first login.
        </p>

        <div className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Student ID
            <input
              type="text"
              value={studentNumber}
              onChange={(event) => setStudentNumber(event.target.value)}
              required
              autoComplete="username"
              placeholder="e.g. PS/2026/001"
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-[#006b3f] focus:ring-2 focus:ring-[#fcd116]/60"
            />
          </label>
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
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={loading} className="w-full rounded-lg bg-[#006b3f] px-4 py-2.5 font-semibold text-white transition hover:bg-[#005530] focus:outline-none focus:ring-2 focus:ring-[#fcd116] focus:ring-offset-2 disabled:opacity-50">
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </div>
        <p className="mt-5 text-center text-sm text-slate-500">
          Use the temporary password provided by your school. You must change your password after signing in.
        </p>
      </form>
    </main>
  );
}
