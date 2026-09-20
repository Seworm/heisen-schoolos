ALTER TYPE school_membership_role ADD VALUE IF NOT EXISTS 'platform_admin';
ALTER TYPE school_membership_role ADD VALUE IF NOT EXISTS 'school_owner';
ALTER TYPE school_membership_role ADD VALUE IF NOT EXISTS 'principal';
ALTER TYPE school_membership_role ADD VALUE IF NOT EXISTS 'bursar';
ALTER TYPE school_membership_role ADD VALUE IF NOT EXISTS 'secretary';
ALTER TYPE school_membership_role ADD VALUE IF NOT EXISTS 'librarian';
ALTER TYPE school_membership_role ADD VALUE IF NOT EXISTS 'nurse';
ALTER TYPE school_membership_role ADD VALUE IF NOT EXISTS 'parent';
ALTER TYPE school_membership_role ADD VALUE IF NOT EXISTS 'student';

ALTER TABLE students ADD COLUMN IF NOT EXISTS admission_number varchar(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS nationality varchar(80) DEFAULT 'Ghanaian';
ALTER TABLE students ADD COLUMN IF NOT EXISTS medical_info jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE students ADD COLUMN IF NOT EXISTS status varchar(30) NOT NULL DEFAULT 'active';
DO $$ BEGIN ALTER TABLE students ADD CONSTRAINT student_school_admission_unique UNIQUE (school_id, admission_number); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS students_status_idx ON students(status);
CREATE INDEX IF NOT EXISTS students_school_name_idx ON students(school_id, last_name, first_name);

CREATE TABLE IF NOT EXISTS school_settings (
  school_id uuid PRIMARY KEY REFERENCES schools(id) ON DELETE CASCADE,
  currency varchar(3) NOT NULL DEFAULT 'GHS',
  timezone varchar(64) NOT NULL DEFAULT 'Africa/Accra',
  enable_ranking boolean NOT NULL DEFAULT true,
  enable_subject_ranking boolean NOT NULL DEFAULT false,
  allow_overpayment boolean NOT NULL DEFAULT false,
  next_term_reopening_date date,
  logo_url text,
  report_card_footer text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id text NOT NULL UNIQUE,
  email varchar(255) NOT NULL,
  first_name varchar(100) NOT NULL,
  last_name varchar(100) NOT NULL,
  phone varchar(30),
  photo_url text,
  status user_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);
CREATE INDEX IF NOT EXISTS profiles_status_idx ON profiles(status);

CREATE TABLE IF NOT EXISTS student_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  name varchar(200) NOT NULL,
  document_type varchar(80) NOT NULL,
  storage_key text NOT NULL,
  mime_type varchar(120),
  size_bytes integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS student_documents_school_idx ON student_documents(school_id);
CREATE INDEX IF NOT EXISTS student_documents_student_idx ON student_documents(student_id);

CREATE TABLE IF NOT EXISTS staff_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  name varchar(200) NOT NULL,
  document_type varchar(80) NOT NULL,
  storage_key text NOT NULL,
  mime_type varchar(120),
  size_bytes integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS staff_documents_school_idx ON staff_documents(school_id);
CREATE INDEX IF NOT EXISTS staff_documents_staff_idx ON staff_documents(staff_id);

CREATE TABLE IF NOT EXISTS student_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status varchar(40) NOT NULL,
  effective_date date NOT NULL,
  reason text,
  actor_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS student_status_history_school_idx ON student_status_history(school_id);
CREATE INDEX IF NOT EXISTS student_status_history_student_idx ON student_status_history(student_id);
CREATE INDEX IF NOT EXISTS student_status_history_date_idx ON student_status_history(effective_date);

CREATE TABLE IF NOT EXISTS fee_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  fee_structure_id uuid NOT NULL REFERENCES fee_structures(id) ON DELETE RESTRICT,
  academic_year_id uuid NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
  term_id uuid NOT NULL REFERENCES terms(id) ON DELETE RESTRICT,
  status varchar(30) NOT NULL DEFAULT 'active',
  assigned_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fee_assignments_unique UNIQUE(student_id, fee_structure_id, term_id)
);
CREATE INDEX IF NOT EXISTS fee_assignments_school_idx ON fee_assignments(school_id);
CREATE INDEX IF NOT EXISTS fee_assignments_student_idx ON fee_assignments(student_id);

CREATE TABLE IF NOT EXISTS scholarships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name varchar(150) NOT NULL,
  percentage numeric(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  max_amount numeric(12,2),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT scholarships_school_name_unique UNIQUE(school_id, name)
);
CREATE INDEX IF NOT EXISTS scholarships_school_idx ON scholarships(school_id);

CREATE TABLE IF NOT EXISTS student_scholarships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  scholarship_id uuid NOT NULL REFERENCES scholarships(id) ON DELETE RESTRICT,
  academic_year_id uuid NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
  term_id uuid NOT NULL REFERENCES terms(id) ON DELETE RESTRICT,
  amount numeric(12,2),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS student_scholarships_school_idx ON student_scholarships(school_id);
CREATE INDEX IF NOT EXISTS student_scholarships_student_idx ON student_scholarships(student_id);

CREATE TABLE IF NOT EXISTS timetable_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name varchar(80) NOT NULL,
  day_of_week integer NOT NULL CHECK(day_of_week BETWEEN 1 AND 7),
  starts_at varchar(5) NOT NULL,
  ends_at varchar(5) NOT NULL,
  sort_order integer NOT NULL,
  CONSTRAINT timetable_period_unique UNIQUE(school_id, day_of_week, sort_order)
);
CREATE INDEX IF NOT EXISTS timetable_period_school_idx ON timetable_periods(school_id);

CREATE TABLE IF NOT EXISTS classrooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name varchar(100) NOT NULL,
  capacity integer,
  location varchar(150),
  active boolean NOT NULL DEFAULT true,
  CONSTRAINT classrooms_school_name_unique UNIQUE(school_id, name)
);
CREATE INDEX IF NOT EXISTS classrooms_school_idx ON classrooms(school_id);

CREATE TABLE IF NOT EXISTS timetable_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
  term_id uuid NOT NULL REFERENCES terms(id) ON DELETE RESTRICT,
  stream_id uuid NOT NULL REFERENCES streams(id) ON DELETE RESTRICT,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
  staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE RESTRICT,
  period_id uuid NOT NULL REFERENCES timetable_periods(id) ON DELETE CASCADE,
  classroom_id uuid REFERENCES classrooms(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT timetable_class_period_unique UNIQUE(stream_id, period_id),
  CONSTRAINT timetable_teacher_period_unique UNIQUE(staff_id, period_id),
  CONSTRAINT timetable_room_period_unique UNIQUE(classroom_id, period_id)
);
CREATE INDEX IF NOT EXISTS timetable_school_idx ON timetable_entries(school_id);
CREATE INDEX IF NOT EXISTS timetable_stream_idx ON timetable_entries(stream_id);

DO $$ BEGIN CREATE TYPE announcement_audience AS ENUM('school','class','stream','staff','parents','students','individual'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  author_id text NOT NULL,
  title varchar(200) NOT NULL,
  body text NOT NULL,
  audience announcement_audience NOT NULL,
  target_id uuid,
  published_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS announcements_school_idx ON announcements(school_id);
CREATE INDEX IF NOT EXISTS announcements_published_idx ON announcements(published_at);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  recipient_auth_user_id text NOT NULL,
  title varchar(200) NOT NULL,
  body text NOT NULL,
  type varchar(50) NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_recipient_idx ON notifications(recipient_auth_user_id);
CREATE INDEX IF NOT EXISTS notifications_school_idx ON notifications(school_id);

CREATE TABLE IF NOT EXISTS internal_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  sender_auth_user_id text NOT NULL,
  recipient_auth_user_id text NOT NULL,
  subject varchar(200) NOT NULL,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS internal_messages_school_idx ON internal_messages(school_id);
CREATE INDEX IF NOT EXISTS internal_messages_recipient_idx ON internal_messages(recipient_auth_user_id);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE,
  actor_auth_user_id text,
  action varchar(100) NOT NULL,
  entity varchar(100) NOT NULL,
  entity_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address varchar(64),
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_logs_school_idx ON audit_logs(school_id);
CREATE INDEX IF NOT EXISTS audit_logs_actor_idx ON audit_logs(actor_auth_user_id);
CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON audit_logs(created_at);

CREATE TABLE IF NOT EXISTS promotion_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  from_enrollment_id uuid NOT NULL REFERENCES student_enrollments(id) ON DELETE RESTRICT,
  to_enrollment_id uuid REFERENCES student_enrollments(id) ON DELETE RESTRICT,
  status promotion_status NOT NULL DEFAULT 'pending',
  decision_date date NOT NULL,
  reason text,
  actor_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS promotion_decisions_school_idx ON promotion_decisions(school_id);
CREATE INDEX IF NOT EXISTS promotion_decisions_student_idx ON promotion_decisions(student_id);

CREATE TABLE IF NOT EXISTS student_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  created_by text NOT NULL,
  filename varchar(255) NOT NULL,
  total_rows integer NOT NULL,
  valid_rows integer NOT NULL,
  invalid_rows integer NOT NULL,
  errors jsonb NOT NULL DEFAULT '[]'::jsonb,
  status varchar(30) NOT NULL DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS student_imports_school_idx ON student_imports(school_id);
CREATE INDEX IF NOT EXISTS student_imports_created_idx ON student_imports(created_at);
