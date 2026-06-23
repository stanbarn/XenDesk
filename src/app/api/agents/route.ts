import { json, parseBody, route } from "@/lib/api/http";
import { requireActor } from "@/lib/auth/session";
import { onboardAgentSchema } from "@/lib/validation/auth";
import { createAgent, listAgents } from "@/lib/services/users";

// Agent-only: list agents for the assignment picker (enforced in the service).
export const GET = route(async () => {
  const actor = await requireActor();
  return json(await listAgents(actor));
});

// Agent-only: onboard a new agent. Returns the one-time temporary password.
export const POST = route(async (request) => {
  const actor = await requireActor();
  const input = await parseBody(request, onboardAgentSchema);
  return json(await createAgent(actor, input), 201);
});
