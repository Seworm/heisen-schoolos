DO $$ BEGIN
  CREATE TYPE "feeding_payment_mode" AS ENUM ('termly', 'daily');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "fee_assignments"
  ADD COLUMN IF NOT EXISTS "feeding_payment_mode" "feeding_payment_mode" NOT NULL DEFAULT 'termly';

CREATE TABLE IF NOT EXISTS "feeding_fee_settings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "school_id" uuid NOT NULL REFERENCES "schools"("id") ON DELETE CASCADE,
  "academic_year_id" uuid NOT NULL REFERENCES "academic_years"("id") ON DELETE CASCADE,
  "class_level_id" uuid NOT NULL REFERENCES "class_levels"("id") ON DELETE CASCADE,
  "daily_amount" numeric(12,2) NOT NULL,
  "termly_amount" numeric(12,2),
  "active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "feeding_fee_settings_scope_unique" UNIQUE ("school_id", "academic_year_id", "class_level_id")
);

CREATE INDEX IF NOT EXISTS "feeding_fee_settings_school_idx"
  ON "feeding_fee_settings" ("school_id");
CREATE INDEX IF NOT EXISTS "feeding_fee_settings_class_idx"
  ON "feeding_fee_settings" ("class_level_id");

CREATE TABLE IF NOT EXISTS "feeding_fee_collections" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "school_id" uuid NOT NULL REFERENCES "schools"("id") ON DELETE CASCADE,
  "student_id" uuid NOT NULL REFERENCES "students"("id") ON DELETE RESTRICT,
  "class_level_id" uuid NOT NULL REFERENCES "class_levels"("id") ON DELETE RESTRICT,
  "stream_id" uuid REFERENCES "streams"("id") ON DELETE RESTRICT,
  "academic_year_id" uuid NOT NULL REFERENCES "academic_years"("id") ON DELETE RESTRICT,
  "collection_date" date NOT NULL,
  "amount" numeric(12,2) NOT NULL,
  "method" "payment_method" NOT NULL DEFAULT 'cash',
  "receipt_number" varchar(50) NOT NULL,
  "collected_by" text NOT NULL,
  "notes" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "feeding_fee_collection_student_date_unique"
    UNIQUE ("school_id", "student_id", "collection_date")
);

CREATE INDEX IF NOT EXISTS "feeding_fee_collections_school_date_idx"
  ON "feeding_fee_collections" ("school_id", "collection_date");
CREATE INDEX IF NOT EXISTS "feeding_fee_collections_class_date_idx"
  ON "feeding_fee_collections" ("class_level_id", "collection_date");
CREATE INDEX IF NOT EXISTS "feeding_fee_collections_student_idx"
  ON "feeding_fee_collections" ("student_id");
