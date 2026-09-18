BEGIN;

-- ============================================================
-- 016 AUTHENTICATION + MULTI-SCHOOL TENANCY
-- ============================================================

CREATE TYPE user_status AS ENUM (
  'active',
  'inactive',
  'suspended'
);

CREATE TYPE school_membership_role AS ENUM (
  'super_admin',
  'school_admin',
  'headteacher',
  'teacher',
  'accountant',
  'staff'
);

-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,

  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,

  status user_status NOT NULL DEFAULT 'active',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT users_email_unique UNIQUE (email)
);

CREATE INDEX users_status_idx
ON public.users (status);

-- ============================================================
-- SCHOOL MEMBERSHIPS
-- ============================================================

CREATE TABLE public.school_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL
    REFERENCES public.users(id)
    ON DELETE CASCADE,

  school_id UUID NOT NULL
    REFERENCES public.schools(id)
    ON DELETE CASCADE,

  role school_membership_role NOT NULL,

  is_active BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT school_memberships_unique
    UNIQUE (user_id, school_id)
);

CREATE INDEX school_memberships_user_idx
ON public.school_memberships (user_id);

CREATE INDEX school_memberships_school_idx
ON public.school_memberships (school_id);

CREATE INDEX school_memberships_role_idx
ON public.school_memberships (role);

CREATE INDEX school_memberships_active_idx
ON public.school_memberships (is_active);

-- ============================================================
-- UPDATED AT
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_users_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.set_users_updated_at();

CREATE OR REPLACE FUNCTION public.set_school_memberships_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER school_memberships_updated_at
BEFORE UPDATE ON public.school_memberships
FOR EACH ROW
EXECUTE FUNCTION public.set_school_memberships_updated_at();

COMMIT;