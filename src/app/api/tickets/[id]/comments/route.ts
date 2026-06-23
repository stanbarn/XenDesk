import { json, parseBody, route } from "@/lib/api/http";
import { requireActor } from "@/lib/auth/session";
import { createCommentSchema } from "@/lib/validation/comment";
import { addComment, listComments } from "@/lib/services/comments";

type Context = { params: Promise<{ id: string }> };

// Chronological comment thread for a ticket the actor can access.
export const GET = route(async (_request, { params }: Context) => {
  const actor = await requireActor();
  const { id } = await params;
  return json(await listComments(actor, id));
});

// Add a reply (customers may only comment on their own tickets).
export const POST = route(async (request, { params }: Context) => {
  const actor = await requireActor();
  const { id } = await params;
  const input = await parseBody(request, createCommentSchema);
  return json(await addComment(actor, id, input), 201);
});
