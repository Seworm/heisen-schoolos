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

export const teacherAssignments =
  pgTable(
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
        .references(
          () => streams.id,
          {
            onDelete: "cascade",
          },
        ),

      subjectId: uuid(
        "subject_id",
      ).references(
        () => subjects.id,
        {
          onDelete: "set null",
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

      isClassTeacher: boolean(
        "is_class_teacher",
      )
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
        "teacher_assignments_staff_idx",
      ).on(
        table.staffId,
      ),

      index(
        "teacher_assignments_stream_idx",
      ).on(
        table.streamId,
      ),

      index(
        "teacher_assignments_subject_idx",
      ).on(
        table.subjectId,
      ),

      index(
        "teacher_assignments_year_idx",
      ).on(
        table.academicYearId,
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