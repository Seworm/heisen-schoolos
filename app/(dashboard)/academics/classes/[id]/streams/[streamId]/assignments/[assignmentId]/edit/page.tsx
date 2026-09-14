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
  teacherAssignments,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";
import AssignmentEditForm from "./AssignmentEditForm";

type Props = {
  params: Promise<{
    id: string;
    streamId: string;
    assignmentId: string;
  }>;
};

export default async function EditAssignmentPage({
  params,
}: Props) {
  const {
    id,
    streamId,
    assignmentId,
  } = await params;

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

  const [assignment] = await db
    .select({
      id: teacherAssignments.id,
      staffId: teacherAssignments.staffId,
      subjectId: teacherAssignments.subjectId,
      isClassTeacher:
        teacherAssignments.isClassTeacher,
    })
    .from(teacherAssignments)
    .where(
      and(
        eq(
          teacherAssignments.id,
          assignmentId,
        ),
        eq(
          teacherAssignments.streamId,
          streamId,
        ),
        eq(
          teacherAssignments.academicYearId,
          academicYear.id,
        ),
      ),
    )
    .limit(1);

  if (!assignment) {
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

  /*
   * If the assignment currently references a subject that
   * has since been removed from the curriculum, include that
   * subject so the edit form can still display the existing
   * assignment safely.
   */
  let availableSubjects = subjectRows;

  if (
    assignment.subjectId &&
    !subjectRows.some(
      (subject) =>
        subject.id === assignment.subjectId,
    )
  ) {
    const [existingSubject] = await db
      .select({
        id: subjects.id,
        name: subjects.name,
        code: subjects.code,
      })
      .from(subjects)
      .where(
        and(
          eq(
            subjects.id,
            assignment.subjectId,
          ),
          eq(subjects.schoolId, school.id),
        ),
      )
      .limit(1);

    if (existingSubject) {
      availableSubjects = [
        existingSubject,
        ...subjectRows,
      ];
    }
  }

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
          Edit teaching assignment
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Update the teacher or subject assigned to{" "}
          {streamResult.classLevel.name}{" "}
          {streamResult.stream.name}.
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <AssignmentEditForm
          classId={id}
          streamId={streamId}
          assignmentId={assignment.id}
          academicYearId={academicYear.id}
          className={streamResult.classLevel.name}
          streamName={streamResult.stream.name}
          initialStaffId={assignment.staffId}
          initialSubjectId={assignment.subjectId}
          initialIsClassTeacher={
            assignment.isClassTeacher
          }
          teachers={teachers}
          subjects={availableSubjects}
        />
      </section>
    </div>
  );
}