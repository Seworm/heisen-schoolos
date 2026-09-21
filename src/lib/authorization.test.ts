import assert from "node:assert/strict";
import test from "node:test";
import { isPlatformUser } from "./authorization";

test("platform role bypasses school membership checks", () => {
  assert.equal(
    isPlatformUser({
      platformRole: "super_admin",
      role: "super_admin",
    }),
    true,
  );
  assert.equal(
    isPlatformUser({
      platformRole: "platform_admin",
      role: "platform_admin",
    }),
    true,
  );
});

test("ordinary school roles remain membership-scoped", () => {
  assert.equal(
    isPlatformUser({
      platformRole: undefined,
      role: "school_admin",
    }),
    false,
  );
});
