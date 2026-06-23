import { json, route } from "@/lib/api/http";
import { requireAgent } from "@/lib/auth/session";
import { HttpError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { seedDatabase } from "@/lib/seed";

/**
 * Reseed the database with demo data ("Seed Sample Data" button).
 *
 * This is destructive (wipes all data), so it is double-gated: the caller
 * must be an agent AND the deployment must explicitly opt in via
 * ENABLE_SEED_ENDPOINT=true. Leave it unset in any real environment.
 */
export const POST = route(async () => {
  await requireAgent();

  if (process.env.ENABLE_SEED_ENDPOINT !== "true") {
    throw new HttpError(403, "Seeding via the API is disabled in this environment.");
  }

  const summary = await seedDatabase(prisma);
  return json({ message: "Database reseeded with demo data.", summary });
});
