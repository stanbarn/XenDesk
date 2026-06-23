// Client-facing DTO types — mirror the JSON the API returns (dates as ISO
// strings). Kept separate from the Prisma-backed service types so client
// components never import server-only code.

export type Role = "CUSTOMER" | "AGENT";
export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";
export type Priority = "LOW" | "MEDIUM" | "HIGH";

export type UserPreview = {
  id: string;
  name: string;
  email: string;
  company: string | null;
};

export type TagDTO = { id: string; name: string; color: string };
export type TagWithCount = TagDTO & { _count: { tickets: number } };

export type TicketListItem = {
  id: string;
  number: number;
  title: string;
  status: TicketStatus;
  priority: Priority;
  createdAt: string;
  updatedAt: string;
  customer: UserPreview;
  agent: UserPreview | null;
  tags: TagDTO[];
  _count: { comments: number };
};

export type CommentDTO = {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; name: string; email: string; role: Role };
};

export type TicketDetail = TicketListItem & {
  description: string;
  comments: CommentDTO[];
};

export type TicketListResult = {
  items: TicketListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type DashboardStats = {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  unassigned: number;
  byPriority: { LOW: number; MEDIUM: number; HIGH: number };
};

export type AgentDTO = {
  id: string;
  name: string;
  email: string;
  role: Role;
  company: string | null;
};

export type CustomerSummary = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  total: number;
  open: number;
};
