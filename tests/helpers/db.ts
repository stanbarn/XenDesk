import { Role } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

/** Wipe all data between tests for isolation. */
export async function resetDatabase() {
  await prisma.comment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();
}

let counter = 0;

/** Create a user with a unique email; returns the created row. */
export function createUser(role: Role, name = "Test User") {
  counter += 1;
  return prisma.user.create({
    data: {
      name,
      email: `user${counter}-${role.toLowerCase()}@test.local`,
      passwordHash: "not-used-in-service-tests",
      role,
    },
  });
}

export { prisma };
