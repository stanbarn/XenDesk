import { json, parseBody, parseQuery, route } from "@/lib/api/http";
import { requireActor } from "@/lib/auth/session";
import { createTicketSchema, listTicketsQuerySchema } from "@/lib/validation/ticket";
import { createTicket, listTickets } from "@/lib/services/tickets";

// List tickets visible to the actor (customers: own only; agents: all + filters).
export const GET = route(async (request) => {
  const actor = await requireActor();
  const query = parseQuery(new URL(request.url).searchParams, listTicketsQuerySchema);
  return json(await listTickets(actor, query));
});

// Create a new ticket (the actor becomes its customer).
export const POST = route(async (request) => {
  const actor = await requireActor();
  const input = await parseBody(request, createTicketSchema);
  return json(await createTicket(actor, input), 201);
});
