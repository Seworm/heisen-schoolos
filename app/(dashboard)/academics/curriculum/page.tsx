import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { classLevels, curriculumStages, curriculumSubjects, ghanaianLanguages, schoolCurriculumConfigurations } from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";
import { getCurriculumStageForClassLevel } from "@/lib/curriculum";
import { saveCurriculumConfiguration } from "./actions";

export default async function CurriculumPage({ searchParams }: { searchParams: Promise<{ classId?: string }> }) {
  const school = await requireCurrentSchool();
  const params = await searchParams;
  const classes = await db.select({ id: classLevels.id, name: classLevels.name, category: classLevels.category }).from(classLevels).where(eq(classLevels.schoolId, school.id)).orderBy(asc(classLevels.sortOrder));
  const selected = classes.find((item) => item.id === params.classId) ?? classes[0];
  const stageCode = selected ? getCurriculumStageForClassLevel(selected.name) : null;
  const [stage] = stageCode ? await db.select().from(curriculumStages).where(eq(curriculumStages.code, stageCode)).limit(1) : [];
  const definitions = stage ? await db.select().from(curriculumSubjects).where(and(eq(curriculumSubjects.curriculumStageId, stage.id), eq(curriculumSubjects.active, true))).orderBy(asc(curriculumSubjects.sortOrder)) : [];
  const configurations = selected ? await db.select().from(schoolCurriculumConfigurations).where(and(eq(schoolCurriculumConfigurations.schoolId, school.id), eq(schoolCurriculumConfigurations.classLevelId, selected.id))) : [];
  const languages = await db.select().from(ghanaianLanguages).where(eq(ghanaianLanguages.active, true)).orderBy(asc(ghanaianLanguages.sortOrder));
  const configuredLanguage = configurations.find((item) => item.languageId)?.languageId;
  const selectedLanguage = languages.find((language) => language.id === configuredLanguage)?.code ?? "";
  return <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
    <Link href="/academics" className="text-sm text-slate-500">← Back to academics</Link>
    <h1 className="mt-4 text-2xl font-bold text-slate-950">Curriculum configuration</h1>
    <p className="mt-2 text-sm text-slate-500">Configure the national curriculum offered by {school.name}.</p>
    <form action={saveCurriculumConfiguration} className="mt-6 space-y-6">
      <label className="block text-sm font-semibold text-slate-700">Class level
        <select name="classLevelId" defaultValue={selected?.id} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5">
          {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>
      {definitions.length === 0 ? <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Run the curriculum reference seed before configuring subjects.</div> : <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold text-slate-950">{selected?.name} · {stage?.name}</h2>
        <div className="mt-5 space-y-3">
          {definitions.map((definition) => {
            const configured = configurations.find((item) => item.curriculumSubjectId === definition.id);
            const checked = definition.compulsory || configured?.offered;
            return <div key={definition.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-100 px-4 py-3">
              <label className="flex items-center gap-3 text-sm font-medium text-slate-800"><input type="checkbox" name={`offered_${definition.code}`} defaultChecked={checked} disabled={definition.compulsory} className="h-4 w-4 accent-[#087443]" />{definition.name}<span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{definition.category.toLowerCase()}</span></label>
              {definition.parameterized ? <select name="languageCode" defaultValue={selectedLanguage} required className="rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="">Select language</option>{languages.map((language) => <option key={language.id} value={language.code}>{language.name}</option>)}</select> : null}
            </div>;
          })}
        </div>
        <button type="submit" className="mt-6 rounded-lg bg-[#087443] px-5 py-2.5 text-sm font-bold text-white">Save curriculum</button>
      </section>}
    </form>
  </main>;
}
