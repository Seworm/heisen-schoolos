CREATE TABLE IF NOT EXISTS "cashbook_entries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "school_id" uuid NOT NULL REFERENCES "schools"("id") ON DELETE CASCADE,
  "entry_date" date NOT NULL,
  "entry_type" varchar(20) NOT NULL,
  "category" varchar(100) NOT NULL,
  "description" varchar(255) NOT NULL,
  "amount" numeric(12,2) NOT NULL,
  "method" "payment_method" NOT NULL DEFAULT 'cash',
  "reference" varchar(150),
  "source_payment_id" uuid REFERENCES "payments"("id") ON DELETE SET NULL,
  "created_by" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "cashbook_entries_source_payment_unique" UNIQUE ("source_payment_id")
);

CREATE INDEX IF NOT EXISTS "cashbook_entries_school_date_idx"
  ON "cashbook_entries" ("school_id", "entry_date");
CREATE INDEX IF NOT EXISTS "cashbook_entries_type_idx"
  ON "cashbook_entries" ("entry_type");
CREATE INDEX IF NOT EXISTS "cashbook_entries_category_idx"
  ON "cashbook_entries" ("category");
