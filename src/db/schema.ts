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
  unique,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";

/* ============================================================
   ENUMS
   ============================================================ */

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

export const enrollmentStatusEnum = pgEnum("enrollment_status", [
  "active",
  "completed",
  "withdrawn",
  "transferred",
]);

/* ============================================================
   SCHOOLS
   ============================================================ */

export const schools = pgTable(
  "schools",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    name: varchar("name", { length: 200 }).notNull(),

    slug: varchar("slug", { length: 200 })
      .notNull()
      .unique(),

    schoolCode: varchar("school_code", { length: 50 })
      .notNull()
      .unique(),

    schoolType: schoolTypeEnum("school_type")
      .notNull()
      .default("private_basic"),

    region: varchar("region", { length: 100 }),

    district: varchar("district", { length: 100 }),

    town: varchar("town", { length: 100 }),

    address: text("address"),

    phone: varchar("phone", { length: 30 }),

    email: varchar("email", { length: 255 }),

    website: varchar("website", { length: 255 }),

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
    index("schools_status_idx").on(table.status),
    index("schools_region_idx").on(table.region),
  ],
);

/* ============================================================
   ACADEMIC YEARS
   ============================================================ */

export const academicYears = pgTable(
  "academic_years",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, {
        onDelete: "cascade",
      }),

    name: varchar("name", { length: 50 }).notNull(),

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
    unique("academic_year_school_name_unique").on(
      table.schoolId,
      table.name,
    ),

    index("academic_year_school_idx").on(table.schoolId),
  ],
);

/* ============================================================
   TERMS
   ============================================================ */

export const terms = pgTable(
  "terms",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    academicYearId: uuid("academic_year_id")
      .notNull()
      .references(() => academicYears.id, {
        onDelete: "cascade",
      }),

    name: varchar("name", { length: 50 }).notNull(),

    termNumber: integer("term_number").notNull(),

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
    unique("term_year_number_unique").on(
      table.academicYearId,
      table.termNumber,
    ),

    index("terms_academic_year_idx").on(
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
    id: uuid("id").defaultRandom().primaryKey(),

    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, {
        onDelete: "cascade",
      }),

    name: varchar("name", { length: 100 }).notNull(),

    category: classCategoryEnum("category").notNull(),

    sortOrder: integer("sort_order").notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("class_level_school_name_unique").on(
      table.schoolId,
      table.name,
    ),

    index("class_levels_school_idx").on(table.schoolId),
  ],
);

/* ============================================================
   STREAMS
   ============================================================ */

export const streams = pgTable(
  "streams",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    classLevelId: uuid("class_level_id")
      .notNull()
      .references(() => classLevels.id, {
        onDelete: "cascade",
      }),

    name: varchar("name", { length: 50 }).notNull(),

    capacity: integer("capacity"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("stream_class_level_name_unique").on(
      table.classLevelId,
      table.name,
    ),

    index("streams_class_level_idx").on(
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
    id: uuid("id").defaultRandom().primaryKey(),

    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, {
        onDelete: "cascade",
      }),

    name: varchar("name", { length: 150 }).notNull(),

    code: varchar("code", { length: 50 }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("subject_school_name_unique").on(
      table.schoolId,
      table.name,
    ),

    index("subjects_school_idx").on(table.schoolId),
  ],
);

/* ============================================================
   STAFF
   ============================================================ */

export const staff = pgTable(
  "staff",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, {
        onDelete: "cascade",
      }),

    firstName: varchar("first_name", {
      length: 100,
    }).notNull(),

    middleName: varchar("middle_name", {
      length: 100,
    }),

    lastName: varchar("last_name", {
      length: 100,
    }).notNull(),

    staffNumber: varchar("staff_number", {
      length: 50,
    }).notNull(),

    gender: genderEnum("gender"),

    dateOfBirth: date("date_of_birth"),

    phone: varchar("phone", { length: 30 }),

    email: varchar("email", { length: 255 }),

    employmentDate: date("employment_date"),

    position: varchar("position", { length: 100 }),

    status: staffStatusEnum("status")
      .notNull()
      .default("active"),

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
    unique("staff_school_number_unique").on(
      table.schoolId,
      table.staffNumber,
    ),

    index("staff_school_idx").on(table.schoolId),

    index("staff_status_idx").on(table.status),
  ],
);

/* ============================================================
   STUDENTS
   ============================================================ */

export const students = pgTable(
  "students",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, {
        onDelete: "cascade",
      }),

    studentNumber: varchar("student_number", {
      length: 50,
    }).notNull(),

    firstName: varchar("first_name", {
      length: 100,
    }).notNull(),

    middleName: varchar("middle_name", {
      length: 100,
    }),

    lastName: varchar("last_name", {
      length: 100,
    }).notNull(),

    gender: genderEnum("gender").notNull(),

    dateOfBirth: date("date_of_birth"),

    admissionDate: date("admission_date"),

    phone: varchar("phone", { length: 30 }),

    email: varchar("email", { length: 255 }),

    photoUrl: text("photo_url"),

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
    unique("student_school_number_unique").on(
      table.schoolId,
      table.studentNumber,
    ),

    index("students_school_idx").on(table.schoolId),

    index("students_last_name_idx").on(table.lastName),
  ],
);

/* ============================================================
   GUARDIANS
   ============================================================ */

export const guardians = pgTable(
  "guardians",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, {
        onDelete: "cascade",
      }),

    firstName: varchar("first_name", {
      length: 100,
    }).notNull(),

    lastName: varchar("last_name", {
      length: 100,
    }).notNull(),

    relationship: varchar("relationship", {
      length: 50,
    }),

    phone: varchar("phone", { length: 30 }),

    email: varchar("email", { length: 255 }),

    address: text("address"),

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
    index("guardians_school_idx").on(table.schoolId),
  ],
);

/* ============================================================
   STUDENT GUARDIANS
   ============================================================ */

export const studentGuardians = pgTable(
  "student_guardians",
  {
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, {
        onDelete: "cascade",
      }),

    guardianId: uuid("guardian_id")
      .notNull()
      .references(() => guardians.id, {
        onDelete: "cascade",
      }),

    isPrimary: boolean("is_primary")
      .notNull()
      .default(false),

    relationship: varchar("relationship", {
      length: 50,
    }),
  },
  (table) => [
    primaryKey({
      columns: [
        table.studentId,
        table.guardianId,
      ],
    }),

    index("student_guardians_guardian_idx").on(
      table.guardianId,
    ),
  ],
);

/* ============================================================
   STUDENT ENROLLMENTS
   ============================================================ */

export const studentEnrollments = pgTable(
  "student_enrollments",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, {
        onDelete: "cascade",
      }),

    academicYearId: uuid("academic_year_id")
      .notNull()
      .references(() => academicYears.id, {
        onDelete: "cascade",
      }),

    streamId: uuid("stream_id")
      .notNull()
      .references(() => streams.id, {
        onDelete: "restrict",
      }),

    admissionNumber: varchar("admission_number", {
      length: 50,
    }),

    enrollmentDate: date("enrollment_date").notNull(),

    status: enrollmentStatusEnum("status")
      .notNull()
      .default("active"),

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
    unique("student_year_unique").on(
      table.studentId,
      table.academicYearId,
    ),

    index("enrollments_student_idx").on(
      table.studentId,
    ),

    index("enrollments_year_idx").on(
      table.academicYearId,
    ),

    index("enrollments_stream_idx").on(
      table.streamId,
    ),
  ],
);

/* ============================================================
   TEACHER ASSIGNMENTS
   ============================================================ */

export const teacherAssignments = pgTable(
  "teacher_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),

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
  ],
);