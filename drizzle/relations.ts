import { relations } from "drizzle-orm/relations";
import { schools, announcements, feeStructures, feeStructureItems, feeCategories, internalMessages, studentInvoices, invoiceAdjustments, auditLogs, classrooms, feeAssignments, students, academicYears, terms, classLevels, streams, staff, assessmentTypes, subjects, resultPublicationSubjects, resultPublicationStudents, resultPublications, gradingSchemes, reportCards, studentScholarships, scholarships, users, schoolMemberships, studentUserAccounts, studentStatusHistory, timetableEntries, timetablePeriods, payments, guardians, paymentAllocations, studentEnrollments, teacherAssignments, studentPlacements, classSubjects, attendanceSessions, attendanceRecords, staffDocuments, assessmentPeriods, assessments, promotionDecisions, schoolSettings, assessmentScores, gradeBands, gradingSchemeItems, studentInvoiceItems, studentDocuments, studentImports, resultPublicationAssessments, notifications, studentGuardians } from "./schema";

export const announcementsRelations = relations(announcements, ({one}) => ({
	school: one(schools, {
		fields: [announcements.schoolId],
		references: [schools.id]
	}),
}));

export const schoolsRelations = relations(schools, ({many}) => ({
	announcements: many(announcements),
	internalMessages: many(internalMessages),
	feeCategories: many(feeCategories),
	auditLogs: many(auditLogs),
	classrooms: many(classrooms),
	feeAssignments: many(feeAssignments),
	staff: many(staff),
	assessmentTypes: many(assessmentTypes),
	resultPublications: many(resultPublications),
	reportCards: many(reportCards),
	studentScholarships: many(studentScholarships),
	schoolMemberships: many(schoolMemberships),
	studentStatusHistories: many(studentStatusHistory),
	timetableEntries: many(timetableEntries),
	timetablePeriods: many(timetablePeriods),
	feeStructures: many(feeStructures),
	students: many(students),
	payments: many(payments),
	academicYears: many(academicYears),
	classLevels: many(classLevels),
	guardians: many(guardians),
	subjects: many(subjects),
	attendanceSessions: many(attendanceSessions),
	staffDocuments: many(staffDocuments),
	assessmentPeriods: many(assessmentPeriods),
	assessments: many(assessments),
	promotionDecisions: many(promotionDecisions),
	scholarships: many(scholarships),
	schoolSettings: many(schoolSettings),
	gradingSchemes: many(gradingSchemes),
	studentDocuments: many(studentDocuments),
	studentInvoices: many(studentInvoices),
	studentImports: many(studentImports),
	notifications: many(notifications),
}));

export const feeStructureItemsRelations = relations(feeStructureItems, ({one}) => ({
	feeStructure: one(feeStructures, {
		fields: [feeStructureItems.feeStructureId],
		references: [feeStructures.id]
	}),
	feeCategory: one(feeCategories, {
		fields: [feeStructureItems.feeCategoryId],
		references: [feeCategories.id]
	}),
}));

export const feeStructuresRelations = relations(feeStructures, ({one, many}) => ({
	feeStructureItems: many(feeStructureItems),
	feeAssignments: many(feeAssignments),
	school: one(schools, {
		fields: [feeStructures.schoolId],
		references: [schools.id]
	}),
	academicYear: one(academicYears, {
		fields: [feeStructures.academicYearId],
		references: [academicYears.id]
	}),
	term: one(terms, {
		fields: [feeStructures.termId],
		references: [terms.id]
	}),
	classLevel: one(classLevels, {
		fields: [feeStructures.classLevelId],
		references: [classLevels.id]
	}),
}));

export const feeCategoriesRelations = relations(feeCategories, ({one, many}) => ({
	feeStructureItems: many(feeStructureItems),
	school: one(schools, {
		fields: [feeCategories.schoolId],
		references: [schools.id]
	}),
	studentInvoiceItems: many(studentInvoiceItems),
}));

export const internalMessagesRelations = relations(internalMessages, ({one}) => ({
	school: one(schools, {
		fields: [internalMessages.schoolId],
		references: [schools.id]
	}),
}));

export const invoiceAdjustmentsRelations = relations(invoiceAdjustments, ({one}) => ({
	studentInvoice: one(studentInvoices, {
		fields: [invoiceAdjustments.invoiceId],
		references: [studentInvoices.id]
	}),
}));

export const studentInvoicesRelations = relations(studentInvoices, ({one, many}) => ({
	invoiceAdjustments: many(invoiceAdjustments),
	paymentAllocations: many(paymentAllocations),
	studentInvoiceItems: many(studentInvoiceItems),
	school: one(schools, {
		fields: [studentInvoices.schoolId],
		references: [schools.id]
	}),
	student: one(students, {
		fields: [studentInvoices.studentId],
		references: [students.id]
	}),
	academicYear: one(academicYears, {
		fields: [studentInvoices.academicYearId],
		references: [academicYears.id]
	}),
	term: one(terms, {
		fields: [studentInvoices.termId],
		references: [terms.id]
	}),
}));

export const auditLogsRelations = relations(auditLogs, ({one}) => ({
	school: one(schools, {
		fields: [auditLogs.schoolId],
		references: [schools.id]
	}),
}));

export const classroomsRelations = relations(classrooms, ({one, many}) => ({
	school: one(schools, {
		fields: [classrooms.schoolId],
		references: [schools.id]
	}),
	timetableEntries: many(timetableEntries),
}));

export const feeAssignmentsRelations = relations(feeAssignments, ({one}) => ({
	school: one(schools, {
		fields: [feeAssignments.schoolId],
		references: [schools.id]
	}),
	student: one(students, {
		fields: [feeAssignments.studentId],
		references: [students.id]
	}),
	feeStructure: one(feeStructures, {
		fields: [feeAssignments.feeStructureId],
		references: [feeStructures.id]
	}),
	academicYear: one(academicYears, {
		fields: [feeAssignments.academicYearId],
		references: [academicYears.id]
	}),
	term: one(terms, {
		fields: [feeAssignments.termId],
		references: [terms.id]
	}),
}));

export const studentsRelations = relations(students, ({one, many}) => ({
	feeAssignments: many(feeAssignments),
	resultPublicationStudents: many(resultPublicationStudents),
	studentScholarships: many(studentScholarships),
	studentUserAccounts: many(studentUserAccounts),
	studentStatusHistories: many(studentStatusHistory),
	school: one(schools, {
		fields: [students.schoolId],
		references: [schools.id]
	}),
	payments: many(payments),
	studentEnrollments: many(studentEnrollments),
	attendanceRecords: many(attendanceRecords),
	promotionDecisions: many(promotionDecisions),
	assessmentScores: many(assessmentScores),
	studentDocuments: many(studentDocuments),
	studentInvoices: many(studentInvoices),
	studentGuardians: many(studentGuardians),
}));

export const academicYearsRelations = relations(academicYears, ({one, many}) => ({
	feeAssignments: many(feeAssignments),
	resultPublications: many(resultPublications),
	studentScholarships: many(studentScholarships),
	timetableEntries: many(timetableEntries),
	feeStructures: many(feeStructures),
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
	studentInvoices: many(studentInvoices),
}));

export const termsRelations = relations(terms, ({one, many}) => ({
	feeAssignments: many(feeAssignments),
	resultPublications: many(resultPublications),
	studentScholarships: many(studentScholarships),
	timetableEntries: many(timetableEntries),
	feeStructures: many(feeStructures),
	academicYear: one(academicYears, {
		fields: [terms.academicYearId],
		references: [academicYears.id]
	}),
	attendanceSessions: many(attendanceSessions),
	assessmentPeriods: many(assessmentPeriods),
	assessments: many(assessments),
	studentInvoices: many(studentInvoices),
}));

export const streamsRelations = relations(streams, ({one, many}) => ({
	classLevel: one(classLevels, {
		fields: [streams.classLevelId],
		references: [classLevels.id]
	}),
	resultPublications: many(resultPublications),
	timetableEntries: many(timetableEntries),
	studentEnrollments: many(studentEnrollments),
	teacherAssignments: many(teacherAssignments),
	studentPlacements: many(studentPlacements),
	attendanceSessions: many(attendanceSessions),
	assessments: many(assessments),
}));

export const classLevelsRelations = relations(classLevels, ({one, many}) => ({
	streams: many(streams),
	feeStructures: many(feeStructures),
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
	timetableEntries: many(timetableEntries),
	teacherAssignments: many(teacherAssignments),
	staffDocuments: many(staffDocuments),
}));

export const assessmentTypesRelations = relations(assessmentTypes, ({one, many}) => ({
	school: one(schools, {
		fields: [assessmentTypes.schoolId],
		references: [schools.id]
	}),
	assessments: many(assessments),
	gradingSchemeItems: many(gradingSchemeItems),
}));

export const resultPublicationSubjectsRelations = relations(resultPublicationSubjects, ({one, many}) => ({
	subject: one(subjects, {
		fields: [resultPublicationSubjects.subjectId],
		references: [subjects.id]
	}),
	resultPublicationStudent: one(resultPublicationStudents, {
		fields: [resultPublicationSubjects.publicationStudentId],
		references: [resultPublicationStudents.id]
	}),
	resultPublicationAssessments: many(resultPublicationAssessments),
}));

export const subjectsRelations = relations(subjects, ({one, many}) => ({
	resultPublicationSubjects: many(resultPublicationSubjects),
	timetableEntries: many(timetableEntries),
	school: one(schools, {
		fields: [subjects.schoolId],
		references: [schools.id]
	}),
	teacherAssignments: many(teacherAssignments),
	classSubjects: many(classSubjects),
	assessments: many(assessments),
}));

export const resultPublicationStudentsRelations = relations(resultPublicationStudents, ({one, many}) => ({
	resultPublicationSubjects: many(resultPublicationSubjects),
	student: one(students, {
		fields: [resultPublicationStudents.studentId],
		references: [students.id]
	}),
	resultPublication: one(resultPublications, {
		fields: [resultPublicationStudents.publicationId],
		references: [resultPublications.id]
	}),
	reportCards: many(reportCards),
}));

export const resultPublicationsRelations = relations(resultPublications, ({one, many}) => ({
	school: one(schools, {
		fields: [resultPublications.schoolId],
		references: [schools.id]
	}),
	academicYear: one(academicYears, {
		fields: [resultPublications.academicYearId],
		references: [academicYears.id]
	}),
	term: one(terms, {
		fields: [resultPublications.termId],
		references: [terms.id]
	}),
	stream: one(streams, {
		fields: [resultPublications.streamId],
		references: [streams.id]
	}),
	gradingScheme: one(gradingSchemes, {
		fields: [resultPublications.gradingSchemeId],
		references: [gradingSchemes.id]
	}),
	resultPublicationStudents: many(resultPublicationStudents),
	reportCards: many(reportCards),
}));

export const gradingSchemesRelations = relations(gradingSchemes, ({one, many}) => ({
	resultPublications: many(resultPublications),
	school: one(schools, {
		fields: [gradingSchemes.schoolId],
		references: [schools.id]
	}),
	gradeBands: many(gradeBands),
	gradingSchemeItems: many(gradingSchemeItems),
}));

export const reportCardsRelations = relations(reportCards, ({one}) => ({
	school: one(schools, {
		fields: [reportCards.schoolId],
		references: [schools.id]
	}),
	resultPublication: one(resultPublications, {
		fields: [reportCards.publicationId],
		references: [resultPublications.id]
	}),
	resultPublicationStudent: one(resultPublicationStudents, {
		fields: [reportCards.publicationStudentId],
		references: [resultPublicationStudents.id]
	}),
}));

export const studentScholarshipsRelations = relations(studentScholarships, ({one}) => ({
	school: one(schools, {
		fields: [studentScholarships.schoolId],
		references: [schools.id]
	}),
	student: one(students, {
		fields: [studentScholarships.studentId],
		references: [students.id]
	}),
	scholarship: one(scholarships, {
		fields: [studentScholarships.scholarshipId],
		references: [scholarships.id]
	}),
	academicYear: one(academicYears, {
		fields: [studentScholarships.academicYearId],
		references: [academicYears.id]
	}),
	term: one(terms, {
		fields: [studentScholarships.termId],
		references: [terms.id]
	}),
}));

export const scholarshipsRelations = relations(scholarships, ({one, many}) => ({
	studentScholarships: many(studentScholarships),
	school: one(schools, {
		fields: [scholarships.schoolId],
		references: [schools.id]
	}),
}));

export const schoolMembershipsRelations = relations(schoolMemberships, ({one}) => ({
	user: one(users, {
		fields: [schoolMemberships.userId],
		references: [users.id]
	}),
	school: one(schools, {
		fields: [schoolMemberships.schoolId],
		references: [schools.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	schoolMemberships: many(schoolMemberships),
}));

export const studentUserAccountsRelations = relations(studentUserAccounts, ({one}) => ({
	student: one(students, {
		fields: [studentUserAccounts.studentId],
		references: [students.id]
	}),
}));

export const studentStatusHistoryRelations = relations(studentStatusHistory, ({one}) => ({
	school: one(schools, {
		fields: [studentStatusHistory.schoolId],
		references: [schools.id]
	}),
	student: one(students, {
		fields: [studentStatusHistory.studentId],
		references: [students.id]
	}),
}));

export const timetableEntriesRelations = relations(timetableEntries, ({one}) => ({
	school: one(schools, {
		fields: [timetableEntries.schoolId],
		references: [schools.id]
	}),
	academicYear: one(academicYears, {
		fields: [timetableEntries.academicYearId],
		references: [academicYears.id]
	}),
	term: one(terms, {
		fields: [timetableEntries.termId],
		references: [terms.id]
	}),
	stream: one(streams, {
		fields: [timetableEntries.streamId],
		references: [streams.id]
	}),
	subject: one(subjects, {
		fields: [timetableEntries.subjectId],
		references: [subjects.id]
	}),
	staff: one(staff, {
		fields: [timetableEntries.staffId],
		references: [staff.id]
	}),
	timetablePeriod: one(timetablePeriods, {
		fields: [timetableEntries.periodId],
		references: [timetablePeriods.id]
	}),
	classroom: one(classrooms, {
		fields: [timetableEntries.classroomId],
		references: [classrooms.id]
	}),
}));

export const timetablePeriodsRelations = relations(timetablePeriods, ({one, many}) => ({
	timetableEntries: many(timetableEntries),
	school: one(schools, {
		fields: [timetablePeriods.schoolId],
		references: [schools.id]
	}),
}));

export const paymentsRelations = relations(payments, ({one, many}) => ({
	school: one(schools, {
		fields: [payments.schoolId],
		references: [schools.id]
	}),
	student: one(students, {
		fields: [payments.studentId],
		references: [students.id]
	}),
	paymentAllocations: many(paymentAllocations),
}));

export const guardiansRelations = relations(guardians, ({one, many}) => ({
	school: one(schools, {
		fields: [guardians.schoolId],
		references: [schools.id]
	}),
	studentGuardians: many(studentGuardians),
}));

export const paymentAllocationsRelations = relations(paymentAllocations, ({one}) => ({
	payment: one(payments, {
		fields: [paymentAllocations.paymentId],
		references: [payments.id]
	}),
	studentInvoice: one(studentInvoices, {
		fields: [paymentAllocations.invoiceId],
		references: [studentInvoices.id]
	}),
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
	promotionDecisions_toEnrollmentId: many(promotionDecisions, {
		relationName: "promotionDecisions_toEnrollmentId_studentEnrollments_id"
	}),
	promotionDecisions_fromEnrollmentId: many(promotionDecisions, {
		relationName: "promotionDecisions_fromEnrollmentId_studentEnrollments_id"
	}),
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
	student: one(students, {
		fields: [attendanceRecords.studentId],
		references: [students.id]
	}),
	attendanceSession: one(attendanceSessions, {
		fields: [attendanceRecords.attendanceSessionId],
		references: [attendanceSessions.id]
	}),
}));

export const staffDocumentsRelations = relations(staffDocuments, ({one}) => ({
	school: one(schools, {
		fields: [staffDocuments.schoolId],
		references: [schools.id]
	}),
	staff: one(staff, {
		fields: [staffDocuments.staffId],
		references: [staff.id]
	}),
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
	resultPublicationAssessments: many(resultPublicationAssessments),
}));

export const promotionDecisionsRelations = relations(promotionDecisions, ({one}) => ({
	school: one(schools, {
		fields: [promotionDecisions.schoolId],
		references: [schools.id]
	}),
	student: one(students, {
		fields: [promotionDecisions.studentId],
		references: [students.id]
	}),
	studentEnrollment_toEnrollmentId: one(studentEnrollments, {
		fields: [promotionDecisions.toEnrollmentId],
		references: [studentEnrollments.id],
		relationName: "promotionDecisions_toEnrollmentId_studentEnrollments_id"
	}),
	studentEnrollment_fromEnrollmentId: one(studentEnrollments, {
		fields: [promotionDecisions.fromEnrollmentId],
		references: [studentEnrollments.id],
		relationName: "promotionDecisions_fromEnrollmentId_studentEnrollments_id"
	}),
}));

export const schoolSettingsRelations = relations(schoolSettings, ({one}) => ({
	school: one(schools, {
		fields: [schoolSettings.schoolId],
		references: [schools.id]
	}),
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

export const gradeBandsRelations = relations(gradeBands, ({one}) => ({
	gradingScheme: one(gradingSchemes, {
		fields: [gradeBands.gradingSchemeId],
		references: [gradingSchemes.id]
	}),
}));

export const gradingSchemeItemsRelations = relations(gradingSchemeItems, ({one}) => ({
	gradingScheme: one(gradingSchemes, {
		fields: [gradingSchemeItems.gradingSchemeId],
		references: [gradingSchemes.id]
	}),
	assessmentType: one(assessmentTypes, {
		fields: [gradingSchemeItems.assessmentTypeId],
		references: [assessmentTypes.id]
	}),
}));

export const studentInvoiceItemsRelations = relations(studentInvoiceItems, ({one}) => ({
	studentInvoice: one(studentInvoices, {
		fields: [studentInvoiceItems.invoiceId],
		references: [studentInvoices.id]
	}),
	feeCategory: one(feeCategories, {
		fields: [studentInvoiceItems.feeCategoryId],
		references: [feeCategories.id]
	}),
}));

export const studentDocumentsRelations = relations(studentDocuments, ({one}) => ({
	school: one(schools, {
		fields: [studentDocuments.schoolId],
		references: [schools.id]
	}),
	student: one(students, {
		fields: [studentDocuments.studentId],
		references: [students.id]
	}),
}));

export const studentImportsRelations = relations(studentImports, ({one}) => ({
	school: one(schools, {
		fields: [studentImports.schoolId],
		references: [schools.id]
	}),
}));

export const resultPublicationAssessmentsRelations = relations(resultPublicationAssessments, ({one}) => ({
	assessment: one(assessments, {
		fields: [resultPublicationAssessments.assessmentId],
		references: [assessments.id]
	}),
	resultPublicationSubject: one(resultPublicationSubjects, {
		fields: [resultPublicationAssessments.publicationSubjectId],
		references: [resultPublicationSubjects.id]
	}),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	school: one(schools, {
		fields: [notifications.schoolId],
		references: [schools.id]
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