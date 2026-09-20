import {
  pgEnum,
  pgTable,
  uuid,
  varchar,
  text,
  date,
  integer,
  boolean,
  timestamp,
  numeric,
  unique,
  uniqueIndex,
  primaryKey,
  index,
  jsonb,
} from "drizzle-orm/pg-core";

import { sql } from "drizzle-orm";
/* ============================================================
   ENUMS
============================================================ */

/* -------------------------
   SCHOOL
------------------------- */

export const schoolTypeEnum = pgEnum("school_type", [
  "private_basic",
  "public_basic",
  "international",
  "montessori",
  "faith_based",
  "other",
]);

export const schoolStatusEnum = pgEnum("school_status", [
  "pending",
  "active",
  "suspended",
  "deactivated",
]);

/* -------------------------
   ACADEMICS
------------------------- */

export const classCategoryEnum = pgEnum("class_category", [
  "creche",
  "nursery",
  "kg",
  "primary",
  "jhs",
]);

export const genderEnum = pgEnum("gender", [
  "male",
  "female",
]);

export const staffStatusEnum = pgEnum("staff_status", [
  "active",
  "inactive",
]);

export const enrollmentStatusEnum = pgEnum(
  "enrollment_status",
  [
    "active",
    "completed",
    "withdrawn",
    "transferred",
  ],
);

export const placementStatusEnum = pgEnum(
  "placement_status",
  [
    "active",
    "completed",
    "transferred",
    "cancelled",
  ],
);

/* -------------------------
   ATTENDANCE
------------------------- */

export const attendanceSessionStatusEnum = pgEnum(
  "attendance_session_status",
  [
    "open",
    "completed",
    "cancelled",
  ],
);

export const attendanceRecordStatusEnum = pgEnum(
  "attendance_record_status",
  [
    "present",
    "absent",
    "late",
    "excused",
  ],
);

/* -------------------------
   ASSESSMENTS
------------------------- */

/**
 * Broad classification of an assessment.
 *
 * continuous_assessment:
 *   Class tests, assignments, projects, quizzes,
 *   exercises, practical work, etc.
 *
 * examination:
 *   Mid-term exams, terminal exams, end-of-year
 *   examinations, mock examinations, etc.
 */
export const assessmentTypeCategoryEnum = pgEnum(
  "assessment_type_category",
  [
    "continuous_assessment",
    "examination",
  ],
);

/**
 * Lifecycle of an assessment period.
 */
export const assessmentPeriodStatusEnum = pgEnum(
  "assessment_period_status",
  [
    "draft",
    "open",
    "closed",
    "published",
    "archived",
  ],
);

/**
 * Lifecycle of an individual assessment.
 */
export const assessmentStatusEnum = pgEnum(
  "assessment_status",
  [
    "draft",
    "open",
    "closed",
    "published",
    "archived",
  ],
);

/* ============================================================
   SCHOOLS
============================================================ */

export const schools = pgTable(
  "schools",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    name: varchar("name", {
      length: 200,
    }).notNull(),

    slug: varchar("slug", {
      length: 200,
    })
      .notNull()
      .unique(),

    schoolCode: varchar("school_code", {
      length: 50,
    })
      .notNull()
      .unique(),

    schoolType: schoolTypeEnum(
      "school_type",
    )
      .notNull()
      .default("private_basic"),

    region: varchar("region", {
      length: 100,
    }),

    district: varchar("district", {
      length: 100,
    }),

    town: varchar("town", {
      length: 100,
    }),

    address: text("address"),

    phone: varchar("phone", {
      length: 30,
    }),

    email: varchar("email", {
      length: 255,
    }),

    website: varchar("website", {
      length: 255,
    }),

    logoUrl: text("logo_url"),

    status: schoolStatusEnum("status")
      .notNull()
      .default("pending"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("schools_status_idx").on(
      table.status,
    ),

    index("schools_region_idx").on(
      table.region,
    ),
  ],
);

/* ============================================================
   ACADEMIC YEARS
============================================================ */

export const academicYears = pgTable(
  "academic_years",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, {
        onDelete: "cascade",
      }),

    name: varchar("name", {
      length: 50,
    }).notNull(),

    startDate: date("start_date").notNull(),

    endDate: date("end_date").notNull(),

    isCurrent: boolean("is_current")
      .notNull()
      .default(false),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique(
      "academic_year_school_name_unique",
    ).on(
      table.schoolId,
      table.name,
    ),

    index("academic_year_school_idx").on(
      table.schoolId,
    ),
  ],
);

/* ============================================================
   TERMS
============================================================ */

export const terms = pgTable(
  "terms",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    academicYearId: uuid(
      "academic_year_id",
    )
      .notNull()
      .references(
        () => academicYears.id,
        {
          onDelete: "cascade",
        },
      ),

    name: varchar("name", {
      length: 50,
    }).notNull(),

    termNumber: integer(
      "term_number",
    ).notNull(),

    startDate: date("start_date")
      .notNull(),

    endDate: date("end_date")
      .notNull(),

    isCurrent: boolean("is_current")
      .notNull()
      .default(false),

    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      },
    )
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique(
      "term_year_number_unique",
    ).on(
      table.academicYearId,
      table.termNumber,
    ),

    index(
      "terms_academic_year_idx",
    ).on(
      table.academicYearId,
    ),
  ],
);

/* ============================================================
   CLASS LEVELS
============================================================ */

export const classLevels = pgTable(
  "class_levels",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, {
        onDelete: "cascade",
      }),

    name: varchar("name", {
      length: 100,
    }).notNull(),

    category: classCategoryEnum(
      "category",
    ).notNull(),

    sortOrder: integer(
      "sort_order",
    ).notNull(),

    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      },
    )
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique(
      "class_level_school_name_unique",
    ).on(
      table.schoolId,
      table.name,
    ),

    index(
      "class_levels_school_idx",
    ).on(
      table.schoolId,
    ),
  ],
);

/* ============================================================
   STREAMS
============================================================ */

export const streams = pgTable(
  "streams",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    classLevelId: uuid(
      "class_level_id",
    )
      .notNull()
      .references(
        () => classLevels.id,
        {
          onDelete: "cascade",
        },
      ),

    name: varchar("name", {
      length: 50,
    }).notNull(),

    capacity: integer("capacity"),

    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      },
    )
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique(
      "stream_class_level_name_unique",
    ).on(
      table.classLevelId,
      table.name,
    ),

    index(
      "streams_class_level_idx",
    ).on(
      table.classLevelId,
    ),
  ],
);

/* ============================================================
   SUBJECTS
============================================================ */

export const subjects = pgTable(
  "subjects",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, {
        onDelete: "cascade",
      }),

    name: varchar("name", {
      length: 150,
    }).notNull(),

    code: varchar("code", {
      length: 50,
    }),

    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      },
    )
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique(
      "subject_school_name_unique",
    ).on(
      table.schoolId,
      table.name,
    ),

    index(
      "subjects_school_idx",
    ).on(
      table.schoolId,
    ),
  ],
);

/* ============================================================
   STAFF
============================================================ */

export const staff = pgTable(
  "staff",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, {
        onDelete: "cascade",
      }),

    firstName: varchar(
      "first_name",
      {
        length: 100,
      },
    ).notNull(),

    middleName: varchar(
      "middle_name",
      {
        length: 100,
      },
    ),

    lastName: varchar(
      "last_name",
      {
        length: 100,
      },
    ).notNull(),

    staffNumber: varchar(
      "staff_number",
      {
        length: 50,
      },
    ).notNull(),

    gender: genderEnum("gender"),

    dateOfBirth: date(
      "date_of_birth",
    ),

    phone: varchar("phone", {
      length: 30,
    }),

    email: varchar("email", {
      length: 255,
    }),

    employmentDate: date(
      "employment_date",
    ),

    position: varchar("position", {
      length: 100,
    }),

    status: staffStatusEnum(
      "status",
    )
      .notNull()
      .default("active"),

    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      },
    )
      .defaultNow()
      .notNull(),

    updatedAt: timestamp(
      "updated_at",
      {
        withTimezone: true,
      },
    )
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique(
      "staff_school_number_unique",
    ).on(
      table.schoolId,
      table.staffNumber,
    ),

    index("staff_school_idx").on(
      table.schoolId,
    ),

    index("staff_status_idx").on(
      table.status,
    ),
  ],
);

/* ============================================================
   CLASS SUBJECTS / CURRICULUM
============================================================ */

export const classSubjects = pgTable(
  "class_subjects",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    classLevelId: uuid(
      "class_level_id",
    )
      .notNull()
      .references(
        () => classLevels.id,
        {
          onDelete: "cascade",
        },
      ),

    subjectId: uuid(
      "subject_id",
    )
      .notNull()
      .references(
        () => subjects.id,
        {
          onDelete: "cascade",
        },
      ),

    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      },
    )
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index(
      "class_subjects_class_idx",
    ).on(
      table.classLevelId,
    ),

    index(
      "class_subjects_subject_idx",
    ).on(
      table.subjectId,
    ),

    unique(
      "class_subjects_unique_class_subject",
    ).on(
      table.classLevelId,
      table.subjectId,
    ),
  ],
);

/* ============================================================
   STUDENTS
============================================================ */

export const students = pgTable(
  "students",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, {
        onDelete: "cascade",
      }),

    studentNumber: varchar(
      "student_number",
      {
        length: 50,
      },
    ).notNull(),

    admissionNumber: varchar("admission_number", { length: 50 }),

    firstName: varchar(
      "first_name",
      {
        length: 100,
      },
    ).notNull(),

    middleName: varchar(
      "middle_name",
      {
        length: 100,
      },
    ),

    lastName: varchar(
      "last_name",
      {
        length: 100,
      },
    ).notNull(),

    gender: genderEnum("gender")
      .notNull(),

    dateOfBirth: date(
      "date_of_birth",
    ),

    admissionDate: date(
      "admission_date",
    ),

    phone: varchar("phone", {
      length: 30,
    }),

    email: varchar("email", {
      length: 255,
    }),

    address: text("address"),
    nationality: varchar("nationality", { length: 80 }).default("Ghanaian"),
    medicalInfo: jsonb("medical_info").$type<Record<string, unknown>>().notNull().default({}),
    status: varchar("status", { length: 30 }).notNull().default("active"),

    photoUrl: text("photo_url"),

    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      },
    )
      .defaultNow()
      .notNull(),

    updatedAt: timestamp(
      "updated_at",
      {
        withTimezone: true,
      },
    )
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique(
      "student_school_number_unique",
    ).on(
      table.schoolId,
      table.studentNumber,
    ),

    unique(
      "student_school_admission_unique",
    ).on(
      table.schoolId,
      table.admissionNumber,
    ),

    index(
      "students_school_idx",
    ).on(
      table.schoolId,
    ),

    index(
      "students_last_name_idx",
    ).on(
      table.lastName,
    ),
  ],
);

/* ============================================================
   GUARDIANS
============================================================ */

export const guardians = pgTable(
  "guardians",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, {
        onDelete: "cascade",
      }),

    firstName: varchar(
      "first_name",
      {
        length: 100,
      },
    ).notNull(),

    lastName: varchar(
      "last_name",
      {
        length: 100,
      },
    ).notNull(),

    phone: varchar("phone", {
      length: 30,
    }),

    email: varchar("email", {
      length: 255,
    }),

    address: text("address"),

    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      },
    )
      .defaultNow()
      .notNull(),

    updatedAt: timestamp(
      "updated_at",
      {
        withTimezone: true,
      },
    )
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index(
      "guardians_school_idx",
    ).on(
      table.schoolId,
    ),
  ],
);

/* ============================================================
   STUDENT GUARDIANS
============================================================ */

export const studentGuardians = pgTable(
  "student_guardians",
  {
    studentId: uuid(
      "student_id",
    )
      .notNull()
      .references(
        () => students.id,
        {
          onDelete: "cascade",
        },
      ),

    guardianId: uuid(
      "guardian_id",
    )
      .notNull()
      .references(
        () => guardians.id,
        {
          onDelete: "cascade",
        },
      ),

    isPrimary: boolean(
      "is_primary",
    )
      .notNull()
      .default(false),

    relationship: varchar(
      "relationship",
      {
        length: 50,
      },
    ),
  },
  (table) => [
    primaryKey({
      columns: [
        table.studentId,
        table.guardianId,
      ],
    }),

    index(
      "student_guardians_guardian_idx",
    ).on(
      table.guardianId,
    ),

    uniqueIndex(
      "student_guardians_one_primary_idx",
    )
      .on(table.studentId)
      .where(
        sql`${table.isPrimary} = true`,
      ),
  ],
);

/* ============================================================
   STUDENT ENROLLMENTS
============================================================ */

export const studentEnrollments =
  pgTable(
    "student_enrollments",
    {
      id: uuid("id")
        .defaultRandom()
        .primaryKey(),

      studentId: uuid(
        "student_id",
      )
        .notNull()
        .references(
          () => students.id,
          {
            onDelete: "cascade",
          },
        ),

      academicYearId: uuid(
        "academic_year_id",
      )
        .notNull()
        .references(
          () => academicYears.id,
          {
            onDelete: "cascade",
          },
        ),

      /*
       * LEGACY / TRANSITIONAL FIELD
       *
       * Eventually streamId will be removed
       * from student_enrollments and
       * studentPlacements will become the
       * authoritative placement model.
       */
      streamId: uuid("stream_id")
        .notNull()
        .references(
          () => streams.id,
          {
            onDelete: "restrict",
          },
        ),

      admissionNumber: varchar(
        "admission_number",
        {
          length: 50,
        },
      ),

      enrollmentDate: date(
        "enrollment_date",
      ).notNull(),

      status: enrollmentStatusEnum(
        "status",
      )
        .notNull()
        .default("active"),

      createdAt: timestamp(
        "created_at",
        {
          withTimezone: true,
        },
      )
        .defaultNow()
        .notNull(),

      updatedAt: timestamp(
        "updated_at",
        {
          withTimezone: true,
        },
      )
        .defaultNow()
        .notNull(),
    },
    (table) => [
      unique(
        "student_year_unique",
      ).on(
        table.studentId,
        table.academicYearId,
      ),

      index(
        "enrollments_student_idx",
      ).on(
        table.studentId,
      ),

      index(
        "enrollments_year_idx",
      ).on(
        table.academicYearId,
      ),

      index(
        "enrollments_stream_idx",
      ).on(
        table.streamId,
      ),
    ],
  );

/* ============================================================
   STUDENT PLACEMENTS
============================================================ */

export const studentPlacements =
  pgTable(
    "student_placements",
    {
      id: uuid("id")
        .defaultRandom()
        .primaryKey(),

      studentEnrollmentId: uuid(
        "student_enrollment_id",
      )
        .notNull()
        .references(
          () => studentEnrollments.id,
          {
            onDelete: "cascade",
          },
        ),

      streamId: uuid("stream_id")
        .notNull()
        .references(
          () => streams.id,
          {
            onDelete: "restrict",
          },
        ),

      startDate: date(
        "start_date",
      ).notNull(),

      endDate: date(
        "end_date",
      ),

      status: placementStatusEnum(
        "status",
      )
        .notNull()
        .default("active"),

      createdAt: timestamp(
        "created_at",
        {
          withTimezone: true,
        },
      )
        .defaultNow()
        .notNull(),

      updatedAt: timestamp(
        "updated_at",
        {
          withTimezone: true,
        },
      )
        .defaultNow()
        .notNull(),
    },
    (table) => [
      index(
        "placements_enrollment_idx",
      ).on(
        table.studentEnrollmentId,
      ),

      index(
        "placements_stream_idx",
      ).on(
        table.streamId,
      ),

      index(
        "placements_status_idx",
      ).on(
        table.status,
      ),

      uniqueIndex(
        "placements_one_active_idx",
      )
        .on(table.studentEnrollmentId)
        .where(
          sql`${table.status} = 'active'`,
        ),
    ],
  );

/* ============================================================
   TEACHER ASSIGNMENTS
============================================================ */

export const teacherAssignments = pgTable(
  "teacher_assignments",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    staffId: uuid("staff_id")
      .notNull()
      .references(() => staff.id, {
        onDelete: "cascade",
      }),

    streamId: uuid("stream_id")
      .notNull()
      .references(() => streams.id, {
        onDelete: "cascade",
      }),

    subjectId: uuid("subject_id").references(
      () => subjects.id,
      {
        onDelete: "set null",
      },
    ),

    academicYearId: uuid("academic_year_id")
      .notNull()
      .references(() => academicYears.id, {
        onDelete: "cascade",
      }),

    isClassTeacher: boolean("is_class_teacher")
      .notNull()
      .default(false),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("teacher_assignments_staff_idx").on(
      table.staffId,
    ),

    index("teacher_assignments_stream_idx").on(
      table.streamId,
    ),

    index("teacher_assignments_subject_idx").on(
      table.subjectId,
    ),

    index("teacher_assignments_year_idx").on(
      table.academicYearId,
    ),

    uniqueIndex(
      "teacher_assignments_one_class_teacher_idx",
    )
      .on(
        table.streamId,
        table.academicYearId,
      )
      .where(
        sql`${table.isClassTeacher} = true`,
      ),

    uniqueIndex(
      "teacher_assignments_unique_subject_idx",
    )
      .on(
        table.staffId,
        table.streamId,
        table.subjectId,
        table.academicYearId,
      )
      .where(
        sql`${table.subjectId} IS NOT NULL`,
      ),

    uniqueIndex(
      "teacher_assignments_unique_class_teacher_idx",
    )
      .on(
        table.staffId,
        table.streamId,
        table.academicYearId,
      )
      .where(
        sql`${table.subjectId} IS NULL AND ${table.isClassTeacher} = true`,
      ),
  ],
);
/* ============================================================
   ATTENDANCE SESSIONS
============================================================ */

export const attendanceSessions =
  pgTable(
    "attendance_sessions",
    {
      id: uuid("id")
        .defaultRandom()
        .primaryKey(),

      schoolId: uuid(
        "school_id",
      )
        .notNull()
        .references(
          () => schools.id,
          {
            onDelete: "cascade",
          },
        ),

      academicYearId: uuid(
        "academic_year_id",
      )
        .notNull()
        .references(
          () => academicYears.id,
          {
            onDelete: "cascade",
          },
        ),

      termId: uuid("term_id")
        .notNull()
        .references(
          () => terms.id,
          {
            onDelete: "cascade",
          },
        ),

      streamId: uuid("stream_id")
        .notNull()
        .references(
          () => streams.id,
          {
            onDelete: "cascade",
          },
        ),

      attendanceDate: date(
        "attendance_date",
      ).notNull(),

      status:
        attendanceSessionStatusEnum(
          "status",
        )
          .notNull()
          .default("open"),

      notes: text("notes"),

      createdAt: timestamp(
        "created_at",
        {
          withTimezone: true,
        },
      )
        .defaultNow()
        .notNull(),

      updatedAt: timestamp(
        "updated_at",
        {
          withTimezone: true,
        },
      )
        .defaultNow()
        .notNull(),
    },
    (table) => [
      unique(
        "attendance_sessions_unique_stream_date",
      ).on(
        table.streamId,
        table.attendanceDate,
      ),

      index(
        "attendance_sessions_school_idx",
      ).on(
        table.schoolId,
      ),

      index(
        "attendance_sessions_year_idx",
      ).on(
        table.academicYearId,
      ),

      index(
        "attendance_sessions_term_idx",
      ).on(
        table.termId,
      ),

      index(
        "attendance_sessions_stream_idx",
      ).on(
        table.streamId,
      ),

      index(
        "attendance_sessions_date_idx",
      ).on(
        table.attendanceDate,
      ),
    ],
  );

/* ============================================================
   ASSESSMENT TYPES
============================================================ */

/**
 * Examples:
 *
 * Continuous Assessment:
 *   - Class Test
 *   - Assignment
 *   - Homework
 *   - Project
 *   - Quiz
 *   - Practical
 *   - Continuous Assessment
 *
 * Examination:
 *   - Mid-Term Examination
 *   - Terminal Examination
 *   - End of Term Examination
 *   - End of Year Examination
 *   - Mock Examination
 */
export const assessmentTypes = pgTable(
  "assessment_types",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, {
        onDelete: "cascade",
      }),

    name: varchar("name", {
      length: 100,
    }).notNull(),

    code: varchar("code", {
      length: 50,
    }),

    category: assessmentTypeCategoryEnum(
      "category",
    )
      .notNull()
      .default("continuous_assessment"),

    description: text("description"),

    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      },
    )
      .notNull()
      .defaultNow(),

    updatedAt: timestamp(
      "updated_at",
      {
        withTimezone: true,
      },
    )
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique(
      "assessment_types_school_name_unique",
    ).on(
      table.schoolId,
      table.name,
    ),

    unique(
      "assessment_types_school_code_unique",
    ).on(
      table.schoolId,
      table.code,
    ),

    index(
      "assessment_types_school_idx",
    ).on(
      table.schoolId,
    ),

    index(
      "assessment_types_category_idx",
    ).on(
      table.category,
    ),
  ],
);

/* ============================================================
   ASSESSMENT PERIODS
============================================================ */

/**
 * An assessment period groups assessments
 * belonging to a particular reporting period.
 *
 * Examples:
 *   Term 1 Continuous Assessment
 *   Term 1 Terminal Examination
 *   Term 2 Continuous Assessment
 *   Term 2 Terminal Examination
 *   Term 3 Terminal Examination
 */
export const assessmentPeriods = pgTable(
  "assessment_periods",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, {
        onDelete: "cascade",
      }),

    academicYearId: uuid(
      "academic_year_id",
    )
      .notNull()
      .references(() => academicYears.id, {
        onDelete: "cascade",
      }),

    termId: uuid("term_id")
      .notNull()
      .references(() => terms.id, {
        onDelete: "cascade",
      }),

    name: varchar("name", {
      length: 150,
    }).notNull(),

    description: text("description"),

    startDate: date("start_date"),

    endDate: date("end_date"),

    status: assessmentPeriodStatusEnum(
      "status",
    )
      .notNull()
      .default("draft"),

    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      },
    )
      .notNull()
      .defaultNow(),

    updatedAt: timestamp(
      "updated_at",
      {
        withTimezone: true,
      },
    )
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique(
      "assessment_periods_school_name_unique",
    ).on(
      table.schoolId,
      table.academicYearId,
      table.termId,
      table.name,
    ),

    index(
      "assessment_periods_school_idx",
    ).on(
      table.schoolId,
    ),

    index(
      "assessment_periods_year_idx",
    ).on(
      table.academicYearId,
    ),

    index(
      "assessment_periods_term_idx",
    ).on(
      table.termId,
    ),

    index(
      "assessment_periods_status_idx",
    ).on(
      table.status,
    ),
  ],
);

/* ============================================================
   ASSESSMENTS
============================================================ */

/**
 * One assessment represents one score-bearing activity
 * for one subject and one stream.
 *
 * Examples:
 *
 *   Mathematics Class Test 1
 *   English Assignment 1
 *   Science Project
 *   Mathematics Terminal Examination
 *   Basic Design & Technology Mid-Term Examination
 */
export const assessments = pgTable(
  "assessments",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, {
        onDelete: "cascade",
      }),

    academicYearId: uuid(
      "academic_year_id",
    )
      .notNull()
      .references(() => academicYears.id, {
        onDelete: "cascade",
      }),

    termId: uuid("term_id")
      .notNull()
      .references(() => terms.id, {
        onDelete: "cascade",
      }),

    assessmentPeriodId: uuid(
      "assessment_period_id",
    )
      .notNull()
      .references(
        () => assessmentPeriods.id,
        {
          onDelete: "cascade",
        },
      ),

    streamId: uuid("stream_id")
      .notNull()
      .references(() => streams.id, {
        onDelete: "cascade",
      }),

    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id, {
        onDelete: "restrict",
      }),

    assessmentTypeId: uuid(
      "assessment_type_id",
    )
      .notNull()
      .references(
        () => assessmentTypes.id,
        {
          onDelete: "restrict",
        },
      ),

    name: varchar("name", {
      length: 200,
    }).notNull(),

    /**
     * Maximum obtainable raw score.
     *
     * Example:
     *   Class Test = 30
     *   Assignment = 20
     *   Examination = 100
     */
    maxScore: numeric("max_score", {
      precision: 8,
      scale: 2,
    }).notNull(),

    assessmentDate: date(
      "assessment_date",
    ),

    status: assessmentStatusEnum(
      "status",
    )
      .notNull()
      .default("draft"),

    instructions: text("instructions"),

    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      },
    )
      .notNull()
      .defaultNow(),

    updatedAt: timestamp(
      "updated_at",
      {
        withTimezone: true,
      },
    )
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index(
      "assessments_school_idx",
    ).on(
      table.schoolId,
    ),

    index(
      "assessments_year_idx",
    ).on(
      table.academicYearId,
    ),

    index(
      "assessments_term_idx",
    ).on(
      table.termId,
    ),

    index(
      "assessments_period_idx",
    ).on(
      table.assessmentPeriodId,
    ),

    index(
      "assessments_stream_idx",
    ).on(
      table.streamId,
    ),

    index(
      "assessments_subject_idx",
    ).on(
      table.subjectId,
    ),

    index(
      "assessments_type_idx",
    ).on(
      table.assessmentTypeId,
    ),

    index(
      "assessments_status_idx",
    ).on(
      table.status,
    ),
  ],
);

/* ============================================================
   ASSESSMENT SCORES
============================================================ */

/**
 * One row per student per assessment.
 *
 * A score belongs to exactly one assessment
 * and exactly one student.
 */
export const assessmentScores = pgTable(
  "assessment_scores",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    assessmentId: uuid(
      "assessment_id",
    )
      .notNull()
      .references(() => assessments.id, {
        onDelete: "cascade",
      }),

    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, {
        onDelete: "cascade",
      }),

    /**
     * Raw score.
     *
     * The application/service layer must ensure:
     *
     *   score >= 0
     *   score <= assessment.maxScore
     */
    score: numeric("score", {
      precision: 8,
      scale: 2,
    }).notNull(),

    comment: text("comment"),

    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      },
    )
      .notNull()
      .defaultNow(),

    updatedAt: timestamp(
      "updated_at",
      {
        withTimezone: true,
      },
    )
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique(
      "assessment_scores_unique_student",
    ).on(
      table.assessmentId,
      table.studentId,
    ),

    index(
      "assessment_scores_assessment_idx",
    ).on(
      table.assessmentId,
    ),

    index(
      "assessment_scores_student_idx",
    ).on(
      table.studentId,
    ),
  ],
);

/* ============================================================
   ATTENDANCE RECORDS
============================================================ */

export const attendanceRecords =
  pgTable(
    "attendance_records",
    {
      id: uuid("id")
        .defaultRandom()
        .primaryKey(),

      attendanceSessionId: uuid(
        "attendance_session_id",
      )
        .notNull()
        .references(
          () => attendanceSessions.id,
          {
            onDelete: "cascade",
          },
        ),

      studentId: uuid(
        "student_id",
      )
        .notNull()
        .references(
          () => students.id,
          {
            onDelete: "cascade",
          },
        ),

      status:
        attendanceRecordStatusEnum(
          "status",
        ).notNull(),

      note: text("note"),

      createdAt: timestamp(
        "created_at",
        {
          withTimezone: true,
        },
      )
        .defaultNow()
        .notNull(),

      updatedAt: timestamp(
        "updated_at",
        {
          withTimezone: true,
        },
      )
        .defaultNow()
        .notNull(),
    },
    (table) => [
      unique(
        "attendance_records_unique_session_student",
      ).on(
        table.attendanceSessionId,
        table.studentId,
      ),

      index(
        "attendance_records_session_idx",
      ).on(
        table.attendanceSessionId,
      ),

      index(
        "attendance_records_student_idx",
      ).on(
        table.studentId,
      ),

      index(
        "attendance_records_status_idx",
      ).on(
        table.status,
      ),
    ],
  );

  export const gradingSchemes = pgTable(
  "grading_schemes",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, {
        onDelete: "cascade",
      }),

    name: varchar("name", {
      length: 150,
    }).notNull(),

    description: text("description"),

    status: varchar("status", {
      length: 20,
    })
      .notNull()
      .default("draft"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique(
      "grading_schemes_school_name_unique",
    ).on(
      table.schoolId,
      table.name,
    ),

    index(
      "grading_schemes_school_idx",
    ).on(table.schoolId),

    index(
      "grading_schemes_status_idx",
    ).on(table.status),
  ],
);


export const gradingSchemeItems = pgTable(
  "grading_scheme_items",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    gradingSchemeId: uuid(
      "grading_scheme_id",
    )
      .notNull()
      .references(
        () => gradingSchemes.id,
        {
          onDelete: "cascade",
        },
      ),

    assessmentTypeId: uuid(
      "assessment_type_id",
    )
      .notNull()
      .references(
        () => assessmentTypes.id,
        {
          onDelete: "restrict",
        },
      ),

    weightPercent: numeric(
      "weight_percent",
      {
        precision: 5,
        scale: 2,
      },
    ).notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique(
      "grading_scheme_items_unique",
    ).on(
      table.gradingSchemeId,
      table.assessmentTypeId,
    ),

    index(
      "grading_scheme_items_scheme_idx",
    ).on(table.gradingSchemeId),

    index(
      "grading_scheme_items_type_idx",
    ).on(table.assessmentTypeId),
  ],
);


export const gradeBands = pgTable(
  "grade_bands",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    gradingSchemeId: uuid(
      "grading_scheme_id",
    )
      .notNull()
      .references(
        () => gradingSchemes.id,
        {
          onDelete: "cascade",
        },
      ),

    grade: varchar("grade", {
      length: 10,
    }).notNull(),

    label: varchar("label", {
      length: 100,
    }),

    minimumPercent: numeric(
      "minimum_percent",
      {
        precision: 5,
        scale: 2,
      },
    ).notNull(),

    maximumPercent: numeric(
      "maximum_percent",
      {
        precision: 5,
        scale: 2,
      },
    ).notNull(),

    remark: varchar("remark", {
      length: 255,
    }),

    sortOrder: integer(
      "sort_order",
    )
      .notNull()
      .default(0),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique(
      "grade_bands_scheme_grade_unique",
    ).on(
      table.gradingSchemeId,
      table.grade,
    ),

    index(
      "grade_bands_scheme_idx",
    ).on(table.gradingSchemeId),

    index(
      "grade_bands_minimum_idx",
    ).on(
      table.gradingSchemeId,
      table.minimumPercent,
    ),
  ],
);

// ============================================================
// RESULT PUBLICATIONS
// ============================================================

export const resultPublications = pgTable(
  "result_publications",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, {
        onDelete: "cascade",
      }),

    academicYearId: uuid("academic_year_id")
      .notNull()
      .references(() => academicYears.id, {
        onDelete: "cascade",
      }),

    termId: uuid("term_id")
      .notNull()
      .references(() => terms.id, {
        onDelete: "cascade",
      }),

    streamId: uuid("stream_id")
      .notNull()
      .references(() => streams.id, {
        onDelete: "cascade",
      }),

    gradingSchemeId: uuid("grading_scheme_id")
      .references(() => gradingSchemes.id, {
        onDelete: "set null",
      }),

    status: varchar("status", {
      length: 20,
    })
      .notNull()
      .default("draft"),

    publishedAt: timestamp("published_at", {
      withTimezone: true,
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("result_publications_unique_scope").on(
      table.schoolId,
      table.academicYearId,
      table.termId,
      table.streamId,
    ),

    index("result_publications_school_idx").on(
      table.schoolId,
    ),

    index("result_publications_year_idx").on(
      table.academicYearId,
    ),

    index("result_publications_term_idx").on(
      table.termId,
    ),

    index("result_publications_stream_idx").on(
      table.streamId,
    ),

    index("result_publications_status_idx").on(
      table.status,
    ),
  ],
);

export const resultPublicationStudents =
  pgTable(
    "result_publication_students",
    {
      id: uuid("id")
        .defaultRandom()
        .primaryKey(),

      publicationId: uuid("publication_id")
        .notNull()
        .references(
          () => resultPublications.id,
          {
            onDelete: "cascade",
          },
        ),

      studentId: uuid("student_id")
        .notNull()
        .references(() => students.id, {
          onDelete: "cascade",
        }),

      studentNumber: text(
        "student_number",
      ).notNull(),

      firstName: text(
        "first_name",
      ).notNull(),

      middleName: text(
        "middle_name",
      ),

      lastName: text(
        "last_name",
      ).notNull(),

      overallPercentage: numeric(
        "overall_percentage",
        {
          precision: 8,
          scale: 2,
        },
      ).notNull(),

      position: integer(
        "position",
      ).notNull(),

      createdAt: timestamp(
        "created_at",
        {
          withTimezone: true,
        },
      )
        .notNull()
        .defaultNow(),
    },
    (table) => [
      unique(
        "result_publication_students_unique",
      ).on(
        table.publicationId,
        table.studentId,
      ),

      index(
        "result_publication_students_publication_idx",
      ).on(table.publicationId),

      index(
        "result_publication_students_student_idx",
      ).on(table.studentId),
    ],
  );

export const resultPublicationSubjects =
  pgTable(
    "result_publication_subjects",
    {
      id: uuid("id")
        .defaultRandom()
        .primaryKey(),

      publicationStudentId:
        uuid(
          "publication_student_id",
        )
          .notNull()
          .references(
            () =>
              resultPublicationStudents.id,
            {
              onDelete: "cascade",
            },
          ),

      subjectId: uuid("subject_id")
        .notNull()
        .references(() => subjects.id, {
          onDelete: "restrict",
        }),

      subjectName: text(
        "subject_name",
      ).notNull(),

      classScore: numeric(
        "class_score",
        {
          precision: 8,
          scale: 2,
        },
      ).notNull(),

      examinationScore: numeric(
        "examination_score",
        {
          precision: 8,
          scale: 2,
        },
      ).notNull(),

      finalPercentage: numeric(
        "final_percentage",
        {
          precision: 8,
          scale: 2,
        },
      ).notNull(),

      grade: text("grade"),

      label: text("label"),

        remark: text("remark"),

  position: integer(
    "position",
  ).notNull(),

  createdAt: timestamp(
        {
          withTimezone: true,
        },
      )
        .notNull()
        .defaultNow(),
    },
    (table) => [
      unique(
        "result_publication_subjects_unique",
      ).on(
        table.publicationStudentId,
        table.subjectId,
      ),

      index(
        "result_publication_subjects_student_idx",
      ).on(
        table.publicationStudentId,
      ),

      index(
        "result_publication_subjects_subject_idx",
      ).on(table.subjectId),
    ],
  );

export const resultPublicationAssessments =
  pgTable(
    "result_publication_assessments",
    {
      id: uuid("id")
        .defaultRandom()
        .primaryKey(),

      publicationSubjectId:
        uuid(
          "publication_subject_id",
        )
          .notNull()
          .references(
            () =>
              resultPublicationSubjects.id,
            {
              onDelete: "cascade",
            },
          ),

      assessmentId:
        uuid("assessment_id").references(
          () => assessments.id,
          {
            onDelete: "set null",
          },
        ),

      assessmentName: text(
        "assessment_name",
      ).notNull(),

      assessmentTypeName: text(
        "assessment_type_name",
      ).notNull(),

      category: varchar("category", {
        length: 30,
      }).notNull(),

      score: numeric("score", {
        precision: 8,
        scale: 2,
      }).notNull(),

      maxScore: numeric("max_score", {
        precision: 8,
        scale: 2,
      }).notNull(),

      percentage: numeric(
        "percentage",
        {
          precision: 8,
          scale: 2,
        },
      ).notNull(),

      weightPercent: numeric(
        "weight_percent",
        {
          precision: 8,
          scale: 2,
        },
      ).notNull(),

      weightedContribution: numeric(
        "weighted_contribution",
        {
          precision: 8,
          scale: 2,
        },
      ).notNull(),

      createdAt: timestamp(
        "created_at",
        {
          withTimezone: true,
        },
      )
        .notNull()
        .defaultNow(),
    },
    (table) => [
      index(
        "result_publication_assessments_subject_idx",
      ).on(
        table.publicationSubjectId,
      ),

      index(
        "result_publication_assessments_assessment_idx",
      ).on(table.assessmentId),
    ],
  );
  export const reportCardStatusEnum = pgEnum(
  "report_card_status",
  [
    "draft",
    "teacher_review",
    "headteacher_review",
    "approved",
  ],
);

export const promotionStatusEnum = pgEnum(
  "promotion_status",
  [
    "pending",
    "promoted",
    "promoted_with_conditions",
    "repeated",
    "withdrawn",
    "transferred",
  ],
);
export const reportCards = pgTable(
  "report_cards",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, {
        onDelete: "cascade",
      }),

    publicationId: uuid("publication_id")
      .notNull()
      .references(
        () => resultPublications.id,
        {
          onDelete: "cascade",
        },
      ),

    publicationStudentId: uuid(
      "publication_student_id",
    )
      .notNull()
      .references(
        () => resultPublicationStudents.id,
        {
          onDelete: "cascade",
        },
      ),

    status: reportCardStatusEnum(
      "status",
    )
      .notNull()
      .default("draft"),

    classTeacherRemark: text(
      "class_teacher_remark",
    ),

    headteacherRemark: text(
      "headteacher_remark",
    ),

    promotionStatus: promotionStatusEnum(
      "promotion_status",
    )
      .notNull()
      .default("pending"),

    classTeacherSignedAt: timestamp(
      "class_teacher_signed_at",
      {
        withTimezone: true,
      },
    ),

    headteacherSignedAt: timestamp(
      "headteacher_signed_at",
      {
        withTimezone: true,
      },
    ),

    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      },
    )
      .defaultNow()
      .notNull(),

    updatedAt: timestamp(
      "updated_at",
      {
        withTimezone: true,
      })
      .defaultNow()
      .notNull(),
  },

  (table) => [
    unique(
      "report_cards_publication_student_unique",
    ).on(
      table.publicationId,
      table.publicationStudentId,
    ),

    index(
      "report_cards_school_idx",
    ).on(table.schoolId),

    index(
      "report_cards_publication_idx",
    ).on(table.publicationId),

    index(
      "report_cards_publication_student_idx",
    ).on(table.publicationStudentId),

    index(
      "report_cards_status_idx",
    ).on(table.status),

    index(
      "report_cards_school_status_idx",
    ).on(
      table.schoolId,
      table.status,
    ),

    index(
      "report_cards_publication_status_idx",
    ).on(
      table.publicationId,
      table.status,
    ),
  ],
);
export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "issued",
  "partially_paid",
  "paid",
  "overdue",
  "cancelled",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "posted",
  "reversed",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "mobile_money",
  "bank_transfer",
  "card",
  "other",
]);

export const adjustmentTypeEnum = pgEnum("adjustment_type", [
  "discount",
  "waiver",
  "surcharge",
]);

export const adjustmentStatusEnum = pgEnum("adjustment_status", [
  "active",
  "cancelled",
]);
export const feeCategories = pgTable(
  "fee_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),

    name: varchar("name", { length: 100 }).notNull(),

    description: text("description"),

    isActive: boolean("is_active").notNull().default(true),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    }).defaultNow().notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    }).defaultNow().notNull(),
  },
  (table) => [
    unique("fee_categories_school_name_unique").on(
      table.schoolId,
      table.name,
    ),

    index("fee_categories_school_idx").on(table.schoolId),
  ],
);
export const feeStructures = pgTable(
  "fee_structures",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),

    academicYearId: uuid("academic_year_id")
      .notNull()
      .references(() => academicYears.id, { onDelete: "cascade" }),

    termId: uuid("term_id")
      .notNull()
      .references(() => terms.id, { onDelete: "cascade" }),

    classLevelId: uuid("class_level_id")
      .notNull()
      .references(() => classLevels.id, { onDelete: "cascade" }),

    name: varchar("name", { length: 150 }).notNull(),

    description: text("description"),

    isActive: boolean("is_active").notNull().default(true),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    }).defaultNow().notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    }).defaultNow().notNull(),
  },
  (table) => [
    index("fee_structures_school_idx").on(table.schoolId),
    index("fee_structures_year_idx").on(table.academicYearId),
    index("fee_structures_term_idx").on(table.termId),
    index("fee_structures_class_idx").on(table.classLevelId),

    unique("fee_structures_scope_name_unique").on(
      table.schoolId,
      table.academicYearId,
      table.termId,
      table.classLevelId,
      table.name,
    ),
  ],
);
export const feeStructureItems = pgTable(
  "fee_structure_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    feeStructureId: uuid("fee_structure_id")
      .notNull()
      .references(() => feeStructures.id, { onDelete: "cascade" }),

    feeCategoryId: uuid("fee_category_id")
      .notNull()
      .references(() => feeCategories.id, { onDelete: "restrict" }),

    amount: numeric("amount", {
      precision: 12,
      scale: 2,
    }).notNull(),

    description: text("description"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    }).defaultNow().notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    }).defaultNow().notNull(),
  },
  (table) => [
    unique("fee_structure_items_unique").on(
      table.feeStructureId,
      table.feeCategoryId,
    ),

    index("fee_structure_items_structure_idx").on(
      table.feeStructureId,
    ),

    index("fee_structure_items_category_idx").on(
      table.feeCategoryId,
    ),
  ],
);

export const studentInvoices = pgTable(
  "student_invoices",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),

    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "restrict" }),

    academicYearId: uuid("academic_year_id")
      .notNull()
      .references(() => academicYears.id, { onDelete: "restrict" }),

    termId: uuid("term_id")
      .notNull()
      .references(() => terms.id, { onDelete: "restrict" }),

    invoiceNumber: varchar("invoice_number", {
      length: 50,
    }).notNull(),

    issueDate: date("issue_date").notNull(),

    dueDate: date("due_date"),

    status: invoiceStatusEnum("status")
      .notNull()
      .default("draft"),

    notes: text("notes"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    }).defaultNow().notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    }).defaultNow().notNull(),
  },
  (table) => [
    unique("student_invoices_school_number_unique").on(
      table.schoolId,
      table.invoiceNumber,
    ),

    index("student_invoices_school_idx").on(table.schoolId),
    index("student_invoices_student_idx").on(table.studentId),
    index("student_invoices_year_idx").on(table.academicYearId),
    index("student_invoices_term_idx").on(table.termId),
    index("student_invoices_status_idx").on(table.status),
  ],
);
export const studentInvoiceItems = pgTable(
  "student_invoice_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => studentInvoices.id, {
        onDelete: "cascade",
      }),

    feeCategoryId: uuid("fee_category_id")
      .notNull()
      .references(() => feeCategories.id, {
        onDelete: "restrict",
      }),

    description: varchar("description", {
      length: 255,
    }).notNull(),

    amount: numeric("amount", {
      precision: 12,
      scale: 2,
    }).notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    }).defaultNow().notNull(),
  },
  (table) => [
    index("student_invoice_items_invoice_idx").on(
      table.invoiceId,
    ),

    index("student_invoice_items_category_idx").on(
      table.feeCategoryId,
    ),
  ],
);
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),

    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "restrict" }),

    receiptNumber: varchar("receipt_number", {
      length: 50,
    }).notNull(),

    paymentDate: date("payment_date").notNull(),

    amount: numeric("amount", {
      precision: 12,
      scale: 2,
    }).notNull(),

    method: paymentMethodEnum("method").notNull(),

    reference: varchar("reference", {
      length: 150,
    }),

    status: paymentStatusEnum("status")
      .notNull()
      .default("posted"),

    notes: text("notes"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    }).defaultNow().notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    }).defaultNow().notNull(),
  },
  (table) => [
    unique("payments_school_receipt_unique").on(
      table.schoolId,
      table.receiptNumber,
    ),

    index("payments_school_idx").on(table.schoolId),
    index("payments_student_idx").on(table.studentId),
    index("payments_date_idx").on(table.paymentDate),
    index("payments_status_idx").on(table.status),
  ],
);
export const paymentAllocations = pgTable(
  "payment_allocations",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    paymentId: uuid("payment_id")
      .notNull()
      .references(() => payments.id, {
        onDelete: "restrict",
      }),

    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => studentInvoices.id, {
        onDelete: "restrict",
      }),

    amount: numeric("amount", {
      precision: 12,
      scale: 2,
    }).notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    }).defaultNow().notNull(),
  },
  (table) => [
    unique("payment_allocations_unique").on(
      table.paymentId,
      table.invoiceId,
    ),

    index("payment_allocations_payment_idx").on(
      table.paymentId,
    ),

    index("payment_allocations_invoice_idx").on(
      table.invoiceId,
    ),
  ],
);
export const invoiceAdjustments = pgTable(
  "invoice_adjustments",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => studentInvoices.id, {
        onDelete: "cascade",
      }),

    type: adjustmentTypeEnum("type").notNull(),

    amount: numeric("amount", {
      precision: 12,
      scale: 2,
    }).notNull(),

    reason: text("reason").notNull(),

    status: adjustmentStatusEnum("status")
      .notNull()
      .default("active"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    }).defaultNow().notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    }).defaultNow().notNull(),
  },
  (table) => [
    index("invoice_adjustments_invoice_idx").on(
      table.invoiceId,
    ),

    index("invoice_adjustments_status_idx").on(
      table.status,
    ),
  ],
);
export const userStatusEnum = pgEnum("user_status", [
  "active",
  "inactive",
  "suspended",
]);

export const schoolMembershipRoleEnum = pgEnum(
  "school_membership_role",
  [
    "super_admin",
    "platform_admin",
    "school_owner",
    "school_admin",
    "principal",
    "headteacher",
    "teacher",
    "accountant",
    "bursar",
    "secretary",
    "librarian",
    "nurse",
    "parent",
    "student",
    "staff",
    "super_admin",
  ],
);
export const platformRoleEnum = pgEnum(
  "platform_role",
  [
    "platform_admin",
    "super_admin",
  ],
);
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    email: text("email").notNull().unique(),

    passwordHash: text("password_hash"),

    firstName: text("first_name").notNull(),

    lastName: text("last_name").notNull(),

    platformRole: platformRoleEnum("platform_role"),

    status: userStatusEnum("status")
      .notNull()
      .default("active"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("users_status_idx").on(table.status),
  ],
);

export const schoolMemberships = pgTable(
  "school_memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, {
        onDelete: "cascade",
      }),

    role: schoolMembershipRoleEnum("role").notNull(),

    isActive: boolean("is_active")
      .notNull()
      .default(true),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("school_memberships_unique").on(
      table.userId,
      table.schoolId,
    ),

    index("school_memberships_user_idx").on(
      table.userId,
    ),

    index("school_memberships_school_idx").on(
      table.schoolId,
    ),

    index("school_memberships_role_idx").on(
      table.role,
    ),

    index("school_memberships_active_idx").on(
      table.isActive,
    ),
  ],
);

export const studentAccountStatusEnum = pgEnum(
  "student_account_status",
  [
    "pending",
    "active",
    "disabled",
  ],
);

export const studentUserAccounts = pgTable(
  "student_user_accounts",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    studentId: uuid("student_id")
      .notNull()
      .unique()
      .references(() => students.id, {
        onDelete: "cascade",
      }),

    // Internal email used by Neon Auth.
    // Students will log in using their student number in the UI.
    email: text("email")
      .notNull()
      .unique(),

    // Neon Auth manages the actual password.
    mustChangePassword: boolean("must_change_password")
      .notNull()
      .default(true),

    lastLoginAt: timestamp("last_login_at", {
      withTimezone: true,
    }),

    status: studentAccountStatusEnum("status")
      .notNull()
      .default("active"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("student_user_accounts_student_idx").on(table.studentId),

    index("student_user_accounts_status_idx").on(table.status),
  ],
);
/* ============================================================
   HEISEN SCHOOLOS PLATFORM LAYER
   Cross-cutting production tables added without replacing the
   existing academic/result model.
============================================================ */

export const schoolSettings = pgTable("school_settings", {
  schoolId: uuid("school_id").primaryKey().references(() => schools.id, { onDelete: "cascade" }),
  currency: varchar("currency", { length: 3 }).notNull().default("GHS"),
  timezone: varchar("timezone", { length: 64 }).notNull().default("Africa/Accra"),
  enableRanking: boolean("enable_ranking").notNull().default(true),
  enableSubjectRanking: boolean("enable_subject_ranking").notNull().default(false),
  allowOverpayment: boolean("allow_overpayment").notNull().default(false),
  nextTermReopeningDate: date("next_term_reopening_date"),
  logoUrl: text("logo_url"),
  reportCardFooter: text("report_card_footer"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const profiles = pgTable("profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  authUserId: text("auth_user_id").notNull().unique(),
  email: varchar("email", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  photoUrl: text("photo_url"),
  status: userStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("profiles_email_idx").on(table.email), index("profiles_status_idx").on(table.status)]);

export const studentDocuments = pgTable("student_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  schoolId: uuid("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }).notNull(),
  documentType: varchar("document_type", { length: 80 }).notNull(),
  storageKey: text("storage_key").notNull(),
  mimeType: varchar("mime_type", { length: 120 }),
  sizeBytes: integer("size_bytes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("student_documents_school_idx").on(table.schoolId), index("student_documents_student_idx").on(table.studentId)]);

export const staffDocuments = pgTable("staff_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  schoolId: uuid("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  staffId: uuid("staff_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }).notNull(),
  documentType: varchar("document_type", { length: 80 }).notNull(),
  storageKey: text("storage_key").notNull(),
  mimeType: varchar("mime_type", { length: 120 }),
  sizeBytes: integer("size_bytes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("staff_documents_school_idx").on(table.schoolId), index("staff_documents_staff_idx").on(table.staffId)]);

export const studentStatusHistory = pgTable("student_status_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  schoolId: uuid("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 40 }).notNull(),
  effectiveDate: date("effective_date").notNull(),
  reason: text("reason"),
  actorId: text("actor_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("student_status_history_school_idx").on(table.schoolId), index("student_status_history_student_idx").on(table.studentId), index("student_status_history_date_idx").on(table.effectiveDate)]);

export const feeAssignments = pgTable("fee_assignments", {
  id: uuid("id").defaultRandom().primaryKey(),
  schoolId: uuid("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "restrict" }),
  feeStructureId: uuid("fee_structure_id").notNull().references(() => feeStructures.id, { onDelete: "restrict" }),
  academicYearId: uuid("academic_year_id").notNull().references(() => academicYears.id, { onDelete: "restrict" }),
  termId: uuid("term_id").notNull().references(() => terms.id, { onDelete: "restrict" }),
  status: varchar("status", { length: 30 }).notNull().default("active"),
  assignedAt: timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [unique("fee_assignments_unique").on(table.studentId, table.feeStructureId, table.termId), index("fee_assignments_school_idx").on(table.schoolId), index("fee_assignments_student_idx").on(table.studentId)]);

export const scholarships = pgTable("scholarships", {
  id: uuid("id").defaultRandom().primaryKey(),
  schoolId: uuid("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 150 }).notNull(),
  percentage: numeric("percentage", { precision: 5, scale: 2 }).notNull(),
  maxAmount: numeric("max_amount", { precision: 12, scale: 2 }),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [unique("scholarships_school_name_unique").on(table.schoolId, table.name), index("scholarships_school_idx").on(table.schoolId)]);

export const studentScholarships = pgTable("student_scholarships", {
  id: uuid("id").defaultRandom().primaryKey(),
  schoolId: uuid("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "restrict" }),
  scholarshipId: uuid("scholarship_id").notNull().references(() => scholarships.id, { onDelete: "restrict" }),
  academicYearId: uuid("academic_year_id").notNull().references(() => academicYears.id, { onDelete: "restrict" }),
  termId: uuid("term_id").notNull().references(() => terms.id, { onDelete: "restrict" }),
  amount: numeric("amount", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("student_scholarships_school_idx").on(table.schoolId), index("student_scholarships_student_idx").on(table.studentId)]);

export const timetablePeriods = pgTable("timetable_periods", {
  id: uuid("id").defaultRandom().primaryKey(),
  schoolId: uuid("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 80 }).notNull(),
  dayOfWeek: integer("day_of_week").notNull(),
  startsAt: varchar("starts_at", { length: 5 }).notNull(),
  endsAt: varchar("ends_at", { length: 5 }).notNull(),
  sortOrder: integer("sort_order").notNull(),
}, (table) => [unique("timetable_period_unique").on(table.schoolId, table.dayOfWeek, table.sortOrder), index("timetable_period_school_idx").on(table.schoolId)]);

export const classrooms = pgTable("classrooms", {
  id: uuid("id").defaultRandom().primaryKey(),
  schoolId: uuid("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  capacity: integer("capacity"),
  location: varchar("location", { length: 150 }),
  active: boolean("active").notNull().default(true),
}, (table) => [unique("classrooms_school_name_unique").on(table.schoolId, table.name), index("classrooms_school_idx").on(table.schoolId)]);

export const timetableEntries = pgTable("timetable_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  schoolId: uuid("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  academicYearId: uuid("academic_year_id").notNull().references(() => academicYears.id, { onDelete: "restrict" }),
  termId: uuid("term_id").notNull().references(() => terms.id, { onDelete: "restrict" }),
  streamId: uuid("stream_id").notNull().references(() => streams.id, { onDelete: "restrict" }),
  subjectId: uuid("subject_id").notNull().references(() => subjects.id, { onDelete: "restrict" }),
  staffId: uuid("staff_id").notNull().references(() => staff.id, { onDelete: "restrict" }),
  periodId: uuid("period_id").notNull().references(() => timetablePeriods.id, { onDelete: "cascade" }),
  classroomId: uuid("classroom_id").references(() => classrooms.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [unique("timetable_class_period_unique").on(table.streamId, table.periodId), unique("timetable_teacher_period_unique").on(table.staffId, table.periodId), unique("timetable_room_period_unique").on(table.classroomId, table.periodId), index("timetable_school_idx").on(table.schoolId), index("timetable_stream_idx").on(table.streamId)]);

export const announcementAudienceEnum = pgEnum("announcement_audience", ["school", "class", "stream", "staff", "parents", "students", "individual"]);
export const announcements = pgTable("announcements", {
  id: uuid("id").defaultRandom().primaryKey(),
  schoolId: uuid("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  authorId: text("author_id").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  body: text("body").notNull(),
  audience: announcementAudienceEnum("audience").notNull(),
  targetId: uuid("target_id"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("announcements_school_idx").on(table.schoolId), index("announcements_published_idx").on(table.publishedAt)]);

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  schoolId: uuid("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  recipientAuthUserId: text("recipient_auth_user_id").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  body: text("body").notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("notifications_recipient_idx").on(table.recipientAuthUserId), index("notifications_school_idx").on(table.schoolId)]);

export const internalMessages = pgTable("internal_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  schoolId: uuid("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  senderAuthUserId: text("sender_auth_user_id").notNull(),
  recipientAuthUserId: text("recipient_auth_user_id").notNull(),
  subject: varchar("subject", { length: 200 }).notNull(),
  body: text("body").notNull(),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("internal_messages_school_idx").on(table.schoolId), index("internal_messages_recipient_idx").on(table.recipientAuthUserId)]);

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  schoolId: uuid("school_id").references(() => schools.id, { onDelete: "cascade" }),
  actorAuthUserId: text("actor_auth_user_id"),
  action: varchar("action", { length: 100 }).notNull(),
  entity: varchar("entity", { length: 100 }).notNull(),
  entityId: text("entity_id"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  ipAddress: varchar("ip_address", { length: 64 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("audit_logs_school_idx").on(table.schoolId), index("audit_logs_actor_idx").on(table.actorAuthUserId), index("audit_logs_entity_idx").on(table.entity, table.entityId), index("audit_logs_created_idx").on(table.createdAt)]);

export const promotionDecisions = pgTable("promotion_decisions", {
  id: uuid("id").defaultRandom().primaryKey(),
  schoolId: uuid("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "restrict" }),
  fromEnrollmentId: uuid("from_enrollment_id").notNull().references(() => studentEnrollments.id, { onDelete: "restrict" }),
  toEnrollmentId: uuid("to_enrollment_id").references(() => studentEnrollments.id, { onDelete: "restrict" }),
  status: promotionStatusEnum("status").notNull().default("pending"),
  decisionDate: date("decision_date").notNull(),
  reason: text("reason"),
  actorId: text("actor_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("promotion_decisions_school_idx").on(table.schoolId), index("promotion_decisions_student_idx").on(table.studentId)]);

export const studentImports = pgTable("student_imports", {
  id: uuid("id").defaultRandom().primaryKey(),
  schoolId: uuid("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  createdBy: text("created_by").notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  totalRows: integer("total_rows").notNull(),
  validRows: integer("valid_rows").notNull(),
  invalidRows: integer("invalid_rows").notNull(),
  errors: jsonb("errors").$type<Array<{ row: number; errors: string[] }>>().notNull().default([]),
  status: varchar("status", { length: 30 }).notNull().default("completed"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("student_imports_school_idx").on(table.schoolId), index("student_imports_created_idx").on(table.createdAt)]);



