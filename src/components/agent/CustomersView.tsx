"use client";

import { Avatar } from "@/components/ui/Avatar";
import { useCustomers } from "@/lib/hooks";

const GRID = "minmax(0,1.3fr) 170px minmax(0,1fr) 84px 84px";

export function CustomersView() {
  const { data, isLoading } = useCustomers();
  const customers = data ?? [];

  return (
    <div className="max-w-[1080px] p-[26px_30px]">
      <h1 className="mb-1 font-display text-2xl font-semibold tracking-[-0.01em]">Customers</h1>
      <p className="mb-[22px] text-sm text-muted">
        Everyone who has opened a support ticket with XenFi.
      </p>

      <div className="overflow-x-auto rounded-[14px] border border-line bg-surface shadow-[0_1px_2px_rgba(16,24,40,.04)]">
        <div className="min-w-[760px]">
        <div
          className="grid items-center gap-3.5 border-b border-divider bg-[#FAFBFD] px-5 py-[11px] text-[11px] font-bold tracking-[0.04em] text-faint"
          style={{ gridTemplateColumns: GRID }}
        >
          <div>CUSTOMER</div>
          <div>COMPANY</div>
          <div>EMAIL</div>
          <div className="text-right">TICKETS</div>
          <div className="text-right">OPEN</div>
        </div>

        {customers.map((c) => (
          <div
            key={c.id}
            className="grid items-center gap-3.5 border-b border-line-soft px-5 py-3"
            style={{ gridTemplateColumns: GRID }}
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <Avatar name={c.name} variant="customer" size={32} />
              <span className="truncate text-[13.5px] font-semibold text-ink">{c.name}</span>
            </div>
            <div className="truncate text-[13px] text-secondary">{c.company ?? "—"}</div>
            <div className="truncate text-[13px] text-muted">{c.email}</div>
            <div className="text-right text-[13.5px] font-bold text-ink">{c.total}</div>
            <div className="text-right text-[13.5px] font-bold text-[#1D4ED8]">{c.open}</div>
          </div>
        ))}

        {!isLoading && customers.length === 0 && (
          <div className="p-12 text-center text-sm text-faint">No customers yet.</div>
        )}
        </div>
      </div>
    </div>
  );
}
