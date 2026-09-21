"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

export default function GuardianChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newPassword.length < 8) return setError("Your new password must be at least 8 characters.");
    const result = await authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: true });
    if (result.error) return setError(result.error.message || "Unable to change your password.");
    const response = await fetch("/api/guardian/change-password", { method: "POST" });
    if (!response.ok) return setError("Password changed, but the account status could not be updated.");
    router.replace("/guardian/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">Create your private password</h1>
        <p className="mt-2 text-sm text-slate-500">Your temporary guardian password must be changed before accessing the portal.</p>
        <div className="mt-6 space-y-4">
          <input required type="password" placeholder="Temporary password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full rounded-lg border px-3 py-2.5" />
          <input required minLength={8} type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full rounded-lg border px-3 py-2.5" />
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button className="w-full rounded-lg bg-slate-950 px-4 py-2.5 font-medium text-white">Change password</button>
        </div>
      </form>
    </main>
  );
}
