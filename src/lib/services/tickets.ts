import type { Prisma } from "@/generated/prisma/client";
import { Priority, Role, TicketStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import {
  type Actor,
  assertAgent,
  assertCanAccessTicket,
  isAgent,
} from "@/lib/auth/rbac";
import { BadRequestError, NotFoundError } from "@/lib/errors";
import {
  type CreateTicketInput,
  type ListTicketsQuery,
  type UpdateTicketInput,
} from "@/lib/validation/ticket";
import { assertTagsExist } from "@/lib/services/tags";

// Public-facing user fields (never expose passwordHash).
const userPreview = { id: true, name: true, email: true, company: true } as const;

// Shape returned by list endpoints — light, with a comment count.
const ticketListSelect = {
  id: true,
  number: true,
  title: true,
  status: true,
  priority: true,
  createdAt: true,
  updatedAt: true,
  customer: { select: userPreview },
  agent: { select: userPreview },
  tags: { select: { id: true, name: true, color: true } },
  _count: { select: { comments: true } },
} as const;

// Shape returned by detail endpoint — includes the full comment thread.
const ticketDetailSelect = {
  ...ticketListSelect,
  description: true,
  comments: {
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      body: true,
      createdAt: true,
      author: { select: { ...userPreview, role: true } },
    },
  },
} as const;

export type TicketListItem = Prisma.TicketGetPayload<{ select: typeof ticketListSelect }>;
export type TicketDetail = Prisma.TicketGetPayload<{ select: typeof ticketDetailSelect }>;

/** Any authenticated user can raise a ticket; they become its customer. */
export async function createTicket(actor: Actor, input: CreateTicketInput): Promise<TicketDetail> {
  const tagIds = await assertTagsExist(input.tagIds);

  return prisma.ticket.create({
    data: {
      title: input.title,
      description: input.description,
      priority: input.priority,
      customerId: actor.id,
      tags: { connect: tagIds.map((id) => ({ id })) },
    },
    select: ticketDetailSelect,
  });
}

export type TicketListResult = {
  items: TicketListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

/**
 * Lists tickets the actor is allowed to see. Customers are hard-scoped to
 * their own tickets server-side; agents see everything and may filter.
 */
export async function listTickets(actor: Actor, query: ListTicketsQuery): Promise<TicketListResult> {
  const where: Prisma.TicketWhereInput = {};

  // Hard ownership scope for customers — not overridable by query params.
  if (!isAgent(actor)) {
    where.customerId = actor.id;
  } else if (query.assignment === "unassigned") {
    where.agentId = null;
  } else if (query.assignment === "mine") {
    where.agentId = actor.id;
  }

  if (query.status) where.status = query.status;
  if (query.priority) where.priority = query.priority;
  if (query.tagId) where.tags = { some: { id: query.tagId } };
  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: "insensitive" } },
      { description: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const skip = (query.page - 1) * query.pageSize;
  // Read-only: run page + count concurrently on the pool (no transaction needed).
  const [items, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      select: ticketListSelect,
      orderBy: { createdAt: "desc" },
      skip,
      take: query.pageSize,
    }),
    prisma.ticket.count({ where }),
  ]);

  return {
    items,
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

export async function getTicketById(actor: Actor, ticketId: string): Promise<TicketDetail> {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: ticketDetailSelect,
  });
  if (!ticket) throw new NotFoundError("Ticket not found.");
  // Customers may only read their own tickets.
  assertCanAccessTicket(actor, { customerId: ticket.customer.id });
  return ticket;
}

/** Agent-only: change status, priority, assignment, and/or tags. */
export async function updateTicket(
  actor: Actor,
  ticketId: string,
  input: UpdateTicketInput,
): Promise<TicketDetail> {
  assertAgent(actor);

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { id: true },
  });
  if (!ticket) throw new NotFoundError("Ticket not found.");

  const data: Prisma.TicketUpdateInput = {};
  if (input.status !== undefined) data.status = input.status;
  if (input.priority !== undefined) data.priority = input.priority;

  // Assignment: validate the target is actually an agent; null unassigns.
  if (input.agentId !== undefined) {
    if (input.agentId === null) {
      data.agent = { disconnect: true };
    } else {
      const agent = await prisma.user.findUnique({
        where: { id: input.agentId },
        select: { role: true },
      });
      if (!agent || agent.role !== Role.AGENT) {
        throw new BadRequestError("Assigned user must be an existing agent.");
      }
      data.agent = { connect: { id: input.agentId } };
    }
  }

  if (input.tagIds !== undefined) {
    const tagIds = await assertTagsExist(input.tagIds);
    data.tags = { set: tagIds.map((id) => ({ id })) };
  }

  return prisma.ticket.update({
    where: { id: ticketId },
    data,
    select: ticketDetailSelect,
  });
}

/** Agent-only: remove a ticket (cascades comments and tag links). */
export async function deleteTicket(actor: Actor, ticketId: string): Promise<void> {
  assertAgent(actor);
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { id: true },
  });
  if (!ticket) throw new NotFoundError("Ticket not found.");
  await prisma.ticket.delete({ where: { id: ticketId } });
}

export type DashboardStats = {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  unassigned: number;
  byPriority: { LOW: number; MEDIUM: number; HIGH: number };
};

/** Agent dashboard metrics. */
export async function getDashboardStats(actor: Actor): Promise<DashboardStats> {
  assertAgent(actor);

  // Priority breakdown is over active (non-resolved) tickets.
  const active = { status: { not: TicketStatus.RESOLVED } };

  const [total, open, inProgress, resolved, unassigned, low, medium, high] =
    await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: TicketStatus.OPEN } }),
      prisma.ticket.count({ where: { status: TicketStatus.IN_PROGRESS } }),
      prisma.ticket.count({ where: { status: TicketStatus.RESOLVED } }),
      // "Needs attention": unassigned and not yet resolved.
      prisma.ticket.count({ where: { agentId: null, ...active } }),
      prisma.ticket.count({ where: { priority: Priority.LOW, ...active } }),
      prisma.ticket.count({ where: { priority: Priority.MEDIUM, ...active } }),
      prisma.ticket.count({ where: { priority: Priority.HIGH, ...active } }),
    ]);

  return {
    total,
    open,
    inProgress,
    resolved,
    unassigned,
    byPriority: { LOW: low, MEDIUM: medium, HIGH: high },
  };
}
