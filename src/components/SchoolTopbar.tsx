"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Search, Bell, ChevronDown, Menu, Sparkles, ArrowUpRight } from "lucide-react";
import { switchActiveSchool } from "@/lib/school-workspace";

type SearchResult = {
  id: string;
  title: string;
  subtitle?: string | null;
  meta?: string | null;
  type: "student" | "staff" | "guardian" | "class";
};

type SchoolTopbarProps = {
  school: { id: string; name: string };
  availableSchools?: Array<{ id: string; name: string }>;
  isPlatformAdmin?: boolean;
};

const resultLabels: Record<SearchResult["type"], string> = {
  student: "Student",
  staff: "Staff",
  guardian: "Guardian",
  class: "Class",
};

function resultHref(result: SearchResult) {
  if (result.type === "student") return `/students/${result.id}`;
  if (result.type === "staff") return `/staff/${result.id}`;
  if (result.type === "class") return `/academics/classes/${result.id}`;
  return `/search?q=${encodeURIComponent(result.title)}`;
}

export function SchoolTopbar({
  school,
  availableSchools = [],
  isPlatformAdmin = false,
}: SchoolTopbarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      setOpen(false);
    }
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.querySelector("input")?.focus();
      }
      if (event.key === "Escape") setOpen(false);
    }

    function onPointerDown(event: PointerEvent) {
      if (!searchRef.current?.contains(event.target as Node)) setOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  useEffect(() => {
    const value = query.trim();
    if (value.length < 2) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(value)}`, {
          signal: controller.signal,
        });
        if (!response.ok) return;
        const data = (await response.json()) as { results?: SearchResult[] };
        setResults(data.results ?? []);
        setOpen(true);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setResults([]);
      }
    }, 180);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  return (
    <header className="sticky top-0 z-30 flex min-h-[76px] items-center justify-between gap-4 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          aria-label="Open navigation"
          onClick={() => window.dispatchEvent(new Event("heisensms:open-navigation"))}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm lg:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div className="hidden h-9 w-9 items-center justify-center rounded-xl bg-[#edf7f0] text-[#087443] sm:flex">
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
              {availableSchools.map((availableSchool) => (
                <option key={availableSchool.id} value={availableSchool.id}>{availableSchool.name}</option>
              ))}
            </select>
          ) : (
            <p className="mt-0.5 truncate text-sm font-bold tracking-tight text-slate-900 sm:text-base">{school.name}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div ref={searchRef} className="relative hidden w-72 md:block">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-500 transition focus-within:border-[#006b3f] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#006b3f]/15">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              aria-label="Search school records"
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
              onFocus={() => query.trim().length >= 2 && setOpen(true)}
              placeholder="Search students, staff..."
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
            <kbd className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">⌘ K</kbd>
          </div>
          {open && (
            <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-emerald-950/10">
              {results.length > 0 ? results.map((result) => (
                <Link
                  key={`${result.type}-${result.id}`}
                  href={resultHref(result)}
                  onClick={() => { setOpen(false); setQuery(""); }}
                  className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition hover:bg-[#edf7f0]"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-slate-900">{result.title} {result.subtitle ?? ""}</span>
                    <span className="block truncate text-xs text-slate-500">{result.meta || resultLabels[result.type]}</span>
                  </span>
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-[#006b3f]">{resultLabels[result.type]} <ArrowUpRight className="inline h-3 w-3" /></span>
                </Link>
              )) : (
                <p className="px-3 py-4 text-center text-sm text-slate-500">No matching records found.</p>
              )}
              <Link href={`/search?q=${encodeURIComponent(query.trim())}`} onClick={() => setOpen(false)} className="mt-1 block border-t border-slate-100 px-3 py-2.5 text-center text-xs font-bold text-[#006b3f] hover:bg-[#fff8d9]">
                View full search results
              </Link>
            </div>
          )}
        </div>
        <button type="button" aria-label="Notifications" className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-[#edf7f0] hover:text-slate-900">
          <Bell className="h-[17px] w-[17px]" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#ce1126] ring-2 ring-white" />
        </button>
        <div className="hidden h-8 w-px bg-slate-200 sm:block" />
        <button type="button" className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-2.5 shadow-sm">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#087443] text-[10px] font-bold text-white">SA</span>
          <span className="hidden text-left sm:block"><span className="block text-xs font-semibold text-slate-800">Administrator</span><span className="block text-[10px] text-slate-500">Workspace owner</span></span>
          <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
        </button>
      </div>
    </header>
  );
}
