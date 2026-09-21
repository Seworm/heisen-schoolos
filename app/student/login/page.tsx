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
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-slate-500">Heisen SchoolOS</p>
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
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-500"
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
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-500"
            />
          </label>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={loading} className="w-full rounded-lg bg-slate-950 px-4 py-2.5 font-medium text-white disabled:opacity-50">
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </div>
        <p className="mt-5 text-center text-sm text-slate-500">
          Use the date of birth recorded by your school. You must change your password after signing in.
        </p>
      </form>
    </main>
  );
}
