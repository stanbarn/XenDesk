import { json, route } from "@/lib/api/http";
import { requireActor } from "@/lib/auth/session";
import { listCustomers } from "@/lib/services/users";

// Agent-only: customers who have raised tickets, with ticket counts.
export const GET = route(async () => {
  const actor = await requireActor();
  return json(await listCustomers(actor));
});
