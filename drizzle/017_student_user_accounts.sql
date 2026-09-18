CREATE TYPE "public"."student_account_status" AS ENUM (
  'pending',
  'active',
  'disabled'
);

CREATE TABLE "student_user_accounts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "student_id" uuid NOT NULL,
  "email" text NOT NULL,
  "password_hash" text,
  "activation_code_hash" text,
  "activation_code_expires_at" timestamp with time zone,
  "activated_at" timestamp with time zone,
  "last_login_at" timestamp with time zone,
  "status" "student_account_status" DEFAULT 'pending' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "student_user_accounts_student_id_unique" UNIQUE("student_id"),
  CONSTRAINT "student_user_accounts_email_unique" UNIQUE("email")
);

ALTER TABLE "student_user_accounts"
  ADD CONSTRAINT "student_user_accounts_student_id_students_id_fk"
  FOREIGN KEY ("student_id")
  REFERENCES "public"."students"("id")
  ON DELETE CASCADE
  ON UPDATE NO ACTION;

CREATE INDEX "student_user_accounts_student_idx"
  ON "student_user_accounts" USING btree ("student_id");

CREATE INDEX "student_user_accounts_status_idx"
  ON "student_user_accounts" USING btree ("status");

CREATE INDEX "student_user_accounts_activation_idx"
  ON "student_user_accounts" USING btree ("activation_code_hash");