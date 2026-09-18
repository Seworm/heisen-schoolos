"use client";

import type { CSSProperties } from "react";

export type ReportCardSubject = {
  id: string;
  subjectName: string;
  classScore: number;
  examinationScore: number;
  finalPercentage: number;
  grade: string | null;
  label: string | null;
  remark: string | null;
  position: number;
};

export type ReportCardData = {
  school: {
    id: string;
    name: string;
  };

  publication: {
    id: string;
    academicYearName: string;
    termName: string;
    className: string;
    classCategory: string;
    streamName: string;
    publishedAt: Date | null;
  };

  student: {
    id: string;
    snapshotId: string;
    name: string;
    studentNumber: string;
    overallPercentage: number;
    position: number;
  };

  attendance: {
    schoolDays: number;
    present: number;
    late: number;
    absent: number;
    excused: number;
    attendancePercentage: number;
  };

  subjects: ReportCardSubject[];

  remarks: {
    classTeacher: string;
    headteacher: string;
  };

  promotionStatus: string;

  signatures?: {
    classTeacherSignedAt: Date | null;
    headteacherSignedAt: Date | null;
  };
};

function formatDate(value: Date | null | undefined) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatPercent(value: number) {
  return `${Number(value || 0).toFixed(2)}%`;
}

function gradeTone(grade: string | null) {
  switch (grade) {
    case "A":
      return "Excellent";
    case "B":
      return "Very Good";
    case "C":
      return "Good";
    case "D":
      return "Credit";
    case "E":
      return "Pass";
    case "F":
      return "Needs Improvement";
    default:
      return "—";
  }
}

function ordinal(value: number) {
  if (value <= 0) return "—";

  const remainder10 = value % 10;
  const remainder100 = value % 100;

  if (remainder10 === 1 && remainder100 !== 11) return `${value}st`;
  if (remainder10 === 2 && remainder100 !== 12) return `${value}nd`;
  if (remainder10 === 3 && remainder100 !== 13) return `${value}rd`;

  return `${value}th`;
}

const cellStyle: CSSProperties = {
  border: "1px solid #cbd5e1",
  padding: "7px 8px",
};

export default function ReportCard({
  data,
}: {
  data: ReportCardData;
}) {
  const {
    school,
    publication,
    student,
    attendance,
    subjects,
    remarks,
    promotionStatus,
    signatures,
  } = data;

  return (
    <article className="report-card-print mx-auto w-full max-w-[794px] bg-white text-slate-950">
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 10mm;
        }

        @media print {
          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }

          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .print-hidden {
            display: none !important;
          }

          .report-card-print {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
          }

          .report-card-page {
            page-break-after: always;
            break-after: page;
          }

          .report-card-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }

          .avoid-break {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          table {
            page-break-inside: auto;
          }

          tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `}</style>

      <div className="report-card-page overflow-hidden rounded-2xl border border-slate-300 shadow-sm print:rounded-none print:border-0 print:shadow-none">
        {/* HEADER */}
        <header className="border-b-2 border-slate-950 px-8 py-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border-2 border-slate-900 bg-slate-50 text-center text-xl font-black">
                {school.name
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((word) => word[0])
                  .join("")
                  .toUpperCase()}
              </div>

              <div>
                <h1 className="text-2xl font-black uppercase tracking-tight">
                  {school.name}
                </h1>

                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Official Academic Report
                </p>

                <p className="mt-2 text-sm font-semibold">
                  Student Report Card
                </p>
              </div>
            </div>

            <div className="text-right text-xs leading-5">
              <p className="font-bold uppercase">
                {publication.academicYearName}
              </p>
              <p>{publication.termName}</p>
              <p>
                {publication.className}
                {publication.streamName
                  ? ` • ${publication.streamName}`
                  : ""}
              </p>
            </div>
          </div>
        </header>

        {/* STUDENT INFORMATION */}
        <section className="px-8 py-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wider">
              Student Information
            </h2>

            <span className="rounded-full border border-slate-300 px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
              {publication.classCategory}
            </span>
          </div>

          <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-slate-300 text-sm">
            <div className="border-b border-r border-slate-300 p-3">
              <p className="text-[10px] font-bold uppercase text-slate-500">
                Student Name
              </p>
              <p className="mt-1 font-bold">{student.name}</p>
            </div>

            <div className="border-b border-slate-300 p-3">
              <p className="text-[10px] font-bold uppercase text-slate-500">
                Student Number
              </p>
              <p className="mt-1 font-bold">{student.studentNumber}</p>
            </div>

            <div className="border-r border-slate-300 p-3">
              <p className="text-[10px] font-bold uppercase text-slate-500">
                Class
              </p>
              <p className="mt-1 font-bold">{publication.className}</p>
            </div>

            <div className="p-3">
              <p className="text-[10px] font-bold uppercase text-slate-500">
                Stream
              </p>
              <p className="mt-1 font-bold">
                {publication.streamName || "—"}
              </p>
            </div>
          </div>
        </section>

        {/* ATTENDANCE */}
        <section className="px-8 pb-5">
          <h2 className="mb-3 text-sm font-black uppercase tracking-wider">
            Attendance
          </h2>

          <div className="grid grid-cols-6 overflow-hidden rounded-lg border border-slate-300 text-center">
            {[
              ["School Days", attendance.schoolDays],
              ["Present", attendance.present],
              ["Late", attendance.late],
              ["Absent", attendance.absent],
              ["Excused", attendance.excused],
              ["Attendance", formatPercent(attendance.attendancePercentage)],
            ].map(([label, value], index) => (
              <div
                key={String(label)}
                className={`p-3 ${
                  index !== 5 ? "border-r border-slate-300" : ""
                }`}
              >
                <p className="text-[9px] font-bold uppercase text-slate-500">
                  {label}
                </p>

                <p className="mt-1 text-sm font-black">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ACADEMIC PERFORMANCE */}
        <section className="px-8 pb-5">
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-sm font-black uppercase tracking-wider">
              Academic Performance
            </h2>

            <p className="text-[10px] font-semibold text-slate-500">
              Published result snapshot
            </p>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-300">
            <table
              className="w-full border-collapse text-xs"
              style={{ tableLayout: "fixed" }}
            >
              <thead>
                <tr className="bg-slate-100 text-[10px] uppercase tracking-wide">
                  <th style={{ ...cellStyle, width: "28%" }} className="text-left">
                    Subject
                  </th>

                  <th style={cellStyle} className="text-center">
                    Class /50
                  </th>

                  <th style={cellStyle} className="text-center">
                    Exam /50
                  </th>

                  <th style={cellStyle} className="text-center">
                    Final /100
                  </th>

                  <th style={cellStyle} className="text-center">
                    Grade
                  </th>

                  <th style={cellStyle} className="text-center">
                    Pos.
                  </th>
                </tr>
              </thead>

              <tbody>
                {subjects.map((subject) => (
                  <tr key={subject.id} className="avoid-break">
                    <td style={cellStyle} className="font-semibold">
                      {subject.subjectName}
                    </td>

                    <td style={cellStyle} className="text-center">
                      {subject.classScore.toFixed(2)}
                    </td>

                    <td style={cellStyle} className="text-center">
                      {subject.examinationScore.toFixed(2)}
                    </td>

                    <td style={cellStyle} className="text-center font-bold">
                      {subject.finalPercentage.toFixed(2)}
                    </td>

                    <td style={cellStyle} className="text-center font-black">
                      {subject.grade || "—"}
                    </td>

                    <td style={cellStyle} className="text-center">
                      {ordinal(subject.position)}
                    </td>
                  </tr>
                ))}

                {subjects.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      style={cellStyle}
                      className="py-8 text-center text-slate-500"
                    >
                      No published subject results available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* OVERALL */}
        <section className="px-8 pb-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-slate-300 p-4">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                Overall Percentage
              </p>

              <p className="mt-2 text-2xl font-black">
                {formatPercent(student.overallPercentage)}
              </p>
            </div>

            <div className="rounded-lg border border-slate-300 p-4">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                Overall Position
              </p>

              <p className="mt-2 text-2xl font-black">
                {ordinal(student.position)}
              </p>
            </div>

            <div className="rounded-lg border border-slate-300 p-4">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                Overall Grade
              </p>

              <p className="mt-2 text-2xl font-black">
                {subjects.length
                  ? gradeTone(
                      subjects
                        .slice()
                        .sort(
                          (a, b) =>
                            b.finalPercentage - a.finalPercentage,
                        )[0]?.grade ?? null,
                    )
                  : "—"}
              </p>
            </div>
          </div>
        </section>

        {/* REMARKS */}
        <section className="px-8 pb-5">
          <h2 className="mb-3 text-sm font-black uppercase tracking-wider">
            Remarks
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="avoid-break rounded-lg border border-slate-300 p-4">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                Class Teacher's Remark
              </p>

              <p className="mt-3 min-h-[58px] whitespace-pre-wrap text-sm leading-6">
                {remarks.classTeacher || "No remark entered."}
              </p>
            </div>

            <div className="avoid-break rounded-lg border border-slate-300 p-4">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                Headteacher's Remark
              </p>

              <p className="mt-3 min-h-[58px] whitespace-pre-wrap text-sm leading-6">
                {remarks.headteacher || "No remark entered."}
              </p>
            </div>
          </div>
        </section>

        {/* PROMOTION */}
        <section className="px-8 pb-6">
          <div className="flex items-center justify-between rounded-lg border-2 border-slate-900 px-5 py-4">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                Promotion Status
              </p>

              <p className="mt-1 text-sm font-black uppercase">
                {promotionStatus || "Pending school decision"}
              </p>
            </div>

            <div className="text-right">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                Result Published
              </p>

              <p className="mt-1 text-xs font-semibold">
                {formatDate(publication.publishedAt)}
              </p>
            </div>
          </div>
        </section>

        {/* SIGNATURES */}
        <section className="px-8 pb-6">
          <div className="grid grid-cols-2 gap-12">
            <div className="avoid-break">
              <div className="h-10 border-b border-slate-900" />

              <p className="mt-2 text-xs font-bold">
                Class Teacher
              </p>

              <p className="mt-1 text-[10px] text-slate-500">
                {formatDate(signatures?.classTeacherSignedAt)}
              </p>
            </div>

            <div className="avoid-break">
              <div className="h-10 border-b border-slate-900" />

              <p className="mt-2 text-xs font-bold">
                Headteacher
              </p>

              <p className="mt-1 text-[10px] text-slate-500">
                {formatDate(signatures?.headteacherSignedAt)}
              </p>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-slate-300 bg-slate-50 px-8 py-3 text-center text-[9px] text-slate-500">
          <p>
            This report card represents the official published academic
            record for the stated academic period.
          </p>

          <p className="mt-1 font-semibold">
            Generated from Heisen SchoolOS
          </p>
        </footer>
      </div>
    </article>
  );
}