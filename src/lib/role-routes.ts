import type { User } from "@/types";

export type AppRole = User["role"];

export function portalHrefForRole(role?: AppRole | null) {
  if (role === "admin" || role === "superadmin") return "/admin";
  if (role === "instructor") return "/instructor/dashboard";
  return "/dashboard";
}

export function roleLabel(role?: AppRole | null) {
  if (role === "superadmin") return "Super Admin";
  if (role === "admin") return "Admin";
  if (role === "instructor") return "Instructor";
  return "Student";
}
