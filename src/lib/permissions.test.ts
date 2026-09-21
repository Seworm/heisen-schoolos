import test from "node:test";
import assert from "node:assert/strict";
import { hasPermission, permissionsForRole } from "./permissions";

const staff = (role: string) => ({
  accountType: "staff" as const,
  role,
  platformRole: undefined,
});

test("platform administrators have every permission", () => {
  assert.equal(
    hasPermission(
      { ...staff("platform_admin"), platformRole: "platform_admin" },
      "finance.manage",
    ),
    true,
  );
});

test("school roles receive only their permission bundle", () => {
  assert.equal(hasPermission(staff("teacher"), "assessments.manage"), true);
  assert.equal(hasPermission(staff("teacher"), "finance.manage"), false);
  assert.equal(permissionsForRole("bursar").includes("finance.manage"), true);
});

test("non-staff accounts cannot receive staff permissions", () => {
  assert.equal(
    hasPermission(
      { accountType: "student", role: "teacher", platformRole: undefined },
      "assessments.read",
    ),
    false,
  );
});
