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
  ShieldCheck,
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
    <aside className="school-sidebar">
      <div className="school-sidebar-brand">
        <Link href="/dashboard" className="school-sidebar-logo">
          <span className="school-sidebar-mark">
            <GraduationCap className="h-5 w-5" strokeWidth={2.3} />
          </span>
          <span className="min-w-0">
            <span className="school-sidebar-name">Heisen SchoolOS</span>
            <span className="school-sidebar-caption">Education OS</span>
          </span>
        </Link>
      </div>

      <nav className="school-sidebar-nav">
        {isPlatformAdmin && (
          <Link
            href="/platform"
            className={`school-sidebar-workspace ${
              active(pathname, "/platform")
                ? "is-active"
                : ""
            }`}
          >
            <span className="school-sidebar-workspace-icon">
              <Building2 className="h-4 w-4" />
            </span>
            <span>
              <span className="school-sidebar-workspace-label">Platform</span>
              <span className="school-sidebar-workspace-title">All schools</span>
            </span>
            <Activity className="school-sidebar-workspace-pulse" />
          </Link>
        )}

        <div className="school-sidebar-groups">
          {groups.map((group) => (
            <section className="school-sidebar-group" key={group.label}>
              <p className="school-sidebar-group-label">{group.label}</p>
              <div className="school-sidebar-items">
                {group.items.map(({ href, label, icon: Icon }) => {
                  const isActive = active(pathname, href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`school-sidebar-item ${
                        isActive
                          ? "is-active"
                          : ""
                      }`}
                    >
                      <span className="school-sidebar-item-icon">
                        <Icon strokeWidth={2} />
                      </span>
                      <span className="school-sidebar-item-label">{label}</span>
                      {isActive && <span className="school-sidebar-item-dot" />}
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </nav>

      <div className="school-sidebar-footer">
        <div className="school-sidebar-status">
          <span className="school-sidebar-status-mark"><span /></span>
          <div>
            <p className="school-sidebar-status-title">System operational</p>
            <p className="school-sidebar-status-caption">Secure school workspace</p>
          </div>
          <ShieldCheck className="school-sidebar-status-icon" />
        </div>
      </div>
    </aside>
  );
}
