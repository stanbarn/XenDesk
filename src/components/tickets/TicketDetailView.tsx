"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Paperclip, Send } from "lucide-react";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { PriorityPill, StatusPill } from "@/components/ui/Pills";
import { TagChip } from "@/components/ui/TagChip";
import { api } from "@/lib/api/client";
import { useAgents, useTicket } from "@/lib/hooks";
import { formatDate, relativeTime } from "@/lib/format";
import { PRIORITY_ORDER, PRIORITY_LABEL, STATUS_ORDER, STATUS_LABEL, ticketCode } from "@/lib/ui/tokens";
import type { Priority, Role, TicketStatus } from "@/lib/types";

const SECTION = "mb-1.5 text-[11px] font-bold tracking-[0.04em] text-faint";

export function TicketDetailView({
  id,
  role,
  currentUserId,
}: {
  id: string;
  role: Role;
  currentUserId: string;
}) {
  const isAgent = role === "AGENT";
  const { data: ticket, error, isLoading, mutate } = useTicket(id);
  const { data: agents } = useAgents();

  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);

  if (error) {
    return (
      <div className="p-[26px_30px] text-sm text-faint">
        This ticket could not be found, or you don&apos;t have access to it.
      </div>
    );
  }
  if (isLoading || !ticket) {
    return <div className="p-[26px_30px] text-sm text-faint">Loading ticket…</div>;
  }

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    try {
      await api.patch(`/tickets/${id}`, body);
      await mutate();
    } finally {
      setSaving(false);
    }
  }

  async function sendReply() {
    const body = reply.trim();
    if (!body) return;
    setSending(true);
    try {
      await api.post(`/tickets/${id}/comments`, { body });
      setReply("");
      await mutate();
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-[1180px] p-[24px_30px]">
      <Link
        href="/tickets"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted hover:text-secondary"
      >
        <ArrowLeft size={15} /> {isAgent ? "All tickets" : "My tickets"}
      </Link>

      {/* Header */}
      <div className="mb-5 flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 text-[12.5px] font-bold text-faint">{ticketCode(ticket.number)}</div>
          <h1 className="mb-2 font-display text-[23px] font-semibold leading-[1.25] tracking-[-0.01em]">
            {ticket.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2.5 text-[12.5px] text-faint">
            <span>Opened {relativeTime(ticket.createdAt)}</span>
            {ticket.customer.company && (
              <>
                <span>·</span>
                <span>{ticket.customer.company}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-shrink-0 gap-2">
          <PriorityPill priority={ticket.priority} className="px-3 py-1.5 text-[13px]" />
          <StatusPill status={ticket.status} className="px-3 py-1.5 text-[13px]" />
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_322px] items-start gap-5">
        {/* Conversation */}
        <div className="overflow-hidden rounded-[14px] border border-line bg-surface shadow-[0_1px_2px_rgba(16,24,40,.04)]">
          <div className="border-b border-divider p-[15px_20px] text-sm font-bold">
            Conversation <span className="font-semibold text-faint">· {ticket.comments.length} messages</span>
          </div>
          <div className="flex flex-col gap-[18px] p-5">
            {ticket.comments.map((c) => {
              const agentMsg = c.author.role === "AGENT";
              return (
                <div key={c.id} className="flex gap-3">
                  <Avatar name={c.author.name} variant={agentMsg ? "agent" : "customer"} size={34} />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2.5">
                      <span className="text-[13.5px] font-bold text-ink">{c.author.name}</span>
                      <span
                        className="rounded-md px-1.5 py-px text-[10.5px] font-bold tracking-[0.02em]"
                        style={
                          agentMsg
                            ? { color: "#067A5B", background: "#E5F6EE" }
                            : { color: "#475569", background: "#EEF1F6" }
                        }
                      >
                        {agentMsg ? "Agent" : "Customer"}
                      </span>
                      <span className="text-xs text-faint">{relativeTime(c.createdAt)}</span>
                    </div>
                    <div
                      className="rounded-[12px] px-[15px] py-3 text-sm leading-[1.55] text-secondary"
                      style={
                        agentMsg
                          ? { background: "#F1FBF6", border: "1px solid #D6F0E4" }
                          : { background: "#FBFCFE", border: "1px solid #EAEEF3" }
                      }
                    >
                      {c.body}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Composer */}
          <div className="border-t border-divider bg-[#FAFBFD] p-[16px_20px]">
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder={isAgent ? "Write a reply to the customer…" : "Add a reply to this ticket…"}
              className="min-h-[78px] w-full resize-y rounded-[11px] border border-input bg-surface px-3.5 py-3 text-sm leading-normal outline-none focus:border-brand focus:ring-[3px] focus:ring-[rgba(14,159,110,0.12)]"
            />
            <div className="mt-3 flex items-center gap-2.5">
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-[9px] border border-input-line bg-surface text-muted"
                aria-label="Attach file"
              >
                <Paperclip size={16} />
              </button>
              <div className="flex-1" />
              <Button onClick={sendReply} disabled={sending || !reply.trim()} className="px-[18px] py-2.5 text-[13.5px]">
                <Send size={15} />
                {sending ? "Sending…" : "Send reply"}
              </Button>
            </div>
          </div>
        </div>

        {/* Details panel */}
        <div className="rounded-[14px] border border-line bg-surface p-[18px] shadow-[0_1px_2px_rgba(16,24,40,.04)]">
          <div className="mb-4 text-sm font-bold">Details</div>

          <div className={SECTION}>STATUS</div>
          {isAgent ? (
            <Select
              value={ticket.status}
              disabled={saving}
              onChange={(e) => patch({ status: e.target.value as TicketStatus })}
              className="mb-4"
            >
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </Select>
          ) : (
            <div className="mb-4">
              <StatusPill status={ticket.status} />
            </div>
          )}

          <div className={SECTION}>PRIORITY</div>
          {isAgent ? (
            <Select
              value={ticket.priority}
              disabled={saving}
              onChange={(e) => patch({ priority: e.target.value as Priority })}
              className="mb-4"
            >
              {PRIORITY_ORDER.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABEL[p]}
                </option>
              ))}
            </Select>
          ) : (
            <div className="mb-4">
              <PriorityPill priority={ticket.priority} />
            </div>
          )}

          <div className={SECTION}>ASSIGNEE</div>
          {isAgent ? (
            <div className="mb-[18px]">
              <Select
                value={ticket.agent?.id ?? "unassigned"}
                disabled={saving}
                onChange={(e) =>
                  patch({ agentId: e.target.value === "unassigned" ? null : e.target.value })
                }
              >
                <option value="unassigned">Unassigned</option>
                {agents?.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
              {ticket.agent?.id !== currentUserId && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => patch({ agentId: currentUserId })}
                  className="mt-2 text-[12.5px] font-semibold text-brand hover:underline disabled:opacity-60"
                >
                  Assign to me
                </button>
              )}
            </div>
          ) : (
            <div className="mb-[18px] text-[13.5px] font-semibold text-secondary">
              {ticket.agent?.name ?? "Unassigned"}
            </div>
          )}

          <div className="mb-4 h-px bg-divider" />

          <div className="mb-2.5 text-[11px] font-bold tracking-[0.04em] text-faint">REQUESTER</div>
          <div className="mb-[18px] flex items-center gap-2.5">
            <Avatar name={ticket.customer.name} variant="customer" size={36} />
            <div className="min-w-0">
              <div className="text-[13.5px] font-bold text-ink">{ticket.customer.name}</div>
              <div className="truncate text-xs text-faint">{ticket.customer.email}</div>
            </div>
          </div>

          {ticket.tags.length > 0 && (
            <>
              <div className="mb-2.5 text-[11px] font-bold tracking-[0.04em] text-faint">TAGS</div>
              <div className="mb-[18px] flex flex-wrap gap-1.5">
                {ticket.tags.map((tag) => (
                  <TagChip key={tag.id} name={tag.name} color={tag.color} />
                ))}
              </div>
            </>
          )}

          <div className="mb-4 h-px bg-divider" />
          <div className="mb-2 flex justify-between text-[12.5px]">
            <span className="text-faint">Created</span>
            <span className="font-semibold text-secondary">{formatDate(ticket.createdAt)}</span>
          </div>
          <div className="flex justify-between text-[12.5px]">
            <span className="text-faint">Last update</span>
            <span className="font-semibold text-secondary">{relativeTime(ticket.updatedAt)}</span>
          </div>

          {isAgent && ticket.status !== "RESOLVED" && (
            <Button
              variant="resolve"
              disabled={saving}
              onClick={() => patch({ status: "RESOLVED" })}
              className="mt-[18px] w-full"
            >
              <Check size={16} strokeWidth={2.2} />
              Mark as resolved
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
