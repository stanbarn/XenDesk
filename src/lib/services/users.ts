import { randomBytes } from "node:crypto";

import { Role } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { type Actor, assertAgent } from "@/lib/auth/rbac";
import { ConflictError } from "@/lib/errors";
import { hashPassword } from "@/lib/auth/password";
import { type OnboardAgentInput, type RegisterInput } from "@/lib/validation/auth";

// Never return passwordHash to callers.
const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  company: true,
} as const;

/** Public self-registration. New accounts are always customers. */
export async function registerCustomer(input: RegisterInput) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });
  if (existing) throw new ConflictError("An account with this email already exists.");

  const passwordHash = await hashPassword(input.password);
  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: Role.CUSTOMER,
      company: input.company ?? null,
    },
    select: safeUserSelect,
  });
}

// A URL-safe, unambiguous temporary password (~16 chars) shown once at
// onboarding. The new agent should change it (change-password flow is a
// documented follow-up).
function generateTempPassword(): string {
  return randomBytes(12).toString("base64url");
}

/**
 * Agent-only: onboard a new agent. The password is generated server-side and
 * returned exactly once so the onboarding agent can share it securely.
 */
export async function createAgent(actor: Actor, input: OnboardAgentInput) {
  assertAgent(actor);

  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });
  if (existing) throw new ConflictError("A user with this email already exists.");

  const tempPassword = generateTempPassword();
  const agent = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(tempPassword),
      role: Role.AGENT,
    },
    select: safeUserSelect,
  });

  return { agent, tempPassword };
}

/** Agent-only: list of agents, used to populate the assignment picker. */
export async function listAgents(actor: Actor) {
  assertAgent(actor);
  return prisma.user.findMany({
    where: { role: Role.AGENT },
    select: safeUserSelect,
    orderBy: { name: "asc" },
  });
}

export type CustomerSummary = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  total: number;
  open: number; // tickets not yet resolved
};

/** Agent-only: every customer who has raised a ticket, with ticket counts. */
export async function listCustomers(actor: Actor): Promise<CustomerSummary[]> {
  assertAgent(actor);

  // Select only the status of each customer's tickets (not full rows) and
  // tally totals/open counts. Adequate at this scale; a groupBy could replace
  // it if the per-customer ticket volume grew large.
  const customers = await prisma.user.findMany({
    where: { role: Role.CUSTOMER, ticketsAsCustomer: { some: {} } },
    select: {
      id: true,
      name: true,
      email: true,
      company: true,
      ticketsAsCustomer: { select: { status: true } },
    },
    orderBy: { name: "asc" },
  });

  return customers.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    company: c.company,
    total: c.ticketsAsCustomer.length,
    open: c.ticketsAsCustomer.filter((t) => t.status !== "RESOLVED").length,
  }));
}
