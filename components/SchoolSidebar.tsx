"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Building2,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Users,
  UsersRound,
} from "lucide-react";
import { useState } from "react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const sections: NavSection[] = [
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        label: "Reports",
        href: "/reports",
        icon: BarChart3,
      },
      {
        label: "Teacher portal",
        href: "/teacher",
        icon: ClipboardList,
      },
    ],
  },
  {
    label: "Academics",
    items: [
      {
        label: "Classes",
        href: "/academics/classes",
        icon: GraduationCap,
      },
      {
        label: "Subjects",
        href: "/academics/subjects",
        icon: BookOpen,
      },
      {
        label: "Academic Years",
        href: "/academics/academic-years",
        icon: CalendarDays,
      },
      {
        label: "Assessments",
        href: "/assessments",
        icon: ClipboardList,
      },
      {
        label: "Results",
        href: "/assessments/results",
        icon: BarChart3,
      },
      {
        label: "Calendar",
        href: "/calendar",
        icon: CalendarDays,
      },
    ],
  },
  {
    label: "People",
    items: [
      {
        label: "Students",
        href: "/students",
        icon: Users,
      },
      {
        label: "Admissions",
        href: "/admissions",
        icon: ClipboardList,
      },
      {
        label: "Guardians",
        href: "/guardians",
        icon: UsersRound,
      },
      {
        label: "Staff",
        href: "/staff",
        icon: ShieldCheck,
      },
      {
        label: "Leave & absence",
        href: "/staff/leave",
        icon: CalendarDays,
      },
      {
        label: "Student services",
        href: "/student-services",
        icon: ShieldCheck,
      },
    ],
  },
  {
    label: "School",
    items: [
      {
        label: "School Profile",
        href: "/school",
        icon: Building2,
      },
      {
        label: "Settings",
        href: "/settings",
        icon: Settings,
      },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SchoolSidebar() {
  const pathname = usePathname();

  const [collapsedSections, setCollapsedSections] = useState<
    Record<string, boolean>
  >({});

  function toggleSection(label: string) {
    setCollapsedSections((current) => ({
      ...current,
      [label]: !current[label],
    }));
  }

  return (
    <aside className="sticky top-0 hidden h-screen w-[284px] shrink-0 border-r border-white/10 bg-[#071c34] text-slate-50 lg:flex lg:flex-col">
      {/* Brand */}
      <div className="flex h-20 shrink-0 items-center border-b border-white/10 px-5">
        <Link
          href="/dashboard"
          className="flex min-w-0 items-center gap-3 rounded-lg outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[#f6a53a]"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f6a53a] shadow-lg shadow-[#f6a53a]/30">
            <GraduationCap className="h-5 w-5 text-[#081c35]" strokeWidth={2.2} />
          </div>

          <div className="min-w-0">
            <p className="truncate text-[15px] font-bold tracking-tight text-white">
              Heisen SchoolOS
            </p>
            <p className="mt-0.5 truncate text-[11px] font-medium text-slate-300">
              Your school, connected
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <div className="space-y-6">
          {sections.map((section) => {
            const isCollapsed = collapsedSections[section.label];

            return (
              <section key={section.label}>
                <button
                  type="button"
                  onClick={() => toggleSection(section.label)}
                  className="mb-2 flex w-full items-center justify-between px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 transition-colors hover:text-slate-200"
                >
                  <span>{section.label}</span>

                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${
                      isCollapsed ? "-rotate-90" : ""
                    }`}
                  />
                </button>

                {!isCollapsed && (
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const active = isActive(pathname, item.href);
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={[
                            "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all",
                            "outline-none focus-visible:ring-2 focus-visible:ring-[#f6a53a]",
                            active
                              ? "bg-[#f6a53a]/12 text-white shadow-md shadow-[#f6a53a]/10"
                              : "text-slate-300 hover:bg-white/5 hover:text-white",
                          ].join(" ")}
                        >
                          <span
                            className={[
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors",
                              active
                                ? "bg-[#f6a53a]/18 text-[#f9d49f]"
                                : "bg-white/5 text-slate-300 group-hover:bg-white/10 group-hover:text-white",
                            ].join(" ")}
                          >
                            <Icon
                              className="h-[17px] w-[17px]"
                              strokeWidth={2}
                            />
                          </span>

                          <span className="truncate">{item.label}</span>

                          {active && (
                            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#f6a53a]" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </nav>

      {/* Bottom status */}
      <div className="shrink-0 border-t border-white/10 p-3">
        <div className="rounded-xl border border-white/10 bg-[#0d2346] p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f6a53a]/10 text-[#f9d49f]">
              <ShieldCheck className="h-4.5 w-4.5" strokeWidth={2} />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-200">
                System Secure
              </p>
              <p className="mt-0.5 text-[10px] text-slate-400">
                SchoolOS is operational
              </p>
            </div>

            <span className="ml-auto h-2 w-2 rounded-full bg-[#f6a53a] shadow-sm shadow-[#f6a53a]/50" />
          </div>
        </div>
      </div>
    </aside>
  );
}
