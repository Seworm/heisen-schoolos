import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db";
import { classLevels } from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";
import ClassEditForm from "./ClassEditForm";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditClassPage({
  params,
}: Props) {
  const { id } = await params;
  const school = await requireCurrentSchool();

  const [classLevel] = await db
    .select()
    .from(classLevels)
    .where(eq(classLevels.id, id))
    .limit(1);

  if (
    !classLevel ||
    classLevel.schoolId !== school.id
  ) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 lg:px-8">
      <ClassEditForm
        classLevel={classLevel}
      />
    </div>
  );
}