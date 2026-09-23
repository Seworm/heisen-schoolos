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
  const languageCode =
    String(formData.get("languageCode") ?? "").trim() || null;

  const [classLevel] = await db
    .select()
    .from(classLevels)
    .where(
      and(
        eq(classLevels.id, classLevelId),
        eq(classLevels.schoolId, school.id),
      ),
    )
    .limit(1);

  if (!classLevel) {
    throw new Error("Class level was not found.");
  }

  const stageCode = getCurriculumStageForClassLevel(classLevel.name);

  if (!stageCode) {
    throw new Error(
      "This class level is not mapped to the Ghanaian curriculum.",
    );
  }

  const [stage] = await db
    .select()
    .from(curriculumStages)
    .where(eq(curriculumStages.code, stageCode))
    .limit(1);

  if (!stage) {
    throw new Error("Curriculum reference data has not been seeded.");
  }

  const definitions = await db
    .select()
    .from(curriculumSubjects)
    .where(
      and(
        eq(curriculumSubjects.curriculumStageId, stage.id),
        eq(curriculumSubjects.active, true),
      ),
    );

  const selections = definitions.map((definition) => ({
    subjectCode: definition.code,
    offered:
      definition.compulsory ||
      formData.get(`offered_${definition.code}`) === "on",
    languageCode: definition.parameterized ? languageCode : null,
  }));

  const validation = validateCurriculumSelections(stageCode, selections);

  if (!validation.valid) {
    throw new Error(validation.errors.join(" "));
  }

  let languageId: string | null = null;

  if (languageCode) {
    if (!isGhanaianLanguageCode(languageCode)) {
      throw new Error("Select a valid Ghanaian language.");
    }

    const [language] = await db
      .select({ id: ghanaianLanguages.id })
      .from(ghanaianLanguages)
      .where(
        and(
          eq(ghanaianLanguages.code, languageCode),
          eq(ghanaianLanguages.active, true),
        ),
      )
      .limit(1);

    if (!language) {
      throw new Error("The selected Ghanaian language is unavailable.");
    }

    languageId = language.id;
  }

  await db.transaction(async (tx) => {
    for (const definition of definitions) {
      const offered =
        definition.compulsory ||
        formData.get(`offered_${definition.code}`) === "on";

      /*
       * Save the school's curriculum configuration.
       */
      const [existingConfiguration] = await tx
        .select({ id: schoolCurriculumConfigurations.id })
        .from(schoolCurriculumConfigurations)
        .where(
          and(
            eq(schoolCurriculumConfigurations.schoolId, school.id),
            eq(schoolCurriculumConfigurations.classLevelId, classLevel.id),
            eq(
              schoolCurriculumConfigurations.curriculumSubjectId,
              definition.id,
            ),
          ),
        )
        .limit(1);

      if (existingConfiguration) {
        await tx
          .update(schoolCurriculumConfigurations)
          .set({
            offered,
            languageId: definition.parameterized ? languageId : null,
            updatedAt: new Date(),
          })
          .where(
            eq(
              schoolCurriculumConfigurations.id,
              existingConfiguration.id,
            ),
          );
      } else {
        await tx.insert(schoolCurriculumConfigurations).values({
          schoolId: school.id,
          classLevelId: classLevel.id,
          curriculumSubjectId: definition.id,
          offered,
          languageId: definition.parameterized ? languageId : null,
        });
      }

      /*
       * Determine the final display name.
       */
      const languageName = languageCode
        ? GHANAIAN_LANGUAGES.find(
            (language) => language.code === languageCode,
          )?.name
        : null;

      const displayName =
        definition.parameterized && languageName
          ? `${definition.name} (${languageName})`
          : definition.name;

      /*
       * Find all existing subjects for this curriculum definition.
       *
       * We check both:
       * 1. curriculumCode, for subjects created by the new system;
       * 2. school + display name, for legacy subjects created before
       *    curriculumCode was introduced.
       */
      const curriculumSubjectsForSchool = await tx
        .select({
          id: subjects.id,
          name: subjects.name,
          curriculumCode: subjects.curriculumCode,
          languageCode: subjects.languageCode,
        })
        .from(subjects)
        .where(
          and(
            eq(subjects.schoolId, school.id),
            eq(subjects.curriculumCode, definition.code),
          ),
        );

      const [subjectByName] = await tx
        .select({
          id: subjects.id,
          name: subjects.name,
          curriculumCode: subjects.curriculumCode,
          languageCode: subjects.languageCode,
        })
        .from(subjects)
        .where(
          and(
            eq(subjects.schoolId, school.id),
            eq(subjects.name, displayName),
          ),
        )
        .limit(1);

      /*
       * Prefer the exact curriculum subject.
       * Otherwise reuse the existing subject with the same name.
       * Only create a new subject when neither exists.
       */
      const configuredSubject =
        curriculumSubjectsForSchool.find((item) =>
          definition.parameterized
            ? item.languageCode === languageCode
            : item.languageCode === null,
        ) ?? subjectByName;

      let subjectId: string;

      if (offered) {
        if (configuredSubject) {
          /*
           * Upgrade/reconcile an old subject so it becomes a proper
           * curriculum-managed subject.
           */
          await tx
            .update(subjects)
            .set({
              name: displayName,
              code: definition.code,
              curriculumCode: definition.code,
              languageCode: definition.parameterized
                ? languageCode
                : null,
              examinable: definition.examinable,
              activityBased: definition.activityBased,
            })
            .where(eq(subjects.id, configuredSubject.id));

          subjectId = configuredSubject.id;
        } else {
          const [createdSubject] = await tx
            .insert(subjects)
            .values({
              schoolId: school.id,
              name: displayName,
              code: definition.code,
              curriculumCode: definition.code,
              languageCode: definition.parameterized
                ? languageCode
                : null,
              examinable: definition.examinable,
              activityBased: definition.activityBased,
            })
            .returning({ id: subjects.id });

          if (!createdSubject) {
            throw new Error(`Could not create ${definition.name}.`);
          }

          subjectId = createdSubject.id;
        }

        /*
         * Link the subject to this class level.
         */
        const [linked] = await tx
          .select({ id: classSubjects.id })
          .from(classSubjects)
          .where(
            and(
              eq(classSubjects.classLevelId, classLevel.id),
              eq(classSubjects.subjectId, subjectId),
            ),
          )
          .limit(1);

        if (!linked) {
          await tx.insert(classSubjects).values({
            classLevelId: classLevel.id,
            subjectId,
          });
        }

        /*
         * Remove stale curriculum variants from this class only.
         * We never delete the subject itself here because another
         * class or an assessment may still reference it.
         */
        const staleSubjectIds = curriculumSubjectsForSchool
          .filter((item) => item.id !== subjectId)
          .map((item) => item.id);

        for (const staleSubjectId of staleSubjectIds) {
          await tx
            .delete(classSubjects)
            .where(
              and(
                eq(classSubjects.classLevelId, classLevel.id),
                eq(classSubjects.subjectId, staleSubjectId),
              ),
            );
        }
      } else {
        /*
         * Subject is not offered for this class.
         * Remove only this class's link.
         */
        const schoolSubjects = await tx
          .select({ id: subjects.id })
          .from(subjects)
          .where(
            and(
              eq(subjects.schoolId, school.id),
              eq(subjects.name, displayName),
            ),
          );

        for (const schoolSubject of schoolSubjects) {
          await tx
            .delete(classSubjects)
            .where(
              and(
                eq(classSubjects.classLevelId, classLevel.id),
                eq(classSubjects.subjectId, schoolSubject.id),
              ),
            );
        }
      }
    }
  });

  redirect(`/academics/curriculum?classId=${classLevel.id}`);
}
