"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const result = await authClient.signIn.email({
        email: email.trim().toLowerCase(),
        password,
      });

      if (result.error) {
        setError(result.error.message || "Invalid email or password.");
        return;
      }

      router.replace("/auth/continue");
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
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-sm font-bold tracking-wide text-[#006b3f]">
            Heisen SMS
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            Sign in
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Sign in to your school management account.
          </p>
        </div>

        <form
          onSubmit={submit}
          className="rounded-2xl border border-[#dfe7df] bg-white p-8 shadow-[0_20px_60px_rgba(0,61,34,0.12)]"
        >
          <div className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                placeholder="admin@school.com"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#006b3f] focus:ring-2 focus:ring-[#fcd116]/60"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#006b3f] focus:ring-2 focus:ring-[#fcd116]/60"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#006b3f] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#005530] focus:outline-none focus:ring-2 focus:ring-[#fcd116] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Signing inâ€¦" : "Sign in"}
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          School administrators and staff use this portal.
        </p>
      </div>
    </main>
  );
}

