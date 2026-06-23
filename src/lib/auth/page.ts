import { redirect } from "next/navigation";

import { auth } from "@/auth";
import type { Role } from "@/lib/types";

/** The current session user (with id/role/company), or null. */
export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}

/** Landing route for a role after sign-in. */
export function roleHome(role: Role): string {
  return role === "AGENT" ? "/dashboard" : "/tickets";
}

/**
 * Page-level guard: returns the session user, redirecting to /login when
 * signed out and to the user's own home when their role lacks access.
 */
export async function requireRole(role?: Role) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (role && user.role !== role) redirect(roleHome(user.role));
  return user;
}
