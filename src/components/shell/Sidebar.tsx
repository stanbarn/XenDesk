"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Avatar } from "@/components/ui/Avatar";
import { Logo } from "@/components/ui/Logo";
import { useDashboardStats } from "@/lib/hooks";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/cn";
import { isNavActive, navForRole } from "./nav";

type ShellUser = { name: string; role: Role; company: string | null };

export function Sidebar({ user }: { user: ShellUser }) {
  const pathname = usePathname();
  const isAgent = user.role === "AGENT";
  const { data: stats } = useDashboardStats();

  const navItems = navForRole(user.role);
  const roleLabel = isAgent
    ? "Support Agent"
    : `Customer${user.company ? ` · ${user.company}` : ""}`;

  return (
    <aside className="flex h-screen w-[248px] flex-shrink-0 flex-col border-r border-line bg-surface px-3.5 py-5">
      <div className="px-2 pb-5 pt-1">
        <Logo size={37} />
      </div>

      <div className="px-2.5 pb-1.5 pt-1 text-[11px] font-bold tracking-[0.07em] text-faint">
        {isAgent ? "SUPPORT WORKSPACE" : "CUSTOMER PORTAL"}
      </div>

      <nav className="flex flex-col gap-[3px]">
        {navItems.map((item) => {
          const active = isNavActive(item.href, pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-[11px] rounded-[10px] px-[13px] py-2.5 text-sm font-semibold transition-colors",
                active
                  ? "bg-brand-tint text-brand shadow-[inset_2px_0_0_#0E9F6E]"
                  : "text-muted hover:bg-canvas",
              )}
            >
              <Icon size={18} strokeWidth={2} className={active ? "text-brand" : "text-faint"} />
              <span className="flex-1">{item.label}</span>
              {item.showOpenBadge && stats ? (
                <span className="rounded-full bg-brand-tint px-2 py-0.5 text-[11px] font-bold text-brand">
                  {stats.open}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      <div className="flex items-center gap-2.5 border-t border-divider px-2 py-2.5">
        <Avatar name={user.name} variant={isAgent ? "agent" : "customer"} size={33} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13.5px] font-bold text-ink">{user.name}</div>
          <div className="truncate text-[11.5px] text-muted">{roleLabel}</div>
        </div>
      </div>
    </aside>
  );
}
