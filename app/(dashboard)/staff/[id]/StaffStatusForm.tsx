"use client";

import { useTransition } from "react";
import { archiveStaff, deleteStaff } from "./actions";

export default function StaffStatusForm({ staffId }: { staffId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-wrap gap-2">
    <form action={(formData) => startTransition(() => archiveStaff(formData))}>
      <input type="hidden" name="staffId" value={staffId} />
      <button type="submit" disabled={pending} onClick={(event) => { if (!window.confirm("Deactivate this staff record and remove its active access?")) event.preventDefault(); }} className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50">
        {pending ? "Deactivating..." : "Deactivate staff"}
      </button>
    </form>
    <form action={(formData) => startTransition(() => deleteStaff(formData))}>
      <input type="hidden" name="staffId" value={staffId} />
      <button type="submit" disabled={pending} onClick={(event) => { if (!window.confirm("Permanently delete this staff record? This cannot be undone. Deactivate instead when historical records must be preserved.")) event.preventDefault(); }} className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50">
        {pending ? "Deleting..." : "Delete permanently"}
      </button>
    </form>
    </div>
  );
}
