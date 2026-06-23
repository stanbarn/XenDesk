"use client";

import { useState } from "react";
import { useSWRConfig } from "swr";
import { Check, Copy, UserPlus } from "lucide-react";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Field";
import { Toggle } from "@/components/ui/Toggle";
import { api, ApiError } from "@/lib/api/client";
import { useAgents } from "@/lib/hooks";
import { initials } from "@/lib/ui/tokens";
import type { AgentDTO } from "@/lib/types";

const TOGGLE_DEFS = [
  { key: "emailNotifs", label: "Email notifications", desc: "Get an email when a ticket you own is updated.", initial: true },
  { key: "newTicketAlerts", label: "New ticket alerts", desc: "Be notified when an unassigned ticket arrives in the queue.", initial: true },
  { key: "weeklyDigest", label: "Weekly digest", desc: "A Monday summary of resolved and pending tickets.", initial: false },
] as const;

export function SettingsView({ name, email }: { name: string; email: string }) {
  const { mutate } = useSWRConfig();
  const { data: agents } = useAgents();

  const [toggles, setToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(TOGGLE_DEFS.map((t) => [t.key, t.initial])),
  );

  // Onboard-agent form state.
  const [agentName, setAgentName] = useState("");
  const [agentEmail, setAgentEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; tempPassword: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function addAgent() {
    if (!agentName.trim() || !agentEmail.trim()) {
      setError("Enter a name and email.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await api.post<{ agent: AgentDTO; tempPassword: string }>("/agents", {
        name: agentName.trim(),
        email: agentEmail.trim(),
      });
      setCreated({ email: result.agent.email, tempPassword: result.tempPassword });
      setAgentName("");
      setAgentEmail("");
      setCopied(false);
      await mutate("/agents");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add the agent.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-[720px] p-[26px_30px]">
      <h1 className="mb-1 font-display text-2xl font-semibold tracking-[-0.01em]">Settings</h1>
      <p className="mb-[22px] text-sm text-muted">Manage your profile, team and notification preferences.</p>

      <Card className="mb-3.5 p-5">
        <div className="mb-4 text-sm font-bold">Profile</div>
        <div className="flex items-center gap-3.5">
          <span className="flex h-[52px] w-[52px] items-center justify-center rounded-[13px] bg-brand-gradient text-[17px] font-bold text-white">
            {initials(name)}
          </span>
          <div>
            <div className="text-[15px] font-bold text-ink">{name}</div>
            <div className="text-[13px] text-muted">{email}</div>
          </div>
          <div className="flex-1" />
          <span className="rounded-lg bg-brand-tint px-2.5 py-1 text-xs font-bold text-brand">
            Support Agent
          </span>
        </div>
      </Card>

      {/* Team / onboard agent */}
      <Card className="mb-3.5 p-5">
        <div className="text-sm font-bold">Team</div>
        <p className="mb-4 mt-0.5 text-[12.5px] text-muted">
          Agents can view every ticket and onboard new agents.
        </p>

        <div className="mb-4 flex flex-col gap-2.5">
          {agents?.map((a) => (
            <div key={a.id} className="flex items-center gap-2.5">
              <Avatar name={a.name} variant="agent" size={32} />
              <div className="min-w-0">
                <div className="truncate text-[13.5px] font-semibold text-ink">{a.name}</div>
                <div className="truncate text-xs text-faint">{a.email}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-line-soft pt-4">
          <div className="mb-3 text-[13px] font-semibold text-secondary">Add an agent</div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <Label htmlFor="agentName">Full name</Label>
              <Input
                id="agentName"
                value={agentName}
                onChange={(e) => { setAgentName(e.target.value); setError(null); }}
                placeholder="Jane Doe"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="agentEmail">Email</Label>
              <Input
                id="agentEmail"
                type="email"
                value={agentEmail}
                onChange={(e) => { setAgentEmail(e.target.value); setError(null); }}
                placeholder="jane.doe@xenfi.com"
              />
            </div>
          </div>

          {error && <p className="mt-2.5 text-[13px] font-semibold text-[#C2341D]">{error}</p>}

          <div className="mt-3.5">
            <Button onClick={addAgent} disabled={submitting}>
              <UserPlus size={16} />
              {submitting ? "Adding…" : "Add agent"}
            </Button>
          </div>

          {created && (
            <div className="mt-4 rounded-[12px] border border-[#BEEBD6] bg-[#E5F6EE] p-4">
              <div className="mb-1 flex items-center gap-2 text-[13px] font-bold text-[#067A5B]">
                <Check size={15} /> Agent created
              </div>
              <p className="mb-3 text-[12.5px] text-secondary">
                Share this one-time password with <strong>{created.email}</strong> securely — it
                won&apos;t be shown again.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-[8px] border border-[#BEEBD6] bg-surface px-3 py-2 font-mono text-[13px] text-ink">
                  {created.tempPassword}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(created.tempPassword);
                    setCopied(true);
                  }}
                  className="flex items-center gap-1.5 rounded-[8px] border border-input bg-surface px-3 py-2 text-[12.5px] font-semibold text-secondary hover:bg-[#F4F7FB]"
                >
                  {copied ? <Check size={14} className="text-[#067A5B]" /> : <Copy size={14} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-1 text-sm font-bold">Notifications</div>
        {TOGGLE_DEFS.map((t) => (
          <div key={t.key} className="flex items-center gap-4 border-t border-line-soft py-3.5">
            <div className="flex-1">
              <div className="text-[13.5px] font-semibold text-ink">{t.label}</div>
              <div className="mt-0.5 text-[12.5px] text-faint">{t.desc}</div>
            </div>
            <Toggle
              checked={toggles[t.key]}
              onChange={(next) => setToggles((s) => ({ ...s, [t.key]: next }))}
              aria-label={t.label}
            />
          </div>
        ))}
      </Card>
    </div>
  );
}
