BEGIN;

-- ============================================================
-- 006 TEACHER ASSIGNMENT INTEGRITY
-- ============================================================
-- Rules:
--
-- 1. A stream can have only ONE class teacher
--    for a given academic year.
--
-- 2. A teacher cannot be assigned the same subject
--    to the same stream twice in the same academic year.
--
-- 3. A teacher cannot receive the same class-teacher-only
--    assignment twice for the same stream/year.
--
-- These constraints complement the application-level checks.
-- ============================================================


-- ============================================================
-- 1. ONE CLASS TEACHER PER STREAM / ACADEMIC YEAR
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS
  teacher_assignments_one_class_teacher_idx
ON public.teacher_assignments (
  stream_id,
  academic_year_id
)
WHERE is_class_teacher = true;


-- ============================================================
-- 2. PREVENT DUPLICATE SUBJECT ASSIGNMENTS
-- ============================================================
-- subject_id is non-null for subject assignments.

CREATE UNIQUE INDEX IF NOT EXISTS
  teacher_assignments_unique_subject_idx
ON public.teacher_assignments (
  staff_id,
  stream_id,
  subject_id,
  academic_year_id
)
WHERE subject_id IS NOT NULL;


-- ============================================================
-- 3. PREVENT DUPLICATE CLASS-TEACHER-ONLY ASSIGNMENTS
-- ============================================================
-- PostgreSQL treats NULL values specially in normal UNIQUE
-- indexes, therefore class-teacher-only assignments need
-- their own partial unique index.

CREATE UNIQUE INDEX IF NOT EXISTS
  teacher_assignments_unique_class_teacher_idx
ON public.teacher_assignments (
  staff_id,
  stream_id,
  academic_year_id
)
WHERE subject_id IS NULL
  AND is_class_teacher = true;


COMMIT;