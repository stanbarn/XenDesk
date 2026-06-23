import { json, route } from "@/lib/api/http";
import { requireActor } from "@/lib/auth/rbac";
import { deleteTag } from "@/lib/services/tags";

type Context = { params: Promise<{ id: string }> };

// Agent-only: delete a tag.
export const DELETE = route(async (_request, { params }: Context) => {
  const actor = await requireActor();
  const { id } = await params;
  await deleteTag(actor, id);
  return json({ success: true });
});
