ALTER TABLE "announcements"
  ADD COLUMN IF NOT EXISTS "sms_sent_at" timestamptz;
