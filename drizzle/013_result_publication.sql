BEGIN;

-- ============================================================
-- 013 RESULT PUBLICATION
-- ============================================================
-- A published result is a historical snapshot.
--
-- Changing the active grading scheme later must NOT change
-- previously published results.
-- ============================================================


-- ============================================================
-- RESULT PUBLICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.result_publications (
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

  stream_id UUID NOT NULL
    REFERENCES public.streams(id)
    ON DELETE CASCADE,

  grading_scheme_id UUID
    REFERENCES public.grading_schemes(id)
    ON DELETE SET NULL,

  status VARCHAR(20) NOT NULL DEFAULT 'draft',

  published_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT result_publications_status_check
    CHECK (
      status IN (
        'draft',
        'ready',
        'published',
        'archived'
      )
    ),

  CONSTRAINT result_publications_published_at_check
    CHECK (
      (
        status = 'published'
        AND published_at IS NOT NULL
      )
      OR
      status <> 'published'
    ),

  CONSTRAINT result_publications_unique_scope
    UNIQUE (
      school_id,
      academic_year_id,
      term_id,
      stream_id
    )
);


CREATE INDEX IF NOT EXISTS
result_publications_school_idx
ON public.result_publications (school_id);


CREATE INDEX IF NOT EXISTS
result_publications_year_idx
ON public.result_publications (academic_year_id);


CREATE INDEX IF NOT EXISTS
result_publications_term_idx
ON public.result_publications (term_id);


CREATE INDEX IF NOT EXISTS
result_publications_stream_idx
ON public.result_publications (stream_id);


CREATE INDEX IF NOT EXISTS
result_publications_status_idx
ON public.result_publications (status);


-- ============================================================
-- RESULT PUBLICATION STUDENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.result_publication_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  publication_id UUID NOT NULL
    REFERENCES public.result_publications(id)
    ON DELETE CASCADE,

  student_id UUID NOT NULL
    REFERENCES public.students(id)
    ON DELETE CASCADE,

  student_number TEXT NOT NULL,

  first_name TEXT NOT NULL,

  middle_name TEXT,

  last_name TEXT NOT NULL,

  overall_percentage NUMERIC(8,2) NOT NULL,

  position INTEGER NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT result_publication_students_unique
    UNIQUE (
      publication_id,
      student_id
    ),

  CONSTRAINT result_publication_students_percentage_check
    CHECK (
      overall_percentage >= 0
      AND overall_percentage <= 100
    ),

  CONSTRAINT result_publication_students_position_check
    CHECK (
      position > 0
    )
);


CREATE INDEX IF NOT EXISTS
result_publication_students_publication_idx
ON public.result_publication_students (
  publication_id
);


CREATE INDEX IF NOT EXISTS
result_publication_students_student_idx
ON public.result_publication_students (
  student_id
);


-- ============================================================
-- RESULT PUBLICATION SUBJECTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.result_publication_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  publication_student_id UUID NOT NULL
    REFERENCES public.result_publication_students(id)
    ON DELETE CASCADE,

  subject_id UUID NOT NULL
    REFERENCES public.subjects(id)
    ON DELETE RESTRICT,

  subject_name TEXT NOT NULL,

  class_score NUMERIC(8,2) NOT NULL,

  examination_score NUMERIC(8,2) NOT NULL,

  final_percentage NUMERIC(8,2) NOT NULL,

  grade TEXT,

  label TEXT,

  remark TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT result_publication_subjects_unique
    UNIQUE (
      publication_student_id,
      subject_id
    ),

  CONSTRAINT result_publication_subjects_class_score_check
    CHECK (
      class_score >= 0
      AND class_score <= 50
    ),

  CONSTRAINT result_publication_subjects_exam_score_check
    CHECK (
      examination_score >= 0
      AND examination_score <= 50
    ),

  CONSTRAINT result_publication_subjects_final_check
    CHECK (
      final_percentage >= 0
      AND final_percentage <= 100
    )
);


CREATE INDEX IF NOT EXISTS
result_publication_subjects_student_idx
ON public.result_publication_subjects (
  publication_student_id
);


CREATE INDEX IF NOT EXISTS
result_publication_subjects_subject_idx
ON public.result_publication_subjects (
  subject_id
);


-- ============================================================
-- RESULT PUBLICATION ASSESSMENTS
-- ============================================================
-- This preserves the raw assessment breakdown used to produce
-- the published subject result.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.result_publication_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  publication_subject_id UUID NOT NULL
    REFERENCES public.result_publication_subjects(id)
    ON DELETE CASCADE,

  assessment_id UUID
    REFERENCES public.assessments(id)
    ON DELETE SET NULL,

  assessment_name TEXT NOT NULL,

  assessment_type_name TEXT NOT NULL,

  category VARCHAR(30) NOT NULL,

  score NUMERIC(8,2) NOT NULL,

  max_score NUMERIC(8,2) NOT NULL,

  percentage NUMERIC(8,2) NOT NULL,

  weight_percent NUMERIC(8,2) NOT NULL,

  weighted_contribution NUMERIC(8,2) NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT result_publication_assessments_category_check
    CHECK (
      category IN (
        'continuous_assessment',
        'examination'
      )
    ),

  CONSTRAINT result_publication_assessments_score_check
    CHECK (
      score >= 0
      AND score <= max_score
    ),

  CONSTRAINT result_publication_assessments_max_score_check
    CHECK (
      max_score > 0
    ),

  CONSTRAINT result_publication_assessments_percentage_check
    CHECK (
      percentage >= 0
      AND percentage <= 100
    ),

  CONSTRAINT result_publication_assessments_weight_check
    CHECK (
      weight_percent > 0
      AND weight_percent <= 100
    ),

  CONSTRAINT result_publication_assessments_contribution_check
    CHECK (
      weighted_contribution >= 0
      AND weighted_contribution <= 100
    )
);


CREATE INDEX IF NOT EXISTS
result_publication_assessments_subject_idx
ON public.result_publication_assessments (
  publication_subject_id
);


CREATE INDEX IF NOT EXISTS
result_publication_assessments_assessment_idx
ON public.result_publication_assessments (
  assessment_id
);


-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS
result_publications_updated_at
ON public.result_publications;

CREATE TRIGGER
result_publications_updated_at
BEFORE UPDATE ON public.result_publications
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


COMMIT;