"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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
      { href: "/admissions", label: "Admissions", icon: GraduationCap },
      { href: "/calendar", label: "Calendar", icon: CalendarDays },
      { href: "/student-services", label: "Student services", icon: ShieldCheck },
      { href: "/reports", label: "Reports", icon: Activity },
      { href: "/operations/documents", label: "Operations", icon: Building2 },
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
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const openNavigation = () => setMobileOpen(true);
    window.addEventListener("heisensms:open-navigation", openNavigation);
    return () => window.removeEventListener("heisensms:open-navigation", openNavigation);
  }, []);

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="school-sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside className={`school-sidebar ${mobileOpen ? "is-mobile-open" : ""}`}>
      <div className="school-sidebar-brand">
        <Link href="/dashboard" className="school-sidebar-logo">
          <span className="school-sidebar-mark">
            <img src="/heisen-logo.png" alt="" className="h-8 w-8 object-contain" />
          </span>
          <span className="min-w-0">
            <span className="school-sidebar-name">Heisen SMS</span>
            <span className="school-sidebar-caption">Education OS</span>
          </span>
        </Link>
      </div>

      <nav className="school-sidebar-nav">
        {isPlatformAdmin && (
          <Link
            href="/platform"
            onClick={() => setMobileOpen(false)}
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
                      onClick={() => setMobileOpen(false)}
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
    </>
  );
}
