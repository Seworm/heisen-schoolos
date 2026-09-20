import { Search } from "lucide-react";
import Link from "next/link";

type SchoolTopbarProps = {
  school: {
    id: string;
    name: string;
  };
};

export function SchoolTopbar({ school }: SchoolTopbarProps) {
  return (
    <header className="flex min-h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900">
          {school.name}
        </p>
        <p className="text-xs text-slate-500">School administration</p>
      </div>

      <Link
        href="/search"
        className="hidden w-full max-w-sm items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 md:flex"
      >
        <Search className="h-4 w-4" />
        Search students, staff, guardians, classes...
      </Link>

      <div className="h-9 w-9 shrink-0 rounded-full bg-slate-900 text-center text-xs font-semibold leading-9 text-white">
        HS
      </div>
    </header>
  );
}
