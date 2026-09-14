BEGIN;

CREATE TABLE IF NOT EXISTS public.class_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  class_level_id UUID NOT NULL
    REFERENCES public.class_levels(id)
    ON DELETE CASCADE,

  subject_id UUID NOT NULL
    REFERENCES public.subjects(id)
    ON DELETE CASCADE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT class_subjects_unique_class_subject
    UNIQUE (class_level_id, subject_id)
);

CREATE INDEX IF NOT EXISTS class_subjects_class_idx
  ON public.class_subjects(class_level_id);

CREATE INDEX IF NOT EXISTS class_subjects_subject_idx
  ON public.class_subjects(subject_id);

COMMIT;