import Link from "next/link";
import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  academicYears,
  assessmentPeriods,
  assessmentTypes,
  classLevels,
  classSubjects,
  streams,
  subjects,
  terms,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

import AssessmentForm from "./AssessmentForm";

export const dynamic = "force-dynamic";

export default async function NewAssessmentPage() {
  const school =
    await requireCurrentSchool();

  const [
    years,
    allTerms,
    periods,
    streamRows,
    subjectRows,
    typeRows,
  ] = await Promise.all([
    /*
     * ----------------------------------------------------------
     * Academic years
     * ----------------------------------------------------------
     */

    db
      .select({
        id: academicYears.id,
        name: academicYears.name,
      })
      .from(academicYears)
      .where(
        eq(
          academicYears.schoolId,
          school.id,
        ),
      )
      .orderBy(
        asc(academicYears.startDate),
      ),

    /*
     * ----------------------------------------------------------
     * Terms
     * ----------------------------------------------------------
     */

    db
      .select({
        id: terms.id,
        name: terms.name,
        academicYearId:
          terms.academicYearId,
      })
      .from(terms)
      .innerJoin(
        academicYears,
        eq(
          terms.academicYearId,
          academicYears.id,
        ),
      )
      .where(
        eq(
          academicYears.schoolId,
          school.id,
        ),
      )
      .orderBy(
        asc(academicYears.startDate),
        asc(terms.termNumber),
      ),

    /*
     * ----------------------------------------------------------
     * Assessment periods
     * ----------------------------------------------------------
     */

    db
      .select({
        id: assessmentPeriods.id,
        name: assessmentPeriods.name,
        academicYearId:
          assessmentPeriods.academicYearId,
        termId:
          assessmentPeriods.termId,
      })
      .from(assessmentPeriods)
      .where(
        eq(
          assessmentPeriods.schoolId,
          school.id,
        ),
      )
      .orderBy(
        asc(assessmentPeriods.name),
      ),

    /*
     * ----------------------------------------------------------
     * Streams
     *
     * We include classLevelId so the client knows which
     * class a stream belongs to.
     * ----------------------------------------------------------
     */

    db
      .select({
        id: streams.id,
        name: streams.name,
        className: classLevels.name,
        classLevelId:
          streams.classLevelId,
      })
      .from(streams)
      .innerJoin(
        classLevels,
        eq(
          streams.classLevelId,
          classLevels.id,
        ),
      )
      .where(
        eq(
          classLevels.schoolId,
          school.id,
        ),
      )
      .orderBy(
        asc(classLevels.sortOrder),
        asc(streams.name),
      ),

    /*
     * ----------------------------------------------------------
     * Subjects
     *
     * Return only subjects assigned to class levels in the
     * current school.
     *
     * A subject can be assigned to multiple class levels,
     * therefore the client receives one row per
     * class-subject relationship.
     * ----------------------------------------------------------
     */

    db
      .select({
        id: subjects.id,
        name: subjects.name,
        classLevelId:
          classSubjects.classLevelId,
      })
      .from(classSubjects)
      .innerJoin(
        subjects,
        eq(
          classSubjects.subjectId,
          subjects.id,
        ),
      )
      .innerJoin(
        classLevels,
        eq(
          classSubjects.classLevelId,
          classLevels.id,
        ),
      )
      .where(
        eq(
          subjects.schoolId,
          school.id,
        ),
      )
      .orderBy(
        asc(classSubjects.classLevelId),
        asc(subjects.name),
      ),

    /*
     * ----------------------------------------------------------
     * Assessment types
     * ----------------------------------------------------------
     */

    db
      .select({
        id: assessmentTypes.id,
        name: assessmentTypes.name,
      })
      .from(assessmentTypes)
      .where(
        eq(
          assessmentTypes.schoolId,
          school.id,
        ),
      )
      .orderBy(
        asc(assessmentTypes.name),
      ),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 lg:px-8">
      <Link
        href="/assessments"
        className="text-sm text-slate-500 transition hover:text-slate-900"
      >
        ← Assessments
      </Link>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
            New assessment
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Create an assessment for a specific
            stream and subject.
          </p>
        </div>

        <div className="mt-8">
          <AssessmentForm
            academicYears={years}
            terms={allTerms}
            periods={periods}
            streams={streamRows}
            subjects={subjectRows}
            assessmentTypes={typeRows}
          />
        </div>
      </div>
    </div>
  );
}