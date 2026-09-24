"use client";

import { Printer } from "lucide-react";

export default function PrintTimetableButton() {
  return <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"><Printer className="h-3.5 w-3.5" /> Print</button>;
}
