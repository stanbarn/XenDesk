import { json, parseBody, route } from "@/lib/api/http";
import { requireActor } from "@/lib/auth/rbac";
import { createTagSchema } from "@/lib/validation/tag";
import { createTag, listTags } from "@/lib/services/tags";

// Any authenticated user can read the tag taxonomy.
export const GET = route(async () => {
  await requireActor();
  return json(await listTags());
});

// Agent-only: create a tag (enforced in the service).
export const POST = route(async (request) => {
  const actor = await requireActor();
  const input = await parseBody(request, createTagSchema);
  return json(await createTag(actor, input), 201);
});
