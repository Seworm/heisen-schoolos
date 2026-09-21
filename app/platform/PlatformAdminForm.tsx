"use client";

import { useState } from "react";
import { createPlatformAdmin } from "./actions";

export default function PlatformAdminForm() {
  const [form, setForm] = useState({ email: "", firstName: "", lastName: "" });
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    try {
      const result = await createPlatformAdmin(form);
      setMessage(`Co-admin account created for ${result.email}. Temporary password: ${result.temporaryPassword}`);
      setForm({ email: "", firstName: "", lastName: "" });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create co-admin.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Platform access</p>
      <h2 className="mt-2 font-bold">Add a co-admin</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <input required placeholder="First name" value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        <input required placeholder="Last name" value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        <input required type="email" placeholder="Email address" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
      </div>
      <button disabled={pending} className="mt-3 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{pending ? "Creating…" : "Create co-admin"}</button>
      {message && <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{message}</p>}
    </form>
  );
}
