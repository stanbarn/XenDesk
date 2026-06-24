import { TicketStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { type Actor, assertCanAccessTicket, isAgent } from "@/lib/auth/rbac";
import { NotFoundError } from "@/lib/errors";
import { type CreateCommentInput } from "@/lib/validation/comment";

const commentSelect = {
  id: true,
  body: true,
  createdAt: true,
  author: { select: { id: true, name: true, email: true, role: true } },
} as const;

async function loadTicketForAccess(ticketId: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { id: true, customerId: true, status: true },
  });
  if (!ticket) throw new NotFoundError("Ticket not found.");
  return ticket;
}

/**
 * Add a reply to a ticket. Customers may only comment on their own tickets.
 *
 * A customer replying to a RESOLVED ticket automatically reopens it (back to
 * OPEN) — the issue clearly isn't settled. An agent's reply does not reopen it.
 * The comment + status change are committed atomically.
 */
export async function addComment(actor: Actor, ticketId: string, input: CreateCommentInput) {
  const ticket = await loadTicketForAccess(ticketId);
  assertCanAccessTicket(actor, ticket);

  const reopen = !isAgent(actor) && ticket.status === TicketStatus.RESOLVED;

  return prisma.$transaction(async (tx) => {
    const comment = await tx.comment.create({
      data: { body: input.body, ticketId: ticket.id, authorId: actor.id },
      select: commentSelect,
    });
    // Every reply counts as activity, so bump the ticket's last-updated time
    // (and reopen it if a customer replied after resolution).
    await tx.ticket.update({
      where: { id: ticket.id },
      data: { updatedAt: new Date(), ...(reopen ? { status: TicketStatus.OPEN } : {}) },
    });
    return comment;
  });
}

/** Chronological comment thread for a ticket the actor can access. */
export async function listComments(actor: Actor, ticketId: string) {
  const ticket = await loadTicketForAccess(ticketId);
  assertCanAccessTicket(actor, ticket);

  return prisma.comment.findMany({
    where: { ticketId: ticket.id },
    select: commentSelect,
    orderBy: { createdAt: "asc" },
  });
}
