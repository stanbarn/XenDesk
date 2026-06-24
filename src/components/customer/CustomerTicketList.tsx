"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { PriorityPill, StatusPill } from "@/components/ui/Pills";
import { TagChip } from "@/components/ui/TagChip";
import { useTickets } from "@/lib/hooks";
import { relativeTime } from "@/lib/format";
import { ticketCode } from "@/lib/ui/tokens";

const STAT_CARDS = [
  { key: "OPEN", label: "Open", color: "#1D4ED8" },
  { key: "IN_PROGRESS", label: "In Progress", color: "#B45309" },
  { key: "RESOLVED", label: "Resolved", color: "#067A5B" },
] as const;

export function CustomerTicketList() {
  const router = useRouter();
  const { data, isLoading } = useTickets("?pageSize=100");
  const items = data?.items ?? [];

  const counts = {
    OPEN: items.filter((t) => t.status === "OPEN").length,
    IN_PROGRESS: items.filter((t) => t.status === "IN_PROGRESS").length,
    RESOLVED: items.filter((t) => t.status === "RESOLVED").length,
  };

  return (
    <div className="max-w-[980px] p-[26px_30px]">
      <div className="mb-[22px] flex items-end justify-between gap-4">
        <div>
          <h1 className="mb-1 font-display text-2xl font-semibold tracking-[-0.01em]">My tickets</h1>
          <p className="text-sm text-muted">Track the status of your support requests with XenFi.</p>
        </div>
        <Link href="/tickets/new">
          <Button>
            <Plus size={16} strokeWidth={2.4} />
            New ticket
          </Button>
        </Link>
      </div>

      <div className="mb-[18px] flex gap-3">
        {STAT_CARDS.map((c) => (
          <div key={c.key} className="flex-1 rounded-[12px] border border-line bg-surface p-[13px_16px]">
            <div className="font-display text-[22px] font-bold" style={{ color: c.color }}>
              {counts[c.key]}
            </div>
            <div className="mt-0.5 text-[12.5px] text-muted">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-[11px]">
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
            className="flex cursor-pointer items-center gap-4 rounded-[13px] border border-line bg-surface p-[16px_18px] shadow-[0_1px_2px_rgba(16,24,40,.04)] transition hover:border-[#CFE9DD] hover:shadow-[0_4px_14px_rgba(16,24,40,.06)]"
          >
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex items-center gap-2.5">
                <span className="text-xs font-bold text-faint">{ticketCode(t.number)}</span>
                <span className="truncate text-[15px] font-bold text-ink">{t.title}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {t.tags.map((tag) => (
                  <TagChip key={tag.id} name={tag.name} color={tag.color} />
                ))}
              </div>
            </div>
            <PriorityPill priority={t.priority} />
            <StatusPill status={t.status} />
            <span className="w-[78px] text-right text-xs text-faint">{relativeTime(t.updatedAt)}</span>
          </div>
        ))}

        {!isLoading && items.length === 0 && (
          <div className="p-12 text-center text-sm text-faint">
            You haven&apos;t submitted any tickets yet.
          </div>
        )}
      </div>
    </div>
  );
}
