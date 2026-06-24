"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";

import type {
  AgentDTO,
  CustomerSummary,
  DashboardStats,
  TagWithCount,
  TicketDetail,
  TicketListResult,
} from "@/lib/types";

// Polling intervals keep the agent dashboard and live ticket thread fresh
// without WebSockets (a deliberate serverless-friendly choice).
const DASHBOARD_REFRESH = 15_000;
const THREAD_REFRESH = 8_000;

// `enabled` lets non-agent surfaces (e.g. the customer sidebar) skip this
// agent-only endpoint instead of firing a request that 403s every load.
export function useDashboardStats(enabled = true) {
  return useSWR<DashboardStats>(enabled ? "/dashboard/stats" : null, {
    refreshInterval: DASHBOARD_REFRESH,
  });
}

export function useTickets(queryString = "") {
  return useSWR<TicketListResult>(`/tickets${queryString}`);
}

export function useTicket(id: string | null) {
  return useSWR<TicketDetail>(id ? `/tickets/${id}` : null, {
    refreshInterval: THREAD_REFRESH,
  });
}

export function useTags() {
  return useSWR<TagWithCount[]>("/tags");
}

export function useAgents() {
  return useSWR<AgentDTO[]>("/agents");
}

export function useCustomers() {
  return useSWR<CustomerSummary[]>("/customers");
}

/** Debounce a fast-changing value (e.g. a search box). */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
