import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { Priority, Role, TicketStatus } from "@/generated/prisma/enums";
import { type Actor, AuthError } from "@/lib/auth/rbac";
import { verifyPassword } from "@/lib/auth/password";
import { BadRequestError, ConflictError, NotFoundError } from "@/lib/errors";
import { listCustomers, listAgents, registerCustomer } from "@/lib/services/users";
import { assertTagsExist, createTag, deleteTag, listTags } from "@/lib/services/tags";
import { prisma, resetDatabase } from "../helpers/db";

const agent: Actor = { id: "agent-x", role: Role.AGENT };
const customer: Actor = { id: "cust-x", role: Role.CUSTOMER };

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

describe("registerCustomer", () => {
  it("creates a hashed CUSTOMER and never returns the hash", async () => {
    const user = await registerCustomer({
      name: "Ada Customer",
      email: "ada@example.com",
      password: "Password123!",
      company: "Acme",
    });
    expect(user.role).toBe(Role.CUSTOMER);
    expect(user).not.toHaveProperty("passwordHash");

    const stored = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(stored.passwordHash).not.toBe("Password123!");
    expect(await verifyPassword("Password123!", stored.passwordHash)).toBe(true);
  });

  it("rejects a duplicate email", async () => {
    await registerCustomer({ name: "A", email: "dup@example.com", password: "Password123!" });
    await expect(
      registerCustomer({ name: "B", email: "dup@example.com", password: "Password123!" }),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});

describe("listAgents / listCustomers", () => {
  it("are agent-only", async () => {
    await expect(listAgents(customer)).rejects.toBeInstanceOf(AuthError);
    await expect(listCustomers(customer)).rejects.toBeInstanceOf(AuthError);
  });

  it("aggregates per-customer ticket counts", async () => {
    const c = await prisma.user.create({
      data: { name: "C", email: "c@example.com", passwordHash: "x", role: Role.CUSTOMER, company: "Globex" },
    });
    await prisma.ticket.create({
      data: { title: "Open one", description: "Long enough description", status: TicketStatus.OPEN, priority: Priority.LOW, customerId: c.id },
    });
    await prisma.ticket.create({
      data: { title: "Done one", description: "Long enough description", status: TicketStatus.RESOLVED, priority: Priority.LOW, customerId: c.id },
    });

    const customers = await listCustomers(agent);
    expect(customers).toHaveLength(1);
    expect(customers[0]).toMatchObject({ company: "Globex", total: 2, open: 1 });
  });
});

describe("tags service", () => {
  it("creates a tag with a default color and is agent-only", async () => {
    await expect(createTag(customer, { name: "Billing" })).rejects.toBeInstanceOf(AuthError);

    const tag = await createTag(agent, { name: "Billing" });
    expect(tag.color).toBe("#667085");

    const colored = await createTag(agent, { name: "Network", color: "#0369A1" });
    expect(colored.color).toBe("#0369A1");
  });

  it("rejects a case-insensitive duplicate name", async () => {
    await createTag(agent, { name: "Account" });
    await expect(createTag(agent, { name: "account" })).rejects.toBeInstanceOf(ConflictError);
  });

  it("lists tags and 404s on deleting a missing one", async () => {
    await createTag(agent, { name: "API" });
    expect(await listTags()).toHaveLength(1);
    await expect(deleteTag(agent, "nope")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("validates tag ids exist", async () => {
    const tag = await createTag(agent, { name: "Hardware" });
    await expect(assertTagsExist([tag.id])).resolves.toEqual([tag.id]);
    await expect(assertTagsExist([tag.id, "missing"])).rejects.toBeInstanceOf(BadRequestError);
  });
});
