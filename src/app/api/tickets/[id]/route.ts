import { json, parseBody, route } from "@/lib/api/http";
import { requireActor } from "@/lib/auth/rbac";
import { updateTicketSchema } from "@/lib/validation/ticket";
import { deleteTicket, getTicketById, updateTicket } from "@/lib/services/tickets";

type Context = { params: Promise<{ id: string }> };

// Ticket detail (access-checked in the service).
export const GET = route(async (_request, { params }: Context) => {
  const actor = await requireActor();
  const { id } = await params;
  return json(await getTicketById(actor, id));
});

// Agent-only: update status / priority / assignment / tags.
export const PATCH = route(async (request, { params }: Context) => {
  const actor = await requireActor();
  const { id } = await params;
  const input = await parseBody(request, updateTicketSchema);
  return json(await updateTicket(actor, id, input));
});

// Agent-only: delete a ticket.
export const DELETE = route(async (_request, { params }: Context) => {
  const actor = await requireActor();
  const { id } = await params;
  await deleteTicket(actor, id);
  return json({ success: true });
});
