BEGIN;

-- ============================================================
-- ASSESSMENTS & EXAMS
-- 010_assessments.sql
--
-- Source of truth:
-- src/db/schema.ts
-- ============================================================


-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE assessment_type_category AS ENUM (
  'continuous_assessment',
  'examination'
);

CREATE TYPE assessment_period_status AS ENUM (
  'draft',
  'open',
  'closed',
  'published',
  'archived'
);

CREATE TYPE assessment_status AS ENUM (
  'draft',
  'open',
  'closed',
  'published',
  'archived'
);


-- ============================================================
-- ASSESSMENT TYPES
-- ============================================================

CREATE TABLE public.assessment_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  school_id UUID NOT NULL
    REFERENCES public.schools(id)
    ON DELETE CASCADE,

  name VARCHAR(100) NOT NULL,

  code VARCHAR(50),

  category assessment_type_category NOT NULL
    DEFAULT 'continuous_assessment',

  description TEXT,

  created_at TIMESTAMPTZ NOT NULL
    DEFAULT NOW(),

  updated_at TIMESTAMPTZ NOT NULL
    DEFAULT NOW(),

  CONSTRAINT assessment_types_school_name_unique
    UNIQUE (
      school_id,
      name
    ),

  CONSTRAINT assessment_types_school_code_unique
    UNIQUE (
      school_id,
      code
    )
);

CREATE INDEX assessment_types_school_idx
  ON public.assessment_types(school_id);

CREATE INDEX assessment_types_category_idx
  ON public.assessment_types(category);


-- ============================================================
-- ASSESSMENT PERIODS
-- ============================================================

CREATE TABLE public.assessment_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  school_id UUID NOT NULL
    REFERENCES public.schools(id)
    ON DELETE CASCADE,

  academic_year_id UUID NOT NULL
    REFERENCES public.academic_years(id)
    ON DELETE CASCADE,

  term_id UUID NOT NULL
    REFERENCES public.terms(id)
    ON DELETE CASCADE,

  name VARCHAR(150) NOT NULL,

  description TEXT,

  start_date DATE,

  end_date DATE,

  status assessment_period_status NOT NULL
    DEFAULT 'draft',

  created_at TIMESTAMPTZ NOT NULL
    DEFAULT NOW(),

  updated_at TIMESTAMPTZ NOT NULL
    DEFAULT NOW(),

  CONSTRAINT assessment_periods_school_name_unique
    UNIQUE (
      school_id,
      academic_year_id,
      term_id,
      name
    )
);

CREATE INDEX assessment_periods_school_idx
  ON public.assessment_periods(school_id);

CREATE INDEX assessment_periods_year_idx
  ON public.assessment_periods(academic_year_id);

CREATE INDEX assessment_periods_term_idx
  ON public.assessment_periods(term_id);

CREATE INDEX assessment_periods_status_idx
  ON public.assessment_periods(status);


-- ============================================================
-- ASSESSMENTS
-- ============================================================

CREATE TABLE public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  school_id UUID NOT NULL
    REFERENCES public.schools(id)
    ON DELETE CASCADE,

  academic_year_id UUID NOT NULL
    REFERENCES public.academic_years(id)
    ON DELETE CASCADE,

  term_id UUID NOT NULL
    REFERENCES public.terms(id)
    ON DELETE CASCADE,

  assessment_period_id UUID NOT NULL
    REFERENCES public.assessment_periods(id)
    ON DELETE CASCADE,

  stream_id UUID NOT NULL
    REFERENCES public.streams(id)
    ON DELETE CASCADE,

  subject_id UUID NOT NULL
    REFERENCES public.subjects(id)
    ON DELETE RESTRICT,

  assessment_type_id UUID NOT NULL
    REFERENCES public.assessment_types(id)
    ON DELETE RESTRICT,

  name VARCHAR(200) NOT NULL,

  max_score NUMERIC(8,2) NOT NULL,

  assessment_date DATE,

  status assessment_status NOT NULL
    DEFAULT 'draft',

  instructions TEXT,

  created_at TIMESTAMPTZ NOT NULL
    DEFAULT NOW(),

  updated_at TIMESTAMPTZ NOT NULL
    DEFAULT NOW()
);

CREATE INDEX assessments_school_idx
  ON public.assessments(school_id);

CREATE INDEX assessments_year_idx
  ON public.assessments(academic_year_id);

CREATE INDEX assessments_term_idx
  ON public.assessments(term_id);

CREATE INDEX assessments_period_idx
  ON public.assessments(assessment_period_id);

CREATE INDEX assessments_stream_idx
  ON public.assessments(stream_id);

CREATE INDEX assessments_subject_idx
  ON public.assessments(subject_id);

CREATE INDEX assessments_type_idx
  ON public.assessments(assessment_type_id);

CREATE INDEX assessments_status_idx
  ON public.assessments(status);


-- ============================================================
-- ASSESSMENT SCORES
-- ============================================================

CREATE TABLE public.assessment_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  assessment_id UUID NOT NULL
    REFERENCES public.assessments(id)
    ON DELETE CASCADE,

  student_id UUID NOT NULL
    REFERENCES public.students(id)
    ON DELETE CASCADE,

  score NUMERIC(8,2) NOT NULL,

  comment TEXT,

  created_at TIMESTAMPTZ NOT NULL
    DEFAULT NOW(),

  updated_at TIMESTAMPTZ NOT NULL
    DEFAULT NOW(),

  CONSTRAINT assessment_scores_unique_student
    UNIQUE (
      assessment_id,
      student_id
    )
);

CREATE INDEX assessment_scores_assessment_idx
  ON public.assessment_scores(assessment_id);

CREATE INDEX assessment_scores_student_idx
  ON public.assessment_scores(student_id);


COMMIT;