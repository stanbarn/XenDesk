import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

// Mock only the session resolver so we can drive route handlers as a given
// actor; everything below (services, Prisma, the DB) runs for real.
vi.mock("@/lib/auth/session", () => ({
  requireActor: vi.fn(),
  requireAgent: vi.fn(),
}));

import { Priority, Role, TicketStatus } from "@/generated/prisma/enums";
import { AuthError } from "@/lib/auth/rbac";
import { requireActor } from "@/lib/auth/session";
import { GET as listTickets, POST as createTicket } from "@/app/api/tickets/route";
import { PATCH as patchTicket } from "@/app/api/tickets/[id]/route";
import { POST as addComment } from "@/app/api/tickets/[id]/comments/route";
import { GET as dashboard } from "@/app/api/dashboard/stats/route";
import { POST as register } from "@/app/api/auth/register/route";
import { GET as listCustomersRoute } from "@/app/api/customers/route";
import { GET as listAgentsRoute, POST as createAgentRoute } from "@/app/api/agents/route";
import { GET as listTagsRoute, POST as createTagRoute } from "@/app/api/tags/route";
import { prisma, resetDatabase } from "../helpers/db";

const mockActor = vi.mocked(requireActor);

function post(body: unknown) {
  return new Request("http://localhost/api/tickets", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

let agentId: string;
let customerId: string;

beforeEach(async () => {
  await resetDatabase();
  const agent = await prisma.user.create({
    data: { name: "Agent", email: "agent@test.local", passwordHash: "x", role: Role.AGENT },
  });
  const customer = await prisma.user.create({
    data: { name: "Customer", email: "customer@test.local", passwordHash: "x", role: Role.CUSTOMER },
  });
  agentId = agent.id;
  customerId = customer.id;
});

afterAll(() => prisma.$disconnect());

describe("/api/tickets", () => {
  it("returns 401 when unauthenticated", async () => {
    mockActor.mockRejectedValueOnce(new AuthError(401, "Authentication required."));
    const res = await listTickets(new Request("http://localhost/api/tickets"));
    expect(res.status).toBe(401);
  });

  it("creates a ticket owned by the actor (201)", async () => {
    mockActor.mockResolvedValueOnce({ id: customerId, role: Role.CUSTOMER });
    const res = await createTicket(post({ title: "Need help", description: "A long enough description here." }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.status).toBe(TicketStatus.OPEN);
    expect(body.customer.id).toBe(customerId);
  });

  it("returns 400 on an invalid body", async () => {
    mockActor.mockResolvedValueOnce({ id: customerId, role: Role.CUSTOMER });
    const res = await createTicket(post({ title: "x" }));
    expect(res.status).toBe(400);
  });
});

describe("/api/tickets/[id] PATCH", () => {
  it("forbids a customer from updating (403)", async () => {
    const ticket = await prisma.ticket.create({
      data: { title: "T", description: "Long enough description", priority: Priority.LOW, customerId },
    });
    mockActor.mockResolvedValueOnce({ id: customerId, role: Role.CUSTOMER });
    const req = new Request(`http://localhost/api/tickets/${ticket.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: TicketStatus.RESOLVED }),
      headers: { "content-type": "application/json" },
    });
    const res = await patchTicket(req, ctx(ticket.id));
    expect(res.status).toBe(403);
  });
});

describe("/api/tickets/[id]/comments POST", () => {
  it("lets the owning customer comment (201)", async () => {
    const ticket = await prisma.ticket.create({
      data: { title: "T", description: "Long enough description", priority: Priority.LOW, customerId },
    });
    mockActor.mockResolvedValueOnce({ id: customerId, role: Role.CUSTOMER });
    const req = new Request(`http://localhost/api/tickets/${ticket.id}/comments`, {
      method: "POST",
      body: JSON.stringify({ body: "Any update?" }),
      headers: { "content-type": "application/json" },
    });
    const res = await addComment(req, ctx(ticket.id));
    expect(res.status).toBe(201);
    expect((await res.json()).author.id).toBe(customerId);
  });
});

describe("/api/dashboard/stats", () => {
  it("returns aggregate counts for an agent (200)", async () => {
    await prisma.ticket.create({
      data: { title: "T", description: "Long enough description", status: TicketStatus.OPEN, priority: Priority.HIGH, customerId },
    });
    mockActor.mockResolvedValueOnce({ id: agentId, role: Role.AGENT });
    const res = await dashboard(new Request("http://localhost/api/dashboard/stats"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.open).toBe(1);
    expect(body.byPriority.HIGH).toBe(1);
  });
});

describe("public + agent collection routes", () => {
  it("registers a customer via POST /api/auth/register (201)", async () => {
    const req = new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name: "New", email: "new@test.local", password: "Password123!" }),
      headers: { "content-type": "application/json" },
    });
    const res = await register(req);
    expect(res.status).toBe(201);
    expect((await res.json()).role).toBe(Role.CUSTOMER);
  });

  it("lists customers and agents for an agent (200)", async () => {
    mockActor.mockResolvedValue({ id: agentId, role: Role.AGENT });
    expect((await listCustomersRoute(new Request("http://localhost/api/customers"))).status).toBe(200);
    expect((await listAgentsRoute(new Request("http://localhost/api/agents"))).status).toBe(200);
  });

  it("onboards an agent for an agent (201) and forbids a customer (403)", async () => {
    mockActor.mockResolvedValueOnce({ id: agentId, role: Role.AGENT });
    const ok = await createAgentRoute(
      new Request("http://localhost/api/agents", {
        method: "POST",
        body: JSON.stringify({ name: "New Agent", email: "new.agent@test.local" }),
        headers: { "content-type": "application/json" },
      }),
    );
    expect(ok.status).toBe(201);
    const body = await ok.json();
    expect(body.agent.role).toBe(Role.AGENT);
    expect(typeof body.tempPassword).toBe("string");

    mockActor.mockResolvedValueOnce({ id: customerId, role: Role.CUSTOMER });
    const forbidden = await createAgentRoute(
      new Request("http://localhost/api/agents", {
        method: "POST",
        body: JSON.stringify({ name: "Nope", email: "nope@test.local" }),
        headers: { "content-type": "application/json" },
      }),
    );
    expect(forbidden.status).toBe(403);
  });

  it("reads tags for any actor and creates one as an agent (201)", async () => {
    mockActor.mockResolvedValueOnce({ id: customerId, role: Role.CUSTOMER });
    expect((await listTagsRoute(new Request("http://localhost/api/tags"))).status).toBe(200);

    mockActor.mockResolvedValueOnce({ id: agentId, role: Role.AGENT });
    const req = new Request("http://localhost/api/tags", {
      method: "POST",
      body: JSON.stringify({ name: "Billing", color: "#B45309" }),
      headers: { "content-type": "application/json" },
    });
    expect((await createTagRoute(req)).status).toBe(201);
  });
});
