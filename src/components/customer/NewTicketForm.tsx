"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Field";
import { api, ApiError } from "@/lib/api/client";
import { useTags } from "@/lib/hooks";
import { PRIORITY_LABEL, PRIORITY_ORDER, PRIORITY_STYLE } from "@/lib/ui/tokens";
import type { Priority } from "@/lib/types";

export function NewTicketForm() {
  const router = useRouter();
  const { data: tags } = useTags();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function toggleTag(id: string) {
    setTagIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  async function submit() {
    if (!title.trim() || !description.trim()) {
      setError("Please fill in both a subject and a description.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/tickets", { title: title.trim(), description: description.trim(), priority, tagIds });
      router.push("/tickets");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not submit your ticket.");
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-[740px] p-[26px_30px]">
      <Link
        href="/tickets"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted hover:text-secondary"
      >
        <ArrowLeft size={15} /> Back to my tickets
      </Link>

      <div className="rounded-[16px] border border-line bg-surface p-[28px_30px] shadow-[0_1px_2px_rgba(16,24,40,.04)]">
        <h2 className="mb-1 font-display text-[21px] font-semibold tracking-[-0.01em]">
          Submit a support ticket
        </h2>
        <p className="mb-[26px] text-sm text-muted">
          Tell us what&apos;s going on and our team will get back to you shortly.
        </p>

        <Label htmlFor="subject">
          Subject <span className="text-[#DC2626]">*</span>
        </Label>
        <Input
          id="subject"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setError(null);
          }}
          placeholder="Brief summary of the issue"
          className="mb-5"
        />

        <Label htmlFor="description">
          Description <span className="text-[#DC2626]">*</span>
        </Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            setError(null);
          }}
          placeholder="Describe the problem in detail — what happened, when it started, and any steps you've tried."
          className="mb-5 min-h-[120px]"
        />

        <Label>Priority</Label>
        <div className="mb-5 flex gap-2">
          {PRIORITY_ORDER.map((p) => {
            const active = priority === p;
            const s = PRIORITY_STYLE[p];
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className="flex-1 rounded-[10px] border py-2.5 text-[13px] font-bold transition"
                style={
                  active
                    ? { color: s.fg, background: s.bg, borderColor: `${s.fg}59` }
                    : { color: "#667085", background: "#fff", borderColor: "#E2E8F0" }
                }
              >
                {PRIORITY_LABEL[p]}
              </button>
            );
          })}
        </div>

        <Label>Category</Label>
        <div className="flex flex-wrap gap-2">
          {tags?.map((tag) => {
            const active = tagIds.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className="rounded-[10px] border px-3.5 py-2 text-[13px] font-semibold transition"
                style={
                  active
                    ? { color: tag.color, background: `${tag.color}1f`, borderColor: tag.color }
                    : { color: "#667085", background: "#fff", borderColor: "#E2E8F0" }
                }
              >
                {tag.name}
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mt-3.5 flex items-center gap-2 text-[13px] font-semibold text-[#C2341D]">
            <AlertTriangle size={15} />
            {error}
          </div>
        )}

        <div className="mt-[26px] flex gap-2.5 border-t border-divider pt-[22px]">
          <div className="flex-1" />
          <Link href="/tickets">
            <Button variant="ghost" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="button" onClick={submit} disabled={submitting}>
            {submitting ? "Submitting…" : "Submit ticket"}
          </Button>
        </div>
      </div>
    </div>
  );
}
