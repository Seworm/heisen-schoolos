import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { procurementRequests } from "@/db/schema";
import { getCurrentSchool } from "@/lib/current-school";

export default async function ProcurementPage() {
  const school = await getCurrentSchool();
  const requests = await db.select().from(procurementRequests).where(eq(procurementRequests.schoolId, school.id)).orderBy(desc(procurementRequests.createdAt));
  return <section><h1 className="text-3xl font-semibold">Procurement</h1><p className="mt-1 text-sm text-slate-500">Requests and approvals for {school.name}.</p><div className="mt-6 rounded-xl border bg-white">{requests.map((request) => <div key={request.id} className="flex justify-between border-b p-4 text-sm"><span>{request.supplier || "Unassigned supplier"} · {request.totalAmount}</span><span className="capitalize">{request.status}</span></div>)}{!requests.length && <p className="p-6 text-sm text-slate-500">No procurement requests yet.</p>}</div></section>;
}
