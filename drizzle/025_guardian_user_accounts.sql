BEGIN;

DO $$ BEGIN
  CREATE TYPE public.guardian_account_status AS ENUM (
    'pending',
    'active',
    'disabled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.guardian_user_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  guardian_id uuid NOT NULL UNIQUE
    REFERENCES public.guardians(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  must_change_password boolean NOT NULL DEFAULT true,
  password_expires_at timestamptz,
  last_login_at timestamptz,
  status public.guardian_account_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS guardian_user_accounts_guardian_idx
  ON public.guardian_user_accounts(guardian_id);

CREATE INDEX IF NOT EXISTS guardian_user_accounts_status_idx
  ON public.guardian_user_accounts(status);

COMMIT;
