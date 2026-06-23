"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowUp, CheckCircle2, Inbox } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { TicketTable } from "@/components/tickets/TicketTable";
import { useDashboardStats, useTickets } from "@/lib/hooks";
import { PRIORITY_STYLE } from "@/lib/ui/tokens";
import { ticketCode } from "@/lib/ui/tokens";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function Metric({
  label,
  value,
  sub,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: number | undefined;
  sub: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <Card className="p-[16px_18px]">
      <div className="mb-3.5 flex items-center justify-between">
        <span className="text-[13px] font-semibold text-muted">{label}</span>
        <span
          className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px]"
          style={{ background: iconBg }}
        >
          <Icon size={16} style={{ color: iconColor }} strokeWidth={2} />
        </span>
      </div>
      <div className="font-display text-[30px] font-bold tracking-[-0.02em]">{value ?? "—"}</div>
      <div className="mt-0.5 text-[12.5px] text-faint">{sub}</div>
    </Card>
  );
}

export function AgentDashboard({ firstName }: { firstName: string }) {
  const router = useRouter();
  const { data: stats } = useDashboardStats();
  const { data: unassigned } = useTickets("?assignment=unassigned&pageSize=4");

  const bars = [
    { label: "High", count: stats?.byPriority.HIGH ?? 0, color: PRIORITY_STYLE.HIGH.dot },
    { label: "Medium", count: stats?.byPriority.MEDIUM ?? 0, color: PRIORITY_STYLE.MEDIUM.dot },
    { label: "Low", count: stats?.byPriority.LOW ?? 0, color: PRIORITY_STYLE.LOW.dot },
  ];
  const maxBar = Math.max(...bars.map((b) => b.count), 1);

  return (
    <div className="max-w-[1320px] p-[26px_30px]">
      <h1 className="mb-1 font-display text-2xl font-semibold tracking-[-0.01em]">
        {greeting()}, {firstName}
      </h1>
      <p className="mb-[22px] text-sm text-muted">
        Here&apos;s what&apos;s happening across XenFi support today.
      </p>

      {/* Metric cards */}
      <div className="mb-3.5 grid grid-cols-4 gap-3.5">
        <Metric label="Open tickets" value={stats?.open} sub="Across all customers" icon={Inbox} iconBg="#EAF0FE" iconColor="#3B82F6" />
        <Metric label="Unassigned" value={stats?.unassigned} sub="Awaiting triage" icon={AlertTriangle} iconBg="#FBF0DD" iconColor="#F59E0B" />
        <Metric label="High priority" value={stats?.byPriority.HIGH} sub="Needs attention" icon={ArrowUp} iconBg="#FDEBE7" iconColor="#EF4444" />
        <Metric label="Resolved" value={stats?.resolved} sub="All time" icon={CheckCircle2} iconBg="#E5F6EE" iconColor="#10B981" />
      </div>

      {/* Priority bars + unassigned queue */}
      <div className="mb-3.5 grid grid-cols-[1.25fr_1fr] gap-3.5">
        <Card className="p-[18px_20px]">
          <div className="mb-[18px] text-sm font-bold">Open tickets by priority</div>
          {bars.map((bar) => (
            <div key={bar.label} className="mb-3.5 flex items-center gap-3.5">
              <div className="w-16 text-[13px] font-semibold text-secondary">{bar.label}</div>
              <div className="h-[9px] flex-1 overflow-hidden rounded-full bg-line-soft">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(bar.count / maxBar) * 100}%`, background: bar.color }}
                />
              </div>
              <div className="w-6 text-right text-[13px] font-bold">{bar.count}</div>
            </div>
          ))}
        </Card>

        <Card className="p-[18px_20px]">
          <div className="mb-3.5 flex items-center justify-between">
            <span className="text-sm font-bold">Unassigned queue</span>
            <span className="rounded-full bg-[#FBF0DD] px-2.5 py-0.5 text-[11.5px] font-bold text-[#B45309]">
              {stats?.unassigned ?? 0} waiting
            </span>
          </div>
          {unassigned?.items.map((t) => (
            <button
              key={t.id}
              onClick={() => router.push(`/tickets/${t.id}`)}
              className="flex w-full items-center gap-2.5 border-t border-line-soft px-1 py-2.5 text-left hover:bg-row-hover"
            >
              <span
                className="h-[7px] w-[7px] flex-shrink-0 rounded-full"
                style={{ background: PRIORITY_STYLE[t.priority].dot }}
              />
              <span className="w-[62px] flex-shrink-0 text-xs font-bold text-faint">
                {ticketCode(t.number)}
              </span>
              <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink">
                {t.title}
              </span>
            </button>
          ))}
          {unassigned && unassigned.items.length === 0 && (
            <div className="border-t border-line-soft py-6 text-center text-[13px] text-faint">
              Nothing waiting — nice work.
            </div>
          )}
        </Card>
      </div>

      {/* Full ticket table */}
      <TicketTable />
    </div>
  );
}
