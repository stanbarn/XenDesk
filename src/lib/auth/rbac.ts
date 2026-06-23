import { auth } from "@/auth";
import { Role } from "@/generated/prisma/enums";
import { HttpError } from "@/lib/errors";

/**
 * The authenticated identity passed into the service layer. Keeping this a
 * plain object (not the full session) lets services enforce authorization
 * without depending on Auth.js — which makes them unit-testable in isolation.
 */
export type Actor = {
  id: string;
  role: Role;
};

/** Thrown by guards; carries the HTTP status the API layer should return. */
export class AuthError extends HttpError {
  constructor(status: 401 | 403, message: string) {
    super(status, message);
  }
}

// --- Identity resolution (HTTP edge) ----------------------------------------

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

// --- Pure authorization predicates (service layer) --------------------------

export function isAgent(actor: Actor): boolean {
  return actor.role === Role.AGENT;
}

/**
 * A customer may only touch their own tickets; an agent may touch any ticket.
 * Pure and resource-agnostic so it can be reused and tested directly.
 */
export function canAccessTicket(
  actor: Actor,
  ticket: { customerId: string },
): boolean {
  return isAgent(actor) || ticket.customerId === actor.id;
}

export function assertCanAccessTicket(
  actor: Actor,
  ticket: { customerId: string },
): void {
  if (!canAccessTicket(actor, ticket)) {
    throw new AuthError(403, "You do not have access to this ticket.");
  }
}

export function assertAgent(actor: Actor): void {
  if (!isAgent(actor)) {
    throw new AuthError(403, "Only agents may perform this action.");
  }
}
