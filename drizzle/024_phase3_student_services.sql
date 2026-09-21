CREATE TYPE "public"."library_loan_status" AS ENUM('borrowed','returned','overdue','lost');
CREATE TYPE "public"."transport_assignment_status" AS ENUM('active','paused','ended');
CREATE TYPE "public"."safeguarding_case_status" AS ENUM('open','monitoring','closed');
CREATE TYPE "public"."discipline_incident_status" AS ENUM('reported','investigating','resolved','dismissed');

CREATE TABLE "library_books" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "school_id" uuid NOT NULL REFERENCES "schools"("id") ON DELETE CASCADE,
  "isbn" varchar(30), "title" varchar(240) NOT NULL, "author" varchar(180), "category" varchar(100),
  "copies_total" integer NOT NULL DEFAULT 1, "copies_available" integer NOT NULL DEFAULT 1,
  "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "library_books_school_isbn_unique" UNIQUE("school_id","isbn")
);
CREATE INDEX "library_books_school_idx" ON "library_books"("school_id");
CREATE TABLE "library_loans" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "school_id" uuid NOT NULL REFERENCES "schools"("id") ON DELETE CASCADE,
  "book_id" uuid NOT NULL REFERENCES "library_books"("id") ON DELETE RESTRICT, "student_id" uuid NOT NULL REFERENCES "students"("id") ON DELETE RESTRICT,
  "issued_by" text NOT NULL, "issued_at" timestamptz NOT NULL DEFAULT now(), "due_at" date NOT NULL, "returned_at" timestamptz,
  "status" "library_loan_status" NOT NULL DEFAULT 'borrowed'
);
CREATE INDEX "library_loans_school_idx" ON "library_loans"("school_id");
CREATE INDEX "library_loans_student_idx" ON "library_loans"("student_id");
CREATE INDEX "library_loans_status_idx" ON "library_loans"("status");

CREATE TABLE "transport_routes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "school_id" uuid NOT NULL REFERENCES "schools"("id") ON DELETE CASCADE,
  "name" varchar(120) NOT NULL, "vehicle_number" varchar(50), "driver_name" varchar(160), "driver_phone" varchar(30),
  "stops" jsonb NOT NULL DEFAULT '[]', "active" boolean NOT NULL DEFAULT true, "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "transport_routes_school_name_unique" UNIQUE("school_id","name")
);
CREATE INDEX "transport_routes_school_idx" ON "transport_routes"("school_id");
CREATE TABLE "transport_assignments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "school_id" uuid NOT NULL REFERENCES "schools"("id") ON DELETE CASCADE,
  "route_id" uuid NOT NULL REFERENCES "transport_routes"("id") ON DELETE RESTRICT, "student_id" uuid NOT NULL REFERENCES "students"("id") ON DELETE RESTRICT,
  "pickup_stop" varchar(160), "dropoff_stop" varchar(160), "status" "transport_assignment_status" NOT NULL DEFAULT 'active',
  "assigned_at" timestamptz NOT NULL DEFAULT now(), CONSTRAINT "transport_assignments_route_student_unique" UNIQUE("route_id","student_id")
);
CREATE INDEX "transport_assignments_school_idx" ON "transport_assignments"("school_id");

CREATE TABLE "student_health_records" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "school_id" uuid NOT NULL REFERENCES "schools"("id") ON DELETE CASCADE,
  "student_id" uuid NOT NULL REFERENCES "students"("id") ON DELETE CASCADE, "recorded_by" text NOT NULL, "record_type" varchar(60) NOT NULL,
  "details" text NOT NULL, "occurred_at" timestamptz NOT NULL DEFAULT now(), "follow_up" text, "confidential" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "student_health_school_idx" ON "student_health_records"("school_id");
CREATE INDEX "student_health_student_idx" ON "student_health_records"("student_id");

CREATE TABLE "safeguarding_cases" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "school_id" uuid NOT NULL REFERENCES "schools"("id") ON DELETE CASCADE,
  "student_id" uuid NOT NULL REFERENCES "students"("id") ON DELETE RESTRICT, "reported_by" text NOT NULL, "assigned_to" text,
  "summary" text NOT NULL, "actions_taken" text, "status" "safeguarding_case_status" NOT NULL DEFAULT 'open',
  "confidential" boolean NOT NULL DEFAULT true, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "safeguarding_cases_school_idx" ON "safeguarding_cases"("school_id");
CREATE INDEX "safeguarding_cases_student_idx" ON "safeguarding_cases"("student_id");

CREATE TABLE "discipline_incidents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "school_id" uuid NOT NULL REFERENCES "schools"("id") ON DELETE CASCADE,
  "student_id" uuid NOT NULL REFERENCES "students"("id") ON DELETE RESTRICT, "reported_by" text NOT NULL, "incident_date" date NOT NULL,
  "category" varchar(80) NOT NULL, "description" text NOT NULL, "action_taken" text,
  "status" "discipline_incident_status" NOT NULL DEFAULT 'reported', "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "discipline_incidents_school_idx" ON "discipline_incidents"("school_id");
CREATE INDEX "discipline_incidents_student_idx" ON "discipline_incidents"("student_id");
