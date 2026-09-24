"use client";

import { useTransition } from "react";
import { archiveStudent, deleteStudent } from "./actions";

export default function StudentStatusForm({ studentId }: { studentId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-wrap gap-2">
    <form action={(formData) => startTransition(() => archiveStudent(formData))}>
      <input type="hidden" name="studentId" value={studentId} />
      <button type="submit" disabled={pending} onClick={(event) => { if (!window.confirm("Archive this student record? Historical financial and academic records will be preserved.")) event.preventDefault(); }} className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-50">
        {pending ? "Archiving..." : "Archive student"}
      </button>
    </form>
    <form action={(formData) => startTransition(() => deleteStudent(formData))}>
      <input type="hidden" name="studentId" value={studentId} />
      <button type="submit" disabled={pending} onClick={(event) => { if (!window.confirm("Permanently delete this student? This cannot be undone. Use Archive when historical records must be preserved.")) event.preventDefault(); }} className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50">
        {pending ? "Deleting..." : "Delete permanently"}
      </button>
    </form>
    </div>
  );
}
