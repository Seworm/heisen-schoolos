import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { academicYears, assessmentPeriods, assessmentTypes, assessments, classLevels, feeCategories, gradingSchemeItems, gradingSchemes, gradeBands, guardians, schoolSettings, staff, studentEnrollments, studentGuardians, students, streams, subjects, teacherAssignments, terms } from "@/db/schema";

async function seedPlatform() {
  const [school] = await db.select().from((await import("@/db/schema")).schools).where(eq((await import("@/db/schema")).schools.slug, "heisen-demo-school")).limit(1);
  if (!school) throw new Error("Run npm run seed first.");
  const [year] = await db.select().from(academicYears).where(and(eq(academicYears.schoolId, school.id), eq(academicYears.isCurrent, true))).limit(1);
  const [term] = await db.select().from(terms).where(and(eq(terms.academicYearId, year.id), eq(terms.isCurrent, true))).limit(1);
  const [stream] = await db.select().from(streams).innerJoin(classLevels, eq(streams.classLevelId, classLevels.id)).where(eq(classLevels.schoolId, school.id)).limit(1);
  const [subject] = await db.select().from(subjects).where(eq(subjects.schoolId, school.id)).limit(1);
  if (!year || !term || !stream || !subject) throw new Error("Required academic seed data is missing.");

  await db.insert(schoolSettings).values({ schoolId: school.id, currency: "GHS", timezone: "Africa/Accra", enableRanking: true, enableSubjectRanking: true }).onConflictDoNothing();

  const types = [
    { name: "Class Test", code: "CAT", category: "continuous_assessment" as const },
    { name: "Examination", code: "EXAM", category: "examination" as const },
  ];
  const typeRows = [] as typeof assessmentTypes.$inferSelect[];
  for (const type of types) {
    const [row] = await db.insert(assessmentTypes).values({ schoolId: school.id, ...type }).onConflictDoNothing().returning();
    const [existing] = row ? [row] : await db.select().from(assessmentTypes).where(and(eq(assessmentTypes.schoolId, school.id), eq(assessmentTypes.code, type.code))).limit(1);
    if (existing) typeRows.push(existing);
  }

  const [scheme] = await db.insert(gradingSchemes).values({ schoolId: school.id, name: "Standard 100-point scheme", description: "Default Ghanaian basic-school grading scheme", status: "active" }).onConflictDoNothing().returning();
  const [schemeRow] = scheme ? [scheme] : await db.select().from(gradingSchemes).where(and(eq(gradingSchemes.schoolId, school.id), eq(gradingSchemes.name, "Standard 100-point scheme"))).limit(1);
  if (schemeRow && typeRows.length === 2) {
    for (const [index, type] of typeRows.entries()) await db.insert(gradingSchemeItems).values({ gradingSchemeId: schemeRow.id, assessmentTypeId: type.id, weightPercent: index === 0 ? "50" : "50" }).onConflictDoNothing();
    const bands = [["A",80,100,"Excellent",1],["B",70,79.99,"Very Good",2],["C",60,69.99,"Good",3],["D",50,59.99,"Satisfactory",4],["E",40,49.99,"Pass",5],["F",0,39.99,"Needs improvement",6]] as const;
    for (const [grade,min,max,remark,sortOrder] of bands) await db.insert(gradeBands).values({ gradingSchemeId: schemeRow.id, grade, label: remark, minimumPercent: String(min), maximumPercent: String(max), remark, sortOrder }).onConflictDoNothing();
  }

  const [staffRow] = await db.insert(staff).values({ schoolId: school.id, firstName: "Ama", lastName: "Mensah", staffNumber: "STF-0001", email: "teacher@heisenschool.example", position: "Teacher", status: "active" }).onConflictDoNothing().returning();
  const [teacher] = staffRow ? [staffRow] : await db.select().from(staff).where(and(eq(staff.schoolId, school.id), eq(staff.staffNumber, "STF-0001"))).limit(1);
  if (teacher) await db.insert(teacherAssignments).values({ staffId: teacher.id, streamId: stream.streams.id, subjectId: subject.id, academicYearId: year.id, isClassTeacher: true }).onConflictDoNothing();

  const [studentRow] = await db.insert(students).values({ schoolId: school.id, studentNumber: "STD-0001", admissionNumber: "ADM-0001", firstName: "Kojo", lastName: "Mensah", gender: "male", admissionDate: "2026-09-01", email: "kojo.student@heisenschool.example" }).onConflictDoNothing().returning();
  const [student] = studentRow ? [studentRow] : await db.select().from(students).where(and(eq(students.schoolId, school.id), eq(students.studentNumber, "STD-0001"))).limit(1);
  if (student) {
    await db.insert(studentEnrollments).values({ studentId: student.id, academicYearId: year.id, streamId: stream.streams.id, admissionNumber: "ADM-0001", enrollmentDate: "2026-09-01", status: "active" }).onConflictDoNothing();
    const [guardianRow] = await db.insert(guardians).values({ schoolId: school.id, firstName: "Adwoa", lastName: "Mensah", phone: "+233200000001", email: "parent@heisenschool.example" }).onConflictDoNothing().returning();
    const [guardian] = guardianRow ? [guardianRow] : await db.select().from(guardians).where(and(eq(guardians.schoolId, school.id), eq(guardians.email, "parent@heisenschool.example"))).limit(1);
    if (guardian) await db.insert(studentGuardians).values({ studentId: student.id, guardianId: guardian.id, isPrimary: true }).onConflictDoNothing();
  }

  if (typeRows.length === 2) {
    const [period] = await db.insert(assessmentPeriods).values({ schoolId: school.id, academicYearId: year.id, termId: term.id, name: "First Term 2026/2027", status: "open" }).onConflictDoNothing().returning();
    const [periodRow] = period ? [period] : await db.select().from(assessmentPeriods).where(and(eq(assessmentPeriods.schoolId, school.id), eq(assessmentPeriods.name, "First Term 2026/2027"))).limit(1);
    if (periodRow) {
      await db.insert(assessments).values({ schoolId: school.id, academicYearId: year.id, termId: term.id, assessmentPeriodId: periodRow.id, streamId: stream.streams.id, subjectId: subject.id, assessmentTypeId: typeRows[0].id, name: "Class Test 1", maxScore: "50", status: "open" }).onConflictDoNothing();
      await db.insert(assessments).values({ schoolId: school.id, academicYearId: year.id, termId: term.id, assessmentPeriodId: periodRow.id, streamId: stream.streams.id, subjectId: subject.id, assessmentTypeId: typeRows[1].id, name: "Terminal Examination", maxScore: "100", status: "open" }).onConflictDoNothing();
    }
  }

  for (const category of [
  "tuition",
  "feeding",
  "transportation",
  "uniform",
  "books",
  "examination",
  "miscellaneous",
]) {
  await db
    .insert(feeCategories)
    .values({
      schoolId: school.id,
      name: category[0].toUpperCase() + category.slice(1),
    })
    .onConflictDoNothing();
}
  console.log("Platform seed completed.");
}

seedPlatform().catch((error) => { console.error(error); process.exit(1); });
