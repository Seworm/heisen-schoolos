import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  assessmentScores,
  assessments,
  attendanceRecords,
  attendanceSessions,
  announcements,
  schoolSettings,
  students,
} from "@/db/schema";

export const DEFAULT_INSIGHT_THRESHOLDS = {
  attendanceRate: 85,
  assessmentAverage: 50,
  minimumAssessments: 2,
  lookbackMonths: 6,
} as const;

export type InsightThresholds = {
  attendanceRate: number;
  assessmentAverage: number;
  minimumAssessments: number;
  lookbackMonths: number;
};

function thresholdsFromMetadata(metadata: Record<string, unknown> | null | undefined): InsightThresholds {
  const configured = (metadata?.insights as Record<string, unknown> | undefined) ?? {};
  const number = (key: keyof InsightThresholds) => {
    const value = Number(configured[key]);
    return Number.isFinite(value) && value >= 0 ? value : DEFAULT_INSIGHT_THRESHOLDS[key];
  };
  return {
    attendanceRate: Math.min(100, number("attendanceRate")),
    assessmentAverage: Math.min(100, number("assessmentAverage")),
    minimumAssessments: Math.max(1, Math.round(number("minimumAssessments"))),
    lookbackMonths: Math.min(24, Math.max(1, Math.round(number("lookbackMonths")))),
  };
}

export async function getInsightThresholds(schoolId: string) {
  const [settings] = await db
    .select({ metadata: schoolSettings.metadata })
    .from(schoolSettings)
    .where(eq(schoolSettings.schoolId, schoolId))
    .limit(1);
  return thresholdsFromMetadata(settings?.metadata);
}

export async function getSchoolInsights(schoolId: string) {
  const thresholds = await getInsightThresholds(schoolId);
  const [studentRows, attendanceRows, assessmentRows, trendRows, communications] = await Promise.all([
    db.select({ id: students.id, firstName: students.firstName, lastName: students.lastName, status: students.status })
      .from(students).where(and(eq(students.schoolId, schoolId), eq(students.status, "active"))),
    db.select({
      studentId: attendanceRecords.studentId,
      total: sql<number>`count(*)`,
      attended: sql<number>`count(*) filter (where ${attendanceRecords.status} in ('present', 'late'))`,
    }).from(attendanceRecords)
      .innerJoin(attendanceSessions, eq(attendanceSessions.id, attendanceRecords.attendanceSessionId))
      .where(and(eq(attendanceSessions.schoolId, schoolId), gte(attendanceSessions.attendanceDate, sql`current_date - (${thresholds.lookbackMonths} || ' months')::interval`)))
      .groupBy(attendanceRecords.studentId),
    db.select({
      studentId: assessmentScores.studentId,
      assessments: sql<number>`count(*)`,
      average: sql<number>`coalesce(avg((${assessmentScores.score} / nullif(${assessments.maxScore}, 0)) * 100), 0)`,
    }).from(assessmentScores)
      .innerJoin(assessments, eq(assessments.id, assessmentScores.assessmentId))
      .where(and(eq(assessments.schoolId, schoolId), sql`${assessments.status} in ('closed', 'published')`, gte(assessments.assessmentDate, sql`current_date - (${thresholds.lookbackMonths} || ' months')::interval`)))
      .groupBy(assessmentScores.studentId),
    db.select({
      month: sql<string>`to_char(date_trunc('month', ${assessments.assessmentDate}), 'Mon')`,
      average: sql<number>`coalesce(avg((${assessmentScores.score} / nullif(${assessments.maxScore}, 0)) * 100), 0)`,
    }).from(assessmentScores).innerJoin(assessments, eq(assessments.id, assessmentScores.assessmentId))
      .where(and(eq(assessments.schoolId, schoolId), sql`${assessments.status} in ('closed', 'published')`, gte(assessments.assessmentDate, sql`current_date - (${thresholds.lookbackMonths} || ' months')::interval`)))
      .groupBy(sql`date_trunc('month', ${assessments.assessmentDate})`).orderBy(sql`date_trunc('month', ${assessments.assessmentDate})`),
    db.select({ count: sql<number>`count(*)` }).from(announcements)
      .where(and(eq(announcements.schoolId, schoolId), gte(announcements.createdAt, sql`current_date - interval '30 days'`))),
  ]);

  const attendance = new Map(attendanceRows.map((row) => [row.studentId, row]));
  const academic = new Map(assessmentRows.map((row) => [row.studentId, row]));
  const risks = studentRows.map((student) => {
    const a = attendance.get(student.id);
    const s = academic.get(student.id);
    const attendanceRate = Number(a?.total) ? (Number(a?.attended) / Number(a?.total)) * 100 : null;
    const average = s ? Number(s.average) : null;
    const factors = [
      attendanceRate !== null && attendanceRate < thresholds.attendanceRate ? "attendance" : null,
      average !== null && Number(s?.assessments) >= thresholds.minimumAssessments && average < thresholds.assessmentAverage ? "academic" : null,
      !s || Number(s.assessments) < thresholds.minimumAssessments ? "assessment coverage" : null,
    ].filter(Boolean) as string[];
    return { id: student.id, name: `${student.firstName} ${student.lastName}`, attendanceRate, average, factors, level: factors.length >= 2 ? "high" : factors.length ? "watch" : "on_track" };
  }).filter((student) => student.factors.length);

  return {
    thresholds,
    summary: { activeStudents: studentRows.length, atRiskStudents: risks.filter((r) => r.level === "high").length, watchStudents: risks.filter((r) => r.level === "watch").length, recentCommunications: Number(communications[0]?.count ?? 0) },
    risks: risks.slice(0, 50),
    trends: trendRows.map((row) => ({ month: row.month, average: Number(row.average) })),
  };
}

export async function getPlatformInsights() {
  const [rows] = await db.select({
    activeStudents: sql<number>`count(*) filter (where ${students.status} = 'active')`,
    atRiskAttendance: sql<number>`count(*) filter (where ${students.status} = 'active' and ${students.id} in (
      select ar.student_id from attendance_records ar join attendance_sessions ats on ats.id = ar.attendance_session_id
      where ats.school_id = ${students.schoolId} group by ar.student_id having avg(case when ar.status in ('present','late') then 100 else 0 end) < 85
    ))`,
  }).from(students);
  return { activeStudents: Number(rows?.activeStudents ?? 0), atRiskAttendance: Number(rows?.atRiskAttendance ?? 0) };
}
