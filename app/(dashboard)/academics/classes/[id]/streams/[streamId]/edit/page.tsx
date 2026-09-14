import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db";
import {
  classLevels,
  streams,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";
import StreamEditForm from "./StreamEditForm";

type Props = {
  params: Promise<{
    id: string;
    streamId: string;
  }>;
};

export default async function EditStreamPage({
  params,
}: Props) {
  const { id, streamId } = await params;
  const school = await requireCurrentSchool();

  const [result] = await db
    .select({
      classLevel: classLevels,
      stream: streams,
    })
    .from(streams)
    .innerJoin(
      classLevels,
      eq(
        streams.classLevelId,
        classLevels.id,
      ),
    )
    .where(
      and(
        eq(streams.id, streamId),
        eq(streams.classLevelId, id),
        eq(classLevels.schoolId, school.id),
      ),
    )
    .limit(1);

  if (!result) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 lg:px-8">
      <Link
        href={`/academics/classes/${result.classLevel.id}`}
        className="text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        ← Back to {result.classLevel.name}
      </Link>

      <div className="mt-4">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
          Edit stream
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Update the configuration for{" "}
          {result.classLevel.name} {result.stream.name}.
        </p>
      </div>

      <div className="mt-8">
        <StreamEditForm
          stream={result.stream}
          classLevel={result.classLevel}
        />
      </div>
    </div>
  );
}