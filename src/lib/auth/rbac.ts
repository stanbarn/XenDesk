import { Role } from "@/generated/prisma/enums";
import { HttpError } from "@/lib/errors";

/**
 * The authenticated identity passed into the service layer. Keeping this a
 * plain object (not the full session) lets services enforce authorization
 * without depending on Auth.js — which makes them unit-testable in isolation.
 *
 * This module is intentionally free of any Auth.js / Next.js imports. The
 * session-bound resolvers (requireActor/requireAgent) live in ./session.
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
