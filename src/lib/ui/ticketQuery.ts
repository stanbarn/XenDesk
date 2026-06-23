import type { Priority, TicketStatus } from "@/lib/types";

export type TicketFilters = {
  status?: TicketStatus | "All";
  priority?: Priority | "All";
  tagId?: string | "All";
  search?: string;
  assignment?: "unassigned" | "mine";
  page?: number;
  pageSize?: number;
};

/** Build the /tickets query string, omitting "All" / empty filters. */
export function buildTicketQuery(f: TicketFilters): string {
  const p = new URLSearchParams();
  if (f.status && f.status !== "All") p.set("status", f.status);
  if (f.priority && f.priority !== "All") p.set("priority", f.priority);
  if (f.tagId && f.tagId !== "All") p.set("tagId", f.tagId);
  if (f.search?.trim()) p.set("search", f.search.trim());
  if (f.assignment) p.set("assignment", f.assignment);
  if (f.page) p.set("page", String(f.page));
  if (f.pageSize) p.set("pageSize", String(f.pageSize));
  const s = p.toString();
  return s ? `?${s}` : "";
}
