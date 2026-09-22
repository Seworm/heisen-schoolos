import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { studentImports } from "@/db/schema";
import { getCurrentSchool } from "@/lib/current-school";
import { importStudentsAction } from "./actions";

export default async function StudentImportPage() {
  const school = await getCurrentSchool();
  const history = await db.select().from(studentImports).where(eq(studentImports.schoolId, school.id)).orderBy(desc(studentImports.createdAt)).limit(20);
  return <section><h1 className="text-3xl font-semibold">Student import center</h1><p className="mt-1 text-sm text-slate-500">Upload a CSV or Excel workbook to add students and place them in Stream A.</p><form action={importStudentsAction} encType="multipart/form-data" className="mt-6 rounded-xl border bg-white p-6"><input type="file" name="file" accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" required /><button className="ml-4 rounded bg-slate-900 px-4 py-2 text-white">Validate and import</button><p className="mt-3 text-xs text-slate-500">Required columns: first_name, last_name, gender, class. Student number is optional and generated when omitted. Class must match an existing class level; students are enrolled in Stream A for the current academic year.</p></form><div className="mt-6 rounded-xl border bg-white"><h2 className="border-b p-4 font-semibold">Import history</h2>{history.map((item) => <div key={item.id} className="flex justify-between border-b p-4 text-sm"><span>{item.filename} · {item.validRows}/{item.totalRows} valid</span><span className="text-slate-500">{item.status}</span></div>)}{!history.length && <p className="p-6 text-sm text-slate-500">No imports yet.</p>}</div></section>;
}
