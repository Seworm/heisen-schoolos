import { relations } from "drizzle-orm/relations";
import { classLevels, streams, schools, staff, academicYears, guardians, students, studentEnrollments, subjects, teacherAssignments, terms, studentPlacements, classSubjects, attendanceSessions, attendanceRecords, assessmentTypes, assessmentPeriods, assessments, assessmentScores, studentGuardians } from "./schema";

export const streamsRelations = relations(streams, ({one, many}) => ({
	classLevel: one(classLevels, {
		fields: [streams.classLevelId],
		references: [classLevels.id]
	}),
	studentEnrollments: many(studentEnrollments),
	teacherAssignments: many(teacherAssignments),
	studentPlacements: many(studentPlacements),
	attendanceSessions: many(attendanceSessions),
	assessments: many(assessments),
}));

export const classLevelsRelations = relations(classLevels, ({one, many}) => ({
	streams: many(streams),
	school: one(schools, {
		fields: [classLevels.schoolId],
		references: [schools.id]
	}),
	classSubjects: many(classSubjects),
}));

export const staffRelations = relations(staff, ({one, many}) => ({
	school: one(schools, {
		fields: [staff.schoolId],
		references: [schools.id]
	}),
	teacherAssignments: many(teacherAssignments),
}));

export const schoolsRelations = relations(schools, ({many}) => ({
	staff: many(staff),
	academicYears: many(academicYears),
	classLevels: many(classLevels),
	guardians: many(guardians),
	students: many(students),
	subjects: many(subjects),
	attendanceSessions: many(attendanceSessions),
	assessmentTypes: many(assessmentTypes),
	assessmentPeriods: many(assessmentPeriods),
	assessments: many(assessments),
}));

export const academicYearsRelations = relations(academicYears, ({one, many}) => ({
	school: one(schools, {
		fields: [academicYears.schoolId],
		references: [schools.id]
	}),
	studentEnrollments: many(studentEnrollments),
	teacherAssignments: many(teacherAssignments),
	terms: many(terms),
	attendanceSessions: many(attendanceSessions),
	assessmentPeriods: many(assessmentPeriods),
	assessments: many(assessments),
}));

export const guardiansRelations = relations(guardians, ({one, many}) => ({
	school: one(schools, {
		fields: [guardians.schoolId],
		references: [schools.id]
	}),
	studentGuardians: many(studentGuardians),
}));

export const studentsRelations = relations(students, ({one, many}) => ({
	school: one(schools, {
		fields: [students.schoolId],
		references: [schools.id]
	}),
	studentEnrollments: many(studentEnrollments),
	attendanceRecords: many(attendanceRecords),
	assessmentScores: many(assessmentScores),
	studentGuardians: many(studentGuardians),
}));

export const studentEnrollmentsRelations = relations(studentEnrollments, ({one, many}) => ({
	student: one(students, {
		fields: [studentEnrollments.studentId],
		references: [students.id]
	}),
	academicYear: one(academicYears, {
		fields: [studentEnrollments.academicYearId],
		references: [academicYears.id]
	}),
	stream: one(streams, {
		fields: [studentEnrollments.streamId],
		references: [streams.id]
	}),
	studentPlacements: many(studentPlacements),
}));

export const subjectsRelations = relations(subjects, ({one, many}) => ({
	school: one(schools, {
		fields: [subjects.schoolId],
		references: [schools.id]
	}),
	teacherAssignments: many(teacherAssignments),
	classSubjects: many(classSubjects),
	assessments: many(assessments),
}));

export const teacherAssignmentsRelations = relations(teacherAssignments, ({one}) => ({
	staff: one(staff, {
		fields: [teacherAssignments.staffId],
		references: [staff.id]
	}),
	stream: one(streams, {
		fields: [teacherAssignments.streamId],
		references: [streams.id]
	}),
	subject: one(subjects, {
		fields: [teacherAssignments.subjectId],
		references: [subjects.id]
	}),
	academicYear: one(academicYears, {
		fields: [teacherAssignments.academicYearId],
		references: [academicYears.id]
	}),
}));

export const termsRelations = relations(terms, ({one, many}) => ({
	academicYear: one(academicYears, {
		fields: [terms.academicYearId],
		references: [academicYears.id]
	}),
	attendanceSessions: many(attendanceSessions),
	assessmentPeriods: many(assessmentPeriods),
	assessments: many(assessments),
}));

export const studentPlacementsRelations = relations(studentPlacements, ({one}) => ({
	stream: one(streams, {
		fields: [studentPlacements.streamId],
		references: [streams.id]
	}),
	studentEnrollment: one(studentEnrollments, {
		fields: [studentPlacements.studentEnrollmentId],
		references: [studentEnrollments.id]
	}),
}));

export const classSubjectsRelations = relations(classSubjects, ({one}) => ({
	classLevel: one(classLevels, {
		fields: [classSubjects.classLevelId],
		references: [classLevels.id]
	}),
	subject: one(subjects, {
		fields: [classSubjects.subjectId],
		references: [subjects.id]
	}),
}));

export const attendanceSessionsRelations = relations(attendanceSessions, ({one, many}) => ({
	school: one(schools, {
		fields: [attendanceSessions.schoolId],
		references: [schools.id]
	}),
	academicYear: one(academicYears, {
		fields: [attendanceSessions.academicYearId],
		references: [academicYears.id]
	}),
	term: one(terms, {
		fields: [attendanceSessions.termId],
		references: [terms.id]
	}),
	stream: one(streams, {
		fields: [attendanceSessions.streamId],
		references: [streams.id]
	}),
	attendanceRecords: many(attendanceRecords),
}));

export const attendanceRecordsRelations = relations(attendanceRecords, ({one}) => ({
	attendanceSession: one(attendanceSessions, {
		fields: [attendanceRecords.attendanceSessionId],
		references: [attendanceSessions.id]
	}),
	student: one(students, {
		fields: [attendanceRecords.studentId],
		references: [students.id]
	}),
}));

export const assessmentTypesRelations = relations(assessmentTypes, ({one, many}) => ({
	school: one(schools, {
		fields: [assessmentTypes.schoolId],
		references: [schools.id]
	}),
	assessments: many(assessments),
}));

export const assessmentPeriodsRelations = relations(assessmentPeriods, ({one, many}) => ({
	school: one(schools, {
		fields: [assessmentPeriods.schoolId],
		references: [schools.id]
	}),
	academicYear: one(academicYears, {
		fields: [assessmentPeriods.academicYearId],
		references: [academicYears.id]
	}),
	term: one(terms, {
		fields: [assessmentPeriods.termId],
		references: [terms.id]
	}),
	assessments: many(assessments),
}));

export const assessmentsRelations = relations(assessments, ({one, many}) => ({
	school: one(schools, {
		fields: [assessments.schoolId],
		references: [schools.id]
	}),
	academicYear: one(academicYears, {
		fields: [assessments.academicYearId],
		references: [academicYears.id]
	}),
	term: one(terms, {
		fields: [assessments.termId],
		references: [terms.id]
	}),
	assessmentPeriod: one(assessmentPeriods, {
		fields: [assessments.assessmentPeriodId],
		references: [assessmentPeriods.id]
	}),
	stream: one(streams, {
		fields: [assessments.streamId],
		references: [streams.id]
	}),
	subject: one(subjects, {
		fields: [assessments.subjectId],
		references: [subjects.id]
	}),
	assessmentType: one(assessmentTypes, {
		fields: [assessments.assessmentTypeId],
		references: [assessmentTypes.id]
	}),
	assessmentScores: many(assessmentScores),
}));

export const assessmentScoresRelations = relations(assessmentScores, ({one}) => ({
	assessment: one(assessments, {
		fields: [assessmentScores.assessmentId],
		references: [assessments.id]
	}),
	student: one(students, {
		fields: [assessmentScores.studentId],
		references: [students.id]
	}),
}));

export const studentGuardiansRelations = relations(studentGuardians, ({one}) => ({
	student: one(students, {
		fields: [studentGuardians.studentId],
		references: [students.id]
	}),
	guardian: one(guardians, {
		fields: [studentGuardians.guardianId],
		references: [guardians.id]
	}),
}));