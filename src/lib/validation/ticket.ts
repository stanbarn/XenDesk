import { z } from "zod";

import { Priority, TicketStatus } from "@/generated/prisma/enums";

const title = z.string().trim().min(3, "Title must be at least 3 characters.").max(200);
const description = z
  .string()
  .trim()
  .min(10, "Description must be at least 10 characters.")
  .max(5000);

// cuid ids, as produced by Prisma's @default(cuid()).
const id = z.string().cuid();

export const createTicketSchema = z.object({
  title,
  description,
  priority: z.enum(Priority).default(Priority.MEDIUM),
  // Customers may attach existing tags when raising a ticket.
  tagIds: z.array(id).max(10).optional().default([]),
});

/**
 * Agent-only update. Every field is optional so the same endpoint serves
 * status changes, (re)assignment, re-prioritisation, and re-tagging.
 * `agentId: null` explicitly unassigns.
 */
export const updateTicketSchema = z
  .object({
    status: z.enum(TicketStatus),
    priority: z.enum(Priority),
    agentId: z.string().cuid().nullable(),
    tagIds: z.array(id).max(10),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided.",
  });

/** Query params for the ticket list / agent dashboard. */
export const listTicketsQuerySchema = z.object({
  status: z.enum(TicketStatus).optional(),
  priority: z.enum(Priority).optional(),
  tagId: id.optional(),
  // Free-text search across title + description.
  search: z.string().trim().max(200).optional(),
  // Agent-only filter: narrow to unassigned or self-assigned tickets.
  assignment: z.enum(["unassigned", "mine"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type ListTicketsQuery = z.infer<typeof listTicketsQuerySchema>;
