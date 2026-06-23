import type { Priority, TicketStatus } from "@/lib/types";

// Status / priority palettes from the design handoff (text / bg / dot).
type Swatch = { fg: string; bg: string; dot: string };

export const STATUS_LABEL: Record<TicketStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export const STATUS_STYLE: Record<TicketStatus, Swatch> = {
  OPEN: { fg: "#1D4ED8", bg: "#EAF0FE", dot: "#3B82F6" },
  IN_PROGRESS: { fg: "#B45309", bg: "#FBF0DD", dot: "#F59E0B" },
  RESOLVED: { fg: "#067A5B", bg: "#E5F6EE", dot: "#10B981" },
};

export const PRIORITY_STYLE: Record<Priority, Swatch> = {
  HIGH: { fg: "#C2341D", bg: "#FDEBE7", dot: "#EF4444" },
  MEDIUM: { fg: "#B45309", bg: "#FBF0DD", dot: "#F59E0B" },
  LOW: { fg: "#475569", bg: "#EEF1F6", dot: "#94A3B8" },
};

export const STATUS_ORDER: TicketStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED"];
export const PRIORITY_ORDER: Priority[] = ["LOW", "MEDIUM", "HIGH"];

export function initials(name: string): string {
  return (name || "")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function ticketCode(number: number): string {
  return `TK-${number}`;
}
