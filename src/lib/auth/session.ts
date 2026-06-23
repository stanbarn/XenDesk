import { auth } from "@/auth";
import { Role } from "@/generated/prisma/enums";
import { type Actor, AuthError } from "@/lib/auth/rbac";

/**
 * Session-bound identity resolution for the HTTP edge. Separated from the pure
 * authorization predicates in ./rbac so that services (and their tests) never
 * import Auth.js.
 */

/** Returns the current actor, or null if not signed in. */
export async function getCurrentActor(): Promise<Actor | null> {
  const session = await auth();
  if (!session?.user) return null;
  return { id: session.user.id, role: session.user.role };
}

/** Returns the current actor or throws 401. */
export async function requireActor(): Promise<Actor> {
  const actor = await getCurrentActor();
  if (!actor) throw new AuthError(401, "Authentication required.");
  return actor;
}

/** Returns the current actor if they are an agent, otherwise throws 401/403. */
export async function requireAgent(): Promise<Actor> {
  const actor = await requireActor();
  if (actor.role !== Role.AGENT) {
    throw new AuthError(403, "Agent role required.");
  }
  return actor;
}
