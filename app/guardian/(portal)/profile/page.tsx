import { redirect } from "next/navigation";
import { requireCurrentGuardian } from "@/lib/guardian-auth";
import { GuardianChildSelector } from "../GuardianChildSelector";

export default async function GuardianProfilePage({
  searchParams,
}: {
  searchParams?: Promise<{ child?: string }>;
}) {
  const params = await searchParams;
  const { session, children } = await requireCurrentGuardian();

  if (children.length === 0) {
    redirect("/guardian/login");
  }

  const selectedChild =
    children.find((child) => child.id === params?.child) ?? children[0];

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Profile</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">
            {session.user.firstName} {session.user.lastName}
          </h1>
        </div>
        <GuardianChildSelector
          childOptions={children}
          selectedChildId={selectedChild.id}
          currentPath="/guardian/profile"
        />
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Guardian account</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <p><span className="font-medium text-slate-900">Name:</span> {session.user.firstName} {session.user.lastName}</p>
            <p><span className="font-medium text-slate-900">Email:</span> {session.user.email}</p>
            <p><span className="font-medium text-slate-900">Linked child:</span> {selectedChild.firstName} {selectedChild.lastName}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">School context</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <p><span className="font-medium text-slate-900">School ID:</span> {session.user.schoolId}</p>
            <p><span className="font-medium text-slate-900">Linked children:</span> {children.length}</p>
            <p><span className="font-medium text-slate-900">Student number:</span> {selectedChild.studentNumber}</p>
          </div>
        </div>
      </section>
    </main>
  );
}

