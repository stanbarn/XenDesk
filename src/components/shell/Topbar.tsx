"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useSWRConfig } from "swr";
import { Bell, Check, ChevronDown, Database, LogOut, Settings } from "lucide-react";

import { Avatar } from "@/components/ui/Avatar";
import { api, ApiError } from "@/lib/api/client";
import { useTickets } from "@/lib/hooks";
import { STATUS_STYLE } from "@/lib/ui/tokens";
import { ticketCode } from "@/lib/ui/tokens";
import { relativeTime } from "@/lib/format";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/cn";
import { pageTitle } from "./nav";

type ShellUser = { name: string; email: string; role: Role; company: string | null };
type OpenMenu = "notif" | "user" | null;

export function Topbar({ user }: { user: ShellUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const isAgent = user.role === "AGENT";

  const [menu, setMenu] = useState<OpenMenu>(null);
  const [seeding, setSeeding] = useState(false);
  const [seeded, setSeeded] = useState(false);

  const { data: recent } = useTickets("?pageSize=5");

  async function reseed() {
    setSeeding(true);
    try {
      await api.post("/admin/seed");
      setSeeded(true);
      await mutate(() => true, undefined, { revalidate: true });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Seeding failed.";
      window.alert(message);
    } finally {
      setSeeding(false);
    }
  }

  return (
    <header className="flex h-[62px] flex-shrink-0 items-center gap-4 border-b border-line bg-surface px-[30px]">
      <div className="font-display text-[17px] font-semibold tracking-[-0.01em]">
        {pageTitle(pathname, user.role)}
      </div>
      <div className="flex-1" />

      {isAgent && (
        <button
          type="button"
          onClick={reseed}
          disabled={seeding}
          className={cn(
            "flex items-center gap-2 rounded-[10px] border px-3.5 py-2 text-[13px] font-semibold transition disabled:opacity-60",
            seeded
              ? "border-[#BEEBD6] bg-[#E5F6EE] text-[#067A5B]"
              : "border-input bg-surface text-secondary hover:bg-[#F4F7FB]",
          )}
        >
          {seeded ? <Check size={15} className="text-[#10B981]" /> : <Database size={15} className="text-faint" />}
          {seeded ? "Sample data loaded" : seeding ? "Seeding…" : "Seed sample data"}
        </button>
      )}

      {/* Outside-click backdrop */}
      {menu && <div className="fixed inset-0 z-40" onClick={() => setMenu(null)} />}

      {/* Notifications */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenu((m) => (m === "notif" ? null : "notif"))}
          className="relative flex h-[37px] w-[37px] items-center justify-center rounded-[10px] border border-input-line bg-surface"
        >
          <Bell size={17} className="text-muted" strokeWidth={2} />
          <span className="absolute right-2 top-2 h-[7px] w-[7px] rounded-full border-2 border-surface bg-brand" />
        </button>
        {menu === "notif" && (
          <div className="absolute right-0 top-[46px] z-50 w-[328px] overflow-hidden rounded-[13px] border border-line bg-surface shadow-[0_14px_36px_rgba(16,24,40,.16)]">
            <div className="flex items-center justify-between border-b border-divider px-4 py-3">
              <span className="text-[13.5px] font-bold">Notifications</span>
              <span className="text-[11.5px] font-bold text-brand">{recent?.items.length ?? 0} recent</span>
            </div>
            {recent?.items.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setMenu(null);
                  router.push(`/tickets/${t.id}`);
                }}
                className="flex w-full gap-2.5 border-b border-[#F4F6FA] px-4 py-3 text-left hover:bg-row-hover"
              >
                <span
                  className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full"
                  style={{ background: STATUS_STYLE[t.status].dot }}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold text-ink">
                    {ticketCode(t.number)} · {t.title}
                  </div>
                  <div className="mt-px text-[11.5px] text-faint">Updated {relativeTime(t.updatedAt)}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* User menu */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenu((m) => (m === "user" ? null : "user"))}
          className="flex items-center gap-1.5 rounded-[11px] p-[3px_7px_3px_3px] hover:bg-line-soft"
        >
          <Avatar name={user.name} variant={isAgent ? "agent" : "customer"} size={37} />
          <ChevronDown size={15} className="text-faint" />
        </button>
        {menu === "user" && (
          <div className="absolute right-0 top-[46px] z-50 w-[250px] overflow-hidden rounded-[13px] border border-line bg-surface shadow-[0_14px_36px_rgba(16,24,40,.16)]">
            <div className="flex items-center gap-2.5 border-b border-divider px-4 py-3.5">
              <Avatar name={user.name} variant={isAgent ? "agent" : "customer"} size={36} />
              <div className="min-w-0">
                <div className="truncate text-[13.5px] font-bold">{user.name}</div>
                <div className="truncate text-xs text-faint">{user.email}</div>
              </div>
            </div>
            <div className="p-1.5">
              {isAgent && (
                <button
                  type="button"
                  onClick={() => {
                    setMenu(null);
                    router.push("/settings");
                  }}
                  className="flex w-full items-center gap-[11px] rounded-[9px] px-[11px] py-2.5 text-[13.5px] font-semibold text-secondary hover:bg-canvas"
                >
                  <Settings size={16} className="text-muted" />
                  Settings
                </button>
              )}
              <button
                type="button"
                onClick={() => void signOut({ callbackUrl: "/login" })}
                className="flex w-full items-center gap-[11px] rounded-[9px] px-[11px] py-2.5 text-[13.5px] font-semibold text-[#C2341D] hover:bg-canvas"
              >
                <LogOut size={16} className="text-[#C2341D]" />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
