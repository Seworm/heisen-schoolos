"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BookOpen,
  Building2,
  CalendarDays,
  ClipboardCheck,
  DollarSign,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  Settings,
  Users,
  UserCog,
  Clock3,
} from "lucide-react";

const groups = [
  { label: "Workspace", items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }] },
  {
    label: "Management",
    items: [
      { href: "/students", label: "Students", icon: Users },
      { href: "/staff", label: "Staff", icon: UserCog },
      { href: "/academics", label: "Academics", icon: BookOpen },
      { href: "/attendance", label: "Attendance", icon: CalendarDays },
      { href: "/assessments", label: "Assessments", icon: ClipboardCheck },
      { href: "/finance", label: "Fees & Finance", icon: DollarSign },
      { href: "/timetable", label: "Timetable", icon: Clock3 },
      { href: "/communications", label: "Communications", icon: Megaphone },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin", label: "Administration", icon: GraduationCap },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
] as const;

function active(pathname: string, href: string) {
  return href === "/dashboard"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function SchoolSidebar({ isPlatformAdmin = false }: { isPlatformAdmin?: boolean }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[276px] shrink-0 border-r border-white/10 bg-[#111827] text-white lg:flex lg:flex-col">
      <div className="border-b border-white/10 px-5 py-5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <span className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-600 shadow-lg shadow-blue-950/50">
            <GraduationCap className="relative z-10 h-5 w-5" strokeWidth={2.3} />
            <span className="absolute -right-3 -top-3 h-8 w-8 rounded-full bg-white/20" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-bold tracking-tight">Heisen SchoolOS</span>
            <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Education OS</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        {isPlatformAdmin && (
          <Link
            href="/platform"
            className={`mb-6 flex items-center gap-3 rounded-xl border px-3 py-3 text-sm font-semibold transition ${
              active(pathname, "/platform")
                ? "border-violet-400/30 bg-violet-500/20 text-violet-100"
                : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white"
            }`}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-400/15 text-violet-300">
              <Building2 className="h-4 w-4" />
            </span>
            <span>All schools</span>
            <Activity className="ml-auto h-3.5 w-3.5 opacity-60" />
          </Link>
        )}

        <div className="space-y-7">
          {groups.map((group) => (
            <section key={group.label}>
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{group.label}</p>
              <div className="space-y-1">
                {group.items.map(({ href, label, icon: Icon }) => {
                  const isActive = active(pathname, href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${
                        isActive
                          ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-950/30"
                          : "text-slate-400 hover:bg-white/[0.07] hover:text-white"
                      }`}
                    >
                      <Icon className={`h-[17px] w-[17px] ${isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"}`} strokeWidth={2} />
                      <span>{label}</span>
                      {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-300" />}
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-emerald-400/10 to-cyan-400/10 px-3 py-3">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
          <div>
            <p className="text-xs font-semibold text-slate-200">System operational</p>
            <p className="mt-0.5 text-[10px] text-slate-500">Secure school workspace</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
