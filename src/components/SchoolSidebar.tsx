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
  WalletCards,
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
      { href: "/payroll", label: "Payroll", icon: WalletCards },
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
    <aside className="hidden w-[276px] shrink-0 border-r border-white/10 bg-[#111111] text-white lg:flex lg:flex-col">
      <div className="border-b border-white/10 px-5 py-5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <span className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#ce1126] via-[#fcd116] to-[#006b3f] shadow-lg shadow-black/50">
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
                ?                 "border-[#fcd116]/30 bg-[#fcd116]/15 text-[#fff8d9]"
                : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white"
            }`}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fcd116]/15 text-[#fcd116]">
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
                          ?                           "bg-gradient-to-r from-[#006b3f] to-[#005530] text-white shadow-lg shadow-black/30"
                          : "text-slate-400 hover:bg-white/[0.07] hover:text-white"
                      }`}
                    >
                      <Icon className={`h-[17px] w-[17px] ${isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"}`} strokeWidth={2} />
                      <span>{label}</span>
                      {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#fcd116]" />}
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-[#006b3f]/20 to-[#fcd116]/10 px-3 py-3">
          <span className="h-2 w-2 rounded-full bg-[#fcd116] shadow-[0_0_12px_rgba(252,209,22,0.9)]" />
          <div>
            <p className="text-xs font-semibold text-slate-200">System operational</p>
            <p className="mt-0.5 text-[10px] text-slate-500">Secure school workspace</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
