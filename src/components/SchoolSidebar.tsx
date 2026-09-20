import Link from "next/link";
import { BookOpen, CalendarDays, ClipboardCheck, DollarSign, GraduationCap, LayoutDashboard, Megaphone, Settings, Users, UserCog, Clock3 } from "lucide-react";

const groups = [
  { label: "Main", items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }] },
  { label: "Management", items: [
    { href: "/students", label: "Students", icon: Users },
    { href: "/staff", label: "Staff", icon: UserCog },
    { href: "/academics", label: "Academics", icon: BookOpen },
    { href: "/attendance", label: "Attendance", icon: CalendarDays },
    { href: "/assessments", label: "Assessments & Results", icon: ClipboardCheck },
    { href: "/finance", label: "Fees & Finance", icon: DollarSign },
    { href: "/timetable", label: "Timetable", icon: Clock3 },
    { href: "/communications", label: "Communications", icon: Megaphone },
  ]},
  { label: "System", items: [
    { href: "/admin", label: "Administration", icon: GraduationCap },
    { href: "/settings", label: "Settings", icon: Settings },
  ]},
] as const;

export function SchoolSidebar() {
  return <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
    <div className="flex h-16 items-center border-b border-slate-200 px-5">
      <div><p className="font-semibold tracking-tight text-slate-950">Heisen SchoolOS</p><p className="text-xs text-slate-500">Ghanaian School Management</p></div>
    </div>
    <nav className="space-y-7 p-4">
      {groups.map((group) => <div key={group.label}>
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">{group.label}</p>
        <div className="space-y-1">{group.items.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-950"><Icon className="h-4 w-4" />{label}</Link>)}</div>
      </div>)}
    </nav>
  </aside>;
}
