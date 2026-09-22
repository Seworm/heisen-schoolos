ALTER TABLE "teacher_assignments"
ADD COLUMN IF NOT EXISTS "lessons_per_week" integer NOT NULL DEFAULT 1;
