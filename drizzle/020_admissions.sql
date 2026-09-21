BEGIN;

DO $$ BEGIN
  CREATE TYPE public.applicant_status AS ENUM ('submitted', 'under_review', 'accepted', 'rejected', 'converted');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.applicants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  application_number varchar(50) NOT NULL,
  first_name varchar(100) NOT NULL,
  middle_name varchar(100),
  last_name varchar(100) NOT NULL,
  gender public.gender,
  date_of_birth date,
  guardian_name varchar(200) NOT NULL,
  guardian_phone varchar(30) NOT NULL,
  guardian_email varchar(255),
  requested_grade varchar(100),
  notes text,
  status public.applicant_status DEFAULT 'submitted' NOT NULL,
  decision_notes text,
  converted_student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  submitted_at timestamptz DEFAULT now() NOT NULL,
  reviewed_at timestamptz,
  decided_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT applicants_school_number_unique UNIQUE (school_id, application_number)
);
CREATE INDEX IF NOT EXISTS applicants_school_idx ON public.applicants(school_id);
CREATE INDEX IF NOT EXISTS applicants_status_idx ON public.applicants(status);
COMMIT;
