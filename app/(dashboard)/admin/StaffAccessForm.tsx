"use client";

import { useState } from "react";
import { createStaffAccess } from "./actions";

export default function StaffAccessForm({
  schools,
  currentSchoolId,
}: {
  schools: Array<{ id: string; name: string }>;
  currentSchoolId: string;
}) {
  const isPlatformAdmin = schools.length > 0;
  const [schoolId, setSchoolId] = useState(currentSchoolId);
  const [email,setEmail]=useState(""); const [firstName,setFirstName]=useState(""); const [lastName,setLastName]=useState(""); const [role,setRole]=useState("teacher"); const [message,setMessage]=useState(""); const [password,setPassword]=useState(""); const [pending,setPending]=useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>){event.preventDefault();setPending(true);setMessage("");setPassword("");try{const result=await createStaffAccess({email,firstName,lastName,role,schoolId:isPlatformAdmin?schoolId:undefined});setMessage(`Account created for ${result.email}. Give the temporary password securely and require a password change.`);setPassword(result.temporaryPassword);setEmail("");setFirstName("");setLastName("");}catch(error){setMessage(error instanceof Error?error.message:"Unable to create account.");}finally{setPending(false);}}
  return <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold">Create staff access</h2>{isPlatformAdmin&&<select required value={schoolId} onChange={e=>setSchoolId(e.target.value)} className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="">Select school</option>{schools.map(school=><option key={school.id} value={school.id}>{school.name}</option>)}</select>}<div className="mt-4 grid gap-3 sm:grid-cols-2"><input required value={firstName} onChange={e=>setFirstName(e.target.value)} placeholder="First name" className="rounded-lg border border-slate-300 px-3 py-2 text-sm"/><input required value={lastName} onChange={e=>setLastName(e.target.value)} placeholder="Last name" className="rounded-lg border border-slate-300 px-3 py-2 text-sm"/><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2"/><select value={role} onChange={e=>setRole(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="teacher">Teacher</option><option value="headteacher">Headteacher</option><option value="principal">Principal</option><option value="accountant">Accountant</option><option value="bursar">Bursar</option><option value="secretary">Secretary</option><option value="librarian">Librarian</option><option value="nurse">Nurse</option><option value="school_admin">School admin</option></select><button disabled={pending} className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{pending?"Creating…":"Create access"}</button></div>{message&&<div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{message}{password&&<code className="mt-2 block break-all font-mono font-semibold">{password}</code>}</div>}</form>;
}

