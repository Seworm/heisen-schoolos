CREATE TYPE "public"."payment_intent_status" AS ENUM('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'expired');
CREATE TYPE "public"."payment_transaction_status" AS ENUM('pending', 'confirmed', 'failed', 'reversed');
CREATE TYPE "public"."payment_provider" AS ENUM('manual', 'mock');

CREATE TABLE "payment_intents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "school_id" uuid NOT NULL REFERENCES "schools"("id") ON DELETE CASCADE,
  "student_id" uuid NOT NULL REFERENCES "students"("id") ON DELETE RESTRICT,
  "amount" numeric(12, 2) NOT NULL,
  "currency" varchar(3) NOT NULL DEFAULT 'GHS',
  "provider" "payment_provider" NOT NULL DEFAULT 'manual',
  "status" "payment_intent_status" NOT NULL DEFAULT 'pending',
  "client_reference" varchar(100) NOT NULL,
  "provider_reference" varchar(150),
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "expires_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "payment_intents_school_client_reference_unique" UNIQUE ("school_id", "client_reference")
);
CREATE INDEX "payment_intents_school_idx" ON "payment_intents" ("school_id");
CREATE INDEX "payment_intents_student_idx" ON "payment_intents" ("student_id");
CREATE INDEX "payment_intents_status_idx" ON "payment_intents" ("status");

CREATE TABLE "payment_transactions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "school_id" uuid NOT NULL REFERENCES "schools"("id") ON DELETE CASCADE,
  "intent_id" uuid NOT NULL REFERENCES "payment_intents"("id") ON DELETE RESTRICT,
  "payment_id" uuid REFERENCES "payments"("id") ON DELETE SET NULL,
  "provider" "payment_provider" NOT NULL,
  "provider_transaction_id" varchar(150) NOT NULL,
  "amount" numeric(12, 2) NOT NULL,
  "currency" varchar(3) NOT NULL DEFAULT 'GHS',
  "status" "payment_transaction_status" NOT NULL DEFAULT 'pending',
  "raw_response" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "failure_reason" text,
  "verified_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "payment_transactions_provider_reference_unique" UNIQUE ("provider", "provider_transaction_id")
);
CREATE INDEX "payment_transactions_school_idx" ON "payment_transactions" ("school_id");
CREATE INDEX "payment_transactions_intent_idx" ON "payment_transactions" ("intent_id");
CREATE INDEX "payment_transactions_status_idx" ON "payment_transactions" ("status");
