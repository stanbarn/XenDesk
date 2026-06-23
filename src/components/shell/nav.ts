import { HelpCircle, Inbox, LayoutGrid, Plus, Settings, Tag, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { Role } from "@/lib/types";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Show the open-ticket count as a badge (agent Tickets item). */
  showOpenBadge?: boolean;
};

export const AGENT_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { label: "Tickets", href: "/tickets", icon: Inbox, showOpenBadge: true },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Tags", href: "/tags", icon: Tag },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const CUSTOMER_NAV: NavItem[] = [
  { label: "My tickets", href: "/tickets", icon: Inbox },
  { label: "New ticket", href: "/tickets/new", icon: Plus },
  { label: "Help center", href: "/help", icon: HelpCircle },
];

export function navForRole(role: Role): NavItem[] {
  return role === "AGENT" ? AGENT_NAV : CUSTOMER_NAV;
}

/** Active-state matching that keeps "/tickets" and "/tickets/new" distinct. */
export function isNavActive(href: string, pathname: string): boolean {
  if (href === "/tickets/new") return pathname === "/tickets/new";
  if (href === "/tickets") {
    return pathname === "/tickets" || (pathname.startsWith("/tickets/") && pathname !== "/tickets/new");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function pageTitle(pathname: string, role: Role): string {
  if (pathname.startsWith("/dashboard")) return "Dashboard";
  if (pathname === "/tickets/new") return "Submit a ticket";
  if (pathname.startsWith("/tickets/")) return "Ticket";
  if (pathname === "/tickets") return role === "AGENT" ? "Tickets" : "My tickets";
  if (pathname.startsWith("/customers")) return "Customers";
  if (pathname.startsWith("/tags")) return "Tags";
  if (pathname.startsWith("/settings")) return "Settings";
  if (pathname.startsWith("/help")) return "Help center";
  return "XenDesk";
}
