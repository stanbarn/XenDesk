"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Receipt, Users, Wifi } from "lucide-react";

import { Card } from "@/components/ui/Card";

const TOPICS = [
  { title: "Billing & payments", blurb: "Invoices, refunds and plan changes.", icon: Receipt, bg: "#FBF0DD", color: "#B45309" },
  { title: "Network & hardware", blurb: "Connectivity, speeds and equipment.", icon: Wifi, bg: "#E6F3FB", color: "#0369A1" },
  { title: "Account & access", blurb: "Logins, users and permissions.", icon: Users, bg: "#F2ECFB", color: "#7C3AED" },
];

const FAQS = [
  { q: "How do I check the status of my ticket?", a: "Open the My tickets page — each ticket shows its current status (Open, In Progress or Resolved) and updates as our team responds." },
  { q: "How are priorities decided?", a: "You set an initial priority when submitting. Agents may adjust it based on impact — High is reserved for outages and billing errors." },
  { q: "How quickly will I get a response?", a: "Our average first response time is around 18 minutes during business hours, with 24/7 coverage for High-priority issues." },
  { q: "Can I add more details after submitting?", a: "Yes — open the ticket and add a reply in the conversation thread. Your assigned agent is notified instantly." },
  { q: "How do I get a refund for a billing error?", a: "Submit a ticket tagged Billing with your invoice number. Verified overcharges are refunded to your original payment method within 3–5 business days." },
];

export function HelpCenter() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="max-w-[780px] p-[26px_30px]">
      <h1 className="mb-1 font-display text-2xl font-semibold tracking-[-0.01em]">Help center</h1>
      <p className="mb-[22px] text-sm text-muted">Find answers fast, or reach our support team.</p>

      <div className="mb-[22px] grid grid-cols-3 gap-3.5">
        {TOPICS.map((t) => {
          const Icon = t.icon;
          return (
            <Card key={t.title} className="p-[18px]">
              <span
                className="mb-3 flex h-[34px] w-[34px] items-center justify-center rounded-[10px]"
                style={{ background: t.bg }}
              >
                <Icon size={18} style={{ color: t.color }} strokeWidth={2} />
              </span>
              <div className="mb-1 text-[14.5px] font-bold">{t.title}</div>
              <div className="text-[12.5px] leading-relaxed text-muted">{t.blurb}</div>
            </Card>
          );
        })}
      </div>

      <Card className="mb-[18px] px-5 py-1.5">
        <div className="px-1 pb-1 pt-3.5 text-sm font-bold">Frequently asked questions</div>
        {FAQS.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={f.q} className="border-t border-line-soft">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center gap-3 px-1 py-[15px] text-left"
              >
                <span className="flex-1 text-sm font-semibold text-ink">{f.q}</span>
                <Plus
                  size={17}
                  strokeWidth={2}
                  className="flex-shrink-0 text-brand transition-transform"
                  style={{ transform: isOpen ? "rotate(45deg)" : "none" }}
                />
              </button>
              {isOpen && (
                <div className="px-1 pb-4 text-[13.5px] leading-relaxed text-muted">{f.a}</div>
              )}
            </div>
          );
        })}
      </Card>

      <div className="flex items-center gap-[18px] rounded-[14px] bg-brand-panel p-[22px_24px] text-white">
        <div className="flex-1">
          <div className="mb-0.5 font-display text-[17px] font-semibold">Still need help?</div>
          <div className="text-[13.5px] text-white/85">
            Submit a ticket and our team will get back to you shortly.
          </div>
        </div>
        <Link
          href="/tickets/new"
          className="inline-flex flex-shrink-0 items-center gap-2 rounded-[11px] bg-white px-[18px] py-[11px] text-sm font-bold text-[#0B8E63] hover:brightness-[.97]"
        >
          <Plus size={16} strokeWidth={2.4} />
          New ticket
        </Link>
      </div>
    </div>
  );
}
