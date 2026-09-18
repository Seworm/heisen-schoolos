"use client";

import { useState } from "react";

export default function StudentActivationPage() {
  const [studentNumber, setStudentNumber] = useState("");
  const [email, setEmail] = useState("");
  const [activationCode, setActivationCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>,
  ) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/student/activate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            studentNumber,
            email,
            activationCode,
            password,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            "Unable to activate your account.",
        );
        return;
      }

      setSuccess(
        "Your account has been activated successfully. You can now sign in.",
      );

      setStudentNumber("");
      setEmail("");
      setActivationCode("");
      setPassword("");
      setConfirmPassword("");
    } catch {
      setError(
        "Unable to connect to the server. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">
            Activate Student Account
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Use the activation code sent to your email
            to create your student account password.
          </p>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Student Number
            </label>

            <input
              type="text"
              value={studentNumber}
              onChange={(e) =>
                setStudentNumber(e.target.value)
              }
              placeholder="HDS-2026-001"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:ring-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="student@example.com"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:ring-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Activation Code
            </label>

            <input
              type="text"
              value={activationCode}
              onChange={(e) =>
                setActivationCode(
                  e.target.value.toUpperCase(),
                )
              }
              placeholder="A0554607"
              maxLength={8}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 font-mono tracking-widest outline-none focus:ring-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Create Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="Minimum 8 characters"
              minLength={8}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:ring-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Confirm Password
            </label>

            <input
              type="password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
              placeholder="Re-enter your password"
              minLength={8}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:ring-2"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-slate-950 px-4 py-2.5 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Activating..."
              : "Activate Account"}
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already activated?{" "}
          <a
            href="/student/login"
            className="font-medium text-slate-950 hover:underline"
          >
            Student sign in
          </a>
        </p>
      </form>
    </main>
  );
}