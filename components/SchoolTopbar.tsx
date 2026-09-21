"use client";

import {
  Bell,
  ChevronDown,
  Menu,
  Search,
  Settings,
  User,
} from "lucide-react";
import { useState } from "react";

type School = {
  id?: string;
  name?: string | null;
  [key: string]: unknown;
};

type SchoolTopbarProps = {
  school: School;
};

export function SchoolTopbar({ school }: SchoolTopbarProps) {
  const [profileOpen, setProfileOpen] = useState(false);

  const schoolName = school?.name?.trim() || "School";

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        {/* Mobile menu */}
        <button
          type="button"
          aria-label="Open navigation"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006b3f] lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* School identity */}
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            School Management System
          </p>

          <h1 className="mt-0.5 truncate text-base font-bold tracking-tight text-slate-900 sm:text-lg">
            {schoolName}
          </h1>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search */}
        <button
          type="button"
          aria-label="Search"
          className="hidden h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006b3f] md:flex"
        >
          <Search className="h-4 w-4" />
          <span>Search</span>
          <kbd className="ml-2 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
            /
          </kbd>
        </button>

        {/* Mobile search */}
        <button
          type="button"
          aria-label="Search"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006b3f] md:hidden"
        >
          <Search className="h-4 w-4" />
        </button>

        {/* Notifications */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006b3f]"
        >
          <Bell className="h-[18px] w-[18px]" strokeWidth={2} />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#ce1126] ring-2 ring-white" />
        </button>

        {/* Divider */}
        <div className="mx-1 hidden h-8 w-px bg-slate-200 sm:block" />

        {/* Profile */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((open) => !open)}
            aria-expanded={profileOpen}
            className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#006b3f] sm:px-2.5"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
              <User className="h-4 w-4" strokeWidth={2} />
            </span>

            <span className="hidden max-w-[150px] text-left sm:block">
              <span className="block truncate text-xs font-semibold text-slate-900">
                Administrator
              </span>

              <span className="block truncate text-[10px] font-medium text-slate-400">
                School Admin
              </span>
            </span>

            <ChevronDown
              className={`hidden h-4 w-4 text-slate-400 transition-transform sm:block ${
                profileOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">
                  Administrator
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  School administrator
                </p>
              </div>

              <div className="p-1.5">
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
                >
                  <User className="h-4 w-4 text-slate-400" />
                  Profile
                </button>

                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
                >
                  <Settings className="h-4 w-4 text-slate-400" />
                  Settings
                </button>
              </div>

              <div className="border-t border-slate-100 p-1.5">
                <button
                  type="button"
                  className="flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
