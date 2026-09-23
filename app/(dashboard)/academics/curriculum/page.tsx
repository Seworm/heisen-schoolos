import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  classLevels,
  curriculumStages,
  curriculumSubjects,
  ghanaianLanguages,
  schoolCurriculumConfigurations,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";
import { getCurriculumStageForClassLevel } from "@/lib/curriculum";
import { saveCurriculumConfiguration } from "./actions";

export default async function CurriculumPage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string }>;
}) {
  const school = await requireCurrentSchool();
  const params = await searchParams;

  const classes = await db
    .select({
      id: classLevels.id,
      name: classLevels.name,
      category: classLevels.category,
    })
    .from(classLevels)
    .where(eq(classLevels.schoolId, school.id))
    .orderBy(asc(classLevels.sortOrder));

  const selected =
    classes.find((item) => item.id === params.classId) ?? classes[0];

  const stageCode = selected
    ? getCurriculumStageForClassLevel(selected.name)
    : null;

  const [stage] = stageCode
    ? await db
        .select()
        .from(curriculumStages)
        .where(eq(curriculumStages.code, stageCode))
        .limit(1)
    : [];

  const definitions = stage
    ? await db
        .select()
        .from(curriculumSubjects)
        .where(
          and(
            eq(curriculumSubjects.curriculumStageId, stage.id),
            eq(curriculumSubjects.active, true),
          ),
        )
        .orderBy(asc(curriculumSubjects.sortOrder))
    : [];

  const configurations = selected
    ? await db
        .select()
        .from(schoolCurriculumConfigurations)
        .where(
          and(
            eq(schoolCurriculumConfigurations.schoolId, school.id),
            eq(schoolCurriculumConfigurations.classLevelId, selected.id),
          ),
        )
    : [];

  const languages = await db
    .select()
    .from(ghanaianLanguages)
    .where(eq(ghanaianLanguages.active, true))
    .orderBy(asc(ghanaianLanguages.sortOrder));

  const configuredLanguage = configurations.find(
    (item) => item.languageId,
  )?.languageId;

  const selectedLanguage =
    languages.find((language) => language.id === configuredLanguage)?.code ?? "";

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/academics"
        className="text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        ← Back to academics
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-slate-950">
        Curriculum configuration
      </h1>

      <p className="mt-2 text-sm text-slate-500">
        Configure the national curriculum offered by {school.name}.
      </p>

      <form
        method="get"
        className="mt-6"
      >
        <label className="block text-sm font-semibold text-slate-700">
          Class level

          <select
            name="classId"
            defaultValue={selected?.id ?? ""}
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          >
            {classes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          className="mt-3 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800"
        >
          Load curriculum
        </button>
      </form>

      {!selected ? (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
          No class levels have been configured for this school yet.
        </div>
      ) : !stageCode ? (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-bold text-amber-900">
            {selected.name} is not mapped to the national curriculum
          </h2>

          <p className="mt-2 text-sm text-amber-800">
            The Ghanaian curriculum reference data is already seeded. This
            class level does not currently have a national curriculum stage
            mapped to it.
          </p>
        </div>
      ) : !stage ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5">
          <h2 className="font-bold text-red-900">
            Curriculum stage unavailable
          </h2>

          <p className="mt-2 text-sm text-red-800">
            The curriculum stage <strong>{stageCode}</strong> is required for{" "}
            {selected.name}, but it was not found in the curriculum reference
            data.
          </p>
        </div>
      ) : definitions.length === 0 ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5">
          <h2 className="font-bold text-red-900">
            No subjects found for {stage.name}
          </h2>

          <p className="mt-2 text-sm text-red-800">
            The curriculum stage exists, but no active subject definitions are
            available for it.
          </p>
        </div>
      ) : (
        <form action={saveCurriculumConfiguration} className="mt-6">
          <input type="hidden" name="classLevelId" value={selected.id} />

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <h2 className="font-bold text-slate-950">
                {selected.name} · {stage.name}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Select the subjects offered at this class level.
                Compulsory subjects are automatically included.
              </p>
            </div>

            <div className="mt-5 space-y-3">
              {definitions.map((definition) => {
                const configured = configurations.find(
                  (item) => item.curriculumSubjectId === definition.id,
                );

                const checked =
                  definition.compulsory || Boolean(configured?.offered);

                return (
                  <div
                    key={definition.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-100 px-4 py-3"
                  >
                    <label className="flex items-center gap-3 text-sm font-medium text-slate-800">
                      <input
                        type="checkbox"
                        name={`offered_${definition.code}`}
                        defaultChecked={checked}
                        disabled={definition.compulsory}
                        className="h-4 w-4 accent-emerald-700"
                      />

                      <span>{definition.name}</span>

                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                        {definition.category.toLowerCase()}
                      </span>

                      {definition.compulsory ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                          Compulsory
                        </span>
                      ) : null}
                    </label>

                    {definition.parameterized ? (
                      <select
                        name="languageCode"
                        defaultValue={selectedLanguage}
                        required
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                      >
                        <option value="">Select language</option>

                        {languages.map((language) => (
                          <option key={language.id} value={language.code}>
                            {language.name}
                          </option>
                        ))}
                      </select>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <button
              type="submit"
              className="mt-6 rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-800"
            >
              Save curriculum
            </button>
          </section>
        </form>
      )}
    </main>
  );
}