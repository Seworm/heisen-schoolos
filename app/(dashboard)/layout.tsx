import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { requireCurrentSchool } from "@/lib/current-school";
import { SchoolSidebar } from "@/components/SchoolSidebar";
import { SchoolTopbar } from "@/components/SchoolTopbar";
import { getApplicationSession } from "@/lib/auth/compat";
import { getAvailableSchools } from "@/lib/school-workspace";
import SchoolSelection from "./SchoolSelection";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getApplicationSession();
  const activeSchoolId = (await cookies()).get("schoolos_active_school_id")?.value;
  const isPlatformAdmin = Boolean(session?.user.isPlatformAdmin);

  if (isPlatformAdmin && !session?.user.schoolId && !activeSchoolId) {
    const availableSchools = await getAvailableSchools();

    return <SchoolSelection schools={availableSchools} />;
  }

  const school = await requireCurrentSchool();
  const availableSchools =
    isPlatformAdmin ? await getAvailableSchools() : [];

  return (
    <div className="min-h-screen bg-[#f8faf7] text-slate-900">
      <div className="flex min-h-screen">
        {/* Fixed navigation */}
        <SchoolSidebar isPlatformAdmin={isPlatformAdmin} />

        {/* Application workspace */}
        <div className="min-w-0 flex-1 bg-[radial-gradient(circle_at_top_right,rgba(252,209,22,0.14),transparent_28rem)]">
          <SchoolTopbar
            school={school}
            availableSchools={availableSchools}
            isPlatformAdmin={isPlatformAdmin}
          />

          <main className="min-h-[calc(100vh-4rem)] px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1600px]">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
