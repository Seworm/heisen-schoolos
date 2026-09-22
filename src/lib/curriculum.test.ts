import test from "node:test";
import assert from "node:assert/strict";
import {
  getCurriculumStageForClassLevel,
  validateCurriculumSelections,
} from "./curriculum";

test("maps Ghanaian class levels to curriculum stages", () => {
  assert.equal(getCurriculumStageForClassLevel("KG 1"), "KINDERGARTEN");
  assert.equal(getCurriculumStageForClassLevel("Basic 1"), "LOWER_PRIMARY");
  assert.equal(getCurriculumStageForClassLevel("Basic 5"), "UPPER_PRIMARY");
  assert.equal(getCurriculumStageForClassLevel("Basic 9"), "JHS");
});

test("requires a controlled Ghanaian language", () => {
  const invalid = validateCurriculumSelections("LOWER_PRIMARY", [
    { subjectCode: "GHANAIAN_LANGUAGE", offered: true },
  ]);
  assert.equal(invalid.valid, false);

  const valid = validateCurriculumSelections("LOWER_PRIMARY", [
    { subjectCode: "GHANAIAN_LANGUAGE", offered: true, languageCode: "EWE" },
  ]);
  assert.equal(valid.errors.some((error) => error.includes("requires")), false);
});

test("does not allow compulsory subjects to be disabled", () => {
  const result = validateCurriculumSelections("JHS", [
    { subjectCode: "MATHEMATICS", offered: false },
  ]);
  assert.equal(result.valid, false);
});
