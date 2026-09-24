DO $$ BEGIN
  CREATE TYPE "calendar_event_status" AS ENUM ('scheduled', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "school_calendar_events"
  ADD COLUMN IF NOT EXISTS "status" "calendar_event_status" NOT NULL DEFAULT 'scheduled';
