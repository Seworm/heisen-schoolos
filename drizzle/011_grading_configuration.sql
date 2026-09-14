BEGIN;

-- ============================================================
-- 011 GRADING CONFIGURATION
-- ============================================================
-- Allows each school to define its own assessment weighting
-- and grading bands.
--
-- Example:
-- CAT 1       10%
-- Homework     5%
-- Project      5%
-- CAT 2       10%
-- Examination 70%
-- Total       100%
-- ============================================================


-- ============================================================
-- GRADING SCHEMES
-- ============================================================

CREATE TABLE IF NOT EXISTS grading_schemes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  school_id UUID NOT NULL
    REFERENCES schools(id)
    ON DELETE CASCADE,

  name VARCHAR(150) NOT NULL,

  description TEXT,

  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (
      status IN (
        'draft',
        'active',
        'archived'
      )
    ),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT grading_schemes_school_name_unique
    UNIQUE (school_id, name)
);

CREATE INDEX IF NOT EXISTS grading_schemes_school_idx
  ON grading_schemes(school_id);

CREATE INDEX IF NOT EXISTS grading_schemes_status_idx
  ON grading_schemes(status);


-- ============================================================
-- GRADING SCHEME ITEMS
-- ============================================================
-- Connects assessment types to their contribution.
--
-- Example:
-- CAT 1       -> 10
-- Homework    -> 5
-- Project     -> 5
-- CAT 2       -> 10
-- Examination -> 70
-- ============================================================

CREATE TABLE IF NOT EXISTS grading_scheme_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  grading_scheme_id UUID NOT NULL
    REFERENCES grading_schemes(id)
    ON DELETE CASCADE,

  assessment_type_id UUID NOT NULL
    REFERENCES assessment_types(id)
    ON DELETE RESTRICT,

  weight_percent NUMERIC(5,2) NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT grading_scheme_items_weight_check
    CHECK (
      weight_percent > 0
      AND weight_percent <= 100
    ),

  CONSTRAINT grading_scheme_items_unique
    UNIQUE (
      grading_scheme_id,
      assessment_type_id
    )
);

CREATE INDEX IF NOT EXISTS grading_scheme_items_scheme_idx
  ON grading_scheme_items(grading_scheme_id);

CREATE INDEX IF NOT EXISTS grading_scheme_items_type_idx
  ON grading_scheme_items(assessment_type_id);


-- ============================================================
-- GRADE BANDS
-- ============================================================
-- Example:
--
-- A: 80-100
-- B: 70-79.99
-- C: 60-69.99
-- D: 50-59.99
-- E: 40-49.99
-- F: 0-39.99
--
-- These are configurable and are NOT hard-coded into results.
-- ============================================================

CREATE TABLE IF NOT EXISTS grade_bands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  grading_scheme_id UUID NOT NULL
    REFERENCES grading_schemes(id)
    ON DELETE CASCADE,

  grade VARCHAR(10) NOT NULL,

  label VARCHAR(100),

  minimum_percent NUMERIC(5,2) NOT NULL,

  maximum_percent NUMERIC(5,2) NOT NULL,

  remark VARCHAR(255),

  sort_order INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT grade_bands_range_check
    CHECK (
      minimum_percent >= 0
      AND maximum_percent <= 100
      AND minimum_percent <= maximum_percent
    ),

  CONSTRAINT grade_bands_unique
    UNIQUE (
      grading_scheme_id,
      grade
    )
);

CREATE INDEX IF NOT EXISTS grade_bands_scheme_idx
  ON grade_bands(grading_scheme_id);

CREATE INDEX IF NOT EXISTS grade_bands_minimum_idx
  ON grade_bands(
    grading_scheme_id,
    minimum_percent
  );


-- ============================================================
-- SCHOOL-SAFE FOREIGN KEY VALIDATION
-- ============================================================
-- The database cannot express the school relationship directly
-- through the foreign keys above because assessment_types and
-- grading_schemes each carry school ownership.
--
-- Server-side actions will enforce this relationship.
-- ============================================================


-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION set_grading_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS grading_schemes_updated_at
ON grading_schemes;

CREATE TRIGGER grading_schemes_updated_at
BEFORE UPDATE ON grading_schemes
FOR EACH ROW
EXECUTE FUNCTION set_grading_updated_at();


DROP TRIGGER IF EXISTS grading_scheme_items_updated_at
ON grading_scheme_items;

CREATE TRIGGER grading_scheme_items_updated_at
BEFORE UPDATE ON grading_scheme_items
FOR EACH ROW
EXECUTE FUNCTION set_grading_updated_at();


DROP TRIGGER IF EXISTS grade_bands_updated_at
ON grade_bands;

CREATE TRIGGER grade_bands_updated_at
BEFORE UPDATE ON grade_bands
FOR EACH ROW
EXECUTE FUNCTION set_grading_updated_at();


COMMIT;