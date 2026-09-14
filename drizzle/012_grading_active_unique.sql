BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS
grading_schemes_one_active_per_school_idx
ON public.grading_schemes (school_id)
WHERE status = 'active';

COMMIT;