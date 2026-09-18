import { redirect } from "next/navigation";
import { auth, signOut } from "@/../auth";

export default async function StudentDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/student/login");
  }

  if (session.user.accountType !== "student") {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-950">
              Heisen SchoolOS
            </h1>

            <p className="text-sm text-slate-500">
              Student Portal
            </p>
          </div>

          <form
            action={async () => {
              "use server";
              await signOut({
                redirectTo: "/student/login",
              });
            }}
          >
            <button
              type="submit"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Welcome
          </p>

          <h2 className="mt-1 text-2xl font-semibold text-slate-950">
            {session.user.firstName}{" "}
            {session.user.lastName}
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Student Number:{" "}
            <span className="font-medium text-slate-700">
              {session.user.studentNumber}
            </span>
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="font-semibold text-slate-950">
              Results
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              View your published academic results.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="font-semibold text-slate-950">
              Attendance
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              View your attendance record.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="font-semibold text-slate-950">
              Profile
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              View your student information.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}