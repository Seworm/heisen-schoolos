export const GHANAIAN_LANGUAGES = [
  { code: "EWE", name: "Ewe", sortOrder: 1 },
  { code: "TWI_ASANTE", name: "Twi (Asante)", sortOrder: 2 },
  { code: "TWI_AKUAPEM", name: "Twi (Akuapem)", sortOrder: 3 },
  { code: "FANTE", name: "Fante", sortOrder: 4 },
  { code: "GA", name: "Ga", sortOrder: 5 },
  { code: "DANGME", name: "Dangme", sortOrder: 6 },
  { code: "DAGBANI", name: "Dagbani", sortOrder: 7 },
  { code: "DAGAARE", name: "Dagaare", sortOrder: 8 },
  { code: "KASEM", name: "Kasem", sortOrder: 9 },
  { code: "NZEMA", name: "Nzema", sortOrder: 10 },
  { code: "GONJA", name: "Gonja", sortOrder: 11 },
] as const;

export type GhanaianLanguageCode = (typeof GHANAIAN_LANGUAGES)[number]["code"];
export type CurriculumStageCode =
  | "KINDERGARTEN"
  | "LOWER_PRIMARY"
  | "UPPER_PRIMARY"
  | "JHS";
export type CurriculumSubjectCategory =
  | "CORE"
  | "COMPULSORY_PARAMETERIZED"
  | "ELECTIVE"
  | "ACTIVITY";

export type CurriculumSubjectDefinition = {
  code: string;
  name: string;
  category: CurriculumSubjectCategory;
  compulsory: boolean;
  parameterized?: "GHANAIAN_LANGUAGE";
  examinable: boolean;
  activityBased: boolean;
  sortOrder: number;
};

export const CURRICULUM: Record<
  CurriculumStageCode,
  { name: string; subjects: readonly CurriculumSubjectDefinition[] }
> = {
  KINDERGARTEN: {
    name: "Kindergarten",
    subjects: [
      subject("ENGLISH_LANGUAGE_LITERACY", "English Language & Literacy", "CORE", true),
      subject("NUMERACY", "Numeracy", "CORE", true),
      subject("OWOP", "Our World Our People (OWOP)", "CORE", true),
      subject("CREATIVE_ARTS", "Creative Arts", "CORE", true),
      languageSubject("GHANAIAN_LANGUAGE_LITERACY", "Ghanaian Language & Literacy"),
    ],
  },
  LOWER_PRIMARY: {
    name: "Lower Primary",
    subjects: [
      subject("ENGLISH_LANGUAGE", "English Language", "CORE", true),
      subject("MATHEMATICS", "Mathematics", "CORE", true),
      subject("SCIENCE", "Science", "CORE", true),
      subject("CREATIVE_ARTS", "Creative Arts", "CORE", true),
      subject("OWOP", "Our World Our People (OWOP)", "CORE", true),
      subject("HISTORY_OF_GHANA", "History of Ghana", "CORE", true),
      subject("RME", "Religious and Moral Education (RME)", "CORE", true),
      subject("PE", "Physical Education (PE)", "CORE", true),
      languageSubject("GHANAIAN_LANGUAGE", "Ghanaian Language"),
      subject("FRENCH", "French", "ELECTIVE", false),
    ],
  },
  UPPER_PRIMARY: {
    name: "Upper Primary",
    subjects: [
      subject("ENGLISH_LANGUAGE", "English Language", "CORE", true),
      subject("MATHEMATICS", "Mathematics", "CORE", true),
      subject("SCIENCE", "Science", "CORE", true),
      subject("COMPUTING", "Computing (ICT)", "CORE", true),
      subject("CREATIVE_ARTS", "Creative Arts", "CORE", true),
      subject("HISTORY_OF_GHANA", "History of Ghana", "CORE", true),
      subject("RME", "Religious and Moral Education (RME)", "CORE", true),
      subject("PE", "Physical Education (PE)", "CORE", true),
      subject("FRENCH", "French", "CORE", true),
      languageSubject("GHANAIAN_LANGUAGE", "Ghanaian Language"),
      subject("ARABIC", "Arabic", "ELECTIVE", false),
    ],
  },
  JHS: {
    name: "Junior High School",
    subjects: [
      subject("ENGLISH_LANGUAGE", "English Language", "CORE", true),
      subject("MATHEMATICS", "Mathematics", "CORE", true),
      subject("GENERAL_SCIENCE", "General Science", "CORE", true),
      subject("SOCIAL_STUDIES", "Social Studies", "CORE", true),
      subject("COMPUTING", "Computing (ICT)", "CORE", true),
      subject("CAREER_TECHNOLOGY", "Career Technology", "CORE", true),
      subject("CREATIVE_ARTS_DESIGN", "Creative Arts and Design", "CORE", true),
      subject("RME", "Religious and Moral Education (RME)", "CORE", true),
      languageSubject("GHANAIAN_LANGUAGE", "Ghanaian Language"),
      subject("FRENCH", "French", "ELECTIVE", false),
      subject("ARABIC", "Arabic", "ELECTIVE", false),
      {
        ...subject("PHYSICAL_HEALTH_EDUCATION", "Physical and Health Education", "ACTIVITY", false),
        examinable: false,
        activityBased: true,
      },
    ],
  },
};

function subject(
  code: string,
  name: string,
  category: CurriculumSubjectCategory,
  compulsory = false,
): CurriculumSubjectDefinition {
  return {
    code,
    name,
    category,
    compulsory,
    examinable: category !== "ACTIVITY",
    activityBased: category === "ACTIVITY",
    sortOrder: 0,
  };
}

function languageSubject(code: string, name: string): CurriculumSubjectDefinition {
  return {
    ...subject(code, name, "COMPULSORY_PARAMETERIZED", true),
    parameterized: "GHANAIAN_LANGUAGE",
  };
}

export function getCurriculumStageForClassLevel(
  className: string,
): CurriculumStageCode | null {
  const normalized = className.trim().toUpperCase().replace(/[\s_-]+/g, "");
  if (/^(KG|KINDERGARTEN)[12]$/.test(normalized)) return "KINDERGARTEN";
  const basicMatch = normalized.match(/^BASIC([1-9])$/);
  if (!basicMatch) return null;
  const level = Number(basicMatch[1]);
  if (level <= 3) return "LOWER_PRIMARY";
  if (level <= 6) return "UPPER_PRIMARY";
  return "JHS";
}

export function isGhanaianLanguageCode(value: string): value is GhanaianLanguageCode {
  return GHANAIAN_LANGUAGES.some((language) => language.code === value);
}

export type CurriculumSelection = {
  subjectCode: string;
  offered: boolean;
  languageCode?: string | null;
};

export function validateCurriculumSelections(
  stage: CurriculumStageCode,
  selections: readonly CurriculumSelection[],
) {
  const definitions = CURRICULUM[stage].subjects;
  const byCode = new Map(definitions.map((definition) => [definition.code, definition]));
  const errors: string[] = [];
  const selectedCodes = new Set<string>();

  for (const selection of selections) {
    if (selectedCodes.has(selection.subjectCode)) {
      errors.push(`Subject ${selection.subjectCode} was configured more than once.`);
      continue;
    }
    selectedCodes.add(selection.subjectCode);
    const definition = byCode.get(selection.subjectCode);
    if (!definition) {
      errors.push(`Subject ${selection.subjectCode} is not available for ${stage}.`);
      continue;
    }
    if (definition.compulsory && !selection.offered) {
      errors.push(`${definition.name} is compulsory and cannot be disabled.`);
    }
    if (definition.parameterized === "GHANAIAN_LANGUAGE" && selection.offered) {
      if (!selection.languageCode || !isGhanaianLanguageCode(selection.languageCode)) {
        errors.push(`${definition.name} requires a valid Ghanaian language.`);
      }
    } else if (selection.languageCode) {
      errors.push(`${definition.name} does not accept a language parameter.`);
    }
    if (definition.activityBased && definition.examinable) {
      errors.push(`${definition.name} cannot be examinable because it is activity-based.`);
    }
  }

  for (const definition of definitions.filter((item) => item.compulsory)) {
    const selection = selections.find((item) => item.subjectCode === definition.code);
    if (!selection || !selection.offered) {
      errors.push(`${definition.name} must be configured.`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function formatConfiguredSubjectName(
  subjectName: string,
  languageCode?: string | null,
) {
  if (!languageCode || !isGhanaianLanguageCode(languageCode)) return subjectName;
  const language = GHANAIAN_LANGUAGES.find((item) => item.code === languageCode);
  const suffix = ` (${language?.name ?? languageCode})`;
  return subjectName.endsWith(suffix) ? subjectName : `${subjectName}${suffix}`;
}
