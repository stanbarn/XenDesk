"use client";

import { useState } from "react";

import { Card } from "@/components/ui/Card";
import { Toggle } from "@/components/ui/Toggle";
import { initials } from "@/lib/ui/tokens";

const TOGGLE_DEFS = [
  { key: "emailNotifs", label: "Email notifications", desc: "Get an email when a ticket you own is updated.", initial: true },
  { key: "newTicketAlerts", label: "New ticket alerts", desc: "Be notified when an unassigned ticket arrives in the queue.", initial: true },
  { key: "weeklyDigest", label: "Weekly digest", desc: "A Monday summary of resolved and pending tickets.", initial: false },
] as const;

export function SettingsView({ name, email }: { name: string; email: string }) {
  const [toggles, setToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(TOGGLE_DEFS.map((t) => [t.key, t.initial])),
  );

  return (
    <div className="max-w-[720px] p-[26px_30px]">
      <h1 className="mb-1 font-display text-2xl font-semibold tracking-[-0.01em]">Settings</h1>
      <p className="mb-[22px] text-sm text-muted">Manage your profile and notification preferences.</p>

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
