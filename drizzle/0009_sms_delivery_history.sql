CREATE TABLE IF NOT EXISTS "announcement_sms_deliveries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "school_id" uuid NOT NULL REFERENCES "schools"("id") ON DELETE CASCADE,
  "announcement_id" uuid NOT NULL REFERENCES "announcements"("id") ON DELETE CASCADE,
  "guardian_id" uuid NOT NULL REFERENCES "guardians"("id") ON DELETE RESTRICT,
  "recipient" varchar(30) NOT NULL,
  "status" varchar(20) NOT NULL,
  "provider_message_id" varchar(150),
  "error_message" text,
  "attempted_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "announcement_sms_deliveries_school_idx" ON "announcement_sms_deliveries" ("school_id");
CREATE INDEX IF NOT EXISTS "announcement_sms_deliveries_announcement_idx" ON "announcement_sms_deliveries" ("announcement_id");
