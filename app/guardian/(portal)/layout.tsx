import Link from "next/link";
import { BellRing, BookOpenText, CalendarCheck2, Home, ReceiptText, Users } from "lucide-react";
import { requireCurrentGuardian } from "@/lib/guardian-auth";

const navItems = [
  { href: "/guardian/dashboard", label: "Dashboard", icon: Home },
  { href: "/guardian/attendance", label: "Attendance", icon: CalendarCheck2 },
  { href: "/guardian/results", label: "Results", icon: BookOpenText },
  { href: "/guardian/fees", label: "Fees", icon: ReceiptText },
  { href: "/guardian/announcements", label: "Announcements", icon: BellRing },
  { href: "/guardian/profile", label: "Profile", icon: Users },
];

export default async function GuardianPortalLayout({ children }: { children: React.ReactNode }) {
  const { session } = await requireCurrentGuardian();
  if (session.user.mustChangePassword) {
    const { redirect } = await import("next/navigation");
    redirect("/guardian/change-password");
  }

  const guardianName = [session.user.firstName, session.user.lastName].filter(Boolean).join(" ") || "Guardian";

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <div className="flex h-20 items-center border-b border-slate-200 px-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Parent portal</p>
            <p className="mt-1 text-base font-semibold text-slate-950">Heisen SMS</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2 px-3 py-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">Guardian</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{guardianName}</p>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Portal overview</p>
              <p className="mt-1 text-lg font-semibold text-slate-950">Child dashboard</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                {guardianName.charAt(0).toUpperCase() || "G"}
              </div>
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-65px)]">
          {children}
        </main>
      </div>
    </div>
  );
}
