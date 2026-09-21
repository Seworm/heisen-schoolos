"use client";

import { Suspense } from "react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { acceptStaffInvitation } from "../../(dashboard)/admin/actions";

function AcceptInvitationForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setPending(true); setMessage("");
    const result = await authClient.signUp.email({ email, password, name });
    if (result.error) { setMessage(result.error.message || "Unable to create your account."); setPending(false); return; }
    try { await acceptStaffInvitation({ token }); router.replace("/dashboard"); router.refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to accept invitation."); }
    finally { setPending(false); }
  }

  return <main className="min-h-screen bg-slate-50 px-4 py-12"><form onSubmit={submit} className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"><h1 className="text-2xl font-semibold">Join your school</h1><p className="mt-2 text-sm text-slate-500">Create your account to accept this staff invitation.</p><div className="mt-6 space-y-3"><input required value={name} onChange={e=>setName(e.target.value)} placeholder="Full name" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"/><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"/><input required minLength={8} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password (8+ characters)" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"/></div>{message&&<p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{message}</p>}<button disabled={pending||!token} className="mt-6 w-full rounded-lg bg-slate-950 px-4 py-3 text-sm font-medium text-white disabled:opacity-50">{pending?"Joining…":"Accept invitation"}</button></form></main>;
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-slate-50" />}>
      <AcceptInvitationForm />
    </Suspense>
  );
}
