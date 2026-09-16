import { describe, it, expect } from "vitest";
import { hasPermission } from "@/lib/auth/rbac";

describe("hasPermission", () => {
  it("grants SUPER_ADMIN full access including user management", () => {
    expect(hasPermission("SUPER_ADMIN", "users:manage")).toBe(true);
    expect(hasPermission("SUPER_ADMIN", "article:publish")).toBe(true);
  });

  it("grants EDITOR publishing rights but not user management", () => {
    expect(hasPermission("EDITOR", "article:publish")).toBe(true);
    expect(hasPermission("EDITOR", "users:manage")).toBe(false);
  });

  it("restricts AUTHOR to creating and editing their own articles only", () => {
    expect(hasPermission("AUTHOR", "article:create")).toBe(true);
    expect(hasPermission("AUTHOR", "article:edit:own")).toBe(true);
    expect(hasPermission("AUTHOR", "article:publish")).toBe(false);
    expect(hasPermission("AUTHOR", "article:delete")).toBe(false);
  });
});
