import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { notificationAutomations, schoolCalendarEvents } from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";
import CalendarForms from "./CalendarForms";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const school = await requireCurrentSchool();
  const events = await db.select().from(schoolCalendarEvents).where(eq(schoolCalendarEvents.schoolId, school.id)).orderBy(asc(schoolCalendarEvents.startsAt)).limit(100);
  const automations = await db.select().from(notificationAutomations).where(eq(notificationAutomations.schoolId, school.id)).orderBy(asc(notificationAutomations.name));
  return <div className="mx-auto max-w-6xl space-y-8">
    <header><p className="text-sm font-medium text-slate-500">School operations</p><h1 className="mt-1 text-2xl font-semibold">Calendar & notifications</h1><p className="mt-2 text-sm text-slate-500">Plan school dates and automate timely reminders for staff.</p></header>
    <CalendarForms />
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="font-semibold">Upcoming events</h2><div className="mt-4 divide-y divide-slate-100">{events.filter((event) => event.endsAt >= new Date()).map((event) => <div key={event.id} className="flex items-center justify-between py-3"><div><p className="font-medium">{event.title}</p><p className="text-sm text-slate-500">{event.type} · {event.startsAt.toLocaleString()}</p></div><span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{event.allDay ? "All day" : "Scheduled"}</span></div>)}{events.length === 0 && <p className="py-6 text-sm text-slate-500">No events yet.</p>}</div></section>
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="font-semibold">Active automations</h2><ul className="mt-3 space-y-2 text-sm text-slate-600">{automations.map((rule) => <li key={rule.id}>{rule.name} <span className="text-slate-400">· {rule.trigger}, {rule.daysBefore} day(s) before</span></li>)}{automations.length === 0 && <li>No automations configured.</li>}</ul></section>
  </div>;
}
