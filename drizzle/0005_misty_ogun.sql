CREATE TYPE "public"."assessment_period_status" AS ENUM('draft', 'open', 'closed', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."assessment_status" AS ENUM('draft', 'open', 'closed', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."assessment_type_category" AS ENUM('continuous_assessment', 'examination');--> statement-breakpoint
CREATE TYPE "public"."attendance_record_status" AS ENUM('present', 'absent', 'late', 'excused');--> statement-breakpoint
CREATE TYPE "public"."attendance_session_status" AS ENUM('open', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "assessment_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"academic_year_id" uuid NOT NULL,
	"term_id" uuid NOT NULL,
	"name" varchar(150) NOT NULL,
	"description" text,
	"start_date" date,
	"end_date" date,
	"status" "assessment_period_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assessment_periods_school_name_unique" UNIQUE("school_id","academic_year_id","term_id","name")
);
--> statement-breakpoint
CREATE TABLE "assessment_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assessment_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"score" numeric(8, 2) NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assessment_scores_unique_student" UNIQUE("assessment_id","student_id")
);
--> statement-breakpoint
CREATE TABLE "assessment_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(50),
	"category" "assessment_type_category" DEFAULT 'continuous_assessment' NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assessment_types_school_name_unique" UNIQUE("school_id","name"),
	CONSTRAINT "assessment_types_school_code_unique" UNIQUE("school_id","code")
);
--> statement-breakpoint
CREATE TABLE "assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"academic_year_id" uuid NOT NULL,
	"term_id" uuid NOT NULL,
	"assessment_period_id" uuid NOT NULL,
	"stream_id" uuid NOT NULL,
	"subject_id" uuid NOT NULL,
	"assessment_type_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"max_score" numeric(8, 2) NOT NULL,
	"assessment_date" date,
	"status" "assessment_status" DEFAULT 'draft' NOT NULL,
	"instructions" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attendance_session_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"status" "attendance_record_status" NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attendance_records_unique_session_student" UNIQUE("attendance_session_id","student_id")
);
--> statement-breakpoint
CREATE TABLE "attendance_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"academic_year_id" uuid NOT NULL,
	"term_id" uuid NOT NULL,
	"stream_id" uuid NOT NULL,
	"attendance_date" date NOT NULL,
	"status" "attendance_session_status" DEFAULT 'open' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attendance_sessions_unique_stream_date" UNIQUE("stream_id","attendance_date")
);
--> statement-breakpoint
CREATE TABLE "class_subjects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_level_id" uuid NOT NULL,
	"subject_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "class_subjects_unique_class_subject" UNIQUE("class_level_id","subject_id")
);
--> statement-breakpoint
CREATE TABLE "grade_bands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"grading_scheme_id" uuid NOT NULL,
	"grade" varchar(10) NOT NULL,
	"label" varchar(100),
	"minimum_percent" numeric(5, 2) NOT NULL,
	"maximum_percent" numeric(5, 2) NOT NULL,
	"remark" varchar(255),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "grade_bands_scheme_grade_unique" UNIQUE("grading_scheme_id","grade")
);
--> statement-breakpoint
CREATE TABLE "grading_scheme_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"grading_scheme_id" uuid NOT NULL,
	"assessment_type_id" uuid NOT NULL,
	"weight_percent" numeric(5, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "grading_scheme_items_unique" UNIQUE("grading_scheme_id","assessment_type_id")
);
--> statement-breakpoint
CREATE TABLE "grading_schemes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"name" varchar(150) NOT NULL,
	"description" text,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "grading_schemes_school_name_unique" UNIQUE("school_id","name")
);
--> statement-breakpoint
ALTER TABLE "assessment_periods" ADD CONSTRAINT "assessment_periods_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_periods" ADD CONSTRAINT "assessment_periods_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_periods" ADD CONSTRAINT "assessment_periods_term_id_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_scores" ADD CONSTRAINT "assessment_scores_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_scores" ADD CONSTRAINT "assessment_scores_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_types" ADD CONSTRAINT "assessment_types_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_term_id_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_assessment_period_id_assessment_periods_id_fk" FOREIGN KEY ("assessment_period_id") REFERENCES "public"."assessment_periods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_stream_id_streams_id_fk" FOREIGN KEY ("stream_id") REFERENCES "public"."streams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_assessment_type_id_assessment_types_id_fk" FOREIGN KEY ("assessment_type_id") REFERENCES "public"."assessment_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_attendance_session_id_attendance_sessions_id_fk" FOREIGN KEY ("attendance_session_id") REFERENCES "public"."attendance_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_term_id_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_stream_id_streams_id_fk" FOREIGN KEY ("stream_id") REFERENCES "public"."streams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_subjects" ADD CONSTRAINT "class_subjects_class_level_id_class_levels_id_fk" FOREIGN KEY ("class_level_id") REFERENCES "public"."class_levels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_subjects" ADD CONSTRAINT "class_subjects_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade_bands" ADD CONSTRAINT "grade_bands_grading_scheme_id_grading_schemes_id_fk" FOREIGN KEY ("grading_scheme_id") REFERENCES "public"."grading_schemes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grading_scheme_items" ADD CONSTRAINT "grading_scheme_items_grading_scheme_id_grading_schemes_id_fk" FOREIGN KEY ("grading_scheme_id") REFERENCES "public"."grading_schemes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grading_scheme_items" ADD CONSTRAINT "grading_scheme_items_assessment_type_id_assessment_types_id_fk" FOREIGN KEY ("assessment_type_id") REFERENCES "public"."assessment_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grading_schemes" ADD CONSTRAINT "grading_schemes_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assessment_periods_school_idx" ON "assessment_periods" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "assessment_periods_year_idx" ON "assessment_periods" USING btree ("academic_year_id");--> statement-breakpoint
CREATE INDEX "assessment_periods_term_idx" ON "assessment_periods" USING btree ("term_id");--> statement-breakpoint
CREATE INDEX "assessment_periods_status_idx" ON "assessment_periods" USING btree ("status");--> statement-breakpoint
CREATE INDEX "assessment_scores_assessment_idx" ON "assessment_scores" USING btree ("assessment_id");--> statement-breakpoint
CREATE INDEX "assessment_scores_student_idx" ON "assessment_scores" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "assessment_types_school_idx" ON "assessment_types" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "assessment_types_category_idx" ON "assessment_types" USING btree ("category");--> statement-breakpoint
CREATE INDEX "assessments_school_idx" ON "assessments" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "assessments_year_idx" ON "assessments" USING btree ("academic_year_id");--> statement-breakpoint
CREATE INDEX "assessments_term_idx" ON "assessments" USING btree ("term_id");--> statement-breakpoint
CREATE INDEX "assessments_period_idx" ON "assessments" USING btree ("assessment_period_id");--> statement-breakpoint
CREATE INDEX "assessments_stream_idx" ON "assessments" USING btree ("stream_id");--> statement-breakpoint
CREATE INDEX "assessments_subject_idx" ON "assessments" USING btree ("subject_id");--> statement-breakpoint
CREATE INDEX "assessments_type_idx" ON "assessments" USING btree ("assessment_type_id");--> statement-breakpoint
CREATE INDEX "assessments_status_idx" ON "assessments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "attendance_records_session_idx" ON "attendance_records" USING btree ("attendance_session_id");--> statement-breakpoint
CREATE INDEX "attendance_records_student_idx" ON "attendance_records" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "attendance_records_status_idx" ON "attendance_records" USING btree ("status");--> statement-breakpoint
CREATE INDEX "attendance_sessions_school_idx" ON "attendance_sessions" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "attendance_sessions_year_idx" ON "attendance_sessions" USING btree ("academic_year_id");--> statement-breakpoint
CREATE INDEX "attendance_sessions_term_idx" ON "attendance_sessions" USING btree ("term_id");--> statement-breakpoint
CREATE INDEX "attendance_sessions_stream_idx" ON "attendance_sessions" USING btree ("stream_id");--> statement-breakpoint
CREATE INDEX "attendance_sessions_date_idx" ON "attendance_sessions" USING btree ("attendance_date");--> statement-breakpoint
CREATE INDEX "class_subjects_class_idx" ON "class_subjects" USING btree ("class_level_id");--> statement-breakpoint
CREATE INDEX "class_subjects_subject_idx" ON "class_subjects" USING btree ("subject_id");--> statement-breakpoint
CREATE INDEX "grade_bands_scheme_idx" ON "grade_bands" USING btree ("grading_scheme_id");--> statement-breakpoint
CREATE INDEX "grade_bands_minimum_idx" ON "grade_bands" USING btree ("grading_scheme_id","minimum_percent");--> statement-breakpoint
CREATE INDEX "grading_scheme_items_scheme_idx" ON "grading_scheme_items" USING btree ("grading_scheme_id");--> statement-breakpoint
CREATE INDEX "grading_scheme_items_type_idx" ON "grading_scheme_items" USING btree ("assessment_type_id");--> statement-breakpoint
CREATE INDEX "grading_schemes_school_idx" ON "grading_schemes" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "grading_schemes_status_idx" ON "grading_schemes" USING btree ("status");