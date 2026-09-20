import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db";
import {
  academicYears,
  classLevels,
  classSubjects,
  staff,
  streams,
  subjects,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

import AssignmentForm from "./AssignmentForm";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Props = {
  params: Promise<{
    id: string;
    streamId: string;
  }>;
};

export default async function NewAssignmentPage({
  params,
}: Props) {
  const { id, streamId } = await params;

  if (!UUID_REGEX.test(id) || !UUID_REGEX.test(streamId)) {
    notFound();
  }

  const school = await requireCurrentSchool();

  const [streamResult] = await db
    .select({
      stream: streams,
      classLevel: classLevels,
    })
    .from(streams)
    .innerJoin(
      classLevels,
      eq(streams.classLevelId, classLevels.id),
    )
    .where(
      and(
        eq(streams.id, streamId),
        eq(streams.classLevelId, id),
        eq(classLevels.schoolId, school.id),
      ),
    )
    .limit(1);

  if (!streamResult) {
    notFound();
  }

  const [academicYear] = await db
    .select()
    .from(academicYears)
    .where(
      and(
        eq(academicYears.schoolId, school.id),
        eq(academicYears.isCurrent, true),
      ),
    )
    .limit(1);

  if (!academicYear) {
    notFound();
  }

  const teachers = await db
    .select({
      id: staff.id,
      firstName: staff.firstName,
      middleName: staff.middleName,
      lastName: staff.lastName,
      staffNumber: staff.staffNumber,
    })
    .from(staff)
    .where(
      and(
        eq(staff.schoolId, school.id),
        eq(staff.status, "active"),
      ),
    )
    .orderBy(
      asc(staff.lastName),
      asc(staff.firstName),
    );

  const subjectRows = await db
    .select({
      id: subjects.id,
      name: subjects.name,
      code: subjects.code,
    })
    .from(classSubjects)
    .innerJoin(
      subjects,
      eq(classSubjects.subjectId, subjects.id),
    )
    .where(
      and(
        eq(
          classSubjects.classLevelId,
          streamResult.classLevel.id,
        ),
        eq(subjects.schoolId, school.id),
      ),
    )
    .orderBy(asc(subjects.name));

  return (
    <div className="mx-auto max-w-2xl px-6 py-8 lg:px-8">
      <div className="mb-8">
        <Link
          href={`/academics/classes/${id}/streams/${streamId}`}
          className="text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          ← Back to {streamResult.classLevel.name}{" "}
          {streamResult.stream.name}
        </Link>

        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
          Add teaching assignment
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Assign a teacher to{" "}
          {streamResult.classLevel.name}{" "}
          {streamResult.stream.name}.
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <AssignmentForm
          classId={id}
          streamId={streamId}
          academicYearId={academicYear.id}
          className={streamResult.classLevel.name}
          streamName={streamResult.stream.name}
          teachers={teachers}
          subjects={subjectRows}
        />
      </section>
    </div>
  );
}