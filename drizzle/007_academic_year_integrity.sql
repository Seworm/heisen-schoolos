BEGIN;

-- Only one current academic year per school.
CREATE UNIQUE INDEX IF NOT EXISTS
  academic_years_one_current_per_school_idx
ON public.academic_years (
  school_id
)
WHERE is_current = true;

-- Only one current term per academic year.
CREATE UNIQUE INDEX IF NOT EXISTS
  terms_one_current_per_year_idx
ON public.terms (
  academic_year_id
)
WHERE is_current = true;

COMMIT;