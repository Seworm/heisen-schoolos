"use client";

import { useState, useActionState } from "react";
import Link from "next/link";

import { createStreamAssignment } from "./actions";

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
  academicYearId: string;
  className: string;
  streamName: string;
  teachers: Teacher[];
  subjects: Subject[];
};

type FormState = {
  error?: string;
};

const initialState: FormState = {};

export default function AssignmentForm({
  classId,
  streamId,
  academicYearId,
  className,
  streamName,
  teachers,
  subjects,
}: Props) {
  const [state, formAction, pending] = useActionState(
    createStreamAssignment,
    initialState,
  );

  const [assignmentType, setAssignmentType] =
    useState<"subject" | "class_teacher">("subject");

  const noTeachersAvailable = teachers.length === 0;
  const isClassTeacher = assignmentType === "class_teacher";

  return (
    <form action={formAction} className="space-y-6">
      <input
        type="hidden"
        name="classId"
        value={classId}
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

      {state.error ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {state.error}
        </div>
      ) : null}

      {noTeachersAvailable ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-semibold text-amber-900">
            No active teachers available
          </p>

          <p className="mt-1 text-sm text-amber-800">
            Add an active staff member before creating a
            teaching assignment.
          </p>
        </div>
      ) : null}

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
          defaultValue=""
          disabled={noTeachersAvailable || pending}
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

      {!isClassTeacher && (
        <div>
          <label htmlFor="lessonsPerWeek" className="block text-sm font-medium text-slate-900">Periods per week</label>
          <input id="lessonsPerWeek" name="lessonsPerWeek" type="number" min={1} max={15} defaultValue={3} required disabled={pending} className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
          <p className="mt-2 text-xs text-slate-500">The intelligent scheduler will create this many lessons for this subject and class each week.</p>
        </div>
      )}

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
          value={assignmentType}
          onChange={(event) =>
            setAssignmentType(
              event.target.value as
                | "subject"
                | "class_teacher",
            )
          }
          disabled={noTeachersAvailable || pending}
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
          A subject teacher is responsible for a
          specific subject. A class teacher is
          responsible for the overall stream.
        </p>
      </div>

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
          required={!isClassTeacher}
          disabled={
            pending ||
            noTeachersAvailable ||
            isClassTeacher ||
            subjects.length === 0
          }
          defaultValue=""
          className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
        >
          <option value="">
            {isClassTeacher
              ? "Not required for class teacher"
              : subjects.length === 0
                ? "No curriculum subjects configured"
                : "Select a subject"}
          </option>

          {!isClassTeacher &&
            subjects.map((subject) => (
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
          {isClassTeacher
            ? "Class teacher assignments do not require a subject."
            : `Subjects are determined by the curriculum configured for ${className}.`}
        </p>
      </div>

      <div className="rounded-lg bg-slate-50 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Assignment
        </p>

        <p className="mt-1 font-medium text-slate-900">
          {className} {streamName}
        </p>

        <p className="mt-1 text-sm text-slate-500">
          Current academic year
        </p>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
        <Link
          href={`/academics/classes/${classId}/streams/${streamId}`}
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={pending || noTeachersAvailable}
          className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending
            ? "Creating assignment..."
            : "Create assignment"}
        </button>
      </div>
    </form>
  );
}