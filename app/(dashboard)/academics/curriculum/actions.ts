"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  classLevels,
  classSubjects,
  curriculumStages,
  curriculumSubjects,
  ghanaianLanguages,
  schoolCurriculumConfigurations,
  subjects,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";
import {
  GHANAIAN_LANGUAGES,
  getCurriculumStageForClassLevel,
  isGhanaianLanguageCode,
  validateCurriculumSelections,
} from "@/lib/curriculum";

export async function saveCurriculumConfiguration(formData: FormData) {
  const school = await requireCurrentSchool();
  const classLevelId = String(formData.get("classLevelId") ?? "").trim();
  const languageCode = String(formData.get("languageCode") ?? "").trim() || null;
  const [classLevel] = await db.select().from(classLevels).where(and(eq(classLevels.id, classLevelId), eq(classLevels.schoolId, school.id))).limit(1);
  if (!classLevel) throw new Error("Class level was not found.");
  const stageCode = getCurriculumStageForClassLevel(classLevel.name);
  if (!stageCode) throw new Error("This class level is not mapped to the Ghanaian curriculum.");
  const [stage] = await db.select().from(curriculumStages).where(eq(curriculumStages.code, stageCode)).limit(1);
  if (!stage) throw new Error("Curriculum reference data has not been seeded.");
  const definitions = await db.select().from(curriculumSubjects).where(and(eq(curriculumSubjects.curriculumStageId, stage.id), eq(curriculumSubjects.active, true)));
  const selections = definitions.map((definition) => ({
    subjectCode: definition.code,
    offered: definition.compulsory || formData.get(`offered_${definition.code}`) === "on",
    languageCode: definition.parameterized ? languageCode : null,
  }));
  const validation = validateCurriculumSelections(stageCode, selections);
  if (!validation.valid) throw new Error(validation.errors.join(" "));
  let languageId: string | null = null;
  if (languageCode) {
    if (!isGhanaianLanguageCode(languageCode)) throw new Error("Select a valid Ghanaian language.");
    const [language] = await db.select({ id: ghanaianLanguages.id }).from(ghanaianLanguages).where(and(eq(ghanaianLanguages.code, languageCode), eq(ghanaianLanguages.active, true))).limit(1);
    if (!language) throw new Error("The selected Ghanaian language is unavailable.");
    languageId = language.id;
  }
  await db.transaction(async (tx) => {
    for (const definition of definitions) {
      const offered = definition.compulsory || formData.get(`offered_${definition.code}`) === "on";
      const [existing] = await tx.select({ id: schoolCurriculumConfigurations.id }).from(schoolCurriculumConfigurations).where(and(eq(schoolCurriculumConfigurations.schoolId, school.id), eq(schoolCurriculumConfigurations.classLevelId, classLevel.id), eq(schoolCurriculumConfigurations.curriculumSubjectId, definition.id))).limit(1);
      if (existing) {
        await tx.update(schoolCurriculumConfigurations).set({ offered, languageId: definition.parameterized ? languageId : null, updatedAt: new Date() }).where(eq(schoolCurriculumConfigurations.id, existing.id));
      } else {
        await tx.insert(schoolCurriculumConfigurations).values({ schoolId: school.id, classLevelId: classLevel.id, curriculumSubjectId: definition.id, offered, languageId: definition.parameterized ? languageId : null });
      }
      const schoolSubjects = await tx
        .select({ id: subjects.id, languageCode: subjects.languageCode })
        .from(subjects)
        .where(and(
          eq(subjects.schoolId, school.id),
          eq(subjects.curriculumCode, definition.code),
        ));
      const configuredSubject = schoolSubjects.find((item) =>
        definition.parameterized
          ? item.languageCode === languageCode
          : item.languageCode === null,
      );
      const staleSubjectIds = schoolSubjects
        .filter((item) => item.id !== configuredSubject?.id)
        .map((item) => item.id);
      if (offered) {
        const languageName = languageCode
          ? GHANAIAN_LANGUAGES.find((language) => language.code === languageCode)?.name
          : null;
        const displayName = definition.parameterized && languageName
          ? `${definition.name} (${languageName})`
          : definition.name;
        const subject = configuredSubject ?? (await tx.insert(subjects).values({ schoolId: school.id, name: displayName, code: definition.code, curriculumCode: definition.code, languageCode: definition.parameterized ? languageCode : null, examinable: definition.examinable, activityBased: definition.activityBased }).returning({ id: subjects.id }))[0];
        if (!subject) throw new Error(`Could not create ${definition.name}.`);
        const [linked] = await tx.select({ id: classSubjects.id }).from(classSubjects).where(and(eq(classSubjects.classLevelId, classLevel.id), eq(classSubjects.subjectId, subject.id))).limit(1);
        if (!linked) await tx.insert(classSubjects).values({ classLevelId: classLevel.id, subjectId: subject.id });
        for (const staleSubjectId of staleSubjectIds) {
          await tx.delete(classSubjects).where(and(
            eq(classSubjects.classLevelId, classLevel.id),
            eq(classSubjects.subjectId, staleSubjectId),
          ));
        }
      } else {
        for (const schoolSubject of schoolSubjects) {
          await tx.delete(classSubjects).where(and(
            eq(classSubjects.classLevelId, classLevel.id),
            eq(classSubjects.subjectId, schoolSubject.id),
          ));
        }
      }
    }
  });
  redirect(`/academics/curriculum?classId=${classLevel.id}`);
}
