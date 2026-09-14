import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db";
import {
  academicYears,
  classLevels,
  staff,
  streams,
  subjects,
  teacherAssignments,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";
import AssignmentEditForm from "../edit/AssignmentEditForm";

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

  const [assignment] = await db
    .select({
      assignment: teacherAssignments,
      stream: streams,
      classLevel: classLevels,
      academicYear: academicYears,
    })
    .from(teacherAssignments)
    .innerJoin(
      streams,
      eq(
        teacherAssignments.streamId,
        streams.id,
      ),
    )
    .innerJoin(
      classLevels,
      eq(
        streams.classLevelId,
        classLevels.id,
      ),
    )
    .innerJoin(
      academicYears,
      eq(
        teacherAssignments.academicYearId,
        academicYears.id,
      ),
    )
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
        eq(streams.classLevelId, id),
        eq(classLevels.schoolId, school.id),
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
    .from(subjects)
    .where(eq(subjects.schoolId, school.id))
    .orderBy(asc(subjects.name));

  return (
    <div className="mx-auto max-w-2xl px-6 py-8 lg:px-8">
      <div className="mb-8">
        <Link
          href={`/academics/classes/${id}/streams/${streamId}`}
          className="text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          ← Back to {assignment.classLevel.name}{" "}
          {assignment.stream.name}
        </Link>

        <div className="mt-4">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
            Edit teaching assignment
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Update the teacher or subject assigned to this
            stream.
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <AssignmentEditForm
          classId={id}
          streamId={streamId}
          assignmentId={assignmentId}
          academicYearId={assignment.academicYear.id}
          className={assignment.classLevel.name}
          streamName={assignment.stream.name}
          initialStaffId={
            assignment.assignment.staffId
          }
          initialSubjectId={
            assignment.assignment.subjectId
          }
          initialIsClassTeacher={
            assignment.assignment.isClassTeacher
          }
          teachers={teachers}
          subjects={subjectRows}
        />
      </section>
    </div>
  );
}