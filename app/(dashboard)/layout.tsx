import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireCurrentSchool } from "@/lib/current-school";
import { SchoolSidebar } from "@/components/SchoolSidebar";
import { SchoolTopbar } from "@/components/SchoolTopbar";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  let school;

  try {
    school = await requireCurrentSchool();
  } catch {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-slate-900">
      <div className="flex min-h-screen">
        {/* Fixed navigation */}
        <SchoolSidebar />

        {/* Application workspace */}
        <div className="min-w-0 flex-1 bg-[#F5F7FB]">
          <SchoolTopbar school={school} />

          <main className="min-h-[calc(100vh-4rem)] px-4 py-5 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1600px]">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

