import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db";
import { classLevels } from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

import StreamForm from "./StreamForm";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function NewStreamPage({
  params,
}: Props) {
  const { id } = await params;
  const school = await requireCurrentSchool();

  const [classLevel] = await db
    .select({
      id: classLevels.id,
      name: classLevels.name,
    })
    .from(classLevels)
    .where(
      and(
        eq(classLevels.id, id),
        eq(classLevels.schoolId, school.id),
      ),
    )
    .limit(1);

  if (!classLevel) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">
          Academics / Classes / Streams
        </p>

        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
          Create stream
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Add a new stream to {classLevel.name}.
        </p>
      </div>

      <StreamForm
        classLevelId={classLevel.id}
        className={classLevel.name}
      />
    </div>
  );
}
