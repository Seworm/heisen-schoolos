BEGIN;

CREATE TYPE calendar_event_type AS ENUM ('holiday', 'academic', 'meeting', 'activity', 'deadline', 'other');
CREATE TYPE leave_request_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
CREATE TYPE leave_type AS ENUM ('annual', 'sick', 'maternity', 'paternity', 'unpaid', 'other');

CREATE TABLE IF NOT EXISTS school_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  type calendar_event_type NOT NULL DEFAULT 'other',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN NOT NULL DEFAULT FALSE,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT school_calendar_events_time_check CHECK (ends_at >= starts_at)
);
CREATE INDEX IF NOT EXISTS school_calendar_events_school_idx ON school_calendar_events(school_id);
CREATE INDEX IF NOT EXISTS school_calendar_events_starts_idx ON school_calendar_events(starts_at);

CREATE TABLE IF NOT EXISTS staff_leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  requested_by TEXT NOT NULL,
  leave_type leave_type NOT NULL,
  starts_on DATE NOT NULL,
  ends_on DATE NOT NULL,
  reason TEXT,
  status leave_request_status NOT NULL DEFAULT 'pending',
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT staff_leave_requests_date_check CHECK (ends_on >= starts_on)
);
CREATE INDEX IF NOT EXISTS staff_leave_requests_school_idx ON staff_leave_requests(school_id);
CREATE INDEX IF NOT EXISTS staff_leave_requests_staff_idx ON staff_leave_requests(staff_id);
CREATE INDEX IF NOT EXISTS staff_leave_requests_status_idx ON staff_leave_requests(status);

CREATE TABLE IF NOT EXISTS notification_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  trigger VARCHAR(60) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  days_before INTEGER NOT NULL DEFAULT 1,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT notification_automations_school_name_unique UNIQUE (school_id, name)
);
CREATE INDEX IF NOT EXISTS notification_automations_school_idx ON notification_automations(school_id);

COMMIT;
