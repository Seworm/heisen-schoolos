"use client";

import { useState } from "react";
import { createStaffInvitation } from "./actions";

export default function StaffAccessForm({
  schools,
  currentSchoolId,
  isPlatformAdmin,
}: {
  schools: Array<{ id: string; name: string }>;
  currentSchoolId: string;
  isPlatformAdmin: boolean;
}) {
  const [schoolId, setSchoolId] = useState(currentSchoolId);
  const [email,setEmail]=useState(""); const [firstName,setFirstName]=useState(""); const [lastName,setLastName]=useState(""); const [role,setRole]=useState("teacher"); const [message,setMessage]=useState(""); const [password,setPassword]=useState(""); const [pending,setPending]=useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>){event.preventDefault();setPending(true);setMessage("");try{const result=await createStaffInvitation({email,firstName,lastName,role,schoolId:isPlatformAdmin?schoolId:undefined});setMessage(result.emailSent ? "Invitation email sent. The staff member will create their own password." : "Invitation created. Configure RESEND_API_KEY to send it automatically, or copy the link below.");setPassword(result.inviteUrl);setEmail("");setFirstName("");setLastName("");}catch(error){setMessage(error instanceof Error?error.message:"Unable to create invitation.");}finally{setPending(false);}}
  return <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold">Invite staff</h2><p className="mt-1 text-sm text-slate-500">The link expires in seven days. The invitee creates their own password.</p>{isPlatformAdmin&&<select required value={schoolId} onChange={e=>setSchoolId(e.target.value)} className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="">Select school</option>{schools.map(school=><option key={school.id} value={school.id}>{school.name}</option>)}</select>}<div className="mt-4 grid gap-3 sm:grid-cols-2"><input required value={firstName} onChange={e=>setFirstName(e.target.value)} placeholder="First name" className="rounded-lg border border-slate-300 px-3 py-2 text-sm"/><input required value={lastName} onChange={e=>setLastName(e.target.value)} placeholder="Last name" className="rounded-lg border border-slate-300 px-3 py-2 text-sm"/><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2"/><select value={role} onChange={e=>setRole(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="teacher">Teacher</option><option value="headteacher">Headteacher</option><option value="principal">Principal</option><option value="accountant">Accountant</option><option value="bursar">Bursar</option><option value="secretary">Secretary</option><option value="librarian">Librarian</option><option value="nurse">Nurse</option><option value="school_admin">School admin</option></select><button disabled={pending} className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{pending?"Creating…":"Create invitation"}</button></div>{message&&<div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{message}{password&&<code className="mt-2 block break-all font-mono font-semibold">{password}</code>}</div>}</form>;
}
