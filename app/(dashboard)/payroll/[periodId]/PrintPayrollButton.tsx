"use client";

import { Printer } from "lucide-react";

export default function PrintPayrollButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
    >
      <Printer className="h-4 w-4" />
      Print payroll
    </button>
  );
}
