import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  academicYears,
  classLevels,
  resultPublicationStudents,
  resultPublicationSubjects,
  resultPublications,
  streams,
  terms as dbTerms,
} from "@/db/schema";
import { getCurrentSchool } from "@/lib/current-school";

export type TranscriptTerm = {
  publicationId: string;
  academicYearId: string;
  academicYearName: string;
  termId: string;
  termName: string;
  termNumber: number;
  className: string;
  streamName: string;
  publishedAt: Date | null;
  overallPercentage: number;
  position: number;
  subjects: Array<{
    subjectId: string;
    subjectName: string;
    finalPercentage: number;
    grade: string | null;
    remark: string | null;
  }>;
};

export type CumulativeTranscript = {
  school: { id: string; name: string; slug: string };
  student: {
    id: string;
    studentNumber: string;
    firstName: string;
    middleName: string | null;
    lastName: string;
  };
  terms: TranscriptTerm[];
  subjectAverages: Array<{
    subjectId: string;
    subjectName: string;
    averagePercentage: number;
    attempts: number;
  }>;
  cumulativeAverage: number;
};

export async function getCumulativeTranscript(
  studentId: string,
): Promise<CumulativeTranscript | null> {
  const school = await getCurrentSchool();
  const rows = await db
    .select({
      publicationId: resultPublications.id,
      academicYearId: resultPublications.academicYearId,
      academicYearName: academicYears.name,
      academicYearStart: academicYears.startDate,
      termId: resultPublications.termId,
      termName: dbTerms.name,
      termNumber: dbTerms.termNumber,
      className: classLevels.name,
      streamName: streams.name,
      publishedAt: resultPublications.publishedAt,
      studentId: resultPublicationStudents.studentId,
      studentNumber: resultPublicationStudents.studentNumber,
      firstName: resultPublicationStudents.firstName,
      middleName: resultPublicationStudents.middleName,
      lastName: resultPublicationStudents.lastName,
      overallPercentage: resultPublicationStudents.overallPercentage,
      position: resultPublicationStudents.position,
      subjectId: resultPublicationSubjects.subjectId,
      subjectName: resultPublicationSubjects.subjectName,
      finalPercentage: resultPublicationSubjects.finalPercentage,
      grade: resultPublicationSubjects.grade,
      remark: resultPublicationSubjects.remark,
    })
    .from(resultPublicationStudents)
    .innerJoin(
      resultPublications,
      and(
        eq(resultPublicationStudents.publicationId, resultPublications.id),
        eq(resultPublications.schoolId, school.id),
        eq(resultPublications.status, "published"),
      ),
    )
    .innerJoin(academicYears, eq(resultPublications.academicYearId, academicYears.id))
    .innerJoin(dbTerms, eq(resultPublications.termId, dbTerms.id))
    .innerJoin(streams, eq(resultPublications.streamId, streams.id))
    .innerJoin(classLevels, eq(streams.classLevelId, classLevels.id))
    .innerJoin(
      resultPublicationSubjects,
      eq(resultPublicationSubjects.publicationStudentId, resultPublicationStudents.id),
    )
    .where(eq(resultPublicationStudents.studentId, studentId))
    .orderBy(
      asc(academicYears.startDate),
      asc(dbTerms.termNumber),
      asc(resultPublicationSubjects.subjectName),
    );

  if (rows.length === 0) return null;

  const first = rows[0];
  const termMap = new Map<string, TranscriptTerm>();
  const subjectMap = new Map<string, number[]>();

  for (const row of rows) {
    let term = termMap.get(row.publicationId);
    if (!term) {
      term = {
        publicationId: row.publicationId,
        academicYearId: row.academicYearId,
        academicYearName: row.academicYearName,
        termId: row.termId,
        termName: row.termName,
        termNumber: row.termNumber,
        className: row.className,
        streamName: row.streamName,
        publishedAt: row.publishedAt,
        overallPercentage: Number(row.overallPercentage),
        position: row.position,
        subjects: [],
      };
      termMap.set(row.publicationId, term);
    }

    term.subjects.push({
      subjectId: row.subjectId,
      subjectName: row.subjectName,
      finalPercentage: Number(row.finalPercentage),
      grade: row.grade,
      remark: row.remark,
    });

    const percentages = subjectMap.get(row.subjectId) ?? [];
    percentages.push(Number(row.finalPercentage));
    subjectMap.set(row.subjectId, percentages);
  }

  const terms = Array.from(termMap.values());
  const subjectAverages = Array.from(subjectMap.entries())
    .map(([subjectId, percentages]) => ({
      subjectId,
      subjectName:
        terms
          .flatMap((term) => term.subjects)
          .find((subject) => subject.subjectId === subjectId)?.subjectName ?? "Subject",
      averagePercentage: round(percentages.reduce((sum, value) => sum + value, 0) / percentages.length),
      attempts: percentages.length,
    }))
    .sort((a, b) => a.subjectName.localeCompare(b.subjectName));

  return {
    school: { id: school.id, name: school.name, slug: school.slug },
    student: {
      id: first.studentId,
      studentNumber: first.studentNumber,
      firstName: first.firstName,
      middleName: first.middleName,
      lastName: first.lastName,
    },
    terms,
    subjectAverages,
    cumulativeAverage: round(
      terms.reduce((sum, term) => sum + term.overallPercentage, 0) / terms.length,
    ),
  };
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}
