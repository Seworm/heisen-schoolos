CREATE TABLE IF NOT EXISTS "staff_invitations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "school_id" uuid NOT NULL REFERENCES "schools"("id") ON DELETE CASCADE,
  "email" text NOT NULL,
  "first_name" text NOT NULL,
  "last_name" text NOT NULL,
  "role" "school_membership_role" NOT NULL,
  "token_hash" text NOT NULL UNIQUE,
  "expires_at" timestamptz NOT NULL,
  "accepted_at" timestamptz,
  "created_by" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "staff_invitations_email_idx" ON "staff_invitations" ("email");
CREATE INDEX IF NOT EXISTS "staff_invitations_school_idx" ON "staff_invitations" ("school_id");
CREATE INDEX IF NOT EXISTS "staff_invitations_expires_idx" ON "staff_invitations" ("expires_at");
