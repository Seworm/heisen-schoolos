ALTER TABLE "cashbook_entries"
  ADD COLUMN IF NOT EXISTS "reversal_of_id" uuid,
  ADD COLUMN IF NOT EXISTS "reversal_reason" varchar(255);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'cashbook_entries_reversal_of_fk'
  ) THEN
    ALTER TABLE "cashbook_entries"
      ADD CONSTRAINT "cashbook_entries_reversal_of_fk"
      FOREIGN KEY ("reversal_of_id")
      REFERENCES "cashbook_entries"("id")
      ON DELETE RESTRICT;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "cashbook_entries_reversal_of_unique"
  ON "cashbook_entries" ("reversal_of_id");
