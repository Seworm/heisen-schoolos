BEGIN;

-- =========================================================
-- HEISEN SCHOOLOS
-- 019_reconcile_platform_foundation.sql
--
-- Purpose:
-- Reconcile the Neon database with the application's
-- platform/foundation schema without recreating existing
-- tables.
--
-- Existing tables are intentionally NOT recreated:
--   report_cards
--   result_publication_assessments
--   result_publication_students
--   result_publication_subjects
--   result_publications
--   school_memberships
--   student_user_accounts
--   users
-- =========================================================


-- =========================================================
-- 1. CORE PLATFORM TABLES
-- =========================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  auth_user_id text NOT NULL,
  email varchar(255) NOT NULL,
  first_name varchar(100) NOT NULL,
  last_name varchar(100) NOT NULL,
  phone varchar(30),
  photo_url text,
  status public.user_status DEFAULT 'active' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT profiles_auth_user_id_unique UNIQUE (auth_user_id)
);

CREATE TABLE IF NOT EXISTS public.school_settings (
  school_id uuid PRIMARY KEY NOT NULL,
  currency varchar(3) DEFAULT 'GHS' NOT NULL,
  timezone varchar(64) DEFAULT 'Africa/Accra' NOT NULL,
  enable_ranking boolean DEFAULT true NOT NULL,
  enable_subject_ranking boolean DEFAULT false NOT NULL,
  allow_overpayment boolean DEFAULT false NOT NULL,
  next_term_reopening_date date,
  logo_url text,
  report_card_footer text,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  school_id uuid NOT NULL,
  author_id text NOT NULL,
  title varchar(200) NOT NULL,
  body text NOT NULL,
  audience public.announcement_audience NOT NULL,
  target_id uuid,
  published_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  school_id uuid NOT NULL,
  recipient_auth_user_id text NOT NULL,
  title varchar(200) NOT NULL,
  body text NOT NULL,
  type varchar(50) NOT NULL,
  read_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.internal_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  school_id uuid NOT NULL,
  sender_auth_user_id text NOT NULL,
  recipient_auth_user_id text NOT NULL,
  subject varchar(200) NOT NULL,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  school_id uuid,
  actor_auth_user_id text,
  action varchar(100) NOT NULL,
  entity varchar(100) NOT NULL,
  entity_id text,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  ip_address varchar(64),
  user_agent text,
  created_at timestamptz DEFAULT now() NOT NULL
);


-- =========================================================
-- 2. CLASSROOMS / TIMETABLE
-- =========================================================

CREATE TABLE IF NOT EXISTS public.classrooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  school_id uuid NOT NULL,
  name varchar(100) NOT NULL,
  capacity integer,
  location varchar(150),
  active boolean DEFAULT true NOT NULL,
  CONSTRAINT classrooms_school_name_unique
    UNIQUE (school_id, name)
);

CREATE TABLE IF NOT EXISTS public.timetable_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  school_id uuid NOT NULL,
  name varchar(80) NOT NULL,
  day_of_week integer NOT NULL,
  starts_at varchar(5) NOT NULL,
  ends_at varchar(5) NOT NULL,
  sort_order integer NOT NULL,
  CONSTRAINT timetable_period_unique
    UNIQUE (school_id, day_of_week, sort_order)
);

CREATE TABLE IF NOT EXISTS public.timetable_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  school_id uuid NOT NULL,
  academic_year_id uuid NOT NULL,
  term_id uuid NOT NULL,
  stream_id uuid NOT NULL,
  subject_id uuid NOT NULL,
  staff_id uuid NOT NULL,
  period_id uuid NOT NULL,
  classroom_id uuid,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT timetable_class_period_unique
    UNIQUE (stream_id, period_id),
  CONSTRAINT timetable_teacher_period_unique
    UNIQUE (staff_id, period_id),
  CONSTRAINT timetable_room_period_unique
    UNIQUE (classroom_id, period_id)
);


-- =========================================================
-- 3. FEES
-- =========================================================

CREATE TABLE IF NOT EXISTS public.fee_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  school_id uuid NOT NULL,
  name varchar(100) NOT NULL,
  description text,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT fee_categories_school_name_unique
    UNIQUE (school_id, name)
);

CREATE TABLE IF NOT EXISTS public.fee_structures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  school_id uuid NOT NULL,
  academic_year_id uuid NOT NULL,
  term_id uuid NOT NULL,
  class_level_id uuid NOT NULL,
  name varchar(150) NOT NULL,
  description text,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT fee_structures_scope_name_unique
    UNIQUE (
      school_id,
      academic_year_id,
      term_id,
      class_level_id,
      name
    )
);

CREATE TABLE IF NOT EXISTS public.fee_structure_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  fee_structure_id uuid NOT NULL,
  fee_category_id uuid NOT NULL,
  amount numeric(12, 2) NOT NULL,
  description text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT fee_structure_items_unique
    UNIQUE (fee_structure_id, fee_category_id)
);

CREATE TABLE IF NOT EXISTS public.fee_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  school_id uuid NOT NULL,
  student_id uuid NOT NULL,
  fee_structure_id uuid NOT NULL,
  academic_year_id uuid NOT NULL,
  term_id uuid NOT NULL,
  status varchar(30) DEFAULT 'active' NOT NULL,
  assigned_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT fee_assignments_unique
    UNIQUE (student_id, fee_structure_id, term_id)
);


-- =========================================================
-- 4. SCHOLARSHIPS
-- =========================================================

CREATE TABLE IF NOT EXISTS public.scholarships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  school_id uuid NOT NULL,
  name varchar(150) NOT NULL,
  percentage numeric(5, 2) NOT NULL,
  max_amount numeric(12, 2),
  active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT scholarships_school_name_unique
    UNIQUE (school_id, name)
);

CREATE TABLE IF NOT EXISTS public.student_scholarships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  school_id uuid NOT NULL,
  student_id uuid NOT NULL,
  scholarship_id uuid NOT NULL,
  academic_year_id uuid NOT NULL,
  term_id uuid NOT NULL,
  amount numeric(12, 2),
  created_at timestamptz DEFAULT now() NOT NULL
);


-- =========================================================
-- 5. STUDENT STATUS / DOCUMENTS / IMPORTS
-- =========================================================

CREATE TABLE IF NOT EXISTS public.student_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  school_id uuid NOT NULL,
  student_id uuid NOT NULL,
  status varchar(40) NOT NULL,
  effective_date date NOT NULL,
  reason text,
  actor_id text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.student_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  school_id uuid NOT NULL,
  student_id uuid NOT NULL,
  name varchar(200) NOT NULL,
  document_type varchar(80) NOT NULL,
  storage_key text NOT NULL,
  mime_type varchar(120),
  size_bytes integer,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.staff_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  school_id uuid NOT NULL,
  staff_id uuid NOT NULL,
  name varchar(200) NOT NULL,
  document_type varchar(80) NOT NULL,
  storage_key text NOT NULL,
  mime_type varchar(120),
  size_bytes integer,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.student_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  school_id uuid NOT NULL,
  created_by text NOT NULL,
  filename varchar(255) NOT NULL,
  total_rows integer NOT NULL,
  valid_rows integer NOT NULL,
  invalid_rows integer NOT NULL,
  errors jsonb DEFAULT '[]'::jsonb NOT NULL,
  status varchar(30) DEFAULT 'completed' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);


-- =========================================================
-- 6. INVOICING
-- =========================================================

CREATE TABLE IF NOT EXISTS public.student_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  school_id uuid NOT NULL,
  student_id uuid NOT NULL,
  academic_year_id uuid NOT NULL,
  term_id uuid NOT NULL,
  invoice_number varchar(50) NOT NULL,
  issue_date date NOT NULL,
  due_date date,
  status public.invoice_status DEFAULT 'draft' NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT student_invoices_school_number_unique
    UNIQUE (school_id, invoice_number)
);

CREATE TABLE IF NOT EXISTS public.student_invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  invoice_id uuid NOT NULL,
  fee_category_id uuid NOT NULL,
  description varchar(255) NOT NULL,
  amount numeric(12, 2) NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.invoice_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  invoice_id uuid NOT NULL,
  type public.adjustment_type NOT NULL,
  amount numeric(12, 2) NOT NULL,
  reason text NOT NULL,
  status public.adjustment_status DEFAULT 'active' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);


-- =========================================================
-- 7. PAYMENTS
-- =========================================================

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  school_id uuid NOT NULL,
  student_id uuid NOT NULL,
  receipt_number varchar(50) NOT NULL,
  payment_date date NOT NULL,
  amount numeric(12, 2) NOT NULL,
  method public.payment_method NOT NULL,
  reference varchar(150),
  status public.payment_status DEFAULT 'posted' NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT payments_school_receipt_unique
    UNIQUE (school_id, receipt_number)
);

CREATE TABLE IF NOT EXISTS public.payment_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  payment_id uuid NOT NULL,
  invoice_id uuid NOT NULL,
  amount numeric(12, 2) NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT payment_allocations_unique
    UNIQUE (payment_id, invoice_id)
);


-- =========================================================
-- 8. PROMOTION
-- =========================================================

CREATE TABLE IF NOT EXISTS public.promotion_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  school_id uuid NOT NULL,
  student_id uuid NOT NULL,
  from_enrollment_id uuid NOT NULL,
  to_enrollment_id uuid,
  status public.promotion_status DEFAULT 'pending' NOT NULL,
  decision_date date NOT NULL,
  reason text,
  actor_id text,
  created_at timestamptz DEFAULT now() NOT NULL
);


-- =========================================================
-- 9. FOREIGN KEYS
-- =========================================================

-- Core platform

ALTER TABLE public.announcements
  ADD CONSTRAINT announcements_school_id_schools_id_fk
  FOREIGN KEY (school_id)
  REFERENCES public.schools(id)
  ON DELETE CASCADE;

ALTER TABLE public.audit_logs
  ADD CONSTRAINT audit_logs_school_id_schools_id_fk
  FOREIGN KEY (school_id)
  REFERENCES public.schools(id)
  ON DELETE CASCADE;

ALTER TABLE public.classrooms
  ADD CONSTRAINT classrooms_school_id_schools_id_fk
  FOREIGN KEY (school_id)
  REFERENCES public.schools(id)
  ON DELETE CASCADE;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_school_id_schools_id_fk
  FOREIGN KEY (school_id)
  REFERENCES public.schools(id)
  ON DELETE CASCADE;

ALTER TABLE public.internal_messages
  ADD CONSTRAINT internal_messages_school_id_schools_id_fk
  FOREIGN KEY (school_id)
  REFERENCES public.schools(id)
  ON DELETE CASCADE;

ALTER TABLE public.school_settings
  ADD CONSTRAINT school_settings_school_id_schools_id_fk
  FOREIGN KEY (school_id)
  REFERENCES public.schools(id)
  ON DELETE CASCADE;


-- Fees

ALTER TABLE public.fee_categories
  ADD CONSTRAINT fee_categories_school_id_schools_id_fk
  FOREIGN KEY (school_id)
  REFERENCES public.schools(id)
  ON DELETE CASCADE;

ALTER TABLE public.fee_structures
  ADD CONSTRAINT fee_structures_school_id_schools_id_fk
  FOREIGN KEY (school_id)
  REFERENCES public.schools(id)
  ON DELETE CASCADE;

ALTER TABLE public.fee_structures
  ADD CONSTRAINT fee_structures_academic_year_id_academic_years_id_fk
  FOREIGN KEY (academic_year_id)
  REFERENCES public.academic_years(id)
  ON DELETE CASCADE;

ALTER TABLE public.fee_structures
  ADD CONSTRAINT fee_structures_term_id_terms_id_fk
  FOREIGN KEY (term_id)
  REFERENCES public.terms(id)
  ON DELETE CASCADE;

ALTER TABLE public.fee_structures
  ADD CONSTRAINT fee_structures_class_level_id_class_levels_id_fk
  FOREIGN KEY (class_level_id)
  REFERENCES public.class_levels(id)
  ON DELETE CASCADE;

ALTER TABLE public.fee_structure_items
  ADD CONSTRAINT fee_structure_items_fee_structure_id_fee_structures_id_fk
  FOREIGN KEY (fee_structure_id)
  REFERENCES public.fee_structures(id)
  ON DELETE CASCADE;

ALTER TABLE public.fee_structure_items
  ADD CONSTRAINT fee_structure_items_fee_category_id_fee_categories_id_fk
  FOREIGN KEY (fee_category_id)
  REFERENCES public.fee_categories(id)
  ON DELETE RESTRICT;

ALTER TABLE public.fee_assignments
  ADD CONSTRAINT fee_assignments_school_id_schools_id_fk
  FOREIGN KEY (school_id)
  REFERENCES public.schools(id)
  ON DELETE CASCADE;

ALTER TABLE public.fee_assignments
  ADD CONSTRAINT fee_assignments_student_id_students_id_fk
  FOREIGN KEY (student_id)
  REFERENCES public.students(id)
  ON DELETE RESTRICT;

ALTER TABLE public.fee_assignments
  ADD CONSTRAINT fee_assignments_fee_structure_id_fee_structures_id_fk
  FOREIGN KEY (fee_structure_id)
  REFERENCES public.fee_structures(id)
  ON DELETE RESTRICT;

ALTER TABLE public.fee_assignments
  ADD CONSTRAINT fee_assignments_academic_year_id_academic_years_id_fk
  FOREIGN KEY (academic_year_id)
  REFERENCES public.academic_years(id)
  ON DELETE RESTRICT;

ALTER TABLE public.fee_assignments
  ADD CONSTRAINT fee_assignments_term_id_terms_id_fk
  FOREIGN KEY (term_id)
  REFERENCES public.terms(id)
  ON DELETE RESTRICT;


-- Scholarships

ALTER TABLE public.scholarships
  ADD CONSTRAINT scholarships_school_id_schools_id_fk
  FOREIGN KEY (school_id)
  REFERENCES public.schools(id)
  ON DELETE CASCADE;

ALTER TABLE public.student_scholarships
  ADD CONSTRAINT student_scholarships_school_id_schools_id_fk
  FOREIGN KEY (school_id)
  REFERENCES public.schools(id)
  ON DELETE CASCADE;

ALTER TABLE public.student_scholarships
  ADD CONSTRAINT student_scholarships_student_id_students_id_fk
  FOREIGN KEY (student_id)
  REFERENCES public.students(id)
  ON DELETE RESTRICT;

ALTER TABLE public.student_scholarships
  ADD CONSTRAINT student_scholarships_scholarship_id_scholarships_id_fk
  FOREIGN KEY (scholarship_id)
  REFERENCES public.scholarships(id)
  ON DELETE RESTRICT;

ALTER TABLE public.student_scholarships
  ADD CONSTRAINT student_scholarships_academic_year_id_academic_years_id_fk
  FOREIGN KEY (academic_year_id)
  REFERENCES public.academic_years(id)
  ON DELETE RESTRICT;

ALTER TABLE public.student_scholarships
  ADD CONSTRAINT student_scholarships_term_id_terms_id_fk
  FOREIGN KEY (term_id)
  REFERENCES public.terms(id)
  ON DELETE RESTRICT;


-- Student records

ALTER TABLE public.student_status_history
  ADD CONSTRAINT student_status_history_school_id_schools_id_fk
  FOREIGN KEY (school_id)
  REFERENCES public.schools(id)
  ON DELETE CASCADE;

ALTER TABLE public.student_status_history
  ADD CONSTRAINT student_status_history_student_id_students_id_fk
  FOREIGN KEY (student_id)
  REFERENCES public.students(id)
  ON DELETE CASCADE;

ALTER TABLE public.student_documents
  ADD CONSTRAINT student_documents_school_id_schools_id_fk
  FOREIGN KEY (school_id)
  REFERENCES public.schools(id)
  ON DELETE CASCADE;

ALTER TABLE public.student_documents
  ADD CONSTRAINT student_documents_student_id_students_id_fk
  FOREIGN KEY (student_id)
  REFERENCES public.students(id)
  ON DELETE CASCADE;

ALTER TABLE public.staff_documents
  ADD CONSTRAINT staff_documents_school_id_schools_id_fk
  FOREIGN KEY (school_id)
  REFERENCES public.schools(id)
  ON DELETE CASCADE;

ALTER TABLE public.staff_documents
  ADD CONSTRAINT staff_documents_staff_id_staff_id_fk
  FOREIGN KEY (staff_id)
  REFERENCES public.staff(id)
  ON DELETE CASCADE;

ALTER TABLE public.student_imports
  ADD CONSTRAINT student_imports_school_id_schools_id_fk
  FOREIGN KEY (school_id)
  REFERENCES public.schools(id)
  ON DELETE CASCADE;


-- Invoices

ALTER TABLE public.student_invoices
  ADD CONSTRAINT student_invoices_school_id_schools_id_fk
  FOREIGN KEY (school_id)
  REFERENCES public.schools(id)
  ON DELETE CASCADE;

ALTER TABLE public.student_invoices
  ADD CONSTRAINT student_invoices_student_id_students_id_fk
  FOREIGN KEY (student_id)
  REFERENCES public.students(id)
  ON DELETE RESTRICT;

ALTER TABLE public.student_invoices
  ADD CONSTRAINT student_invoices_academic_year_id_academic_years_id_fk
  FOREIGN KEY (academic_year_id)
  REFERENCES public.academic_years(id)
  ON DELETE RESTRICT;

ALTER TABLE public.student_invoices
  ADD CONSTRAINT student_invoices_term_id_terms_id_fk
  FOREIGN KEY (term_id)
  REFERENCES public.terms(id)
  ON DELETE RESTRICT;

ALTER TABLE public.student_invoice_items
  ADD CONSTRAINT student_invoice_items_invoice_id_student_invoices_id_fk
  FOREIGN KEY (invoice_id)
  REFERENCES public.student_invoices(id)
  ON DELETE CASCADE;

ALTER TABLE public.student_invoice_items
  ADD CONSTRAINT student_invoice_items_fee_category_id_fee_categories_id_fk
  FOREIGN KEY (fee_category_id)
  REFERENCES public.fee_categories(id)
  ON DELETE RESTRICT;

ALTER TABLE public.invoice_adjustments
  ADD CONSTRAINT invoice_adjustments_invoice_id_student_invoices_id_fk
  FOREIGN KEY (invoice_id)
  REFERENCES public.student_invoices(id)
  ON DELETE CASCADE;


-- Payments

ALTER TABLE public.payments
  ADD CONSTRAINT payments_school_id_schools_id_fk
  FOREIGN KEY (school_id)
  REFERENCES public.schools(id)
  ON DELETE CASCADE;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_student_id_students_id_fk
  FOREIGN KEY (student_id)
  REFERENCES public.students(id)
  ON DELETE RESTRICT;

ALTER TABLE public.payment_allocations
  ADD CONSTRAINT payment_allocations_payment_id_payments_id_fk
  FOREIGN KEY (payment_id)
  REFERENCES public.payments(id)
  ON DELETE RESTRICT;

ALTER TABLE public.payment_allocations
  ADD CONSTRAINT payment_allocations_invoice_id_student_invoices_id_fk
  FOREIGN KEY (invoice_id)
  REFERENCES public.student_invoices(id)
  ON DELETE RESTRICT;


-- Promotion

ALTER TABLE public.promotion_decisions
  ADD CONSTRAINT promotion_decisions_school_id_schools_id_fk
  FOREIGN KEY (school_id)
  REFERENCES public.schools(id)
  ON DELETE CASCADE;

ALTER TABLE public.promotion_decisions
  ADD CONSTRAINT promotion_decisions_student_id_students_id_fk
  FOREIGN KEY (student_id)
  REFERENCES public.students(id)
  ON DELETE RESTRICT;

ALTER TABLE public.promotion_decisions
  ADD CONSTRAINT promotion_decisions_from_enrollment_id_student_enrollments_id_fk
  FOREIGN KEY (from_enrollment_id)
  REFERENCES public.student_enrollments(id)
  ON DELETE RESTRICT;

ALTER TABLE public.promotion_decisions
  ADD CONSTRAINT promotion_decisions_to_enrollment_id_student_enrollments_id_fk
  FOREIGN KEY (to_enrollment_id)
  REFERENCES public.student_enrollments(id)
  ON DELETE RESTRICT;


-- Timetable

ALTER TABLE public.timetable_periods
  ADD CONSTRAINT timetable_periods_school_id_schools_id_fk
  FOREIGN KEY (school_id)
  REFERENCES public.schools(id)
  ON DELETE CASCADE;

ALTER TABLE public.timetable_entries
  ADD CONSTRAINT timetable_entries_school_id_schools_id_fk
  FOREIGN KEY (school_id)
  REFERENCES public.schools(id)
  ON DELETE CASCADE;

ALTER TABLE public.timetable_entries
  ADD CONSTRAINT timetable_entries_academic_year_id_academic_years_id_fk
  FOREIGN KEY (academic_year_id)
  REFERENCES public.academic_years(id)
  ON DELETE RESTRICT;

ALTER TABLE public.timetable_entries
  ADD CONSTRAINT timetable_entries_term_id_terms_id_fk
  FOREIGN KEY (term_id)
  REFERENCES public.terms(id)
  ON DELETE RESTRICT;

ALTER TABLE public.timetable_entries
  ADD CONSTRAINT timetable_entries_stream_id_streams_id_fk
  FOREIGN KEY (stream_id)
  REFERENCES public.streams(id)
  ON DELETE RESTRICT;

ALTER TABLE public.timetable_entries
  ADD CONSTRAINT timetable_entries_subject_id_subjects_id_fk
  FOREIGN KEY (subject_id)
  REFERENCES public.subjects(id)
  ON DELETE RESTRICT;

ALTER TABLE public.timetable_entries
  ADD CONSTRAINT timetable_entries_staff_id_staff_id_fk
  FOREIGN KEY (staff_id)
  REFERENCES public.staff(id)
  ON DELETE RESTRICT;

ALTER TABLE public.timetable_entries
  ADD CONSTRAINT timetable_entries_period_id_timetable_periods_id_fk
  FOREIGN KEY (period_id)
  REFERENCES public.timetable_periods(id)
  ON DELETE CASCADE;

ALTER TABLE public.timetable_entries
  ADD CONSTRAINT timetable_entries_classroom_id_classrooms_id_fk
  FOREIGN KEY (classroom_id)
  REFERENCES public.classrooms(id)
  ON DELETE SET NULL;


-- =========================================================
-- 10. INDEXES
-- =========================================================

CREATE INDEX IF NOT EXISTS announcements_school_idx
  ON public.announcements(school_id);

CREATE INDEX IF NOT EXISTS announcements_audience_idx
  ON public.announcements(school_id, audience);

CREATE INDEX IF NOT EXISTS audit_logs_school_created_idx
  ON public.audit_logs(school_id, created_at);

CREATE INDEX IF NOT EXISTS audit_logs_entity_idx
  ON public.audit_logs(entity, entity_id);

CREATE INDEX IF NOT EXISTS notifications_recipient_idx
  ON public.notifications(recipient_auth_user_id, created_at);

CREATE INDEX IF NOT EXISTS internal_messages_recipient_idx
  ON public.internal_messages(recipient_auth_user_id, created_at);

CREATE INDEX IF NOT EXISTS classrooms_school_idx
  ON public.classrooms(school_id);

CREATE INDEX IF NOT EXISTS timetable_periods_school_idx
  ON public.timetable_periods(school_id);

CREATE INDEX IF NOT EXISTS timetable_entries_school_idx
  ON public.timetable_entries(school_id);

CREATE INDEX IF NOT EXISTS timetable_entries_stream_idx
  ON public.timetable_entries(stream_id);

CREATE INDEX IF NOT EXISTS timetable_entries_staff_idx
  ON public.timetable_entries(staff_id);

CREATE INDEX IF NOT EXISTS fee_categories_school_idx
  ON public.fee_categories(school_id);

CREATE INDEX IF NOT EXISTS fee_structures_school_idx
  ON public.fee_structures(school_id);

CREATE INDEX IF NOT EXISTS fee_structures_class_level_idx
  ON public.fee_structures(class_level_id);

CREATE INDEX IF NOT EXISTS fee_structure_items_structure_idx
  ON public.fee_structure_items(fee_structure_id);

CREATE INDEX IF NOT EXISTS fee_assignments_student_idx
  ON public.fee_assignments(student_id);

CREATE INDEX IF NOT EXISTS fee_assignments_school_idx
  ON public.fee_assignments(school_id);

CREATE INDEX IF NOT EXISTS student_scholarships_student_idx
  ON public.student_scholarships(student_id);

CREATE INDEX IF NOT EXISTS student_status_history_student_idx
  ON public.student_status_history(student_id);

CREATE INDEX IF NOT EXISTS student_documents_student_idx
  ON public.student_documents(student_id);

CREATE INDEX IF NOT EXISTS staff_documents_staff_idx
  ON public.staff_documents(staff_id);

CREATE INDEX IF NOT EXISTS student_imports_school_idx
  ON public.student_imports(school_id);

CREATE INDEX IF NOT EXISTS student_invoices_student_idx
  ON public.student_invoices(student_id);

CREATE INDEX IF NOT EXISTS student_invoices_school_idx
  ON public.student_invoices(school_id);

CREATE INDEX IF NOT EXISTS student_invoice_items_invoice_idx
  ON public.student_invoice_items(invoice_id);

CREATE INDEX IF NOT EXISTS invoice_adjustments_invoice_idx
  ON public.invoice_adjustments(invoice_id);

CREATE INDEX IF NOT EXISTS payments_student_idx
  ON public.payments(student_id);

CREATE INDEX IF NOT EXISTS payments_school_idx
  ON public.payments(school_id);

CREATE INDEX IF NOT EXISTS payment_allocations_payment_idx
  ON public.payment_allocations(payment_id);

CREATE INDEX IF NOT EXISTS payment_allocations_invoice_idx
  ON public.payment_allocations(invoice_id);

CREATE INDEX IF NOT EXISTS promotion_decisions_student_idx
  ON public.promotion_decisions(student_id);

CREATE INDEX IF NOT EXISTS promotion_decisions_school_idx
  ON public.promotion_decisions(school_id);


COMMIT;