BEGIN;

-- ============================================================
-- 014 RESULT PUBLICATION SUBJECT POSITION
-- ============================================================
-- Stores the student's position within each subject at the
-- point results are published.
--
-- This is intentionally stored in the publication snapshot so
-- published reports do not change if scores or rankings are
-- later recalculated.
-- ============================================================

ALTER TABLE public.result_publication_subjects
ADD COLUMN IF NOT EXISTS position INTEGER;

CREATE INDEX IF NOT EXISTS
result_publication_subjects_position_idx
ON public.result_publication_subjects (position);

COMMIT;