BEGIN;

CREATE TYPE payroll_period_status AS ENUM ('draft', 'processed', 'paid', 'void');
CREATE TYPE payroll_frequency AS ENUM ('monthly', 'weekly', 'hourly');

CREATE TABLE payroll_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name varchar(100) NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  pay_date date NOT NULL,
  status payroll_period_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payroll_period_school_name_unique UNIQUE (school_id, name),
  CONSTRAINT payroll_period_dates_valid CHECK (period_end >= period_start)
);
CREATE INDEX payroll_period_school_idx ON payroll_periods(school_id);
CREATE INDEX payroll_period_status_idx ON payroll_periods(status);

CREATE TABLE payroll_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  frequency payroll_frequency NOT NULL DEFAULT 'monthly',
  base_salary numeric(12,2) NOT NULL DEFAULT 0,
  allowances numeric(12,2) NOT NULL DEFAULT 0,
  tax_deduction numeric(12,2) NOT NULL DEFAULT 0,
  pension_deduction numeric(12,2) NOT NULL DEFAULT 0,
  other_deduction numeric(12,2) NOT NULL DEFAULT 0,
  bank_name varchar(120),
  bank_account_number varchar(80),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payroll_profile_staff_unique UNIQUE (school_id, staff_id)
);
CREATE INDEX payroll_profile_school_idx ON payroll_profiles(school_id);
CREATE INDEX payroll_profile_staff_idx ON payroll_profiles(staff_id);

CREATE TABLE payroll_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  period_id uuid NOT NULL REFERENCES payroll_periods(id) ON DELETE CASCADE,
  gross_total numeric(14,2) NOT NULL DEFAULT 0,
  deductions_total numeric(14,2) NOT NULL DEFAULT 0,
  net_total numeric(14,2) NOT NULL DEFAULT 0,
  processed_by text,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payroll_run_period_unique UNIQUE (period_id)
);
CREATE INDEX payroll_run_school_idx ON payroll_runs(school_id);

CREATE TABLE payroll_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE RESTRICT,
  base_salary numeric(12,2) NOT NULL,
  allowances numeric(12,2) NOT NULL,
  gross_pay numeric(12,2) NOT NULL,
  tax_deduction numeric(12,2) NOT NULL,
  pension_deduction numeric(12,2) NOT NULL,
  other_deduction numeric(12,2) NOT NULL,
  total_deductions numeric(12,2) NOT NULL,
  net_pay numeric(12,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payroll_item_run_staff_unique UNIQUE (run_id, staff_id)
);
CREATE INDEX payroll_item_run_idx ON payroll_items(run_id);
CREATE INDEX payroll_item_school_idx ON payroll_items(school_id);

COMMIT;
