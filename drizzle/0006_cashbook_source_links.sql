ALTER TABLE "cashbook_entries"
  ADD COLUMN IF NOT EXISTS "source_feeding_collection_id" uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'cashbook_entries_source_feeding_collection_fk'
  ) THEN
    ALTER TABLE "cashbook_entries"
      ADD CONSTRAINT "cashbook_entries_source_feeding_collection_fk"
      FOREIGN KEY ("source_feeding_collection_id")
      REFERENCES "feeding_fee_collections"("id")
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "cashbook_entries_source_feeding_unique"
  ON "cashbook_entries" ("source_feeding_collection_id");
