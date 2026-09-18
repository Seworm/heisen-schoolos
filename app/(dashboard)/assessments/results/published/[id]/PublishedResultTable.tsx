"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { PublishedResultPublication } from "./page";

type Props = {
  publication: PublishedResultPublication;
};

export default function PublishedResultTable({
  publication,
}: Props) {
  const [query, setQuery] = useState("");

  const filteredStudents = useMemo(() => {
    const normalizedQuery = query
      .trim()
      .toLowerCase();

    if (!normalizedQuery) {
      return publication.students;
    }

    return publication.students.filter(
      (student) => {
        const studentName = [
          student.firstName,
          student.middleName,
          student.lastName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return (
          studentName.includes(
            normalizedQuery,
          ) ||
          student.studentNumber
            .toLowerCase()
            .includes(normalizedQuery)
        );
      },
    );
  }, [publication.students, query]);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* ========================================================
          TABLE HEADER
          ======================================================== */}

      <div className="border-b border-slate-100 px-5 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-950">
              Published student results
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              These results are read directly from the
              official publication snapshot.
            </p>
          </div>

          <div className="w-full lg:w-80">
            <label
              htmlFor="published-student-search"
              className="sr-only"
            >
              Search students
            </label>

            <input
              id="published-student-search"
              type="search"
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="Search student or number..."
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>
        </div>
      </div>

      {/* ========================================================
          EMPTY STATE
          ======================================================== */}

      {filteredStudents.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl text-slate-500">
            ⌕
          </div>

          <h3 className="mt-4 text-base font-bold text-slate-900">
            No students found
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Try searching with another student name or
            student number.
          </p>
        </div>
      ) : (
        <>
          {/* ======================================================
              DESKTOP TABLE
              ====================================================== */}

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-left">
                  <th className="w-20 px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                    Pos.
                  </th>

                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                    Student
                  </th>

                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                    Student number
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-400">
                    Overall
                  </th>

                  <th className="w-32 px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-400">
                    Grade
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-400">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map(
                  (student) => (
                    <tr
                      key={student.id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <PositionBadge
                          position={
                            student.position
                          }
                        />
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-900">
                          {formatStudentName(
                            student,
                          )}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-mono text-xs text-slate-500">
                          {
                            student.studentNumber
                          }
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <span className="text-sm font-bold text-slate-900">
                          {student.overallPercentage.toFixed(
                            2,
                          )}
                          %
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <GradeBadge
                          percentage={
                            student.overallPercentage
                          }
                        />
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/assessments/results/published/${publication.id}/students/${student.studentId}`}
                          className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          View result
                          <span className="ml-2">
                            →
                          </span>
                        </Link>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>

          {/* ======================================================
              MOBILE CARDS
              ====================================================== */}

          <div className="divide-y divide-slate-100 md:hidden">
            {filteredStudents.map(
              (student) => (
                <article
                  key={student.id}
                  className="p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <PositionBadge
                        position={
                          student.position
                        }
                      />

                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-slate-950">
                          {formatStudentName(
                            student,
                          )}
                        </h3>

                        <p className="mt-1 font-mono text-xs text-slate-500">
                          {
                            student.studentNumber
                          }
                        </p>
                      </div>
                    </div>

                    <GradeBadge
                      percentage={
                        student.overallPercentage
                      }
                    />
                  </div>

                  <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Overall result
                      </p>

                      <p className="mt-1 text-lg font-bold text-slate-950">
                        {student.overallPercentage.toFixed(
                          2,
                        )}
                        %
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Position
                      </p>

                      <p className="mt-1 text-sm font-bold text-slate-800">
                        {formatPosition(
                          student.position,
                        )}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/assessments/results/published/${publication.id}/students/${student.studentId}`}
                    className="mt-4 flex w-full items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    View published result
                    <span className="ml-2">
                      →
                    </span>
                  </Link>
                </article>
              ),
            )}
          </div>
        </>
      )}
    </section>
  );
}

function formatStudentName(student: {
  firstName: string;
  middleName: string | null;
  lastName: string;
}) {
  return [
    student.firstName,
    student.middleName,
    student.lastName,
  ]
    .filter(Boolean)
    .join(" ");
}

function formatPosition(position: number) {
  if (
    position % 100 >= 11 &&
    position % 100 <= 13
  ) {
    return `${position}th`;
  }

  switch (position % 10) {
    case 1:
      return `${position}st`;
    case 2:
      return `${position}nd`;
    case 3:
      return `${position}rd`;
    default:
      return `${position}th`;
  }
}

function PositionBadge({
  position,
}: {
  position: number;
}) {
  return (
    <span className="inline-flex min-w-9 items-center justify-center rounded-lg bg-slate-100 px-2 py-1.5 text-xs font-bold text-slate-700">
      {position}
    </span>
  );
}

function GradeBadge({
  percentage,
}: {
  percentage: number;
}) {
  const grade = getDisplayGrade(percentage);

  return (
    <span
      className={`inline-flex min-w-10 items-center justify-center rounded-lg px-2.5 py-1.5 text-xs font-bold ${
        grade === "A"
          ? "bg-emerald-100 text-emerald-700"
          : grade === "B"
            ? "bg-blue-100 text-blue-700"
            : grade === "C"
              ? "bg-amber-100 text-amber-700"
              : grade === "D"
                ? "bg-orange-100 text-orange-700"
                : grade === "E"
                  ? "bg-slate-100 text-slate-700"
                  : "bg-red-100 text-red-700"
      }`}
    >
      {grade}
    </span>
  );
}

function getDisplayGrade(
  percentage: number,
) {
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  if (percentage >= 40) return "E";
  return "F";
}