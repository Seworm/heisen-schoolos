"use client";

import Link from "next/link";
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
  const [mobileOpen, setMobileOpen] = useState(false);

  const schoolName = school?.name?.trim() || "School";

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center border-b border-[#dfe7e0] bg-[#f5f7f6] px-4 text-slate-900 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <button
          type="button"
          aria-label="Open navigation"
          onClick={() => setMobileOpen((open) => !open)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#0d2139] lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
            SchoolOS workspace
          </p>

          <h1 className="mt-0.5 truncate text-base font-bold tracking-tight text-slate-900 sm:text-lg">
            {schoolName}
          </h1>
        </div>
        {mobileOpen && (
          <div className="absolute left-0 right-0 top-20 border-b border-slate-200 bg-[#f6f8f7] p-4 shadow-xl lg:hidden">
            <nav className="grid gap-1 sm:grid-cols-2">
              {[
                ["Dashboard", "/dashboard"],
                ["Students", "/students"],
                ["Staff", "/staff"],
                ["Academics", "/academics/classes"],
                ["Finance", "/finance"],
                ["Reports", "/reports"],
                ["Communications", "/communications"],
                ["Settings", "/settings"],
              ].map(([label, href]) => (
                <Link key={href} href={href} onClick={() => setMobileOpen(false)} className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-white hover:text-[#0d2139]">
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>

      <div className="hidden items-center gap-2 rounded-xl bg-[#dff5e3] px-3 py-2 text-xs font-semibold text-[#0d2139] xl:flex">
        <span className="h-2 w-2 rounded-full bg-[#1aa95d]" />
        Operations running normally
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          aria-label="Search"
          className="hidden h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#0d2139] md:flex"
        >
          <Search className="h-4 w-4" />
          <span>Search</span>
          <kbd className="ml-2 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
            /
          </kbd>
        </button>

        <button
          type="button"
          aria-label="Search"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#0d2139] md:hidden"
        >
          <Search className="h-4 w-4" />
        </button>

        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#0d2139]"
        >
          <Bell className="h-[18px] w-[18px]" strokeWidth={2} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#1aa95d] ring-2 ring-white" />
        </button>

        <div className="mx-1 hidden h-8 w-px bg-slate-200 sm:block" />

        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((open) => !open)}
            aria-expanded={profileOpen}
            className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#0d2139] sm:px-2.5"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#dff5e3] text-[#0d2139]">
              <User className="h-4 w-4" strokeWidth={2} />
            </span>

            <span className="hidden max-w-[150px] text-left sm:block">
              <span className="block truncate text-xs font-semibold text-slate-900">
                Administrator
              </span>

              <span className="block truncate text-[10px] font-medium text-slate-500">
                School Admin
              </span>
            </span>

            <ChevronDown
              className={`hidden h-4 w-4 text-slate-500 transition-transform sm:block ${
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
                <Link
                  href="/settings"
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
                >
                  <Settings className="h-4 w-4 text-slate-400" />
                  Settings
                </Link>
              </div>

              <div className="border-t border-slate-100 p-1.5">
                <Link
                  href="/login"
                  className="flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-[#0d2139] transition-colors hover:bg-slate-50"
                >
                  Sign out
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
