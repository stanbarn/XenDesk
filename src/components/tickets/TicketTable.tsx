"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useSWRConfig } from "swr";
import { Search, UserPlus } from "lucide-react";

import { Avatar } from "@/components/ui/Avatar";
import { PriorityPill, StatusPill } from "@/components/ui/Pills";
import { TagChip } from "@/components/ui/TagChip";
import { api, ApiError } from "@/lib/api/client";
import { useDebounce, useTags, useTickets } from "@/lib/hooks";
import { relativeTime } from "@/lib/format";
import { ticketCode } from "@/lib/ui/tokens";
import { buildTicketQuery } from "@/lib/ui/ticketQuery";
import type { Priority, TicketStatus } from "@/lib/types";
import { cn } from "@/lib/cn";

const GRID = "96px minmax(0,1fr) 150px 108px 124px 152px 84px";

const STATUS_CHIPS: { label: string; value: TicketStatus | "All" }[] = [
  { label: "All", value: "All" },
  { label: "Open", value: "OPEN" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Resolved", value: "RESOLVED" },
];

export function TicketTable({ title = "All tickets" }: { title?: string }) {
  const router = useRouter();
  const { data: tags } = useTags();

  const [status, setStatus] = useState<TicketStatus | "All">("All");
  const [priority, setPriority] = useState<Priority | "All">("All");
  const [tagId, setTagId] = useState<string | "All">("All");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const query = buildTicketQuery({ status, priority, tagId, search: debouncedSearch, pageSize: 100 });
  const { data, isLoading } = useTickets(query);
  const items = data?.items ?? [];

  const { data: session } = useSession();
  const myId = session?.user?.id;
  const { mutate } = useSWRConfig();
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);

  async function claim(ticketId: string, e: React.MouseEvent) {
    e.stopPropagation(); // don't open the ticket
    if (!myId) return;
    setClaimingId(ticketId);
    setClaimError(null);
    try {
      await api.patch(`/tickets/${ticketId}`, { agentId: myId });
      await mutate((key) => typeof key === "string" && (key.startsWith("/tickets") || key.startsWith("/dashboard")));
    } catch (err) {
      setClaimError(err instanceof ApiError ? err.message : "Could not assign the ticket.");
    } finally {
      setClaimingId(null);
    }
  }

  return (
    <div className="overflow-hidden rounded-[14px] border border-line bg-surface shadow-[0_1px_2px_rgba(16,24,40,.04)]">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-divider p-[15px_18px]">
        <div className="text-sm font-bold">
          {title} <span className="font-semibold text-faint">· {data?.total ?? 0}</span>
        </div>
        <div className="flex-1" />

        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets…"
            className="w-[210px] rounded-[9px] border border-input-line bg-[#F7F9FC] py-2 pl-8 pr-3 text-[13px] outline-none focus:border-brand focus:bg-surface"
          />
        </div>

        <div className="flex gap-1.5">
          {STATUS_CHIPS.map((chip) => {
            const active = status === chip.value;
            return (
              <button
                key={chip.value}
                onClick={() => setStatus(chip.value)}
                className={cn(
                  "rounded-[9px] border px-3 py-[7px] text-[12.5px] font-semibold transition",
                  active
                    ? "border-transparent bg-brand-gradient text-white"
                    : "border-input-line bg-surface text-muted hover:bg-canvas",
                )}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority | "All")}
          className="cursor-pointer rounded-[9px] border border-input-line bg-surface px-2.5 py-2 text-[12.5px] font-semibold text-secondary outline-none"
        >
          <option value="All">All priority</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        <select
          value={tagId}
          onChange={(e) => setTagId(e.target.value)}
          className="cursor-pointer rounded-[9px] border border-input-line bg-surface px-2.5 py-2 text-[12.5px] font-semibold text-secondary outline-none"
        >
          <option value="All">All tags</option>
          {tags?.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {claimError && (
        <p className="px-[18px] pt-3 text-[12.5px] font-semibold text-[#C2341D]">{claimError}</p>
      )}

      {/* Scrollable grid (keeps columns from collapsing on narrow widths) */}
      <div className="overflow-x-auto">
      <div className="min-w-[920px]">
      {/* Header row */}
      <div
        className="grid items-center gap-3.5 border-b border-divider bg-[#FAFBFD] px-[18px] py-2.5 text-[11px] font-bold tracking-[0.04em] text-faint"
        style={{ gridTemplateColumns: GRID }}
      >
        <div>TICKET</div>
        <div>SUBJECT</div>
        <div>TAGS</div>
        <div>PRIORITY</div>
        <div>STATUS</div>
        <div>ASSIGNEE</div>
        <div className="text-right">UPDATED</div>
      </div>

      {/* Rows */}
      {items.map((t) => (
        <div
          key={t.id}
          role="button"
          tabIndex={0}
          onClick={() => router.push(`/tickets/${t.id}`)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              router.push(`/tickets/${t.id}`);
            }
          }}
          className="grid cursor-pointer items-center gap-3.5 border-b border-line-soft px-[18px] py-[11px] hover:bg-row-hover"
          style={{ gridTemplateColumns: GRID }}
        >
          <div className="text-[12.5px] font-bold text-faint">{ticketCode(t.number)}</div>
          <div className="min-w-0">
            <div className="truncate text-[13.5px] font-semibold text-ink">{t.title}</div>
            <div className="truncate text-xs text-faint">{t.customer.name}</div>
          </div>
          <div className="flex max-h-6 flex-wrap gap-1.5 overflow-hidden">
            {t.tags.map((tag) => (
              <TagChip key={tag.id} name={tag.name} color={tag.color} />
            ))}
          </div>
          <div>
            <PriorityPill priority={t.priority} />
          </div>
          <div>
            <StatusPill status={t.status} />
          </div>
          <div className="min-w-0">
            {t.agent ? (
              <span className="inline-flex min-w-0 items-center gap-2">
                <Avatar name={t.agent.name} variant="customer" size={22} />
                <span className="truncate text-[12.5px] text-secondary">{t.agent.name}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <span className="text-[12.5px] font-semibold text-[#B45309]">Unassigned</span>
                <button
                  type="button"
                  disabled={claimingId === t.id}
                  onClick={(e) => claim(t.id, e)}
                  title="Assign to me"
                  aria-label="Assign to me"
                  className="text-brand hover:text-brand-dark disabled:opacity-50"
                >
                  <UserPlus size={14} />
                </button>
              </span>
            )}
          </div>
          <div className="text-right text-xs text-faint">{relativeTime(t.updatedAt)}</div>
        </div>
      ))}

      {!isLoading && items.length === 0 && (
        <div className="p-12 text-center text-sm text-faint">No tickets match your filters.</div>
      )}
      {isLoading && (
        <div className="p-12 text-center text-sm text-faint">Loading tickets…</div>
      )}
      </div>
      </div>
    </div>
  );
}
