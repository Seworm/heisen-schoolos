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

export type GhanaianLanguageCode =
  (typeof GHANAIAN_LANGUAGES)[number]["code"];

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
  /**
   * ============================================================
   * KINDERGARTEN
   * KG 1 – KG 2
   * ============================================================
   */
  KINDERGARTEN: {
    name: "Kindergarten",
    subjects: [
      subject(
        "ENGLISH_LANGUAGE_LITERACY",
        "English Language & Literacy",
        "CORE",
        true,
      ),
      subject("NUMERACY", "Numeracy", "CORE", true),
      subject("OWOP", "Our World Our People (OWOP)", "CORE", true),
      subject("CREATIVE_ARTS", "Creative Arts", "CORE", true),
      languageSubject(
        "GHANAIAN_LANGUAGE_LITERACY",
        "Ghanaian Language & Literacy",
      ),
    ],
  },

  /**
   * ============================================================
   * LOWER PRIMARY
   * BASIC 1 – BASIC 3
   * ============================================================
   */
  LOWER_PRIMARY: {
    name: "Lower Primary",
    subjects: [
      subject("ENGLISH_LANGUAGE", "English Language", "CORE", true),
      subject("MATHEMATICS", "Mathematics", "CORE", true),
      subject("SCIENCE", "Science", "CORE", true),
      subject("CREATIVE_ARTS", "Creative Arts", "CORE", true),
      subject("OWOP", "Our World Our People (OWOP)", "CORE", true),
      subject("HISTORY_OF_GHANA", "History of Ghana", "CORE", true),
      subject(
        "RME",
        "Religious and Moral Education (RME)",
        "CORE",
        true,
      ),
      subject("PE", "Physical Education (PE)", "CORE", true),
      languageSubject("GHANAIAN_LANGUAGE", "Ghanaian Language"),
      subject("FRENCH", "French", "ELECTIVE", false),
    ],
  },

  /**
   * ============================================================
   * UPPER PRIMARY
   * BASIC 4 – BASIC 6
   * ============================================================
   */
  UPPER_PRIMARY: {
    name: "Upper Primary",
    subjects: [
      subject("ENGLISH_LANGUAGE", "English Language", "CORE", true),
      subject("MATHEMATICS", "Mathematics", "CORE", true),
      subject("SCIENCE", "Science", "CORE", true),
      subject("COMPUTING", "Computing (ICT)", "CORE", true),
      subject("CREATIVE_ARTS", "Creative Arts", "CORE", true),
      subject("HISTORY_OF_GHANA", "History of Ghana", "CORE", true),
      subject(
        "RME",
        "Religious and Moral Education (RME)",
        "CORE",
        true,
      ),
      subject("PE", "Physical Education (PE)", "CORE", true),
      subject("FRENCH", "French", "CORE", true),
      languageSubject("GHANAIAN_LANGUAGE", "Ghanaian Language"),
      subject("ARABIC", "Arabic", "ELECTIVE", false),
    ],
  },

  /**
   * ============================================================
   * JUNIOR HIGH SCHOOL
   *
   * JHS 1 – JHS 3
   * BASIC 7 – BASIC 9
   *
   * Common Core Programme (CCP)
   * ============================================================
   */
  JHS: {
    name: "Junior High School (Common Core Programme)",
    subjects: [
      // Core / BECE subjects
      subject("ENGLISH_LANGUAGE", "English Language", "CORE", true),

      subject("MATHEMATICS", "Mathematics", "CORE", true),

      subject("GENERAL_SCIENCE", "General Science", "CORE", true),

      subject("SOCIAL_STUDIES", "Social Studies", "CORE", true),

      subject("COMPUTING", "Computing (ICT)", "CORE", true),

      subject(
        "CAREER_TECHNOLOGY",
        "Career Technology",
        "CORE",
        true,
      ),

      subject(
        "CREATIVE_ARTS_DESIGN",
        "Creative Arts and Design",
        "CORE",
        true,
      ),

      languageSubject("GHANAIAN_LANGUAGE", "Ghanaian Language"),

      subject(
        "RME",
        "Religious and Moral Education (RME)",
        "CORE",
        true,
      ),

      // Optional / elective
      subject("FRENCH", "French", "ELECTIVE", false),

      subject("ARABIC", "Arabic", "ELECTIVE", false),

      // Non-core activity
      {
        ...subject(
          "PHYSICAL_HEALTH_EDUCATION",
          "Physical and Health Education (PHE)",
          "ACTIVITY",
          false,
        ),
        examinable: false,
        activityBased: true,
      },
    ],
  },
};

/**
 * Create a standard curriculum subject definition.
 */
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

/**
 * Create a compulsory Ghanaian-language subject.
 *
 * The actual language is selected by the school:
 * Ewe, Twi, Fante, Ga, etc.
 */
function languageSubject(
  code: string,
  name: string,
): CurriculumSubjectDefinition {
  return {
    ...subject(
      code,
      name,
      "COMPULSORY_PARAMETERIZED",
      true,
    ),
    parameterized: "GHANAIAN_LANGUAGE",
  };
}

/**
 * Map a school class level to the Ghanaian national curriculum stage.
 *
 * Supported national stages:
 *
 * KG 1 – KG 2
 * Basic 1 – Basic 3
 * Basic 4 – Basic 6
 * Basic 7 – Basic 9
 * JHS 1 – JHS 3
 *
 * Creche and Nursery are intentionally NOT mapped.
 * Their subjects must be configured manually by the school.
 */
export function getCurriculumStageForClassLevel(
  className: string,
): CurriculumStageCode | null {
  const normalized = className
    .trim()
    .toUpperCase()
    .replace(/[\s_-]+/g, "");

  /**
   * Kindergarten
   *
   * KG 1
   * KG 2
   * Kindergarten 1
   * Kindergarten 2
   */
  if (/^(KG|KINDERGARTEN)[12]$/.test(normalized)) {
    return "KINDERGARTEN";
  }

  /**
   * Lower Primary
   *
   * Basic 1
   * Basic 2
   * Basic 3
   */
  const basicMatch = normalized.match(/^BASIC([1-9])$/);

  if (basicMatch) {
    const level = Number(basicMatch[1]);

    if (level >= 1 && level <= 3) {
      return "LOWER_PRIMARY";
    }

    /**
     * Upper Primary
     *
     * Basic 4
     * Basic 5
     * Basic 6
     */
    if (level >= 4 && level <= 6) {
      return "UPPER_PRIMARY";
    }

    /**
     * Junior High School
     *
     * Basic 7
     * Basic 8
     * Basic 9
     *
     * These correspond to:
     * JHS 1
     * JHS 2
     * JHS 3
     */
    if (level >= 7 && level <= 9) {
      return "JHS";
    }
  }

  /**
   * Junior High School
   *
   * JHS 1
   * JHS 2
   * JHS 3
   */
  const jhsMatch = normalized.match(/^JHS([1-3])$/);

  if (jhsMatch) {
    return "JHS";
  }

  /**
   * Creche and Nursery intentionally return null.
   *
   * Examples:
   * Creche
   * Nursery
   * Nursery 1
   * Nursery 2
   *
   * These levels should be configured manually.
   */
  return null;
}

/**
 * Check whether a supplied language code is one of the
 * supported Ghanaian languages.
 */
export function isGhanaianLanguageCode(
  value: string,
): value is GhanaianLanguageCode {
  return GHANAIAN_LANGUAGES.some(
    (language) => language.code === value,
  );
}

export type CurriculumSelection = {
  subjectCode: string;
  offered: boolean;
  languageCode?: string | null;
};

/**
 * Validate a school's curriculum selections.
 *
 * This ensures:
 * - compulsory subjects cannot be disabled
 * - only valid curriculum subjects can be selected
 * - Ghanaian Language has a valid language
 * - non-language subjects cannot receive a language
 * - activity subjects cannot be examinable
 */
export function validateCurriculumSelections(
  stage: CurriculumStageCode,
  selections: readonly CurriculumSelection[],
) {
  const definitions = CURRICULUM[stage].subjects;

  const byCode = new Map(
    definitions.map((definition) => [
      definition.code,
      definition,
    ]),
  );

  const errors: string[] = [];
  const selectedCodes = new Set<string>();

  for (const selection of selections) {
    /**
     * Prevent duplicate subject configuration.
     */
    if (selectedCodes.has(selection.subjectCode)) {
      errors.push(
        `Subject ${selection.subjectCode} was configured more than once.`,
      );
      continue;
    }

    selectedCodes.add(selection.subjectCode);

    const definition = byCode.get(selection.subjectCode);

    /**
     * Subject does not belong to the selected curriculum stage.
     */
    if (!definition) {
      errors.push(
        `Subject ${selection.subjectCode} is not available for ${stage}.`,
      );
      continue;
    }

    /**
     * Compulsory subjects must always be offered.
     */
    if (definition.compulsory && !selection.offered) {
      errors.push(
        `${definition.name} is compulsory and cannot be disabled.`,
      );
    }

    /**
     * Ghanaian Language must have a valid language selection.
     */
    if (
      definition.parameterized === "GHANAIAN_LANGUAGE" &&
      selection.offered
    ) {
      if (
        !selection.languageCode ||
        !isGhanaianLanguageCode(selection.languageCode)
      ) {
        errors.push(
          `${definition.name} requires a valid Ghanaian language.`,
        );
      }
    } else if (selection.languageCode) {
      errors.push(
        `${definition.name} does not accept a language parameter.`,
      );
    }

    /**
     * Activity-based subjects cannot be examinable.
     */
    if (
      definition.activityBased &&
      definition.examinable
    ) {
      errors.push(
        `${definition.name} cannot be examinable because it is activity-based.`,
      );
    }
  }

  /**
   * Make sure every compulsory subject appears in the
   * configuration and is offered.
   */
  for (const definition of definitions.filter(
    (item) => item.compulsory,
  )) {
    const selection = selections.find(
      (item) => item.subjectCode === definition.code,
    );

    if (!selection || !selection.offered) {
      errors.push(
        `${definition.name} must be configured.`,
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Format a configured subject name with its selected
 * Ghanaian language where applicable.
 *
 * Example:
 *
 * Ghanaian Language
 * →
 * Ghanaian Language (Ewe)
 */
export function formatConfiguredSubjectName(
  subjectName: string,
  languageCode?: string | null,
) {
  if (
    !languageCode ||
    !isGhanaianLanguageCode(languageCode)
  ) {
    return subjectName;
  }

  const language = GHANAIAN_LANGUAGES.find(
    (item) => item.code === languageCode,
  );

  const suffix = ` (${language?.name ?? languageCode})`;

  return subjectName.endsWith(suffix)
    ? subjectName
    : `${subjectName}${suffix}`;
}