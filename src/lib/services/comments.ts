import { prisma } from "@/lib/prisma";
import { type Actor, assertCanAccessTicket } from "@/lib/auth/rbac";
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
    select: { id: true, customerId: true },
  });
  if (!ticket) throw new NotFoundError("Ticket not found.");
  return ticket;
}

/** Add a reply to a ticket. Customers may only comment on their own tickets. */
export async function addComment(actor: Actor, ticketId: string, input: CreateCommentInput) {
  const ticket = await loadTicketForAccess(ticketId);
  assertCanAccessTicket(actor, ticket);

  return prisma.comment.create({
    data: { body: input.body, ticketId: ticket.id, authorId: actor.id },
    select: commentSelect,
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
