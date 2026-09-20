import { pgTable, index, foreignKey, uuid, text, varchar, timestamp, unique, numeric, boolean, jsonb, integer, date, uniqueIndex, primaryKey, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const adjustmentStatus = pgEnum("adjustment_status", ['active', 'cancelled'])
export const adjustmentType = pgEnum("adjustment_type", ['discount', 'waiver', 'surcharge'])
export const announcementAudience = pgEnum("announcement_audience", ['school', 'class', 'stream', 'staff', 'parents', 'students', 'individual'])
export const assessmentPeriodStatus = pgEnum("assessment_period_status", ['draft', 'open', 'closed', 'published', 'archived'])
export const assessmentStatus = pgEnum("assessment_status", ['draft', 'open', 'closed', 'published', 'archived'])
export const assessmentTypeCategory = pgEnum("assessment_type_category", ['continuous_assessment', 'examination'])
export const attendanceRecordStatus = pgEnum("attendance_record_status", ['present', 'absent', 'late', 'excused'])
export const attendanceSessionStatus = pgEnum("attendance_session_status", ['open', 'completed', 'cancelled'])
export const classCategory = pgEnum("class_category", ['creche', 'nursery', 'kg', 'primary', 'jhs'])
export const enrollmentStatus = pgEnum("enrollment_status", ['active', 'completed', 'withdrawn', 'transferred'])
export const gender = pgEnum("gender", ['male', 'female'])
export const invoiceStatus = pgEnum("invoice_status", ['draft', 'issued', 'partially_paid', 'paid', 'overdue', 'cancelled'])
export const paymentMethod = pgEnum("payment_method", ['cash', 'mobile_money', 'bank_transfer', 'card', 'other'])
export const paymentStatus = pgEnum("payment_status", ['posted', 'reversed'])
export const placementStatus = pgEnum("placement_status", ['active', 'completed', 'transferred', 'cancelled'])
export const promotionStatus = pgEnum("promotion_status", ['pending', 'promoted', 'promoted_with_conditions', 'repeated', 'withdrawn', 'transferred'])
export const reportCardStatus = pgEnum("report_card_status", ['draft', 'teacher_review', 'headteacher_review', 'approved'])
export const schoolMembershipRole = pgEnum("school_membership_role", ['platform_admin', 'school_owner', 'school_admin', 'principal', 'headteacher', 'teacher', 'accountant', 'bursar', 'secretary', 'librarian', 'nurse', 'parent', 'student', 'staff', 'super_admin'])
export const schoolStatus = pgEnum("school_status", ['pending', 'active', 'suspended', 'deactivated'])
export const schoolType = pgEnum("school_type", ['private_basic', 'public_basic', 'international', 'montessori', 'faith_based', 'other'])
export const staffStatus = pgEnum("staff_status", ['active', 'inactive'])
export const studentAccountStatus = pgEnum("student_account_status", ['pending', 'active', 'disabled'])
export const userStatus = pgEnum("user_status", ['active', 'inactive', 'suspended'])


export const announcements = pgTable("announcements", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	schoolId: uuid("school_id").notNull(),
	authorId: text("author_id").notNull(),
	title: varchar({ length: 200 }).notNull(),
	body: text().notNull(),
	audience: announcementAudience().notNull(),
	targetId: uuid("target_id"),
	publishedAt: timestamp("published_at", { withTimezone: true, mode: 'string' }),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("announcements_published_idx").using("btree", table.publishedAt.asc().nullsLast().op("timestamptz_ops")),
	index("announcements_school_idx").using("btree", table.schoolId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "announcements_school_id_schools_id_fk"
		}).onDelete("cascade"),
]);

export const feeStructureItems = pgTable("fee_structure_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	feeStructureId: uuid("fee_structure_id").notNull(),
	feeCategoryId: uuid("fee_category_id").notNull(),
	amount: numeric({ precision: 12, scale:  2 }).notNull(),
	description: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("fee_structure_items_category_idx").using("btree", table.feeCategoryId.asc().nullsLast().op("uuid_ops")),
	index("fee_structure_items_structure_idx").using("btree", table.feeStructureId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.feeStructureId],
			foreignColumns: [feeStructures.id],
			name: "fee_structure_items_fee_structure_id_fee_structures_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.feeCategoryId],
			foreignColumns: [feeCategories.id],
			name: "fee_structure_items_fee_category_id_fee_categories_id_fk"
		}).onDelete("restrict"),
	unique("fee_structure_items_unique").on(table.feeCategoryId, table.feeStructureId),
]);

export const internalMessages = pgTable("internal_messages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	schoolId: uuid("school_id").notNull(),
	senderAuthUserId: text("sender_auth_user_id").notNull(),
	recipientAuthUserId: text("recipient_auth_user_id").notNull(),
	subject: varchar({ length: 200 }).notNull(),
	body: text().notNull(),
	readAt: timestamp("read_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("internal_messages_recipient_idx").using("btree", table.recipientAuthUserId.asc().nullsLast().op("text_ops")),
	index("internal_messages_school_idx").using("btree", table.schoolId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "internal_messages_school_id_schools_id_fk"
		}).onDelete("cascade"),
]);

export const feeCategories = pgTable("fee_categories", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	schoolId: uuid("school_id").notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("fee_categories_school_idx").using("btree", table.schoolId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "fee_categories_school_id_schools_id_fk"
		}).onDelete("cascade"),
	unique("fee_categories_school_name_unique").on(table.name, table.schoolId),
]);

export const invoiceAdjustments = pgTable("invoice_adjustments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	invoiceId: uuid("invoice_id").notNull(),
	type: adjustmentType().notNull(),
	amount: numeric({ precision: 12, scale:  2 }).notNull(),
	reason: text().notNull(),
	status: adjustmentStatus().default('active').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("invoice_adjustments_invoice_idx").using("btree", table.invoiceId.asc().nullsLast().op("uuid_ops")),
	index("invoice_adjustments_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.invoiceId],
			foreignColumns: [studentInvoices.id],
			name: "invoice_adjustments_invoice_id_student_invoices_id_fk"
		}).onDelete("cascade"),
]);

export const auditLogs = pgTable("audit_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	schoolId: uuid("school_id"),
	actorAuthUserId: text("actor_auth_user_id"),
	action: varchar({ length: 100 }).notNull(),
	entity: varchar({ length: 100 }).notNull(),
	entityId: text("entity_id"),
	metadata: jsonb().default({}).notNull(),
	ipAddress: varchar("ip_address", { length: 64 }),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("audit_logs_actor_idx").using("btree", table.actorAuthUserId.asc().nullsLast().op("text_ops")),
	index("audit_logs_created_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("audit_logs_entity_idx").using("btree", table.entity.asc().nullsLast().op("text_ops"), table.entityId.asc().nullsLast().op("text_ops")),
	index("audit_logs_school_idx").using("btree", table.schoolId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "audit_logs_school_id_schools_id_fk"
		}).onDelete("cascade"),
]);

export const classrooms = pgTable("classrooms", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	schoolId: uuid("school_id").notNull(),
	name: varchar({ length: 100 }).notNull(),
	capacity: integer(),
	location: varchar({ length: 150 }),
	active: boolean().default(true).notNull(),
}, (table) => [
	index("classrooms_school_idx").using("btree", table.schoolId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "classrooms_school_id_schools_id_fk"
		}).onDelete("cascade"),
	unique("classrooms_school_name_unique").on(table.name, table.schoolId),
]);

export const feeAssignments = pgTable("fee_assignments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	schoolId: uuid("school_id").notNull(),
	studentId: uuid("student_id").notNull(),
	feeStructureId: uuid("fee_structure_id").notNull(),
	academicYearId: uuid("academic_year_id").notNull(),
	termId: uuid("term_id").notNull(),
	status: varchar({ length: 30 }).default('active').notNull(),
	assignedAt: timestamp("assigned_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("fee_assignments_school_idx").using("btree", table.schoolId.asc().nullsLast().op("uuid_ops")),
	index("fee_assignments_student_idx").using("btree", table.studentId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "fee_assignments_school_id_schools_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [students.id],
			name: "fee_assignments_student_id_students_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.feeStructureId],
			foreignColumns: [feeStructures.id],
			name: "fee_assignments_fee_structure_id_fee_structures_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.academicYearId],
			foreignColumns: [academicYears.id],
			name: "fee_assignments_academic_year_id_academic_years_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.termId],
			foreignColumns: [terms.id],
			name: "fee_assignments_term_id_terms_id_fk"
		}).onDelete("restrict"),
	unique("fee_assignments_unique").on(table.feeStructureId, table.studentId, table.termId),
]);

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
	unique("stream_class_level_name_unique").on(table.classLevelId, table.name),
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
	unique("staff_school_number_unique").on(table.schoolId, table.staffNumber),
]);

export const profiles = pgTable("profiles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	authUserId: text("auth_user_id").notNull(),
	email: varchar({ length: 255 }).notNull(),
	firstName: varchar("first_name", { length: 100 }).notNull(),
	lastName: varchar("last_name", { length: 100 }).notNull(),
	phone: varchar({ length: 30 }),
	photoUrl: text("photo_url"),
	status: userStatus().default('active').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("profiles_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("profiles_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	unique("profiles_auth_user_id_unique").on(table.authUserId),
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
			name: "assessment_types_school_id_schools_id_fk"
		}).onDelete("cascade"),
	unique("assessment_types_school_name_unique").on(table.name, table.schoolId),
	unique("assessment_types_school_code_unique").on(table.code, table.schoolId),
]);

export const resultPublicationSubjects = pgTable("result_publication_subjects", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	publicationStudentId: uuid("publication_student_id").notNull(),
	subjectId: uuid("subject_id").notNull(),
	subjectName: text("subject_name").notNull(),
	classScore: numeric("class_score", { precision: 8, scale:  2 }).notNull(),
	examinationScore: numeric("examination_score", { precision: 8, scale:  2 }).notNull(),
	finalPercentage: numeric("final_percentage", { precision: 8, scale:  2 }).notNull(),
	grade: text(),
	label: text(),
	remark: text(),
	position: integer().notNull(),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("result_publication_subjects_student_idx").using("btree", table.publicationStudentId.asc().nullsLast().op("uuid_ops")),
	index("result_publication_subjects_subject_idx").using("btree", table.subjectId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.subjectId],
			foreignColumns: [subjects.id],
			name: "result_publication_subjects_subject_id_subjects_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.publicationStudentId],
			foreignColumns: [resultPublicationStudents.id],
			name: "result_publication_subjects_publication_student_id_result_publi"
		}).onDelete("cascade"),
	unique("result_publication_subjects_unique").on(table.publicationStudentId, table.subjectId),
]);

export const resultPublications = pgTable("result_publications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	schoolId: uuid("school_id").notNull(),
	academicYearId: uuid("academic_year_id").notNull(),
	termId: uuid("term_id").notNull(),
	streamId: uuid("stream_id").notNull(),
	gradingSchemeId: uuid("grading_scheme_id"),
	status: varchar({ length: 20 }).default('draft').notNull(),
	publishedAt: timestamp("published_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("result_publications_school_idx").using("btree", table.schoolId.asc().nullsLast().op("uuid_ops")),
	index("result_publications_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("result_publications_stream_idx").using("btree", table.streamId.asc().nullsLast().op("uuid_ops")),
	index("result_publications_term_idx").using("btree", table.termId.asc().nullsLast().op("uuid_ops")),
	index("result_publications_year_idx").using("btree", table.academicYearId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "result_publications_school_id_schools_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.academicYearId],
			foreignColumns: [academicYears.id],
			name: "result_publications_academic_year_id_academic_years_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.termId],
			foreignColumns: [terms.id],
			name: "result_publications_term_id_terms_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.streamId],
			foreignColumns: [streams.id],
			name: "result_publications_stream_id_streams_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.gradingSchemeId],
			foreignColumns: [gradingSchemes.id],
			name: "result_publications_grading_scheme_id_grading_schemes_id_fk"
		}).onDelete("set null"),
	unique("result_publications_unique_scope").on(table.academicYearId, table.schoolId, table.streamId, table.termId),
]);

export const resultPublicationStudents = pgTable("result_publication_students", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	publicationId: uuid("publication_id").notNull(),
	studentId: uuid("student_id").notNull(),
	studentNumber: text("student_number").notNull(),
	firstName: text("first_name").notNull(),
	middleName: text("middle_name"),
	lastName: text("last_name").notNull(),
	overallPercentage: numeric("overall_percentage", { precision: 8, scale:  2 }).notNull(),
	position: integer().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("result_publication_students_publication_idx").using("btree", table.publicationId.asc().nullsLast().op("uuid_ops")),
	index("result_publication_students_student_idx").using("btree", table.studentId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [students.id],
			name: "result_publication_students_student_id_students_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.publicationId],
			foreignColumns: [resultPublications.id],
			name: "result_publication_students_publication_id_result_publications_"
		}).onDelete("cascade"),
	unique("result_publication_students_unique").on(table.publicationId, table.studentId),
]);

export const reportCards = pgTable("report_cards", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	schoolId: uuid("school_id").notNull(),
	publicationId: uuid("publication_id").notNull(),
	publicationStudentId: uuid("publication_student_id").notNull(),
	status: reportCardStatus().default('draft').notNull(),
	classTeacherRemark: text("class_teacher_remark"),
	headteacherRemark: text("headteacher_remark"),
	promotionStatus: promotionStatus("promotion_status").default('pending').notNull(),
	classTeacherSignedAt: timestamp("class_teacher_signed_at", { withTimezone: true, mode: 'string' }),
	headteacherSignedAt: timestamp("headteacher_signed_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("report_cards_publication_idx").using("btree", table.publicationId.asc().nullsLast().op("uuid_ops")),
	index("report_cards_publication_status_idx").using("btree", table.publicationId.asc().nullsLast().op("enum_ops"), table.status.asc().nullsLast().op("enum_ops")),
	index("report_cards_publication_student_idx").using("btree", table.publicationStudentId.asc().nullsLast().op("uuid_ops")),
	index("report_cards_school_idx").using("btree", table.schoolId.asc().nullsLast().op("uuid_ops")),
	index("report_cards_school_status_idx").using("btree", table.schoolId.asc().nullsLast().op("enum_ops"), table.status.asc().nullsLast().op("enum_ops")),
	index("report_cards_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "report_cards_school_id_schools_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.publicationId],
			foreignColumns: [resultPublications.id],
			name: "report_cards_publication_id_result_publications_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.publicationStudentId],
			foreignColumns: [resultPublicationStudents.id],
			name: "report_cards_publication_student_id_result_publication_students"
		}).onDelete("cascade"),
	unique("report_cards_publication_student_unique").on(table.publicationId, table.publicationStudentId),
]);

export const studentScholarships = pgTable("student_scholarships", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	schoolId: uuid("school_id").notNull(),
	studentId: uuid("student_id").notNull(),
	scholarshipId: uuid("scholarship_id").notNull(),
	academicYearId: uuid("academic_year_id").notNull(),
	termId: uuid("term_id").notNull(),
	amount: numeric({ precision: 12, scale:  2 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("student_scholarships_school_idx").using("btree", table.schoolId.asc().nullsLast().op("uuid_ops")),
	index("student_scholarships_student_idx").using("btree", table.studentId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "student_scholarships_school_id_schools_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [students.id],
			name: "student_scholarships_student_id_students_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.scholarshipId],
			foreignColumns: [scholarships.id],
			name: "student_scholarships_scholarship_id_scholarships_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.academicYearId],
			foreignColumns: [academicYears.id],
			name: "student_scholarships_academic_year_id_academic_years_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.termId],
			foreignColumns: [terms.id],
			name: "student_scholarships_term_id_terms_id_fk"
		}).onDelete("restrict"),
]);

export const schoolMemberships = pgTable("school_memberships", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	schoolId: uuid("school_id").notNull(),
	role: schoolMembershipRole().notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("school_memberships_active_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("school_memberships_role_idx").using("btree", table.role.asc().nullsLast().op("enum_ops")),
	index("school_memberships_school_idx").using("btree", table.schoolId.asc().nullsLast().op("uuid_ops")),
	index("school_memberships_user_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "school_memberships_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "school_memberships_school_id_schools_id_fk"
		}).onDelete("cascade"),
	unique("school_memberships_unique").on(table.schoolId, table.userId),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: text().notNull(),
	passwordHash: text("password_hash"),
	firstName: text("first_name").notNull(),
	lastName: text("last_name").notNull(),
	status: userStatus().default('active').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("users_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	unique("users_email_unique").on(table.email),
]);

export const studentUserAccounts = pgTable("student_user_accounts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	studentId: uuid("student_id").notNull(),
	email: text().notNull(),
	lastLoginAt: timestamp("last_login_at", { withTimezone: true, mode: 'string' }),
	status: studentAccountStatus().default('active').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	mustChangePassword: boolean("must_change_password").default(true).notNull(),
}, (table) => [
	index("student_user_accounts_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("student_user_accounts_student_idx").using("btree", table.studentId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [students.id],
			name: "student_user_accounts_student_id_students_id_fk"
		}).onDelete("cascade"),
	unique("student_user_accounts_student_id_unique").on(table.studentId),
	unique("student_user_accounts_email_unique").on(table.email),
]);

export const studentStatusHistory = pgTable("student_status_history", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	schoolId: uuid("school_id").notNull(),
	studentId: uuid("student_id").notNull(),
	status: varchar({ length: 40 }).notNull(),
	effectiveDate: date("effective_date").notNull(),
	reason: text(),
	actorId: text("actor_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("student_status_history_date_idx").using("btree", table.effectiveDate.asc().nullsLast().op("date_ops")),
	index("student_status_history_school_idx").using("btree", table.schoolId.asc().nullsLast().op("uuid_ops")),
	index("student_status_history_student_idx").using("btree", table.studentId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "student_status_history_school_id_schools_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [students.id],
			name: "student_status_history_student_id_students_id_fk"
		}).onDelete("cascade"),
]);

export const timetableEntries = pgTable("timetable_entries", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	schoolId: uuid("school_id").notNull(),
	academicYearId: uuid("academic_year_id").notNull(),
	termId: uuid("term_id").notNull(),
	streamId: uuid("stream_id").notNull(),
	subjectId: uuid("subject_id").notNull(),
	staffId: uuid("staff_id").notNull(),
	periodId: uuid("period_id").notNull(),
	classroomId: uuid("classroom_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("timetable_school_idx").using("btree", table.schoolId.asc().nullsLast().op("uuid_ops")),
	index("timetable_stream_idx").using("btree", table.streamId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "timetable_entries_school_id_schools_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.academicYearId],
			foreignColumns: [academicYears.id],
			name: "timetable_entries_academic_year_id_academic_years_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.termId],
			foreignColumns: [terms.id],
			name: "timetable_entries_term_id_terms_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.streamId],
			foreignColumns: [streams.id],
			name: "timetable_entries_stream_id_streams_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.subjectId],
			foreignColumns: [subjects.id],
			name: "timetable_entries_subject_id_subjects_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.staffId],
			foreignColumns: [staff.id],
			name: "timetable_entries_staff_id_staff_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.periodId],
			foreignColumns: [timetablePeriods.id],
			name: "timetable_entries_period_id_timetable_periods_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.classroomId],
			foreignColumns: [classrooms.id],
			name: "timetable_entries_classroom_id_classrooms_id_fk"
		}).onDelete("set null"),
	unique("timetable_room_period_unique").on(table.classroomId, table.periodId),
	unique("timetable_class_period_unique").on(table.periodId, table.streamId),
	unique("timetable_teacher_period_unique").on(table.periodId, table.staffId),
]);

export const timetablePeriods = pgTable("timetable_periods", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	schoolId: uuid("school_id").notNull(),
	name: varchar({ length: 80 }).notNull(),
	dayOfWeek: integer("day_of_week").notNull(),
	startsAt: varchar("starts_at", { length: 5 }).notNull(),
	endsAt: varchar("ends_at", { length: 5 }).notNull(),
	sortOrder: integer("sort_order").notNull(),
}, (table) => [
	index("timetable_period_school_idx").using("btree", table.schoolId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "timetable_periods_school_id_schools_id_fk"
		}).onDelete("cascade"),
	unique("timetable_period_unique").on(table.dayOfWeek, table.schoolId, table.sortOrder),
]);

export const feeStructures = pgTable("fee_structures", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	schoolId: uuid("school_id").notNull(),
	academicYearId: uuid("academic_year_id").notNull(),
	termId: uuid("term_id").notNull(),
	classLevelId: uuid("class_level_id").notNull(),
	name: varchar({ length: 150 }).notNull(),
	description: text(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("fee_structures_class_idx").using("btree", table.classLevelId.asc().nullsLast().op("uuid_ops")),
	index("fee_structures_school_idx").using("btree", table.schoolId.asc().nullsLast().op("uuid_ops")),
	index("fee_structures_term_idx").using("btree", table.termId.asc().nullsLast().op("uuid_ops")),
	index("fee_structures_year_idx").using("btree", table.academicYearId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "fee_structures_school_id_schools_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.academicYearId],
			foreignColumns: [academicYears.id],
			name: "fee_structures_academic_year_id_academic_years_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.termId],
			foreignColumns: [terms.id],
			name: "fee_structures_term_id_terms_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.classLevelId],
			foreignColumns: [classLevels.id],
			name: "fee_structures_class_level_id_class_levels_id_fk"
		}).onDelete("cascade"),
	unique("fee_structures_scope_name_unique").on(table.academicYearId, table.classLevelId, table.name, table.schoolId, table.termId),
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
	admissionNumber: varchar("admission_number", { length: 50 }),
	address: text(),
	nationality: varchar({ length: 80 }).default('Ghanaian'),
	medicalInfo: jsonb("medical_info").default({}).notNull(),
	status: varchar({ length: 30 }).default('active').notNull(),
}, (table) => [
	index("students_last_name_idx").using("btree", table.lastName.asc().nullsLast().op("text_ops")),
	index("students_school_idx").using("btree", table.schoolId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "students_school_id_schools_id_fk"
		}).onDelete("cascade"),
	unique("student_school_number_unique").on(table.schoolId, table.studentNumber),
	unique("student_school_admission_unique").on(table.admissionNumber, table.schoolId),
]);

export const payments = pgTable("payments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	schoolId: uuid("school_id").notNull(),
	studentId: uuid("student_id").notNull(),
	receiptNumber: varchar("receipt_number", { length: 50 }).notNull(),
	paymentDate: date("payment_date").notNull(),
	amount: numeric({ precision: 12, scale:  2 }).notNull(),
	method: paymentMethod().notNull(),
	reference: varchar({ length: 150 }),
	status: paymentStatus().default('posted').notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("payments_date_idx").using("btree", table.paymentDate.asc().nullsLast().op("date_ops")),
	index("payments_school_idx").using("btree", table.schoolId.asc().nullsLast().op("uuid_ops")),
	index("payments_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("payments_student_idx").using("btree", table.studentId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "payments_school_id_schools_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [students.id],
			name: "payments_student_id_students_id_fk"
		}).onDelete("restrict"),
	unique("payments_school_receipt_unique").on(table.receiptNumber, table.schoolId),
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
	unique("academic_year_school_name_unique").on(table.name, table.schoolId),
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
	unique("class_level_school_name_unique").on(table.name, table.schoolId),
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

export const paymentAllocations = pgTable("payment_allocations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	paymentId: uuid("payment_id").notNull(),
	invoiceId: uuid("invoice_id").notNull(),
	amount: numeric({ precision: 12, scale:  2 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("payment_allocations_invoice_idx").using("btree", table.invoiceId.asc().nullsLast().op("uuid_ops")),
	index("payment_allocations_payment_idx").using("btree", table.paymentId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.paymentId],
			foreignColumns: [payments.id],
			name: "payment_allocations_payment_id_payments_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.invoiceId],
			foreignColumns: [studentInvoices.id],
			name: "payment_allocations_invoice_id_student_invoices_id_fk"
		}).onDelete("restrict"),
	unique("payment_allocations_unique").on(table.invoiceId, table.paymentId),
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
	unique("student_year_unique").on(table.academicYearId, table.studentId),
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
	unique("subject_school_name_unique").on(table.name, table.schoolId),
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
	uniqueIndex("teacher_assignments_one_class_teacher_idx").using("btree", table.streamId.asc().nullsLast().op("uuid_ops"), table.academicYearId.asc().nullsLast().op("uuid_ops")).where(sql`(is_class_teacher = true)`),
	index("teacher_assignments_staff_idx").using("btree", table.staffId.asc().nullsLast().op("uuid_ops")),
	index("teacher_assignments_stream_idx").using("btree", table.streamId.asc().nullsLast().op("uuid_ops")),
	index("teacher_assignments_subject_idx").using("btree", table.subjectId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("teacher_assignments_unique_class_teacher_idx").using("btree", table.staffId.asc().nullsLast().op("uuid_ops"), table.streamId.asc().nullsLast().op("uuid_ops"), table.academicYearId.asc().nullsLast().op("uuid_ops")).where(sql`((subject_id IS NULL) AND (is_class_teacher = true))`),
	uniqueIndex("teacher_assignments_unique_subject_idx").using("btree", table.staffId.asc().nullsLast().op("uuid_ops"), table.streamId.asc().nullsLast().op("uuid_ops"), table.subjectId.asc().nullsLast().op("uuid_ops"), table.academicYearId.asc().nullsLast().op("uuid_ops")).where(sql`(subject_id IS NOT NULL)`),
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
	unique("term_year_number_unique").on(table.academicYearId, table.termNumber),
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
	unique("class_subjects_unique_class_subject").on(table.classLevelId, table.subjectId),
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
	unique("attendance_sessions_unique_stream_date").on(table.attendanceDate, table.streamId),
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
			columns: [table.studentId],
			foreignColumns: [students.id],
			name: "attendance_records_student_id_students_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.attendanceSessionId],
			foreignColumns: [attendanceSessions.id],
			name: "attendance_records_attendance_session_id_attendance_sessions_id"
		}).onDelete("cascade"),
	unique("attendance_records_unique_session_student").on(table.attendanceSessionId, table.studentId),
]);

export const staffDocuments = pgTable("staff_documents", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	schoolId: uuid("school_id").notNull(),
	staffId: uuid("staff_id").notNull(),
	name: varchar({ length: 200 }).notNull(),
	documentType: varchar("document_type", { length: 80 }).notNull(),
	storageKey: text("storage_key").notNull(),
	mimeType: varchar("mime_type", { length: 120 }),
	sizeBytes: integer("size_bytes"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("staff_documents_school_idx").using("btree", table.schoolId.asc().nullsLast().op("uuid_ops")),
	index("staff_documents_staff_idx").using("btree", table.staffId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "staff_documents_school_id_schools_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.staffId],
			foreignColumns: [staff.id],
			name: "staff_documents_staff_id_staff_id_fk"
		}).onDelete("cascade"),
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
			name: "assessment_periods_school_id_schools_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.academicYearId],
			foreignColumns: [academicYears.id],
			name: "assessment_periods_academic_year_id_academic_years_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.termId],
			foreignColumns: [terms.id],
			name: "assessment_periods_term_id_terms_id_fk"
		}).onDelete("cascade"),
	unique("assessment_periods_school_name_unique").on(table.academicYearId, table.name, table.schoolId, table.termId),
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
			name: "assessments_school_id_schools_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.academicYearId],
			foreignColumns: [academicYears.id],
			name: "assessments_academic_year_id_academic_years_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.termId],
			foreignColumns: [terms.id],
			name: "assessments_term_id_terms_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.assessmentPeriodId],
			foreignColumns: [assessmentPeriods.id],
			name: "assessments_assessment_period_id_assessment_periods_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.streamId],
			foreignColumns: [streams.id],
			name: "assessments_stream_id_streams_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.subjectId],
			foreignColumns: [subjects.id],
			name: "assessments_subject_id_subjects_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.assessmentTypeId],
			foreignColumns: [assessmentTypes.id],
			name: "assessments_assessment_type_id_assessment_types_id_fk"
		}).onDelete("restrict"),
]);

export const promotionDecisions = pgTable("promotion_decisions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	schoolId: uuid("school_id").notNull(),
	studentId: uuid("student_id").notNull(),
	fromEnrollmentId: uuid("from_enrollment_id").notNull(),
	toEnrollmentId: uuid("to_enrollment_id"),
	status: promotionStatus().default('pending').notNull(),
	decisionDate: date("decision_date").notNull(),
	reason: text(),
	actorId: text("actor_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("promotion_decisions_school_idx").using("btree", table.schoolId.asc().nullsLast().op("uuid_ops")),
	index("promotion_decisions_student_idx").using("btree", table.studentId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "promotion_decisions_school_id_schools_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [students.id],
			name: "promotion_decisions_student_id_students_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.toEnrollmentId],
			foreignColumns: [studentEnrollments.id],
			name: "promotion_decisions_to_enrollment_id_student_enrollments_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.fromEnrollmentId],
			foreignColumns: [studentEnrollments.id],
			name: "promotion_decisions_from_enrollment_id_student_enrollments_id_f"
		}).onDelete("restrict"),
]);

export const scholarships = pgTable("scholarships", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	schoolId: uuid("school_id").notNull(),
	name: varchar({ length: 150 }).notNull(),
	percentage: numeric({ precision: 5, scale:  2 }).notNull(),
	maxAmount: numeric("max_amount", { precision: 12, scale:  2 }),
	active: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("scholarships_school_idx").using("btree", table.schoolId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "scholarships_school_id_schools_id_fk"
		}).onDelete("cascade"),
	unique("scholarships_school_name_unique").on(table.name, table.schoolId),
]);

export const schoolSettings = pgTable("school_settings", {
	schoolId: uuid("school_id").primaryKey().notNull(),
	currency: varchar({ length: 3 }).default('GHS').notNull(),
	timezone: varchar({ length: 64 }).default('Africa/Accra').notNull(),
	enableRanking: boolean("enable_ranking").default(true).notNull(),
	enableSubjectRanking: boolean("enable_subject_ranking").default(false).notNull(),
	allowOverpayment: boolean("allow_overpayment").default(false).notNull(),
	nextTermReopeningDate: date("next_term_reopening_date"),
	logoUrl: text("logo_url"),
	reportCardFooter: text("report_card_footer"),
	metadata: jsonb().default({}).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "school_settings_school_id_schools_id_fk"
		}).onDelete("cascade"),
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
			name: "assessment_scores_assessment_id_assessments_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [students.id],
			name: "assessment_scores_student_id_students_id_fk"
		}).onDelete("cascade"),
	unique("assessment_scores_unique_student").on(table.assessmentId, table.studentId),
]);

export const gradingSchemes = pgTable("grading_schemes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	schoolId: uuid("school_id").notNull(),
	name: varchar({ length: 150 }).notNull(),
	description: text(),
	status: varchar({ length: 20 }).default('draft').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("grading_schemes_school_idx").using("btree", table.schoolId.asc().nullsLast().op("uuid_ops")),
	index("grading_schemes_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "grading_schemes_school_id_schools_id_fk"
		}).onDelete("cascade"),
	unique("grading_schemes_school_name_unique").on(table.name, table.schoolId),
]);

export const gradeBands = pgTable("grade_bands", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	gradingSchemeId: uuid("grading_scheme_id").notNull(),
	grade: varchar({ length: 10 }).notNull(),
	label: varchar({ length: 100 }),
	minimumPercent: numeric("minimum_percent", { precision: 5, scale:  2 }).notNull(),
	maximumPercent: numeric("maximum_percent", { precision: 5, scale:  2 }).notNull(),
	remark: varchar({ length: 255 }),
	sortOrder: integer("sort_order").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("grade_bands_minimum_idx").using("btree", table.gradingSchemeId.asc().nullsLast().op("numeric_ops"), table.minimumPercent.asc().nullsLast().op("numeric_ops")),
	index("grade_bands_scheme_idx").using("btree", table.gradingSchemeId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.gradingSchemeId],
			foreignColumns: [gradingSchemes.id],
			name: "grade_bands_grading_scheme_id_grading_schemes_id_fk"
		}).onDelete("cascade"),
	unique("grade_bands_scheme_grade_unique").on(table.grade, table.gradingSchemeId),
]);

export const gradingSchemeItems = pgTable("grading_scheme_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	gradingSchemeId: uuid("grading_scheme_id").notNull(),
	assessmentTypeId: uuid("assessment_type_id").notNull(),
	weightPercent: numeric("weight_percent", { precision: 5, scale:  2 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("grading_scheme_items_scheme_idx").using("btree", table.gradingSchemeId.asc().nullsLast().op("uuid_ops")),
	index("grading_scheme_items_type_idx").using("btree", table.assessmentTypeId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.gradingSchemeId],
			foreignColumns: [gradingSchemes.id],
			name: "grading_scheme_items_grading_scheme_id_grading_schemes_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.assessmentTypeId],
			foreignColumns: [assessmentTypes.id],
			name: "grading_scheme_items_assessment_type_id_assessment_types_id_fk"
		}).onDelete("restrict"),
	unique("grading_scheme_items_unique").on(table.assessmentTypeId, table.gradingSchemeId),
]);

export const studentInvoiceItems = pgTable("student_invoice_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	invoiceId: uuid("invoice_id").notNull(),
	feeCategoryId: uuid("fee_category_id").notNull(),
	description: varchar({ length: 255 }).notNull(),
	amount: numeric({ precision: 12, scale:  2 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("student_invoice_items_category_idx").using("btree", table.feeCategoryId.asc().nullsLast().op("uuid_ops")),
	index("student_invoice_items_invoice_idx").using("btree", table.invoiceId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.invoiceId],
			foreignColumns: [studentInvoices.id],
			name: "student_invoice_items_invoice_id_student_invoices_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.feeCategoryId],
			foreignColumns: [feeCategories.id],
			name: "student_invoice_items_fee_category_id_fee_categories_id_fk"
		}).onDelete("restrict"),
]);

export const studentDocuments = pgTable("student_documents", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	schoolId: uuid("school_id").notNull(),
	studentId: uuid("student_id").notNull(),
	name: varchar({ length: 200 }).notNull(),
	documentType: varchar("document_type", { length: 80 }).notNull(),
	storageKey: text("storage_key").notNull(),
	mimeType: varchar("mime_type", { length: 120 }),
	sizeBytes: integer("size_bytes"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("student_documents_school_idx").using("btree", table.schoolId.asc().nullsLast().op("uuid_ops")),
	index("student_documents_student_idx").using("btree", table.studentId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "student_documents_school_id_schools_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [students.id],
			name: "student_documents_student_id_students_id_fk"
		}).onDelete("cascade"),
]);

export const studentInvoices = pgTable("student_invoices", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	schoolId: uuid("school_id").notNull(),
	studentId: uuid("student_id").notNull(),
	academicYearId: uuid("academic_year_id").notNull(),
	termId: uuid("term_id").notNull(),
	invoiceNumber: varchar("invoice_number", { length: 50 }).notNull(),
	issueDate: date("issue_date").notNull(),
	dueDate: date("due_date"),
	status: invoiceStatus().default('draft').notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("student_invoices_school_idx").using("btree", table.schoolId.asc().nullsLast().op("uuid_ops")),
	index("student_invoices_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("student_invoices_student_idx").using("btree", table.studentId.asc().nullsLast().op("uuid_ops")),
	index("student_invoices_term_idx").using("btree", table.termId.asc().nullsLast().op("uuid_ops")),
	index("student_invoices_year_idx").using("btree", table.academicYearId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "student_invoices_school_id_schools_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [students.id],
			name: "student_invoices_student_id_students_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.academicYearId],
			foreignColumns: [academicYears.id],
			name: "student_invoices_academic_year_id_academic_years_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.termId],
			foreignColumns: [terms.id],
			name: "student_invoices_term_id_terms_id_fk"
		}).onDelete("restrict"),
	unique("student_invoices_school_number_unique").on(table.invoiceNumber, table.schoolId),
]);

export const studentImports = pgTable("student_imports", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	schoolId: uuid("school_id").notNull(),
	createdBy: text("created_by").notNull(),
	filename: varchar({ length: 255 }).notNull(),
	totalRows: integer("total_rows").notNull(),
	validRows: integer("valid_rows").notNull(),
	invalidRows: integer("invalid_rows").notNull(),
	errors: jsonb().default([]).notNull(),
	status: varchar({ length: 30 }).default('completed').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("student_imports_created_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("student_imports_school_idx").using("btree", table.schoolId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "student_imports_school_id_schools_id_fk"
		}).onDelete("cascade"),
]);

export const resultPublicationAssessments = pgTable("result_publication_assessments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	publicationSubjectId: uuid("publication_subject_id").notNull(),
	assessmentId: uuid("assessment_id"),
	assessmentName: text("assessment_name").notNull(),
	assessmentTypeName: text("assessment_type_name").notNull(),
	category: varchar({ length: 30 }).notNull(),
	score: numeric({ precision: 8, scale:  2 }).notNull(),
	maxScore: numeric("max_score", { precision: 8, scale:  2 }).notNull(),
	percentage: numeric({ precision: 8, scale:  2 }).notNull(),
	weightPercent: numeric("weight_percent", { precision: 8, scale:  2 }).notNull(),
	weightedContribution: numeric("weighted_contribution", { precision: 8, scale:  2 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("result_publication_assessments_assessment_idx").using("btree", table.assessmentId.asc().nullsLast().op("uuid_ops")),
	index("result_publication_assessments_subject_idx").using("btree", table.publicationSubjectId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.assessmentId],
			foreignColumns: [assessments.id],
			name: "result_publication_assessments_assessment_id_assessments_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.publicationSubjectId],
			foreignColumns: [resultPublicationSubjects.id],
			name: "result_publication_assessments_publication_subject_id_result_pu"
		}).onDelete("cascade"),
]);

export const notifications = pgTable("notifications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	schoolId: uuid("school_id").notNull(),
	recipientAuthUserId: text("recipient_auth_user_id").notNull(),
	title: varchar({ length: 200 }).notNull(),
	body: text().notNull(),
	type: varchar({ length: 50 }).notNull(),
	readAt: timestamp("read_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("notifications_recipient_idx").using("btree", table.recipientAuthUserId.asc().nullsLast().op("text_ops")),
	index("notifications_school_idx").using("btree", table.schoolId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "notifications_school_id_schools_id_fk"
		}).onDelete("cascade"),
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
	primaryKey({ columns: [table.guardianId, table.studentId], name: "student_guardians_student_id_guardian_id_pk"}),
]);
