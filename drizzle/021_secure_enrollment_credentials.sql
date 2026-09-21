ALTER TABLE student_user_accounts
  ADD COLUMN IF NOT EXISTS password_expires_at TIMESTAMPTZ;

DO $$ BEGIN
  IF to_regclass('public.guardian_user_accounts') IS NOT NULL THEN
    ALTER TABLE guardian_user_accounts
      ADD COLUMN IF NOT EXISTS password_expires_at TIMESTAMPTZ;
  END IF;
END $$;

UPDATE student_user_accounts
SET password_expires_at = NOW()
WHERE must_change_password = TRUE
  AND password_expires_at IS NULL;

DO $$ BEGIN
  IF to_regclass('public.guardian_user_accounts') IS NOT NULL THEN
    UPDATE guardian_user_accounts
    SET must_change_password = TRUE,
        password_expires_at = NOW()
    WHERE password_expires_at IS NULL;
  END IF;
END $$;
