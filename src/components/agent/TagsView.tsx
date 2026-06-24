"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Field";
import { api, ApiError } from "@/lib/api/client";
import { useTags } from "@/lib/hooks";
import type { TagWithCount } from "@/lib/types";
import { cn } from "@/lib/cn";

// Brand-aligned palette for new tags (the seeded five + a few extras).
const PALETTE = ["#0E9F6E", "#B45309", "#0369A1", "#7C3AED", "#BE185D", "#0F766E", "#DC2626", "#475569"];

export function TagsView() {
  const { data, isLoading, mutate } = useTags();
  const tags = data ?? [];

  const [name, setName] = useState("");
  const [color, setColor] = useState(PALETTE[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createTag() {
    if (name.trim().length < 2) {
      setError("Tag name must be at least 2 characters.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/tags", { name: name.trim(), color });
      setName("");
      await mutate();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create the tag.");
    } finally {
      setSubmitting(false);
    }
  }

  async function removeTag(tag: TagWithCount) {
    const note = tag._count.tickets
      ? ` It will be removed from ${tag._count.tickets} ticket(s).`
      : "";
    if (!window.confirm(`Delete the tag "${tag.name}"?${note}`)) return;
    try {
      await api.del(`/tags/${tag.id}`);
      await mutate();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete the tag.");
    }
  }

  return (
    <div className="max-w-[1000px] p-[26px_30px]">
      <h1 className="mb-1 font-display text-2xl font-semibold tracking-[-0.01em]">Tags</h1>
      <p className="mb-[22px] text-sm text-muted">Categories used to organize and route tickets.</p>

      {/* Create a tag */}
      <Card className="mb-[18px] p-5">
        <div className="mb-4 text-sm font-bold">New tag</div>
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="min-w-[200px] flex-1">
            <Label htmlFor="tagName">Name</Label>
            <Input
              id="tagName"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="e.g. Outage"
              onKeyDown={(e) => {
                if (e.key === "Enter") void createTag();
              }}
            />
          </div>
          <div>
            <Label>Color</Label>
            <div className="flex h-[46px] items-center gap-2">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Color ${c}`}
                  onClick={() => setColor(c)}
                  className={cn(
                    "h-6 w-6 rounded-full transition",
                    color === c ? "ring-2 ring-offset-2 ring-[#0E9F6E]" : "hover:scale-110",
                  )}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
          <Button onClick={createTag} disabled={submitting}>
            {submitting ? "Creating…" : "Create tag"}
          </Button>
        </div>
        {error && <p className="mt-3 text-[13px] font-semibold text-[#C2341D]">{error}</p>}
      </Card>

      <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(216px,1fr))" }}>
        {tags.map((tag) => (
          <div
            key={tag.id}
            className="rounded-[14px] p-[18px_20px]"
            style={{ background: `${tag.color}0f`, border: `1px solid ${tag.color}29` }}
          >
            <div className="mb-3.5 flex items-center gap-2.5">
              <span className="h-[11px] w-[11px] rounded-full" style={{ background: tag.color }} />
              <span className="flex-1 text-[15px] font-bold" style={{ color: tag.color }}>
                {tag.name}
              </span>
              <button
                type="button"
                onClick={() => removeTag(tag)}
                aria-label={`Delete ${tag.name}`}
                title="Delete tag"
                className="text-faint transition hover:text-[#C2341D]"
              >
                <Trash2 size={15} />
              </button>
            </div>
            <div className="font-display text-[26px] font-bold text-ink">{tag._count.tickets}</div>
            <div className="mt-0.5 text-[12.5px] text-muted">tagged tickets</div>
          </div>
        ))}
      </div>

      {!isLoading && tags.length === 0 && (
        <div className="p-12 text-center text-sm text-faint">No tags yet — create your first above.</div>
      )}
    </div>
  );
}
