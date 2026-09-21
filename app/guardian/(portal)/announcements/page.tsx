import { and, desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { announcements } from "@/db/schema";
import { requireCurrentGuardian } from "@/lib/guardian-auth";
import { GuardianChildSelector } from "../GuardianChildSelector";

function formatDate(value: string | Date | null) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-GH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default async function GuardianAnnouncementsPage({
  searchParams,
}: {
  searchParams?: Promise<{ child?: string }>;
}) {
  const params = await searchParams;
  const { children, schoolId } = await requireCurrentGuardian();

  if (children.length === 0) {
    redirect("/guardian/login");
  }

  const selectedChild =
    children.find((child) => child.id === params?.child) ?? children[0];

  const info = await db
    .select({
      id: announcements.id,
      title: announcements.title,
      body: announcements.body,
      audience: announcements.audience,
      publishedAt: announcements.publishedAt,
    })
    .from(announcements)
    .where(
      and(
        eq(announcements.schoolId, schoolId),
        eq(announcements.audience, "parents"),
      ),
    )
    .orderBy(desc(announcements.publishedAt))
    .limit(20);

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Announcements</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">
            {selectedChild.firstName} {selectedChild.lastName}
          </h1>
        </div>
        <GuardianChildSelector
          childOptions={children}
          selectedChildId={selectedChild.id}
          currentPath="/guardian/announcements"
        />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {info.length === 0 ? (
          <p className="text-sm text-slate-500">No parent announcements have been published for this school yet.</p>
        ) : (
          <div className="space-y-4">
            {info.map((item) => (
              <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="font-semibold text-slate-900">{item.title}</h2>
                  <span className="rounded-full bg-slate-200 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-slate-700">
                    {item.audience}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
                <p className="mt-3 text-xs text-slate-500">Published {formatDate(item.publishedAt)}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

