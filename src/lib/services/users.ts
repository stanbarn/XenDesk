import { Role } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { type Actor, assertAgent } from "@/lib/auth/rbac";
import { ConflictError } from "@/lib/errors";
import { hashPassword } from "@/lib/auth/password";
import { type RegisterInput } from "@/lib/validation/auth";

// Never return passwordHash to callers.
const safeUserSelect = { id: true, name: true, email: true, role: true } as const;

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
    },
    select: safeUserSelect,
  });
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
