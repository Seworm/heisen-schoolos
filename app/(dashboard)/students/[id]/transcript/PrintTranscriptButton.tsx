"use client";

import { Download } from "lucide-react";

export default function PrintTranscriptButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-xl bg-[#edf7f0] px-4 py-2.5 text-sm font-semibold text-[#005530] shadow-sm ring-1 ring-[#cfe4d5] transition hover:bg-[#dff5e3]"
    >
      <Download className="h-4 w-4" />
      Print transcript
    </button>
  );
}
