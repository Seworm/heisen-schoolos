import { requireTeacherScope } from "@/lib/authorization";
import { requireCurrentSchool } from "@/lib/current-school";
import TeacherDashboard from "./TeacherDashboard";

export const dynamic = "force-dynamic";

export default async function TeacherPage() {
  const school = await requireCurrentSchool();
  const user = await requireTeacherScope(school.id);
  return <TeacherDashboard schoolId={school.id} user={user} />;
}
