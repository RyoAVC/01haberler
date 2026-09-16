import type { UserRole } from "@prisma/client";

export type Permission =
  | "article:create"
  | "article:edit:own"
  | "article:edit:any"
  | "article:publish"
  | "article:delete"
  | "category:manage"
  | "source:manage"
  | "ads:manage"
  | "settings:manage"
  | "content-filter:manage"
  | "users:manage"
  | "audit:view"
  | "modules:manage"
  | "redirects:manage"
  | "changelog:manage"
  | "license:view-hidden"
  | "comments:moderate"
  | "polls:manage"
  | "push:manage"
  | "social:manage";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    "article:create",
    "article:edit:own",
    "article:edit:any",
    "article:publish",
    "article:delete",
    "category:manage",
    "source:manage",
    "ads:manage",
    "settings:manage",
    "content-filter:manage",
    "users:manage",
    "audit:view",
    "modules:manage",
    "redirects:manage",
    "changelog:manage",
    "license:view-hidden",
    "comments:moderate",
    "polls:manage",
    "push:manage",
    "social:manage",
  ],
  EDITOR: [
    "article:create",
    "article:edit:own",
    "article:edit:any",
    "article:publish",
    "article:delete",
    "category:manage",
    "source:manage",
    "content-filter:manage",
    "audit:view",
    "comments:moderate",
    "polls:manage",
    "changelog:manage",
  ],
  AUTHOR: ["article:create", "article:edit:own"],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
