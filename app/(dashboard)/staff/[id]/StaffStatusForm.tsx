"use client";

import { useTransition } from "react";
import { archiveStaff } from "./actions";

export default function StaffStatusForm({ staffId }: { staffId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <form action={(formData) => startTransition(() => archiveStaff(formData))}>
      <input type="hidden" name="staffId" value={staffId} />
      <button type="submit" disabled={pending} onClick={(event) => { if (!window.confirm("Deactivate this staff record and remove its active access?")) event.preventDefault(); }} className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50">
        {pending ? "Deactivating..." : "Deactivate staff"}
      </button>
    </form>
  );
}
