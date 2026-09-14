BEGIN;

-- ============================================================
-- 009 ATTENDANCE
-- ============================================================

CREATE TYPE attendance_session_status AS ENUM (
  'open',
  'completed',
  'cancelled'
);

CREATE TYPE attendance_record_status AS ENUM (
  'present',
  'absent',
  'late',
  'excused'
);

-- ============================================================
-- ATTENDANCE SESSIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.attendance_sessions (
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

  attendance_date DATE NOT NULL,

  status attendance_session_status NOT NULL
    DEFAULT 'open',

  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL
    DEFAULT NOW(),

  updated_at TIMESTAMPTZ NOT NULL
    DEFAULT NOW(),

  CONSTRAINT attendance_sessions_unique_stream_date
    UNIQUE (
      stream_id,
      attendance_date
    )
);

CREATE INDEX IF NOT EXISTS attendance_sessions_school_idx
  ON public.attendance_sessions(school_id);

CREATE INDEX IF NOT EXISTS attendance_sessions_year_idx
  ON public.attendance_sessions(academic_year_id);

CREATE INDEX IF NOT EXISTS attendance_sessions_term_idx
  ON public.attendance_sessions(term_id);

CREATE INDEX IF NOT EXISTS attendance_sessions_stream_idx
  ON public.attendance_sessions(stream_id);

CREATE INDEX IF NOT EXISTS attendance_sessions_date_idx
  ON public.attendance_sessions(attendance_date);


-- ============================================================
-- ATTENDANCE RECORDS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  attendance_session_id UUID NOT NULL
    REFERENCES public.attendance_sessions(id)
    ON DELETE CASCADE,

  student_id UUID NOT NULL
    REFERENCES public.students(id)
    ON DELETE CASCADE,

  status attendance_record_status NOT NULL,

  note TEXT,

  created_at TIMESTAMPTZ NOT NULL
    DEFAULT NOW(),

  updated_at TIMESTAMPTZ NOT NULL
    DEFAULT NOW(),

  CONSTRAINT attendance_records_unique_session_student
    UNIQUE (
      attendance_session_id,
      student_id
    )
);

CREATE INDEX IF NOT EXISTS attendance_records_session_idx
  ON public.attendance_records(attendance_session_id);

CREATE INDEX IF NOT EXISTS attendance_records_student_idx
  ON public.attendance_records(student_id);

CREATE INDEX IF NOT EXISTS attendance_records_status_idx
  ON public.attendance_records(status);

COMMIT;