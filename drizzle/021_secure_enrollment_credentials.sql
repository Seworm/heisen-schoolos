ALTER TABLE student_user_accounts
  ADD COLUMN IF NOT EXISTS password_expires_at TIMESTAMPTZ;

ALTER TABLE guardian_user_accounts
  ADD COLUMN IF NOT EXISTS password_expires_at TIMESTAMPTZ;

UPDATE student_user_accounts
SET password_expires_at = NOW()
WHERE must_change_password = TRUE
  AND password_expires_at IS NULL;

UPDATE guardian_user_accounts
SET must_change_password = TRUE,
    password_expires_at = NOW()
WHERE password_expires_at IS NULL;
