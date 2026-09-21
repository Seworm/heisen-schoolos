"use client";

import { Search, Bell, ChevronDown, Menu, Sparkles } from "lucide-react";
import { switchActiveSchool } from "@/lib/school-workspace";

type SchoolTopbarProps = {
  school: { id: string; name: string };
  availableSchools?: Array<{ id: string; name: string }>;
  isPlatformAdmin?: boolean;
};

export function SchoolTopbar({ school, availableSchools = [], isPlatformAdmin = false }: SchoolTopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex min-h-[76px] items-center justify-between gap-4 border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" aria-label="Open navigation" className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 lg:hidden">
          <Menu className="h-4 w-4" />
        </button>
        <div className="hidden h-9 w-9 items-center justify-center rounded-xl bg-[#fff8d9] text-[#006b3f] sm:flex">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Active workspace</p>
          {isPlatformAdmin && availableSchools.length > 0 ? (
            <select
              aria-label="Active school"
              value={school.id}
              onChange={async (event) => {
                await switchActiveSchool(event.target.value);
                window.location.reload();
              }}
              className="mt-0.5 max-w-[250px] truncate bg-transparent text-sm font-bold tracking-tight text-slate-900 outline-none sm:text-base"
            >
              {availableSchools.map((availableSchool) => <option key={availableSchool.id} value={availableSchool.id}>{availableSchool.name}</option>)}
            </select>
          ) : (
            <p className="mt-0.5 truncate text-sm font-bold tracking-tight text-slate-900 sm:text-base">{school.name}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden w-64 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-400 md:flex">
          <Search className="h-4 w-4" />
          <span>Search anything...</span>
          <kbd className="ml-auto rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold">⌘ K</kbd>
        </div>
        <button type="button" aria-label="Notifications" className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-[#fff8d9] hover:text-slate-900">
          <Bell className="h-[17px] w-[17px]" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#ce1126] ring-2 ring-white" />
        </button>
        <div className="hidden h-8 w-px bg-slate-200 sm:block" />
        <button type="button" className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-2.5 shadow-sm">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-slate-800 to-slate-950 text-[10px] font-bold text-white">SA</span>
          <span className="hidden text-left sm:block"><span className="block text-xs font-semibold text-slate-800">Administrator</span><span className="block text-[10px] text-slate-400">Workspace owner</span></span>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        </button>
      </div>
    </header>
  );
}
