import { pgTable, index, foreignKey, unique, uuid, varchar, integer, timestamp, text, date, boolean, uniqueIndex, numeric, primaryKey, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const assessmentPeriodStatus = pgEnum("assessment_period_status", ['draft', 'open', 'closed', 'published', 'archived'])
export const assessmentStatus = pgEnum("assessment_status", ['draft', 'open', 'closed', 'published', 'archived'])
export const assessmentTypeCategory = pgEnum("assessment_type_category", ['continuous_assessment', 'examination'])
export const attendanceRecordStatus = pgEnum("attendance_record_status", ['present', 'absent', 'late', 'excused'])
export const attendanceSessionStatus = pgEnum("attendance_session_status", ['open', 'completed', 'cancelled'])
export const classCategory = pgEnum("class_category", ['creche', 'nursery', 'kg', 'primary', 'jhs'])
export const enrollmentStatus = pgEnum("enrollment_status", ['active', 'completed', 'withdrawn', 'transferred'])
export const gender = pgEnum("gender", ['male', 'female'])
export const placementStatus = pgEnum("placement_status", ['active', 'completed', 'transferred', 'cancelled'])
export const schoolStatus = pgEnum("school_status", ['pending', 'active', 'suspended', 'deactivated'])
export const schoolType = pgEnum("school_type", ['private_basic', 'public_basic', 'international', 'montessori', 'faith_based', 'other'])
export const staffStatus = pgEnum("staff_status", ['active', 'inactive'])


export const streams = pgTable("streams", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	classLevelId: uuid("class_level_id").notNull(),
	name: varchar({ length: 50 }).notNull(),
	capacity: integer(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("streams_class_level_idx").using("btree", table.classLevelId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.classLevelId],
			foreignColumns: [classLevels.id],
			name: "streams_class_level_id_class_levels_id_fk"
		}).onDelete("cascade"),
	unique("stream_class_level_name_unique").on(table.name, table.classLevelId),
]);

export const schools = pgTable("schools", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 200 }).notNull(),
	slug: varchar({ length: 200 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	schoolCode: varchar("school_code", { length: 50 }).notNull(),
	schoolType: schoolType("school_type").default('private_basic').notNull(),
	region: varchar({ length: 100 }),
	district: varchar({ length: 100 }),
	town: varchar({ length: 100 }),
	address: text(),
	phone: varchar({ length: 30 }),
	email: varchar({ length: 255 }),
	website: varchar({ length: 255 }),
	logoUrl: text("logo_url"),
	status: schoolStatus().default('pending').notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("schools_region_idx").using("btree", table.region.asc().nullsLast().op("text_ops")),
	index("schools_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	unique("schools_slug_unique").on(table.slug),
	unique("schools_school_code_unique").on(table.schoolCode),
]);

export const staff = pgTable("staff", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	schoolId: uuid("school_id").notNull(),
	firstName: varchar("first_name", { length: 100 }).notNull(),
	middleName: varchar("middle_name", { length: 100 }),
	lastName: varchar("last_name", { length: 100 }).notNull(),
	staffNumber: varchar("staff_number", { length: 50 }).notNull(),
	gender: gender(),
	dateOfBirth: date("date_of_birth"),
	phone: varchar({ length: 30 }),
	email: varchar({ length: 255 }),
	employmentDate: date("employment_date"),
	position: varchar({ length: 100 }),
	status: staffStatus().default('active').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("staff_school_idx").using("btree", table.schoolId.asc().nullsLast().op("uuid_ops")),
	index("staff_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "staff_school_id_schools_id_fk"
		}).onDelete("cascade"),
	unique("staff_school_number_unique").on(table.staffNumber, table.schoolId),
]);

export const academicYears = pgTable("academic_years", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	schoolId: uuid("school_id").notNull(),
	name: varchar({ length: 50 }).notNull(),
	startDate: date("start_date").notNull(),
	endDate: date("end_date").notNull(),
	isCurrent: boolean("is_current").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("academic_year_school_idx").using("btree", table.schoolId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "academic_years_school_id_schools_id_fk"
		}).onDelete("cascade"),
	unique("academic_year_school_name_unique").on(table.schoolId, table.name),
]);

export const classLevels = pgTable("class_levels", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	schoolId: uuid("school_id").notNull(),
	name: varchar({ length: 100 }).notNull(),
	category: classCategory().notNull(),
	sortOrder: integer("sort_order").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("class_levels_school_idx").using("btree", table.schoolId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "class_levels_school_id_schools_id_fk"
		}).onDelete("cascade"),
	unique("class_level_school_name_unique").on(table.schoolId, table.name),
]);

export const guardians = pgTable("guardians", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	schoolId: uuid("school_id").notNull(),
	firstName: varchar("first_name", { length: 100 }).notNull(),
	lastName: varchar("last_name", { length: 100 }).notNull(),
	phone: varchar({ length: 30 }),
	email: varchar({ length: 255 }),
	address: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("guardians_school_idx").using("btree", table.schoolId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "guardians_school_id_schools_id_fk"
		}).onDelete("cascade"),
]);

export const students = pgTable("students", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	schoolId: uuid("school_id").notNull(),
	studentNumber: varchar("student_number", { length: 50 }).notNull(),
	firstName: varchar("first_name", { length: 100 }).notNull(),
	middleName: varchar("middle_name", { length: 100 }),
	lastName: varchar("last_name", { length: 100 }).notNull(),
	gender: gender().notNull(),
	dateOfBirth: date("date_of_birth"),
	admissionDate: date("admission_date"),
	phone: varchar({ length: 30 }),
	email: varchar({ length: 255 }),
	photoUrl: text("photo_url"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("students_last_name_idx").using("btree", table.lastName.asc().nullsLast().op("text_ops")),
	index("students_school_idx").using("btree", table.schoolId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "students_school_id_schools_id_fk"
		}).onDelete("cascade"),
	unique("student_school_number_unique").on(table.studentNumber, table.schoolId),
]);

export const studentEnrollments = pgTable("student_enrollments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	studentId: uuid("student_id").notNull(),
	academicYearId: uuid("academic_year_id").notNull(),
	streamId: uuid("stream_id").notNull(),
	admissionNumber: varchar("admission_number", { length: 50 }),
	enrollmentDate: date("enrollment_date").notNull(),
	status: enrollmentStatus().default('active').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("enrollments_stream_idx").using("btree", table.streamId.asc().nullsLast().op("uuid_ops")),
	index("enrollments_student_idx").using("btree", table.studentId.asc().nullsLast().op("uuid_ops")),
	index("enrollments_year_idx").using("btree", table.academicYearId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [students.id],
			name: "student_enrollments_student_id_students_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.academicYearId],
			foreignColumns: [academicYears.id],
			name: "student_enrollments_academic_year_id_academic_years_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.streamId],
			foreignColumns: [streams.id],
			name: "student_enrollments_stream_id_streams_id_fk"
		}).onDelete("restrict"),
	unique("student_year_unique").on(table.studentId, table.academicYearId),
]);

export const subjects = pgTable("subjects", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	schoolId: uuid("school_id").notNull(),
	name: varchar({ length: 150 }).notNull(),
	code: varchar({ length: 50 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("subjects_school_idx").using("btree", table.schoolId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "subjects_school_id_schools_id_fk"
		}).onDelete("cascade"),
	unique("subject_school_name_unique").on(table.schoolId, table.name),
]);

export const teacherAssignments = pgTable("teacher_assignments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	staffId: uuid("staff_id").notNull(),
	streamId: uuid("stream_id").notNull(),
	subjectId: uuid("subject_id"),
	academicYearId: uuid("academic_year_id").notNull(),
	isClassTeacher: boolean("is_class_teacher").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("teacher_assignments_staff_idx").using("btree", table.staffId.asc().nullsLast().op("uuid_ops")),
	index("teacher_assignments_stream_idx").using("btree", table.streamId.asc().nullsLast().op("uuid_ops")),
	index("teacher_assignments_subject_idx").using("btree", table.subjectId.asc().nullsLast().op("uuid_ops")),
	index("teacher_assignments_year_idx").using("btree", table.academicYearId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.staffId],
			foreignColumns: [staff.id],
			name: "teacher_assignments_staff_id_staff_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.streamId],
			foreignColumns: [streams.id],
			name: "teacher_assignments_stream_id_streams_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.subjectId],
			foreignColumns: [subjects.id],
			name: "teacher_assignments_subject_id_subjects_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.academicYearId],
			foreignColumns: [academicYears.id],
			name: "teacher_assignments_academic_year_id_academic_years_id_fk"
		}).onDelete("cascade"),
]);

export const terms = pgTable("terms", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	academicYearId: uuid("academic_year_id").notNull(),
	name: varchar({ length: 50 }).notNull(),
	termNumber: integer("term_number").notNull(),
	startDate: date("start_date").notNull(),
	endDate: date("end_date").notNull(),
	isCurrent: boolean("is_current").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("terms_academic_year_idx").using("btree", table.academicYearId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.academicYearId],
			foreignColumns: [academicYears.id],
			name: "terms_academic_year_id_academic_years_id_fk"
		}).onDelete("cascade"),
	unique("term_year_number_unique").on(table.termNumber, table.academicYearId),
]);

export const studentPlacements = pgTable("student_placements", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	studentEnrollmentId: uuid("student_enrollment_id").notNull(),
	streamId: uuid("stream_id").notNull(),
	startDate: date("start_date").notNull(),
	endDate: date("end_date"),
	status: placementStatus().default('active').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("placements_enrollment_idx").using("btree", table.studentEnrollmentId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("placements_one_active_idx").using("btree", table.studentEnrollmentId.asc().nullsLast().op("uuid_ops")).where(sql`(status = 'active'::placement_status)`),
	index("placements_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("placements_stream_idx").using("btree", table.streamId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.streamId],
			foreignColumns: [streams.id],
			name: "student_placements_stream_id_streams_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.studentEnrollmentId],
			foreignColumns: [studentEnrollments.id],
			name: "student_placements_student_enrollment_id_student_enrollments_id"
		}).onDelete("cascade"),
]);

export const classSubjects = pgTable("class_subjects", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	classLevelId: uuid("class_level_id").notNull(),
	subjectId: uuid("subject_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("class_subjects_class_idx").using("btree", table.classLevelId.asc().nullsLast().op("uuid_ops")),
	index("class_subjects_subject_idx").using("btree", table.subjectId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.classLevelId],
			foreignColumns: [classLevels.id],
			name: "class_subjects_class_level_id_class_levels_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.subjectId],
			foreignColumns: [subjects.id],
			name: "class_subjects_subject_id_subjects_id_fk"
		}).onDelete("cascade"),
	unique("class_subjects_unique_class_subject").on(table.subjectId, table.classLevelId),
]);

export const attendanceSessions = pgTable("attendance_sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	schoolId: uuid("school_id").notNull(),
	academicYearId: uuid("academic_year_id").notNull(),
	termId: uuid("term_id").notNull(),
	streamId: uuid("stream_id").notNull(),
	attendanceDate: date("attendance_date").notNull(),
	status: attendanceSessionStatus().default('open').notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("attendance_sessions_date_idx").using("btree", table.attendanceDate.asc().nullsLast().op("date_ops")),
	index("attendance_sessions_school_idx").using("btree", table.schoolId.asc().nullsLast().op("uuid_ops")),
	index("attendance_sessions_stream_idx").using("btree", table.streamId.asc().nullsLast().op("uuid_ops")),
	index("attendance_sessions_term_idx").using("btree", table.termId.asc().nullsLast().op("uuid_ops")),
	index("attendance_sessions_year_idx").using("btree", table.academicYearId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "attendance_sessions_school_id_schools_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.academicYearId],
			foreignColumns: [academicYears.id],
			name: "attendance_sessions_academic_year_id_academic_years_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.termId],
			foreignColumns: [terms.id],
			name: "attendance_sessions_term_id_terms_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.streamId],
			foreignColumns: [streams.id],
			name: "attendance_sessions_stream_id_streams_id_fk"
		}).onDelete("cascade"),
	unique("attendance_sessions_unique_stream_date").on(table.streamId, table.attendanceDate),
]);

export const attendanceRecords = pgTable("attendance_records", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	attendanceSessionId: uuid("attendance_session_id").notNull(),
	studentId: uuid("student_id").notNull(),
	status: attendanceRecordStatus().notNull(),
	note: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("attendance_records_session_idx").using("btree", table.attendanceSessionId.asc().nullsLast().op("uuid_ops")),
	index("attendance_records_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("attendance_records_student_idx").using("btree", table.studentId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.attendanceSessionId],
			foreignColumns: [attendanceSessions.id],
			name: "attendance_records_attendance_session_id_attendance_sessions_id"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [students.id],
			name: "attendance_records_student_id_students_id_fk"
		}).onDelete("cascade"),
	unique("attendance_records_unique_session_student").on(table.studentId, table.attendanceSessionId),
]);

export const assessmentTypes = pgTable("assessment_types", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	schoolId: uuid("school_id").notNull(),
	name: varchar({ length: 100 }).notNull(),
	code: varchar({ length: 50 }),
	category: assessmentTypeCategory().default('continuous_assessment').notNull(),
	description: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("assessment_types_category_idx").using("btree", table.category.asc().nullsLast().op("enum_ops")),
	index("assessment_types_school_idx").using("btree", table.schoolId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "assessment_types_school_id_fkey"
		}).onDelete("cascade"),
	unique("assessment_types_school_name_unique").on(table.schoolId, table.name),
	unique("assessment_types_school_code_unique").on(table.schoolId, table.code),
]);

export const assessmentPeriods = pgTable("assessment_periods", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	schoolId: uuid("school_id").notNull(),
	academicYearId: uuid("academic_year_id").notNull(),
	termId: uuid("term_id").notNull(),
	name: varchar({ length: 150 }).notNull(),
	description: text(),
	startDate: date("start_date"),
	endDate: date("end_date"),
	status: assessmentPeriodStatus().default('draft').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("assessment_periods_school_idx").using("btree", table.schoolId.asc().nullsLast().op("uuid_ops")),
	index("assessment_periods_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("assessment_periods_term_idx").using("btree", table.termId.asc().nullsLast().op("uuid_ops")),
	index("assessment_periods_year_idx").using("btree", table.academicYearId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "assessment_periods_school_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.academicYearId],
			foreignColumns: [academicYears.id],
			name: "assessment_periods_academic_year_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.termId],
			foreignColumns: [terms.id],
			name: "assessment_periods_term_id_fkey"
		}).onDelete("cascade"),
	unique("assessment_periods_school_name_unique").on(table.termId, table.schoolId, table.name, table.academicYearId),
]);

export const assessments = pgTable("assessments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	schoolId: uuid("school_id").notNull(),
	academicYearId: uuid("academic_year_id").notNull(),
	termId: uuid("term_id").notNull(),
	assessmentPeriodId: uuid("assessment_period_id").notNull(),
	streamId: uuid("stream_id").notNull(),
	subjectId: uuid("subject_id").notNull(),
	assessmentTypeId: uuid("assessment_type_id").notNull(),
	name: varchar({ length: 200 }).notNull(),
	maxScore: numeric("max_score", { precision: 8, scale:  2 }).notNull(),
	assessmentDate: date("assessment_date"),
	status: assessmentStatus().default('draft').notNull(),
	instructions: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("assessments_period_idx").using("btree", table.assessmentPeriodId.asc().nullsLast().op("uuid_ops")),
	index("assessments_school_idx").using("btree", table.schoolId.asc().nullsLast().op("uuid_ops")),
	index("assessments_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("assessments_stream_idx").using("btree", table.streamId.asc().nullsLast().op("uuid_ops")),
	index("assessments_subject_idx").using("btree", table.subjectId.asc().nullsLast().op("uuid_ops")),
	index("assessments_term_idx").using("btree", table.termId.asc().nullsLast().op("uuid_ops")),
	index("assessments_type_idx").using("btree", table.assessmentTypeId.asc().nullsLast().op("uuid_ops")),
	index("assessments_year_idx").using("btree", table.academicYearId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "assessments_school_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.academicYearId],
			foreignColumns: [academicYears.id],
			name: "assessments_academic_year_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.termId],
			foreignColumns: [terms.id],
			name: "assessments_term_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.assessmentPeriodId],
			foreignColumns: [assessmentPeriods.id],
			name: "assessments_assessment_period_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.streamId],
			foreignColumns: [streams.id],
			name: "assessments_stream_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.subjectId],
			foreignColumns: [subjects.id],
			name: "assessments_subject_id_fkey"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.assessmentTypeId],
			foreignColumns: [assessmentTypes.id],
			name: "assessments_assessment_type_id_fkey"
		}).onDelete("restrict"),
]);

export const assessmentScores = pgTable("assessment_scores", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	assessmentId: uuid("assessment_id").notNull(),
	studentId: uuid("student_id").notNull(),
	score: numeric({ precision: 8, scale:  2 }).notNull(),
	comment: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("assessment_scores_assessment_idx").using("btree", table.assessmentId.asc().nullsLast().op("uuid_ops")),
	index("assessment_scores_student_idx").using("btree", table.studentId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.assessmentId],
			foreignColumns: [assessments.id],
			name: "assessment_scores_assessment_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [students.id],
			name: "assessment_scores_student_id_fkey"
		}).onDelete("cascade"),
	unique("assessment_scores_unique_student").on(table.studentId, table.assessmentId),
]);

export const studentGuardians = pgTable("student_guardians", {
	studentId: uuid("student_id").notNull(),
	guardianId: uuid("guardian_id").notNull(),
	isPrimary: boolean("is_primary").default(false).notNull(),
	relationship: varchar({ length: 50 }),
}, (table) => [
	index("student_guardians_guardian_idx").using("btree", table.guardianId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("student_guardians_one_primary_idx").using("btree", table.studentId.asc().nullsLast().op("uuid_ops")).where(sql`(is_primary = true)`),
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [students.id],
			name: "student_guardians_student_id_students_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.guardianId],
			foreignColumns: [guardians.id],
			name: "student_guardians_guardian_id_guardians_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.studentId, table.guardianId], name: "student_guardians_student_id_guardian_id_pk"}),
]);
export const reportCardStatusEnum = pgEnum(
  "report_card_status",
  [
    "draft",
    "teacher_review",
    "headteacher_review",
    "approved",
  ],
);

export const promotionStatusEnum = pgEnum(
  "promotion_status",
  [
    "pending",
    "promoted",
    "promoted_with_conditions",
    "repeated",
    "withdrawn",
    "transferred",
  ],
);