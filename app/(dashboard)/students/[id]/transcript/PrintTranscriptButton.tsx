"use client";

import { Download } from "lucide-react";

export default function PrintTranscriptButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-xl bg-[#111111] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#ce1126]"
    >
      <Download className="h-4 w-4" />
      Print transcript
    </button>
  );
}
