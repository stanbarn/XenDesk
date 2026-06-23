import { json, route } from "@/lib/api/http";
import { requireActor } from "@/lib/auth/session";
import { listAgents } from "@/lib/services/users";

// Agent-only: list agents for the assignment picker (enforced in the service).
export const GET = route(async () => {
  const actor = await requireActor();
  return json(await listAgents(actor));
});
