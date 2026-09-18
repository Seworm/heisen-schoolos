import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/../auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
          <div className="flex h-16 items-center border-b border-slate-200 px-6">
            <div>
              <p className="text-lg font-semibold tracking-tight text-slate-950">
                Heisen SchoolOS
              </p>

              <p className="text-xs text-slate-500">
                School Management
              </p>
            </div>
          </div>

          <nav className="p-4">
            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Main
            </p>

            <Link
              href="/dashboard"
              className="block rounded-lg bg-slate-100 px-3 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-slate-100"
            >
              Dashboard
            </Link>

            <p className="mt-7 px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Management
            </p>

            <div className="space-y-1">
              <Link
                href="/students"
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Students
              </Link>

              <Link
                href="/staff"
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Staff
              </Link>

              <Link
                href="/academics"
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Academics
              </Link>

              <Link
                href="/attendance"
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Attendance
              </Link>

              <Link
                href="/assessments"
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Assessments
              </Link>

              <span className="block cursor-not-allowed rounded-lg px-3 py-2.5 text-sm text-slate-400">
                Finance
              </span>
            </div>

            <p className="mt-7 px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              System
            </p>

            <span className="block cursor-not-allowed rounded-lg px-3 py-2.5 text-sm text-slate-400">
              Settings
            </span>
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 lg:px-8">
            <div>
              <p className="text-sm font-medium text-slate-900">
                School Administration
              </p>

              <p className="text-xs text-slate-500">
                Heisen SchoolOS
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-slate-900">
                  Development Mode
                </p>

                <p className="text-xs text-slate-500">
                  Heisen Demo School
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                HS
              </div>
            </div>
          </header>

          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}