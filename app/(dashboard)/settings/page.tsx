import { eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { schoolSettings } from "@/db/schema";
import { getCurrentSchool } from "@/lib/current-school";
import { getInsightThresholds } from "@/lib/insights";
import { requireRole } from "@/lib/authorization";
import {
  updateInsightThresholds,
  updateOperationalSettings,
  updateSchoolProfile,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const school = await getCurrentSchool();
  const user = await requireRole(
    ["school_admin", "school_owner", "principal", "headteacher"],
    school.id,
  );
  const [settings] = await db
    .select()
    .from(schoolSettings)
    .where(eq(schoolSettings.schoolId, school.id))
    .limit(1);
  const thresholds = await getInsightThresholds(school.id);

  return (
    <main className="mx-auto max-w-6xl space-y-7 px-4 py-6 sm:px-6 lg:px-8">
      <header className="rounded-2xl border border-[#d9e9de] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#087443]">
          School administration
        </p>
        <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#183126]">
              Settings
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6b7d72]">
              Configure your school identity, finance rules, results behavior,
              report cards, insight alerts, and account security.
            </p>
          </div>
          <Link
            href="/auth/two-factor"
            className="inline-flex items-center justify-center rounded-xl border border-[#b9ddc4] bg-[#edf7f0] px-4 py-2.5 text-sm font-bold text-[#087443] hover:bg-[#e4f3e9]"
          >
            Secure administrator account
          </Link>
        </div>
      </header>

      <section className="rounded-2xl border border-[#d9e9de] bg-white p-6 shadow-sm sm:p-8">
        <SectionHeading
          eyebrow="School identity"
          title="Profile and branding"
          description="These details appear across dashboards, communication, receipts, and report cards."
        />
        <form action={updateSchoolProfile} className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field name="name" label="School name" defaultValue={school.name} required />
          <Field name="schoolCode" label="School code" defaultValue={school.schoolCode} required />
          <label className="block text-sm font-semibold text-[#315443]">
            School type
            <select name="schoolType" defaultValue={school.schoolType} className="settings-input">
              <option value="private_basic">Private basic</option>
              <option value="public_basic">Public basic</option>
              <option value="international">International</option>
              <option value="montessori">Montessori</option>
              <option value="faith_based">Faith-based</option>
              <option value="other">Other</option>
            </select>
          </label>
          <Field name="region" label="Region" defaultValue={school.region ?? ""} />
          <Field name="district" label="District" defaultValue={school.district ?? ""} />
          <Field name="town" label="Town / city" defaultValue={school.town ?? ""} />
          <Field name="phone" label="Phone" defaultValue={school.phone ?? ""} />
          <Field name="email" label="School email" type="email" defaultValue={school.email ?? ""} />
          <Field name="website" label="Website" type="url" defaultValue={school.website ?? ""} />
          <Field name="logoUrl" label="Logo URL" type="url" defaultValue={school.logoUrl ?? ""} />
          <label className="block text-sm font-semibold text-[#315443] sm:col-span-2">
            Address
            <textarea name="address" defaultValue={school.address ?? ""} rows={3} className="settings-input" />
          </label>
          <SaveButton label="Save school profile" />
        </form>
      </section>

      <section className="rounded-2xl border border-[#d9e9de] bg-white p-6 shadow-sm sm:p-8">
        <SectionHeading
          eyebrow="Operations"
          title="Finance and results behavior"
          description="These controls affect billing, ranking, results, and generated report cards."
        />
        <form action={updateOperationalSettings} className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-[#315443]">
            Currency
            <select name="currency" defaultValue={settings?.currency ?? "GHS"} className="settings-input">
              <option value="GHS">GHS — Ghana cedi</option>
              <option value="USD">USD — US dollar</option>
              <option value="GBP">GBP — Pound sterling</option>
              <option value="EUR">EUR — Euro</option>
            </select>
          </label>
          <Field name="timezone" label="Timezone" defaultValue={settings?.timezone ?? "Africa/Accra"} required />
          <Field name="nextTermReopeningDate" label="Next term reopening date" type="date" defaultValue={settings?.nextTermReopeningDate ?? ""} />
          <label className="flex items-center gap-3 rounded-xl border border-[#d9e9de] bg-[#f5faf7] p-4 text-sm font-semibold text-[#315443]">
            <input type="checkbox" name="allowOverpayment" defaultChecked={settings?.allowOverpayment ?? false} />
            Allow invoice overpayments
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-[#d9e9de] bg-[#f5faf7] p-4 text-sm font-semibold text-[#315443]">
            <input type="checkbox" name="enableRanking" defaultChecked={settings?.enableRanking ?? true} />
            Enable overall student ranking
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-[#d9e9de] bg-[#f5faf7] p-4 text-sm font-semibold text-[#315443]">
            <input type="checkbox" name="enableSubjectRanking" defaultChecked={settings?.enableSubjectRanking ?? false} />
            Enable subject ranking
          </label>
          <label className="block text-sm font-semibold text-[#315443] sm:col-span-2">
            Report-card footer
            <textarea name="reportCardFooter" defaultValue={settings?.reportCardFooter ?? ""} rows={3} placeholder="Optional message printed at the bottom of report cards" className="settings-input" />
          </label>
          <SaveButton label="Save operational settings" />
        </form>
      </section>

      <section className="rounded-2xl border border-[#d9e9de] bg-white p-6 shadow-sm sm:p-8">
        <SectionHeading
          eyebrow="Early support"
          title="Insight thresholds"
          description="Use these thresholds to identify attendance and academic concerns before they become urgent."
        />
        <form action={updateInsightThresholds} className="mt-6 grid gap-5 sm:grid-cols-2">
          <NumberField name="attendanceRate" label="Attendance watch below (%)" value={thresholds.attendanceRate} />
          <NumberField name="assessmentAverage" label="Academic watch below (%)" value={thresholds.assessmentAverage} />
          <NumberField name="minimumAssessments" label="Minimum assessments" value={thresholds.minimumAssessments} />
          <NumberField name="lookbackMonths" label="Lookback window (months)" value={thresholds.lookbackMonths} />
          <SaveButton label="Save insight thresholds" />
        </form>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <InfoCard title="Current school" value={school.name} detail={school.schoolCode} />
        <InfoCard title="Access level" value={user.role ?? "Administrator"} detail="School administration permissions" />
        <InfoCard title="Security" value="Two-factor available" detail="Protect administrator accounts from takeover" />
      </section>
    </main>
  );
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#087443]">{eyebrow}</p>
      <h2 className="mt-1 text-xl font-bold text-[#183126]">{title}</h2>
      <p className="mt-1 text-sm text-[#6b7d72]">{description}</p>
    </div>
  );
}

function Field({ name, label, defaultValue, type = "text", required = false }: { name: string; label: string; defaultValue: string; type?: string; required?: boolean }) {
  return (
    <label className="block text-sm font-semibold text-[#315443]">
      {label}
      <input name={name} type={type} required={required} defaultValue={defaultValue} className="settings-input" />
    </label>
  );
}

function NumberField({ name, label, value }: { name: string; label: string; value: number }) {
  return <Field name={name} label={label} defaultValue={String(value)} type="number" />;
}

function SaveButton({ label }: { label: string }) {
  return <button type="submit" className="w-fit rounded-xl bg-[#087443] px-5 py-3 text-sm font-bold text-white hover:bg-[#055631]">{label}</button>;
}

function InfoCard({ title, value, detail }: { title: string; value: string; detail: string }) {
  return <div className="rounded-2xl border border-[#d9e9de] bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wider text-[#819087]">{title}</p><p className="mt-2 truncate font-bold text-[#183126]">{value}</p><p className="mt-1 text-xs text-[#6b7d72]">{detail}</p></div>;
}
