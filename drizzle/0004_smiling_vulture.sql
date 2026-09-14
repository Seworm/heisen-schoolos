CREATE TYPE "public"."placement_status" AS ENUM('active', 'completed', 'transferred', 'cancelled');--> statement-breakpoint
CREATE TABLE "student_placements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_enrollment_id" uuid NOT NULL,
	"stream_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"status" "placement_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "student_placements" ADD CONSTRAINT "student_placements_student_enrollment_id_student_enrollments_id_fk" FOREIGN KEY ("student_enrollment_id") REFERENCES "public"."student_enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_placements" ADD CONSTRAINT "student_placements_stream_id_streams_id_fk" FOREIGN KEY ("stream_id") REFERENCES "public"."streams"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "placements_enrollment_idx" ON "student_placements" USING btree ("student_enrollment_id");--> statement-breakpoint
CREATE INDEX "placements_stream_idx" ON "student_placements" USING btree ("stream_id");--> statement-breakpoint
CREATE INDEX "placements_status_idx" ON "student_placements" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "placements_one_active_idx" ON "student_placements" USING btree ("student_enrollment_id") WHERE "student_placements"."status" = 'active';