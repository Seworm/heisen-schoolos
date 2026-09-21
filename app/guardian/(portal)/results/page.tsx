import { and, desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  academicYears,
  resultPublicationStudents,
  resultPublicationSubjects,
  resultPublications,
  terms,
} from "@/db/schema";
import { requireCurrentGuardian } from "@/lib/guardian-auth";
import { GuardianChildSelector } from "../GuardianChildSelector";

function formatDate(value: string | Date | null) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-GH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default async function GuardianResultsPage({
  searchParams,
}: {
  searchParams?: Promise<{ child?: string }>;
}) {
  const params = await searchParams;
  const { children, schoolId } = await requireCurrentGuardian();

  if (children.length === 0) {
    redirect("/guardian/login");
  }

  const selectedChild =
    children.find((child) => child.id === params?.child) ?? children[0];

  const results = await db
    .select({
      publicationId: resultPublications.id,
      academicYear: academicYears.name,
      term: terms.name,
      publishedAt: resultPublications.publishedAt,
      subjectName: resultPublicationSubjects.subjectName,
      finalPercentage: resultPublicationSubjects.finalPercentage,
      grade: resultPublicationSubjects.grade,
      remark: resultPublicationSubjects.remark,
    })
    .from(resultPublicationStudents)
    .innerJoin(
      resultPublications,
      eq(resultPublicationStudents.publicationId, resultPublications.id),
    )
    .innerJoin(
      academicYears,
      eq(resultPublications.academicYearId, academicYears.id),
    )
    .innerJoin(
      terms,
      eq(resultPublications.termId, terms.id),
    )
    .innerJoin(
      resultPublicationSubjects,
      eq(
        resultPublicationSubjects.publicationStudentId,
        resultPublicationStudents.id,
      ),
    )
    .where(
      and(
        eq(resultPublicationStudents.studentId, selectedChild.id),
        eq(resultPublications.schoolId, schoolId),
        eq(resultPublications.status, "published"),
      ),
    )
    .orderBy(desc(resultPublications.publishedAt), resultPublicationSubjects.subjectName)
    .limit(20);

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Results</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">
            {selectedChild.firstName} {selectedChild.lastName}
          </h1>
        </div>
        <GuardianChildSelector
          childOptions={children}
          selectedChildId={selectedChild.id}
          currentPath="/guardian/results"
        />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {results.length === 0 ? (
          <p className="text-sm text-slate-500">No published results are available for this child yet.</p>
        ) : (
          <div className="space-y-5">
            {results.map((result, index) => (
              <div key={`${result.publicationId}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
                      {result.academicYear} · {result.term}
                    </p>
                    <p className="mt-1 font-semibold text-slate-900">{result.subjectName}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Final mark</p>
                      <p className="text-lg font-semibold text-slate-900">{result.finalPercentage}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Grade</p>
                      <p className="text-lg font-semibold text-slate-900">{result.grade ?? "-"}</p>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-600">{result.remark ?? "No additional comment."}</p>
                <p className="mt-2 text-xs text-slate-500">Published {formatDate(result.publishedAt)}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

