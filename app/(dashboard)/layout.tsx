import type { ReactNode } from "react";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
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

            <a
              href="/"
              className="flex items-center rounded-lg bg-slate-100 px-3 py-2.5 text-sm font-medium text-slate-950"
            >
              Dashboard
            </a>

            <p className="mt-7 px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Management
            </p>

            <div className="space-y-1">
              <a
                href="#"
                className="block rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                Students
              </a>

              <a
                href="#"
                className="block rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                Staff
              </a>

              <a
                href="#"
                className="block rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                Academics
              </a>

              <a
                href="#"
                className="block rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                Attendance
              </a>

              <a
                href="#"
                className="block rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                Assessments
              </a>

              <a
                href="#"
                className="block rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                Finance
              </a>
            </div>

            <p className="mt-7 px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              System
            </p>

            <a
              href="#"
              className="block rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              Settings
            </a>
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 lg:px-8">
            <div>
              <p className="text-sm font-medium text-slate-900">
                School Administration
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