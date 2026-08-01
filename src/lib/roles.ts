import type { User } from "@/types";

/** True for accounts that may enter the /admin area. */
export function canAccessAdmin(user?: Pick<User, "role"> | null): boolean {
  return user?.role === "admin" || user?.role === "superadmin";
}

export function isSuperAdmin(user?: Pick<User, "role"> | null): boolean {
  return user?.role === "superadmin";
}

export function isAdmin(user?: Pick<User, "role"> | null): boolean {
  return user?.role === "admin";
}

/** Rank used to guard against escalating privileges. Higher = more privileged. */
const ROLE_RANK: Record<User["role"], number> = {
  student: 0,
  instructor: 1,
  admin: 2,
  superadmin: 3,
};

/**
 * Can `actor` manage a target user (disable, demote, etc.)?
 * Superadmin manages everything except themselves being disabled via the API.
 * Admins may only act on students/instructors, never on admins or superadmins.
 */
export function canManageUser(
  actor?: Pick<User, "role"> | null,
  targetRole?: User["role"],
): boolean {
  if (!actor || !targetRole) return false;
  const actorRank = ROLE_RANK[actor.role];
  const targetRank = ROLE_RANK[targetRole];
  return actorRank > targetRank;
}
