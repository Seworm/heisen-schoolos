import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { documentRecords } from "@/db/schema";
import { getCurrentSchool } from "@/lib/current-school";

export default async function DocumentsPage() {
  const school = await getCurrentSchool();
  const documents = await db.select().from(documentRecords).where(eq(documentRecords.schoolId, school.id)).orderBy(desc(documentRecords.createdAt)).limit(50);
  return <section><h1 className="text-3xl font-semibold">Documents & certificates</h1><p className="mt-1 text-sm text-slate-500">Issued, printable records for {school.name}.</p><div className="mt-6 rounded-xl border bg-white">{documents.map((document) => <div key={document.id} className="flex flex-wrap justify-between gap-3 border-b p-4 text-sm"><span>{document.title} · {document.documentNumber}</span><span className="capitalize text-slate-500">{document.status}</span></div>)}{!documents.length && <p className="p-6 text-sm text-slate-500">No documents issued yet.</p>}</div></section>;
}
