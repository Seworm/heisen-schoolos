"use client";

import { useActionState } from "react";
import Link from "next/link";

import { updateStreamAssignment } from "../new/actions";

type Teacher = {
  id: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  staffNumber: string;
};

type Subject = {
  id: string;
  name: string;
  code: string | null;
};

type Props = {
  classId: string;
  streamId: string;
  assignmentId: string;
  academicYearId: string;
  className: string;
  streamName: string;
  initialStaffId: string;
  initialSubjectId: string | null;
  initialIsClassTeacher: boolean;
  teachers: Teacher[];
  subjects: Subject[];
};

type FormState = {
  error?: string;
};

const initialState: FormState = {};

export default function AssignmentEditForm({
  classId,
  streamId,
  assignmentId,
  academicYearId,
  className,
  streamName,
  initialStaffId,
  initialSubjectId,
  initialIsClassTeacher,
  teachers,
  subjects,
}: Props) {
  const [state, formAction, pending] = useActionState(
    updateStreamAssignment,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-6">
      {/* Hidden identifiers */}
      <input
        type="hidden"
        name="classId"
        value={classId}
      />

      <input
        type="hidden"
        name="assignmentId"
        value={assignmentId}
      />

      <input
        type="hidden"
        name="streamId"
        value={streamId}
      />

      <input
        type="hidden"
        name="academicYearId"
        value={academicYearId}
      />

      {/* Server validation error */}
      {state.error ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {state.error}
        </div>
      ) : null}

      {/* Teacher */}
      <div>
        <label
          htmlFor="staffId"
          className="block text-sm font-medium text-slate-900"
        >
          Teacher
        </label>

        <select
          id="staffId"
          name="staffId"
          required
          defaultValue={initialStaffId}
          disabled={pending}
          className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
        >
          <option value="" disabled>
            Select a teacher
          </option>

          {teachers.map((teacher) => {
            const teacherName = [
              teacher.firstName,
              teacher.middleName,
              teacher.lastName,
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <option
                key={teacher.id}
                value={teacher.id}
              >
                {teacherName} ({teacher.staffNumber})
              </option>
            );
          })}
        </select>
      </div>

      {/* Assignment type */}
      <div>
        <label
          htmlFor="assignmentType"
          className="block text-sm font-medium text-slate-900"
        >
          Assignment type
        </label>

        <select
          id="assignmentType"
          name="assignmentType"
          defaultValue={
            initialIsClassTeacher
              ? "class_teacher"
              : "subject"
          }
          disabled={pending}
          className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
        >
          <option value="subject">
            Subject teacher
          </option>

          <option value="class_teacher">
            Class teacher
          </option>
        </select>

        <p className="mt-2 text-xs text-slate-500">
          Choose whether this teacher is responsible for a
          specific subject or the overall stream.
        </p>
      </div>

      {/* Subject */}
      <div>
        <label
          htmlFor="subjectId"
          className="block text-sm font-medium text-slate-900"
        >
          Subject
        </label>

        <select
          id="subjectId"
          name="subjectId"
          defaultValue={initialSubjectId ?? ""}
          disabled={pending}
          className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
        >
          <option value="">
            No subject / class teacher
          </option>

          {subjects.map((subject) => (
            <option
              key={subject.id}
              value={subject.id}
            >
              {subject.name}
              {subject.code
                ? ` (${subject.code})`
                : ""}
            </option>
          ))}
        </select>

        <p className="mt-2 text-xs text-slate-500">
          Leave the subject empty when this is a class teacher
          assignment.
        </p>
      </div>

      {/* Assignment summary */}
      <div className="rounded-lg bg-slate-50 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Assignment
        </p>

        <p className="mt-1 font-medium text-slate-900">
          {className} {streamName}
        </p>

        <p className="mt-1 text-sm text-slate-500">
          Editing teaching assignment
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
        <Link
          href={`/academics/classes/${classId}/streams/${streamId}`}
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending
            ? "Saving changes..."
            : "Save changes"}
        </button>
      </div>
    </form>
  );
}