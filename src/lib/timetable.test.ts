import { test } from "node:test";
import assert from "node:assert/strict";
import { buildTimetablePlan } from "./timetable";

test("intelligent scheduler never places one teacher in two classes", () => {
  const result = buildTimetablePlan({
    assignments: [
      { id: "a", streamId: "class-1", subjectId: "math", staffId: "teacher-1" },
      { id: "b", streamId: "class-2", subjectId: "eng", staffId: "teacher-1" },
    ],
    periods: [
      { id: "p1", dayOfWeek: 1, sortOrder: 1 },
      { id: "p2", dayOfWeek: 1, sortOrder: 2 },
    ],
    occupied: [],
    lessonsPerAssignment: 1,
  });

  assert.equal(result.entries.length, 2);
  assert.notEqual(result.entries[0].periodId, result.entries[1].periodId);
  assert.equal(result.unscheduled.length, 0);
});

test("scheduler reports teacher capacity instead of creating a clash", () => {
  const result = buildTimetablePlan({
    assignments: [
      { id: "a", streamId: "class-1", subjectId: "math", staffId: "teacher-1" },
      { id: "b", streamId: "class-2", subjectId: "eng", staffId: "teacher-1" },
    ],
    periods: [{ id: "p1", dayOfWeek: 1, sortOrder: 1 }],
    occupied: [],
    lessonsPerAssignment: 1,
  });

  assert.equal(result.entries.length, 1);
  assert.deepEqual(result.unscheduled, [{ assignmentId: "b", lessonNumber: 1, reason: "teacher_busy" }]);
});
