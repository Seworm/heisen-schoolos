import { and, count, countDistinct, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  assessmentScores,
  assessments,
  attendanceRecords,
  attendanceSessions,
  payments,
  schools,
  studentInvoiceItems,
  studentInvoices,
  students,
} from "@/db/schema";

const attended = sql<number>`count(*) filter (where ${attendanceRecords.status} in ('present', 'late'))`;
const attendanceTotal = sql<number>`count(${attendanceRecords.id})`;
const scorePercent = sql<number>`coalesce(avg((${assessmentScores.score} / nullif(${assessments.maxScore}, 0)) * 100), 0)`;

export async function getSchoolReport(schoolId: string) {
  const [enrollment, attendance, finance, academics, trend] =
    await Promise.all([
      db
        .select({
          total: count(),
          active: sql<number>`count(*) filter (where ${students.status} = 'active')`,
          newThisYear: sql<number>`count(*) filter (where ${students.admissionDate} >= date_trunc('year', current_date))`,
        })
        .from(students)
        .where(eq(students.schoolId, schoolId)),
      db
        .select({
          sessions: countDistinct(attendanceSessions.id),
          records: attendanceTotal,
          attended,
        })
        .from(attendanceSessions)
        .leftJoin(
          attendanceRecords,
          eq(attendanceRecords.attendanceSessionId, attendanceSessions.id),
        )
        .where(eq(attendanceSessions.schoolId, schoolId)),
      db
        .select({
          invoiced: sql<string>`coalesce(sum(${studentInvoiceItems.amount}), 0)`,
        })
        .from(studentInvoices)
        .innerJoin(
          studentInvoiceItems,
          eq(studentInvoiceItems.invoiceId, studentInvoices.id),
        )
        .where(
          and(
            eq(studentInvoices.schoolId, schoolId),
            sql`${studentInvoices.status} <> 'cancelled'`,
          ),
        ),
      db
        .select({ average: scorePercent, assessments: countDistinct(assessments.id) })
        .from(assessments)
        .innerJoin(
          assessmentScores,
          eq(assessmentScores.assessmentId, assessments.id),
        )
        .where(
          and(
            eq(assessments.schoolId, schoolId),
            sql`${assessments.status} in ('closed', 'published')`,
          ),
        ),
      db
        .select({
          month: sql<string>`to_char(date_trunc('month', ${students.admissionDate}), 'Mon')`,
          value: count(),
        })
        .from(students)
        .where(
          and(
            eq(students.schoolId, schoolId),
            gte(students.admissionDate, sql`current_date - interval '5 months'`),
            lte(students.admissionDate, sql`current_date`),
          ),
        )
        .groupBy(sql`date_trunc('month', ${students.admissionDate})`)
        .orderBy(sql`date_trunc('month', ${students.admissionDate})`),
    ]);

  const [collected] = await db
    .select({ value: sql<string>`coalesce(sum(${payments.amount}), 0)` })
    .from(payments)
    .where(
      and(
        eq(payments.schoolId, schoolId),
        eq(payments.status, "posted"),
        gte(payments.paymentDate, sql`current_date - interval '12 months'`),
      ),
    );

  const row = enrollment[0];
  const attendanceRow = attendance[0];
  return {
    enrollment: {
      total: Number(row?.total ?? 0),
      active: Number(row?.active ?? 0),
      newThisYear: Number(row?.newThisYear ?? 0),
    },
    attendance: {
      sessions: Number(attendanceRow?.sessions ?? 0),
      rate: Number(attendanceRow?.records ?? 0)
        ? (Number(attendanceRow?.attended ?? 0) / Number(attendanceRow?.records ?? 1)) * 100
        : 0,
    },
    finance: {
      invoiced: Number(finance[0]?.invoiced ?? 0),
      collected: Number(collected?.value ?? 0),
    },
    academics: {
      average: Number(academics[0]?.average ?? 0),
      assessments: Number(academics[0]?.assessments ?? 0),
    },
    enrollmentTrend: trend.map((point) => ({
      month: point.month,
      value: Number(point.value),
    })),
  };
}

export async function getPlatformReport() {
  const [schoolsSummary, enrollment, attendance, finance, academics] =
    await Promise.all([
      db
        .select({
          id: schools.id,
          name: schools.name,
          status: schools.status,
          students: countDistinct(students.id),
        })
        .from(schools)
        .leftJoin(students, eq(students.schoolId, schools.id))
        .where(eq(schools.status, "active"))
        .groupBy(schools.id)
        .orderBy(sql`count(distinct ${students.id}) desc`),
      db
        .select({ value: count() })
        .from(students)
        .innerJoin(schools, eq(schools.id, students.schoolId))
        .where(and(eq(schools.status, "active"), eq(students.status, "active"))),
      db
        .select({ records: attendanceTotal, attended })
        .from(attendanceSessions)
        .innerJoin(schools, eq(schools.id, attendanceSessions.schoolId))
        .leftJoin(attendanceRecords, eq(attendanceRecords.attendanceSessionId, attendanceSessions.id))
        .where(eq(schools.status, "active")),
      db
        .select({ value: sql<string>`coalesce(sum(${studentInvoiceItems.amount}), 0)` })
        .from(studentInvoices)
        .innerJoin(studentInvoiceItems, eq(studentInvoiceItems.invoiceId, studentInvoices.id))
        .innerJoin(schools, eq(schools.id, studentInvoices.schoolId))
        .where(and(eq(schools.status, "active"), sql`${studentInvoices.status} <> 'cancelled'`)),
      db
        .select({ average: scorePercent })
        .from(assessments)
        .innerJoin(assessmentScores, eq(assessmentScores.assessmentId, assessments.id))
        .innerJoin(schools, eq(schools.id, assessments.schoolId))
        .where(and(eq(schools.status, "active"), sql`${assessments.status} in ('closed', 'published')`)),
    ]);

  const [collected] = await db
    .select({ value: sql<string>`coalesce(sum(${payments.amount}), 0)` })
    .from(payments)
    .innerJoin(schools, eq(schools.id, payments.schoolId))
    .where(and(eq(schools.status, "active"), eq(payments.status, "posted")));
  const attendanceRow = attendance[0];
  return {
    schoolCount: schoolsSummary.length,
    activeStudents: Number(enrollment[0]?.value ?? 0),
    attendanceRate: Number(attendanceRow?.records ?? 0)
      ? (Number(attendanceRow?.attended ?? 0) / Number(attendanceRow?.records ?? 1)) * 100
      : 0,
    invoiced: Number(finance[0]?.value ?? 0),
    collected: Number(collected?.value ?? 0),
    academicAverage: Number(academics[0]?.average ?? 0),
    schools: schoolsSummary.map((school) => ({
      id: school.id,
      name: school.name,
      students: Number(school.students),
      status: school.status,
    })),
  };
}
