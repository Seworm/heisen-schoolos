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
  if (!value) return "Not recorded";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatPercent(value: number) {
  return `${Number(value || 0).toFixed(2)}%`;
}

function formatScore(value: number) {
  return Number(value || 0).toFixed(2);
}

function ordinal(value: number) {
  if (value <= 0) return "Not ranked";

  const remainder10 = value % 10;
  const remainder100 = value % 100;

  if (remainder10 === 1 && remainder100 !== 11) return `${value}st`;
  if (remainder10 === 2 && remainder100 !== 12) return `${value}nd`;
  if (remainder10 === 3 && remainder100 !== 13) return `${value}rd`;

  return `${value}th`;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
}

function subjectRemark(subject: ReportCardSubject) {
  return subject.remark || subject.label || "—";
}

const borderStyle: CSSProperties = {
  border: "1px solid #cbd5e1",
};

const cellStyle: CSSProperties = {
  border: "1px solid #cbd5e1",
  padding: "6px 7px",
  verticalAlign: "middle",
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
    <article className="report-card-document mx-auto w-full max-w-[794px] bg-white text-slate-950">
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 9mm;
        }

        .report-card-document {
          font-family:
            Arial,
            Helvetica,
            sans-serif;
          color: #0f172a;
          background: #ffffff;
        }

        .report-card-document * {
          box-sizing: border-box;
        }

        .report-card-document table {
          border-collapse: collapse;
        }

        .report-card-document .section-title {
          letter-spacing: 0.12em;
        }

        .report-card-document .signature-line {
          border-bottom: 1px solid #0f172a;
        }

        @media screen {
          .report-card-document {
            margin-bottom: 32px;
            box-shadow:
              0 18px 45px rgba(15, 23, 42, 0.10),
              0 2px 8px rgba(15, 23, 42, 0.06);
          }
        }

        @media print {
          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }

          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .report-card-document {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
          }

          .report-card-section {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .report-card-table {
            page-break-inside: auto;
          }

          .report-card-table thead {
            display: table-header-group;
          }

          .report-card-table tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .report-card-footer {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="overflow-hidden border border-slate-400 bg-white">
        {/* ============================================================
            OFFICIAL SCHOOL HEADER
            ============================================================ */}

        <header className="border-b-[3px] border-slate-900 px-7 pb-4 pt-5">
          <div className="flex items-center gap-4">
            <div
              className="flex h-[72px] w-[72px] shrink-0 items-center justify-center border-2 border-slate-900 bg-slate-50 text-lg font-black tracking-tight"
              aria-label="School logo placeholder"
            >
              {initials(school.name)}
            </div>

            <div className="min-w-0 flex-1 text-center">
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-slate-600">
                Official Academic Record
              </p>

              <h1 className="mt-1 text-[22px] font-black uppercase leading-tight tracking-tight">
                {school.name}
              </h1>

              <div className="mx-auto mt-2 h-px w-24 bg-slate-900" />

              <h2 className="mt-2 text-[14px] font-black uppercase tracking-[0.14em]">
                Student Report Card
              </h2>
            </div>

            <div className="w-[72px] shrink-0 text-center">
              <div className="flex h-[72px] items-center justify-center border border-dashed border-slate-400 text-[8px] font-bold uppercase leading-3 text-slate-500">
                Student
                <br />
                Photo
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 border border-slate-300 bg-slate-50 text-center">
            <div className="border-r border-slate-300 px-3 py-2">
              <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-slate-500">
                Academic Year
              </p>
              <p className="mt-1 text-[11px] font-black">
                {publication.academicYearName}
              </p>
            </div>

            <div className="border-r border-slate-300 px-3 py-2">
              <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-slate-500">
                Term
              </p>
              <p className="mt-1 text-[11px] font-black">
                {publication.termName}
              </p>
            </div>

            <div className="px-3 py-2">
              <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-slate-500">
                Class / Stream
              </p>
              <p className="mt-1 text-[11px] font-black">
                {publication.className}
                {publication.streamName
                  ? ` / ${publication.streamName}`
                  : ""}
              </p>
            </div>
          </div>
        </header>

        {/* ============================================================
            STUDENT PARTICULARS
            ============================================================ */}

        <section className="report-card-section px-7 pt-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="section-title text-[10px] font-black uppercase">
              Student Particulars
            </h3>

            <span className="border border-slate-400 px-2 py-1 text-[8px] font-bold uppercase tracking-wider">
              {publication.classCategory}
            </span>
          </div>

          <div
            className="grid grid-cols-4 text-[10px]"
            style={borderStyle}
          >
            <div className="border-r border-slate-300 px-3 py-2">
              <p className="text-[8px] font-bold uppercase text-slate-500">
                Student Name
              </p>
              <p className="mt-1 font-black">{student.name}</p>
            </div>

            <div className="border-r border-slate-300 px-3 py-2">
              <p className="text-[8px] font-bold uppercase text-slate-500">
                Student Number
              </p>
              <p className="mt-1 font-black">{student.studentNumber}</p>
            </div>

            <div className="border-r border-slate-300 px-3 py-2">
              <p className="text-[8px] font-bold uppercase text-slate-500">
                Class
              </p>
              <p className="mt-1 font-black">{publication.className}</p>
            </div>

            <div className="px-3 py-2">
              <p className="text-[8px] font-bold uppercase text-slate-500">
                Stream
              </p>
              <p className="mt-1 font-black">
                {publication.streamName || "—"}
              </p>
            </div>
          </div>
        </section>

        {/* ============================================================
            ATTENDANCE
            ============================================================ */}

        <section className="report-card-section px-7 pt-4">
          <h3 className="section-title mb-2 text-[10px] font-black uppercase">
            Attendance Record
          </h3>

          <div className="grid grid-cols-6 border border-slate-300 text-center">
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
                className={
                  index < 5
                    ? "border-r border-slate-300 px-2 py-2"
                    : "px-2 py-2"
                }
              >
                <p className="text-[7px] font-bold uppercase tracking-wide text-slate-500">
                  {label}
                </p>
                <p className="mt-1 text-[11px] font-black">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================
            ACADEMIC PERFORMANCE
            ============================================================ */}

        <section className="report-card-section px-7 pt-4">
          <div className="mb-2 flex items-end justify-between">
            <h3 className="section-title text-[10px] font-black uppercase">
              Academic Performance
            </h3>

            <p className="text-[8px] text-slate-500">
              Published result snapshot
            </p>
          </div>

          <div className="overflow-hidden border border-slate-300">
            <table
              className="report-card-table w-full text-[9px]"
              style={{ tableLayout: "fixed" }}
            >
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th
                    style={{ ...cellStyle, width: "25%" }}
                    className="text-left font-bold uppercase"
                  >
                    Subject
                  </th>

                  <th
                    style={{ ...cellStyle, width: "10%" }}
                    className="text-center font-bold uppercase"
                  >
                    Class
                  </th>

                  <th
                    style={{ ...cellStyle, width: "10%" }}
                    className="text-center font-bold uppercase"
                  >
                    Exam
                  </th>

                  <th
                    style={{ ...cellStyle, width: "12%" }}
                    className="text-center font-bold uppercase"
                  >
                    Final
                  </th>

                  <th
                    style={{ ...cellStyle, width: "9%" }}
                    className="text-center font-bold uppercase"
                  >
                    Grade
                  </th>

                  <th
                    style={{ ...cellStyle, width: "22%" }}
                    className="text-left font-bold uppercase"
                  >
                    Remark
                  </th>

                  <th
                    style={{ ...cellStyle, width: "12%" }}
                    className="text-center font-bold uppercase"
                  >
                    Position
                  </th>
                </tr>
              </thead>

              <tbody>
                {subjects.map((subject, index) => (
                  <tr
                    key={subject.id}
                    className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
                  >
                    <td style={cellStyle} className="font-bold">
                      {subject.subjectName}
                    </td>

                    <td style={cellStyle} className="text-center">
                      {formatScore(subject.classScore)}
                    </td>

                    <td style={cellStyle} className="text-center">
                      {formatScore(subject.examinationScore)}
                    </td>

                    <td
                      style={cellStyle}
                      className="text-center font-black"
                    >
                      {formatScore(subject.finalPercentage)}
                    </td>

                    <td
                      style={cellStyle}
                      className="text-center font-black"
                    >
                      {subject.grade || "—"}
                    </td>

                    <td style={cellStyle}>
                      {subjectRemark(subject)}
                    </td>

                    <td style={cellStyle} className="text-center">
                      {ordinal(subject.position)}
                    </td>
                  </tr>
                ))}

                {subjects.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      style={cellStyle}
                      className="py-7 text-center text-slate-500"
                    >
                      No published subject results available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ============================================================
            OVERALL RESULT SUMMARY
            ============================================================ */}

        <section className="report-card-section px-7 pt-4">
          <h3 className="section-title mb-2 text-[10px] font-black uppercase">
            Overall Result
          </h3>

          <div className="grid grid-cols-3 border-2 border-slate-900">
            <div className="border-r border-slate-900 px-4 py-3 text-center">
              <p className="text-[8px] font-bold uppercase tracking-wider text-slate-500">
                Overall Percentage
              </p>
              <p className="mt-1 text-[20px] font-black">
                {formatPercent(student.overallPercentage)}
              </p>
            </div>

            <div className="border-r border-slate-900 px-4 py-3 text-center">
              <p className="text-[8px] font-bold uppercase tracking-wider text-slate-500">
                Overall Position
              </p>
              <p className="mt-1 text-[20px] font-black">
                {ordinal(student.position)}
              </p>
            </div>

            <div className="px-4 py-3 text-center">
              <p className="text-[8px] font-bold uppercase tracking-wider text-slate-500">
                Subjects Assessed
              </p>
              <p className="mt-1 text-[20px] font-black">
                {subjects.length}
              </p>
            </div>
          </div>
        </section>

        {/* ============================================================
            REMARKS
            ============================================================ */}

        <section className="report-card-section px-7 pt-4">
          <h3 className="section-title mb-2 text-[10px] font-black uppercase">
            Official Remarks
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div
              className="min-h-[88px] p-3"
              style={borderStyle}
            >
              <p className="text-[8px] font-bold uppercase tracking-wider text-slate-500">
                Class Teacher&apos;s Remark
              </p>

              <p className="mt-3 whitespace-pre-wrap text-[10px] leading-5">
                {remarks.classTeacher || "No remark entered."}
              </p>
            </div>

            <div
              className="min-h-[88px] p-3"
              style={borderStyle}
            >
              <p className="text-[8px] font-bold uppercase tracking-wider text-slate-500">
                Headteacher&apos;s Remark
              </p>

              <p className="mt-3 whitespace-pre-wrap text-[10px] leading-5">
                {remarks.headteacher || "No remark entered."}
              </p>
            </div>
          </div>
        </section>

        {/* ============================================================
            PROMOTION
            ============================================================ */}

        <section className="report-card-section px-7 pt-4">
          <div className="grid grid-cols-[1fr_auto] border-2 border-slate-900">
            <div className="px-4 py-3">
              <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-slate-500">
                Promotion / Progression Status
              </p>

              <p className="mt-1 text-[12px] font-black uppercase">
                {promotionStatus || "Pending school decision"}
              </p>
            </div>

            <div className="border-l border-slate-900 px-4 py-3 text-right">
              <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-slate-500">
                Result Published
              </p>

              <p className="mt-1 text-[10px] font-bold">
                {formatDate(publication.publishedAt)}
              </p>
            </div>
          </div>
        </section>

        {/* ============================================================
            SIGNATURES
            ============================================================ */}

        <section className="report-card-section px-7 pb-4 pt-5">
          <div className="grid grid-cols-2 gap-16">
            <div>
              <div className="signature-line h-8" />

              <p className="mt-1 text-[9px] font-black uppercase">
                Class Teacher
              </p>

              <p className="mt-1 text-[8px] text-slate-500">
                Date: {formatDate(signatures?.classTeacherSignedAt)}
              </p>
            </div>

            <div>
              <div className="signature-line h-8" />

              <p className="mt-1 text-[9px] font-black uppercase">
                Headteacher
              </p>

              <p className="mt-1 text-[8px] text-slate-500">
                Date: {formatDate(signatures?.headteacherSignedAt)}
              </p>
            </div>
          </div>
        </section>

        {/* ============================================================
            OFFICIAL FOOTER
            ============================================================ */}

        <footer className="report-card-footer border-t-2 border-slate-900 bg-slate-50 px-7 py-3 text-center">
          <p className="text-[8px] leading-4 text-slate-600">
            This report card is an official academic record for the
            academic period stated above.
          </p>

          <p className="mt-1 text-[7px] font-bold uppercase tracking-[0.16em] text-slate-500">
            Generated by Heisen SchoolOS
          </p>
        </footer>
      </div>
    </article>
  );
}
