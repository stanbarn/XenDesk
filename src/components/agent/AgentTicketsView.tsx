"use client";

import { TicketTable } from "@/components/tickets/TicketTable";

export function AgentTicketsView() {
  return (
    <div className="max-w-[1320px] p-[26px_30px]">
      <h1 className="mb-1 font-display text-2xl font-semibold tracking-[-0.01em]">All tickets</h1>
      <p className="mb-[22px] text-sm text-muted">
        Search, filter and manage every ticket across XenFi support.
      </p>
      <TicketTable />
    </div>
  );
}
