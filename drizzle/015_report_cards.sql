BEGIN;

-- ============================================================
-- 015 REPORT CARDS
-- ============================================================
-- One report card belongs to one published result publication
-- and one published student snapshot.
--
-- Academic data remains immutable in:
--   result_publications
--   result_publication_students
--   result_publication_subjects
--   result_publication_assessments
--
-- This table stores the administrative/report-card workflow only.
-- ============================================================

CREATE TYPE report_card_status AS ENUM (
  'draft',
  'teacher_review',
  'headteacher_review',
  'approved'
);

CREATE TYPE promotion_status AS ENUM (
  'pending',
  'promoted',
  'promoted_with_conditions',
  'repeated',
  'withdrawn',
  'transferred'
);

CREATE TABLE public.report_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  school_id UUID NOT NULL
    REFERENCES public.schools(id)
    ON DELETE CASCADE,

  publication_id UUID NOT NULL
    REFERENCES public.result_publications(id)
    ON DELETE CASCADE,

  publication_student_id UUID NOT NULL
    REFERENCES public.result_publication_students(id)
    ON DELETE CASCADE,

  status report_card_status NOT NULL DEFAULT 'draft',

  class_teacher_remark TEXT,
  headteacher_remark TEXT,

  promotion_status promotion_status
    NOT NULL DEFAULT 'pending',

  class_teacher_signed_at TIMESTAMPTZ,
  headteacher_signed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ
    NOT NULL DEFAULT now(),

  updated_at TIMESTAMPTZ
    NOT NULL DEFAULT now(),

  CONSTRAINT report_cards_publication_student_unique
    UNIQUE (
      publication_id,
      publication_student_id
    ),

  CONSTRAINT report_cards_class_teacher_signoff_check
    CHECK (
      (
        status IN (
          'draft',
          'teacher_review'
        )
        AND class_teacher_signed_at IS NULL
      )
      OR
      (
        status IN (
          'headteacher_review',
          'approved'
        )
        AND class_teacher_signed_at IS NOT NULL
      )
    ),

  CONSTRAINT report_cards_headteacher_signoff_check
    CHECK (
      (
        status <> 'approved'
        AND headteacher_signed_at IS NULL
      )
      OR
      (
        status = 'approved'
        AND headteacher_signed_at IS NOT NULL
      )
    )
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX report_cards_school_idx
  ON public.report_cards (school_id);

CREATE INDEX report_cards_publication_idx
  ON public.report_cards (publication_id);

CREATE INDEX report_cards_publication_student_idx
  ON public.report_cards (publication_student_id);

CREATE INDEX report_cards_status_idx
  ON public.report_cards (status);

CREATE INDEX report_cards_school_status_idx
  ON public.report_cards (
    school_id,
    status
  );

CREATE INDEX report_cards_publication_status_idx
  ON public.report_cards (
    publication_id,
    status
  );

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_report_cards_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER report_cards_updated_at
BEFORE UPDATE ON public.report_cards
FOR EACH ROW
EXECUTE FUNCTION public.set_report_cards_updated_at();

COMMIT;