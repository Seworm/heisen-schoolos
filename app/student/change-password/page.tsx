"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

export default function ChangePasswordPage() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (newPassword.length < 8) {
      setError("Your new password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });

      if (result.error) {
        setError(
          result.error.message || "Unable to change your password.",
        );
        return;
      }

      const response = await fetch("/api/student/change-password", {
        method: "POST",
      });

      if (!response.ok) {
        setError(
          "Your password was changed, but your account could not be updated. Please contact your school administrator.",
        );
        return;
      }

      router.replace("/student/dashboard");
      router.refresh();
    } catch {
      setError("Unable to change your password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <p className="text-sm font-medium text-slate-500">
          Heisen SMS
        </p>

        <h1 className="mt-1 text-2xl font-semibold text-slate-950">
          Change your password
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          This is your first login. You must create a new password before
          accessing the student portal.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="currentPassword"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Temporary password
            </label>

            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(event) =>
                setCurrentPassword(event.target.value)
              }
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-500"
            />
          </div>

          <div>
            <label
              htmlFor="newPassword"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              New password
            </label>

            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-500"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Confirm new password
            </label>

            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-500"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-slate-950 px-4 py-2.5 font-medium text-white disabled:opacity-50"
          >
            {loading ? "Changing password…" : "Change password"}
          </button>
        </div>
      </form>
    </main>
  );
}

