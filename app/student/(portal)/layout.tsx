import "server-only";
import { redirect } from "next/navigation";
import { requireStudentSession } from "@/lib/student-auth";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireStudentSession();

  if (session.user.mustChangePassword) {
    redirect("/student/change-password");
  }

  const studentName =
    [session.user.firstName, session.user.lastName]
      .filter(Boolean)
      .join(" ") || "Student";

  const initials =
    [session.user.firstName, session.user.lastName]
      .filter(Boolean)
      .map((name) => name.charAt(0).toUpperCase())
      .join("") || "ST";

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200 bg-white lg:flex lg:flex-col">
        {/* keep your existing sidebar markup */}
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Student Portal
              </p>

              <p className="text-sm font-semibold text-slate-950">
                {studentName}
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
              {initials}
            </div>
          </div>
        </header>

        <main>{children}</main>
      </div>
    </div>
  );
}


