import { strict as assert } from "node:assert";
import test from "node:test";
import { calculateComponents, calculateFinalScore, calculateGrade, calculatePosition, validateWeights } from "./calculations";

test("50/50 raw marks calculate to 77 final", () => {
  const components = calculateComponents([
    { id: "cat", name: "Class Test", rawScore: 35, maximumScore: 50, weightPercent: 50 },
    { id: "exam", name: "Examination", rawScore: 42, maximumScore: 50, weightPercent: 50 },
  ]);
  assert.equal(components[0].percentage, 70);
  assert.equal(components[0].weightedContribution, 35);
  assert.equal(components[1].percentage, 84);
  assert.equal(components[1].weightedContribution, 42);
  assert.equal(calculateFinalScore(components), 77);
});

test("invalid assessment weights are rejected", () => {
  assert.equal(validateWeights([50, 49.99]).valid, false);
  assert.throws(() => calculateComponents([{ id: "a", name: "A", rawScore: 1, maximumScore: 10, weightPercent: 49.99 }, { id: "b", name: "B", rawScore: 1, maximumScore: 10, weightPercent: 49.99 }]));
});

test("missing scores do not create a false class rank", () => {
  assert.deepEqual(calculatePosition([{ studentId: "a", score: 90 }, { studentId: "b", score: null }, { studentId: "c", score: 90 }, { studentId: "d", score: 80 }]), [
    { studentId: "a", score: 90, position: 1 }, { studentId: "b", score: null, position: null }, { studentId: "c", score: 90, position: 1 }, { studentId: "d", score: 80, position: 3 },
  ]);
});

test("grade rules are data driven", () => {
  assert.equal(calculateGrade(77, [{ grade: "A", minimumScore: 80, maximumScore: 100, remark: "Excellent", gradePoint: 4 }, { grade: "B", minimumScore: 70, maximumScore: 79.99, remark: "Very Good", gradePoint: 3 }])?.grade, "B");
});

test("100/0 weighting is valid and zero score remains zero", () => {
  const components = calculateComponents([
    { id: "exam", name: "Examination", rawScore: 0, maximumScore: 100, weightPercent: 100 },
    { id: "optional", name: "Optional", rawScore: null, maximumScore: 50, weightPercent: 0 },
  ]);
  assert.equal(calculateFinalScore(components), 0);
});

test("scores above maximum are rejected", () => {
  assert.throws(() => calculateComponents([{ id: "a", name: "Test", rawScore: 51, maximumScore: 50, weightPercent: 100 }]));
});
