import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/authorization";
import { createSchool } from "./actions";

export const dynamic = "force-dynamic";

export default async function NewSchoolPage() {
  await requireSuperAdmin();

  async function submit(formData: FormData) {
    "use server";
    const school = await createSchool({
      name: formData.get("name"),
      slug: formData.get("slug"),
      schoolCode: formData.get("schoolCode"),
    });
    redirect(`/platform?created=${school.id}`);
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/platform" className="text-sm font-medium text-blue-600">← Back to all schools</Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">Add school</h1>
      <p className="mt-1 text-sm text-slate-500">Create an isolated school workspace for staff, students, academics and finance.</p>
      <form action={submit} className="mt-7 space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <label className="block text-sm font-medium">School name<input required name="name" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
        <label className="block text-sm font-medium">URL slug<input required name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="north-campus" /></label>
        <label className="block text-sm font-medium">School code<input required name="schoolCode" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="NORTH-001" /></label>
        <button className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white">Create school</button>
      </form>
    </main>
  );
}
