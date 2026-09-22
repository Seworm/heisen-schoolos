ALTER TABLE "subjects"
  ADD COLUMN IF NOT EXISTS "curriculum_code" varchar(80),
  ADD COLUMN IF NOT EXISTS "language_code" varchar(40),
  ADD COLUMN IF NOT EXISTS "examinable" boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "activity_based" boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "curriculum_stages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" varchar(40) NOT NULL UNIQUE,
  "name" varchar(120) NOT NULL,
  "description" text,
  "min_sort_order" integer NOT NULL,
  "max_sort_order" integer NOT NULL,
  "active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "curriculum_subjects" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "curriculum_stage_id" uuid NOT NULL REFERENCES "curriculum_stages"("id") ON DELETE CASCADE,
  "code" varchar(80) NOT NULL,
  "name" varchar(150) NOT NULL,
  "category" varchar(40) NOT NULL,
  "compulsory" boolean NOT NULL DEFAULT false,
  "parameterized" varchar(60),
  "examinable" boolean NOT NULL DEFAULT true,
  "activity_based" boolean NOT NULL DEFAULT false,
  "sort_order" integer NOT NULL DEFAULT 0,
  "active" boolean NOT NULL DEFAULT true,
  CONSTRAINT "curriculum_stage_subject_code_unique" UNIQUE ("curriculum_stage_id", "code")
);

CREATE TABLE IF NOT EXISTS "ghanaian_languages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" varchar(40) NOT NULL UNIQUE,
  "name" varchar(100) NOT NULL,
  "active" boolean NOT NULL DEFAULT true,
  "sort_order" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "school_curriculum_configurations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "school_id" uuid NOT NULL REFERENCES "schools"("id") ON DELETE CASCADE,
  "class_level_id" uuid NOT NULL REFERENCES "class_levels"("id") ON DELETE CASCADE,
  "curriculum_subject_id" uuid NOT NULL REFERENCES "curriculum_subjects"("id") ON DELETE CASCADE,
  "language_id" uuid REFERENCES "ghanaian_languages"("id") ON DELETE RESTRICT,
  "offered" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "school_curriculum_config_class_subject_unique" UNIQUE ("school_id", "class_level_id", "curriculum_subject_id")
);

CREATE INDEX IF NOT EXISTS "school_curriculum_config_school_idx"
  ON "school_curriculum_configurations" ("school_id");
