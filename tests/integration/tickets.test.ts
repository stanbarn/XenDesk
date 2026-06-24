import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { Priority, Role, TicketStatus } from "@/generated/prisma/enums";
import { type Actor, AuthError } from "@/lib/auth/rbac";
import { BadRequestError, NotFoundError } from "@/lib/errors";
import {
  createTicket,
  deleteTicket,
  getDashboardStats,
  getTicketById,
  listTickets,
  updateTicket,
} from "@/lib/services/tickets";
import { addComment } from "@/lib/services/comments";
import { createUser, prisma, resetDatabase } from "../helpers/db";

const LIST_DEFAULTS = { page: 1, pageSize: 20 } as const;

let agent: Actor;
let customerA: Actor;
let customerB: Actor;

beforeEach(async () => {
  await resetDatabase();
  const [a, ca, cb] = await Promise.all([
    createUser(Role.AGENT, "Agent"),
    createUser(Role.CUSTOMER, "Customer A"),
    createUser(Role.CUSTOMER, "Customer B"),
  ]);
  agent = { id: a.id, role: a.role };
  customerA = { id: ca.id, role: ca.role };
  customerB = { id: cb.id, role: cb.role };
});

afterAll(async () => {
  await prisma.$disconnect();
});

function ticketInput(overrides: Partial<{ title: string; description: string; priority: Priority }> = {}) {
  return {
    title: overrides.title ?? "Something is broken",
    description: overrides.description ?? "A detailed description of the problem.",
    priority: overrides.priority ?? Priority.MEDIUM,
    tagIds: [] as string[],
  };
}

describe("createTicket", () => {
  it("creates a ticket owned by the actor, defaulting to OPEN", async () => {
    const ticket = await createTicket(customerA, ticketInput());
    expect(ticket.status).toBe(TicketStatus.OPEN);
    expect(ticket.customer.id).toBe(customerA.id);
    expect(ticket.agent).toBeNull();
  });
});

describe("listTickets — ownership scoping", () => {
  beforeEach(async () => {
    await createTicket(customerA, ticketInput({ title: "A-1" }));
    await createTicket(customerA, ticketInput({ title: "A-2" }));
    await createTicket(customerB, ticketInput({ title: "B-1" }));
  });

  it("scopes customers to their own tickets regardless of filters", async () => {
    const result = await listTickets(customerA, LIST_DEFAULTS);
    expect(result.total).toBe(2);
    expect(result.items.every((t) => t.customer.id === customerA.id)).toBe(true);
  });

  it("lets agents see every ticket", async () => {
    const result = await listTickets(agent, LIST_DEFAULTS);
    expect(result.total).toBe(3);
  });

  it("supports the agent 'unassigned' filter", async () => {
    const result = await listTickets(agent, { ...LIST_DEFAULTS, assignment: "unassigned" });
    expect(result.total).toBe(3);
  });
});

describe("getTicketById — access control", () => {
  it("denies a customer access to another customer's ticket", async () => {
    const ticket = await createTicket(customerA, ticketInput());
    await expect(getTicketById(customerB, ticket.id)).rejects.toBeInstanceOf(AuthError);
  });

  it("returns 404 for a missing ticket", async () => {
    await expect(getTicketById(agent, "does-not-exist")).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("updateTicket — state transitions", () => {
  it("rejects updates from customers", async () => {
    const ticket = await createTicket(customerA, ticketInput());
    await expect(
      updateTicket(customerA, ticket.id, { status: TicketStatus.RESOLVED }),
    ).rejects.toBeInstanceOf(AuthError);
  });

  it("lets an agent change status", async () => {
    const ticket = await createTicket(customerA, ticketInput());
    const updated = await updateTicket(agent, ticket.id, { status: TicketStatus.IN_PROGRESS });
    expect(updated.status).toBe(TicketStatus.IN_PROGRESS);
  });

  it("lets an agent assign and unassign", async () => {
    const ticket = await createTicket(customerA, ticketInput());

    const assigned = await updateTicket(agent, ticket.id, { agentId: agent.id });
    expect(assigned.agent?.id).toBe(agent.id);

    const unassigned = await updateTicket(agent, ticket.id, { agentId: null });
    expect(unassigned.agent).toBeNull();
  });

  it("rejects assignment to a non-agent user", async () => {
    const ticket = await createTicket(customerA, ticketInput());
    await expect(
      updateTicket(agent, ticket.id, { agentId: customerB.id }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});

describe("deleteTicket", () => {
  it("is agent-only", async () => {
    const ticket = await createTicket(customerA, ticketInput());
    await expect(deleteTicket(customerA, ticket.id)).rejects.toBeInstanceOf(AuthError);
    await expect(deleteTicket(agent, ticket.id)).resolves.toBeUndefined();
    await expect(getTicketById(agent, ticket.id)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("addComment — access control", () => {
  it("lets the owning customer comment", async () => {
    const ticket = await createTicket(customerA, ticketInput());
    const comment = await addComment(customerA, ticket.id, { body: "Any update?" });
    expect(comment.author.id).toBe(customerA.id);
  });

  it("denies a foreign customer from commenting", async () => {
    const ticket = await createTicket(customerA, ticketInput());
    await expect(
      addComment(customerB, ticket.id, { body: "I should not be here" }),
    ).rejects.toBeInstanceOf(AuthError);
  });
});

describe("reopen on customer reply", () => {
  async function resolvedTicket() {
    const ticket = await createTicket(customerA, ticketInput());
    await updateTicket(agent, ticket.id, { status: TicketStatus.RESOLVED });
    return ticket;
  }

  it("reopens a RESOLVED ticket when its customer replies", async () => {
    const ticket = await resolvedTicket();
    await addComment(customerA, ticket.id, { body: "It's happening again." });
    const reloaded = await getTicketById(agent, ticket.id);
    expect(reloaded.status).toBe(TicketStatus.OPEN);
  });

  it("does NOT reopen when an agent replies to a RESOLVED ticket", async () => {
    const ticket = await resolvedTicket();
    await addComment(agent, ticket.id, { body: "Closing note for the record." });
    const reloaded = await getTicketById(agent, ticket.id);
    expect(reloaded.status).toBe(TicketStatus.RESOLVED);
  });

  it("leaves a non-resolved ticket's status unchanged on reply", async () => {
    const ticket = await createTicket(customerA, ticketInput()); // OPEN
    await updateTicket(agent, ticket.id, { status: TicketStatus.IN_PROGRESS });
    await addComment(customerA, ticket.id, { body: "Any update?" });
    const reloaded = await getTicketById(agent, ticket.id);
    expect(reloaded.status).toBe(TicketStatus.IN_PROGRESS);
  });
});

describe("getDashboardStats", () => {
  it("aggregates counts for agents", async () => {
    await createTicket(customerA, ticketInput({ priority: Priority.HIGH }));
    const inProg = await createTicket(customerA, ticketInput({ priority: Priority.LOW }));
    await updateTicket(agent, inProg.id, { status: TicketStatus.IN_PROGRESS, agentId: agent.id });

    const stats = await getDashboardStats(agent);
    expect(stats.total).toBe(2);
    expect(stats.open).toBe(1);
    expect(stats.inProgress).toBe(1);
    expect(stats.unassigned).toBe(1); // the open one is still unassigned
    expect(stats.byPriority.HIGH).toBe(1);
  });

  it("is denied to customers", async () => {
    await expect(getDashboardStats(customerA)).rejects.toBeInstanceOf(AuthError);
  });
});
