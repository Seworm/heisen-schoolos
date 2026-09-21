import { Building2, ShieldCheck } from "lucide-react";
import SchoolWorkspaceButton from "../platform/SchoolWorkspaceButton";

type School = {
  id: string;
  name: string;
  slug: string;
  status: string;
};

export default function SchoolSelection({ schools }: { schools: School[] }) {
  return (
    <main className="min-h-screen bg-[#f8faf7] px-4 py-10 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-600">
              Platform administration
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
              Choose a school workspace
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Select a school to open its dashboard. You can switch schools
              from the workspace header at any time.
            </p>
          </div>
        </div>

        {schools.length > 0 ? (
          <div className="mt-8 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200">
            {schools.map((school) => (
              <div
                key={school.id}
                className="flex items-center justify-between gap-4 px-4 py-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Building2 className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-900">
                      {school.name}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {school.slug}
                    </p>
                  </div>
                </div>
                <SchoolWorkspaceButton schoolId={school.id} />
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-8 rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-600">
            No active schools are available yet. Create a school from the
            platform administration area first.
          </p>
        )}
      </section>
    </main>
  );
}
