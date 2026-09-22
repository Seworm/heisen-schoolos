import { relations } from "drizzle-orm/relations";
import { schools, announcements, feeCategories, feeStructureItems, feeStructures, internalMessages, studentInvoices, invoiceAdjustments, auditLogs, classrooms, academicYears, feeAssignments, students, terms, classLevels, streams, staff, assessmentTypes, resultPublicationStudents, resultPublicationSubjects, subjects, resultPublications, gradingSchemes, reportCards, studentScholarships, scholarships, studentUserAccounts, schoolMemberships, users, studentStatusHistory, timetableEntries, timetablePeriods, payments, guardians, paymentAllocations, studentEnrollments, teacherAssignments, studentPlacements, classSubjects, attendanceSessions, attendanceRecords, staffDocuments, assessmentPeriods, assessments, promotionDecisions, schoolSettings, assessmentScores, gradeBands, gradingSchemeItems, studentInvoiceItems, studentDocuments, studentImports, resultPublicationAssessments, notifications, payrollPeriods, payrollProfiles, payrollRuns, payrollItems, paymentIntents, paymentTransactions, applicants, schoolCalendarEvents, inventoryItems, procurementRequestItems, procurementRequests, staffLeaveRequests, notificationAutomations, inventoryTransactions, documentRecords, libraryBooks, libraryLoans, transportRoutes, transportAssignments, studentHealthRecords, safeguardingCases, disciplineIncidents, guardianUserAccounts, studentGuardians } from "./schema";

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
	payrollPeriods: many(payrollPeriods),
	payrollProfiles: many(payrollProfiles),
	payrollRuns: many(payrollRuns),
	payrollItems: many(payrollItems),
	paymentIntents: many(paymentIntents),
	paymentTransactions: many(paymentTransactions),
	applicants: many(applicants),
	schoolCalendarEvents: many(schoolCalendarEvents),
	staffLeaveRequests: many(staffLeaveRequests),
	notificationAutomations: many(notificationAutomations),
	inventoryItems: many(inventoryItems),
	inventoryTransactions: many(inventoryTransactions),
	procurementRequests: many(procurementRequests),
	documentRecords: many(documentRecords),
	libraryBooks: many(libraryBooks),
	libraryLoans: many(libraryLoans),
	transportRoutes: many(transportRoutes),
	transportAssignments: many(transportAssignments),
	studentHealthRecords: many(studentHealthRecords),
	safeguardingCases: many(safeguardingCases),
	disciplineIncidents: many(disciplineIncidents),
}));

export const feeStructureItemsRelations = relations(feeStructureItems, ({one}) => ({
	feeCategory: one(feeCategories, {
		fields: [feeStructureItems.feeCategoryId],
		references: [feeCategories.id]
	}),
	feeStructure: one(feeStructures, {
		fields: [feeStructureItems.feeStructureId],
		references: [feeStructures.id]
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

export const feeStructuresRelations = relations(feeStructures, ({one, many}) => ({
	feeStructureItems: many(feeStructureItems),
	feeAssignments: many(feeAssignments),
	academicYear: one(academicYears, {
		fields: [feeStructures.academicYearId],
		references: [academicYears.id]
	}),
	classLevel: one(classLevels, {
		fields: [feeStructures.classLevelId],
		references: [classLevels.id]
	}),
	school: one(schools, {
		fields: [feeStructures.schoolId],
		references: [schools.id]
	}),
	term: one(terms, {
		fields: [feeStructures.termId],
		references: [terms.id]
	}),
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
	academicYear: one(academicYears, {
		fields: [studentInvoices.academicYearId],
		references: [academicYears.id]
	}),
	school: one(schools, {
		fields: [studentInvoices.schoolId],
		references: [schools.id]
	}),
	student: one(students, {
		fields: [studentInvoices.studentId],
		references: [students.id]
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
	academicYear: one(academicYears, {
		fields: [feeAssignments.academicYearId],
		references: [academicYears.id]
	}),
	feeStructure: one(feeStructures, {
		fields: [feeAssignments.feeStructureId],
		references: [feeStructures.id]
	}),
	school: one(schools, {
		fields: [feeAssignments.schoolId],
		references: [schools.id]
	}),
	student: one(students, {
		fields: [feeAssignments.studentId],
		references: [students.id]
	}),
	term: one(terms, {
		fields: [feeAssignments.termId],
		references: [terms.id]
	}),
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
	paymentIntents: many(paymentIntents),
	applicants: many(applicants),
	documentRecords: many(documentRecords),
	libraryLoans: many(libraryLoans),
	transportAssignments: many(transportAssignments),
	studentHealthRecords: many(studentHealthRecords),
	safeguardingCases: many(safeguardingCases),
	disciplineIncidents: many(disciplineIncidents),
	studentGuardians: many(studentGuardians),
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
	payrollProfiles: many(payrollProfiles),
	payrollItems: many(payrollItems),
	staffLeaveRequests: many(staffLeaveRequests),
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
	resultPublicationStudent: one(resultPublicationStudents, {
		fields: [resultPublicationSubjects.publicationStudentId],
		references: [resultPublicationStudents.id]
	}),
	subject: one(subjects, {
		fields: [resultPublicationSubjects.subjectId],
		references: [subjects.id]
	}),
	resultPublicationAssessments: many(resultPublicationAssessments),
}));

export const resultPublicationStudentsRelations = relations(resultPublicationStudents, ({one, many}) => ({
	resultPublicationSubjects: many(resultPublicationSubjects),
	resultPublication: one(resultPublications, {
		fields: [resultPublicationStudents.publicationId],
		references: [resultPublications.id]
	}),
	student: one(students, {
		fields: [resultPublicationStudents.studentId],
		references: [students.id]
	}),
	reportCards: many(reportCards),
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

export const resultPublicationsRelations = relations(resultPublications, ({one, many}) => ({
	academicYear: one(academicYears, {
		fields: [resultPublications.academicYearId],
		references: [academicYears.id]
	}),
	gradingScheme: one(gradingSchemes, {
		fields: [resultPublications.gradingSchemeId],
		references: [gradingSchemes.id]
	}),
	school: one(schools, {
		fields: [resultPublications.schoolId],
		references: [schools.id]
	}),
	stream: one(streams, {
		fields: [resultPublications.streamId],
		references: [streams.id]
	}),
	term: one(terms, {
		fields: [resultPublications.termId],
		references: [terms.id]
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
	resultPublication: one(resultPublications, {
		fields: [reportCards.publicationId],
		references: [resultPublications.id]
	}),
	resultPublicationStudent: one(resultPublicationStudents, {
		fields: [reportCards.publicationStudentId],
		references: [resultPublicationStudents.id]
	}),
	school: one(schools, {
		fields: [reportCards.schoolId],
		references: [schools.id]
	}),
}));

export const studentScholarshipsRelations = relations(studentScholarships, ({one}) => ({
	academicYear: one(academicYears, {
		fields: [studentScholarships.academicYearId],
		references: [academicYears.id]
	}),
	scholarship: one(scholarships, {
		fields: [studentScholarships.scholarshipId],
		references: [scholarships.id]
	}),
	school: one(schools, {
		fields: [studentScholarships.schoolId],
		references: [schools.id]
	}),
	student: one(students, {
		fields: [studentScholarships.studentId],
		references: [students.id]
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

export const studentUserAccountsRelations = relations(studentUserAccounts, ({one}) => ({
	student: one(students, {
		fields: [studentUserAccounts.studentId],
		references: [students.id]
	}),
}));

export const schoolMembershipsRelations = relations(schoolMemberships, ({one}) => ({
	school: one(schools, {
		fields: [schoolMemberships.schoolId],
		references: [schools.id]
	}),
	user: one(users, {
		fields: [schoolMemberships.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	schoolMemberships: many(schoolMemberships),
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
	academicYear: one(academicYears, {
		fields: [timetableEntries.academicYearId],
		references: [academicYears.id]
	}),
	classroom: one(classrooms, {
		fields: [timetableEntries.classroomId],
		references: [classrooms.id]
	}),
	timetablePeriod: one(timetablePeriods, {
		fields: [timetableEntries.periodId],
		references: [timetablePeriods.id]
	}),
	school: one(schools, {
		fields: [timetableEntries.schoolId],
		references: [schools.id]
	}),
	staff: one(staff, {
		fields: [timetableEntries.staffId],
		references: [staff.id]
	}),
	stream: one(streams, {
		fields: [timetableEntries.streamId],
		references: [streams.id]
	}),
	subject: one(subjects, {
		fields: [timetableEntries.subjectId],
		references: [subjects.id]
	}),
	term: one(terms, {
		fields: [timetableEntries.termId],
		references: [terms.id]
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
	paymentTransactions: many(paymentTransactions),
}));

export const guardiansRelations = relations(guardians, ({one, many}) => ({
	school: one(schools, {
		fields: [guardians.schoolId],
		references: [schools.id]
	}),
	guardianUserAccounts: many(guardianUserAccounts),
	studentGuardians: many(studentGuardians),
}));

export const paymentAllocationsRelations = relations(paymentAllocations, ({one}) => ({
	studentInvoice: one(studentInvoices, {
		fields: [paymentAllocations.invoiceId],
		references: [studentInvoices.id]
	}),
	payment: one(payments, {
		fields: [paymentAllocations.paymentId],
		references: [payments.id]
	}),
}));

export const studentEnrollmentsRelations = relations(studentEnrollments, ({one, many}) => ({
	academicYear: one(academicYears, {
		fields: [studentEnrollments.academicYearId],
		references: [academicYears.id]
	}),
	stream: one(streams, {
		fields: [studentEnrollments.streamId],
		references: [streams.id]
	}),
	student: one(students, {
		fields: [studentEnrollments.studentId],
		references: [students.id]
	}),
	studentPlacements: many(studentPlacements),
	promotionDecisions_fromEnrollmentId: many(promotionDecisions, {
		relationName: "promotionDecisions_fromEnrollmentId_studentEnrollments_id"
	}),
	promotionDecisions_toEnrollmentId: many(promotionDecisions, {
		relationName: "promotionDecisions_toEnrollmentId_studentEnrollments_id"
	}),
}));

export const teacherAssignmentsRelations = relations(teacherAssignments, ({one}) => ({
	academicYear: one(academicYears, {
		fields: [teacherAssignments.academicYearId],
		references: [academicYears.id]
	}),
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
	academicYear: one(academicYears, {
		fields: [attendanceSessions.academicYearId],
		references: [academicYears.id]
	}),
	school: one(schools, {
		fields: [attendanceSessions.schoolId],
		references: [schools.id]
	}),
	stream: one(streams, {
		fields: [attendanceSessions.streamId],
		references: [streams.id]
	}),
	term: one(terms, {
		fields: [attendanceSessions.termId],
		references: [terms.id]
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
	academicYear: one(academicYears, {
		fields: [assessmentPeriods.academicYearId],
		references: [academicYears.id]
	}),
	school: one(schools, {
		fields: [assessmentPeriods.schoolId],
		references: [schools.id]
	}),
	term: one(terms, {
		fields: [assessmentPeriods.termId],
		references: [terms.id]
	}),
	assessments: many(assessments),
}));

export const assessmentsRelations = relations(assessments, ({one, many}) => ({
	academicYear: one(academicYears, {
		fields: [assessments.academicYearId],
		references: [academicYears.id]
	}),
	assessmentPeriod: one(assessmentPeriods, {
		fields: [assessments.assessmentPeriodId],
		references: [assessmentPeriods.id]
	}),
	assessmentType: one(assessmentTypes, {
		fields: [assessments.assessmentTypeId],
		references: [assessmentTypes.id]
	}),
	school: one(schools, {
		fields: [assessments.schoolId],
		references: [schools.id]
	}),
	stream: one(streams, {
		fields: [assessments.streamId],
		references: [streams.id]
	}),
	subject: one(subjects, {
		fields: [assessments.subjectId],
		references: [subjects.id]
	}),
	term: one(terms, {
		fields: [assessments.termId],
		references: [terms.id]
	}),
	assessmentScores: many(assessmentScores),
	resultPublicationAssessments: many(resultPublicationAssessments),
}));

export const promotionDecisionsRelations = relations(promotionDecisions, ({one}) => ({
	studentEnrollment_fromEnrollmentId: one(studentEnrollments, {
		fields: [promotionDecisions.fromEnrollmentId],
		references: [studentEnrollments.id],
		relationName: "promotionDecisions_fromEnrollmentId_studentEnrollments_id"
	}),
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
	assessmentType: one(assessmentTypes, {
		fields: [gradingSchemeItems.assessmentTypeId],
		references: [assessmentTypes.id]
	}),
	gradingScheme: one(gradingSchemes, {
		fields: [gradingSchemeItems.gradingSchemeId],
		references: [gradingSchemes.id]
	}),
}));

export const studentInvoiceItemsRelations = relations(studentInvoiceItems, ({one}) => ({
	feeCategory: one(feeCategories, {
		fields: [studentInvoiceItems.feeCategoryId],
		references: [feeCategories.id]
	}),
	studentInvoice: one(studentInvoices, {
		fields: [studentInvoiceItems.invoiceId],
		references: [studentInvoices.id]
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

export const payrollPeriodsRelations = relations(payrollPeriods, ({one, many}) => ({
	school: one(schools, {
		fields: [payrollPeriods.schoolId],
		references: [schools.id]
	}),
	payrollRuns: many(payrollRuns),
}));

export const payrollProfilesRelations = relations(payrollProfiles, ({one}) => ({
	school: one(schools, {
		fields: [payrollProfiles.schoolId],
		references: [schools.id]
	}),
	staff: one(staff, {
		fields: [payrollProfiles.staffId],
		references: [staff.id]
	}),
}));

export const payrollRunsRelations = relations(payrollRuns, ({one, many}) => ({
	payrollPeriod: one(payrollPeriods, {
		fields: [payrollRuns.periodId],
		references: [payrollPeriods.id]
	}),
	school: one(schools, {
		fields: [payrollRuns.schoolId],
		references: [schools.id]
	}),
	payrollItems: many(payrollItems),
}));

export const payrollItemsRelations = relations(payrollItems, ({one}) => ({
	payrollRun: one(payrollRuns, {
		fields: [payrollItems.runId],
		references: [payrollRuns.id]
	}),
	school: one(schools, {
		fields: [payrollItems.schoolId],
		references: [schools.id]
	}),
	staff: one(staff, {
		fields: [payrollItems.staffId],
		references: [staff.id]
	}),
}));

export const paymentIntentsRelations = relations(paymentIntents, ({one, many}) => ({
	school: one(schools, {
		fields: [paymentIntents.schoolId],
		references: [schools.id]
	}),
	student: one(students, {
		fields: [paymentIntents.studentId],
		references: [students.id]
	}),
	paymentTransactions: many(paymentTransactions),
}));

export const paymentTransactionsRelations = relations(paymentTransactions, ({one}) => ({
	paymentIntent: one(paymentIntents, {
		fields: [paymentTransactions.intentId],
		references: [paymentIntents.id]
	}),
	payment: one(payments, {
		fields: [paymentTransactions.paymentId],
		references: [payments.id]
	}),
	school: one(schools, {
		fields: [paymentTransactions.schoolId],
		references: [schools.id]
	}),
}));

export const applicantsRelations = relations(applicants, ({one}) => ({
	student: one(students, {
		fields: [applicants.convertedStudentId],
		references: [students.id]
	}),
	school: one(schools, {
		fields: [applicants.schoolId],
		references: [schools.id]
	}),
}));

export const schoolCalendarEventsRelations = relations(schoolCalendarEvents, ({one}) => ({
	school: one(schools, {
		fields: [schoolCalendarEvents.schoolId],
		references: [schools.id]
	}),
}));

export const procurementRequestItemsRelations = relations(procurementRequestItems, ({one}) => ({
	inventoryItem: one(inventoryItems, {
		fields: [procurementRequestItems.itemId],
		references: [inventoryItems.id]
	}),
	procurementRequest: one(procurementRequests, {
		fields: [procurementRequestItems.requestId],
		references: [procurementRequests.id]
	}),
}));

export const inventoryItemsRelations = relations(inventoryItems, ({one, many}) => ({
	procurementRequestItems: many(procurementRequestItems),
	school: one(schools, {
		fields: [inventoryItems.schoolId],
		references: [schools.id]
	}),
	inventoryTransactions: many(inventoryTransactions),
}));

export const procurementRequestsRelations = relations(procurementRequests, ({one, many}) => ({
	procurementRequestItems: many(procurementRequestItems),
	school: one(schools, {
		fields: [procurementRequests.schoolId],
		references: [schools.id]
	}),
}));

export const staffLeaveRequestsRelations = relations(staffLeaveRequests, ({one}) => ({
	school: one(schools, {
		fields: [staffLeaveRequests.schoolId],
		references: [schools.id]
	}),
	staff: one(staff, {
		fields: [staffLeaveRequests.staffId],
		references: [staff.id]
	}),
}));

export const notificationAutomationsRelations = relations(notificationAutomations, ({one}) => ({
	school: one(schools, {
		fields: [notificationAutomations.schoolId],
		references: [schools.id]
	}),
}));

export const inventoryTransactionsRelations = relations(inventoryTransactions, ({one}) => ({
	inventoryItem: one(inventoryItems, {
		fields: [inventoryTransactions.itemId],
		references: [inventoryItems.id]
	}),
	school: one(schools, {
		fields: [inventoryTransactions.schoolId],
		references: [schools.id]
	}),
}));

export const documentRecordsRelations = relations(documentRecords, ({one}) => ({
	school: one(schools, {
		fields: [documentRecords.schoolId],
		references: [schools.id]
	}),
	student: one(students, {
		fields: [documentRecords.studentId],
		references: [students.id]
	}),
}));

export const libraryBooksRelations = relations(libraryBooks, ({one, many}) => ({
	school: one(schools, {
		fields: [libraryBooks.schoolId],
		references: [schools.id]
	}),
	libraryLoans: many(libraryLoans),
}));

export const libraryLoansRelations = relations(libraryLoans, ({one}) => ({
	libraryBook: one(libraryBooks, {
		fields: [libraryLoans.bookId],
		references: [libraryBooks.id]
	}),
	school: one(schools, {
		fields: [libraryLoans.schoolId],
		references: [schools.id]
	}),
	student: one(students, {
		fields: [libraryLoans.studentId],
		references: [students.id]
	}),
}));

export const transportRoutesRelations = relations(transportRoutes, ({one, many}) => ({
	school: one(schools, {
		fields: [transportRoutes.schoolId],
		references: [schools.id]
	}),
	transportAssignments: many(transportAssignments),
}));

export const transportAssignmentsRelations = relations(transportAssignments, ({one}) => ({
	transportRoute: one(transportRoutes, {
		fields: [transportAssignments.routeId],
		references: [transportRoutes.id]
	}),
	school: one(schools, {
		fields: [transportAssignments.schoolId],
		references: [schools.id]
	}),
	student: one(students, {
		fields: [transportAssignments.studentId],
		references: [students.id]
	}),
}));

export const studentHealthRecordsRelations = relations(studentHealthRecords, ({one}) => ({
	school: one(schools, {
		fields: [studentHealthRecords.schoolId],
		references: [schools.id]
	}),
	student: one(students, {
		fields: [studentHealthRecords.studentId],
		references: [students.id]
	}),
}));

export const safeguardingCasesRelations = relations(safeguardingCases, ({one}) => ({
	school: one(schools, {
		fields: [safeguardingCases.schoolId],
		references: [schools.id]
	}),
	student: one(students, {
		fields: [safeguardingCases.studentId],
		references: [students.id]
	}),
}));

export const disciplineIncidentsRelations = relations(disciplineIncidents, ({one}) => ({
	school: one(schools, {
		fields: [disciplineIncidents.schoolId],
		references: [schools.id]
	}),
	student: one(students, {
		fields: [disciplineIncidents.studentId],
		references: [students.id]
	}),
}));

export const guardianUserAccountsRelations = relations(guardianUserAccounts, ({one}) => ({
	guardian: one(guardians, {
		fields: [guardianUserAccounts.guardianId],
		references: [guardians.id]
	}),
}));

export const studentGuardiansRelations = relations(studentGuardians, ({one}) => ({
	guardian: one(guardians, {
		fields: [studentGuardians.guardianId],
		references: [guardians.id]
	}),
	student: one(students, {
		fields: [studentGuardians.studentId],
		references: [students.id]
	}),
}));