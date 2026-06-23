"use client";

import { useTags } from "@/lib/hooks";

export function TagsView() {
  const { data, isLoading } = useTags();
  const tags = data ?? [];

  return (
    <div className="max-w-[1000px] p-[26px_30px]">
      <h1 className="mb-1 font-display text-2xl font-semibold tracking-[-0.01em]">Tags</h1>
      <p className="mb-[22px] text-sm text-muted">Categories used to organize and route tickets.</p>

      <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(216px,1fr))" }}>
        {tags.map((tag) => (
          <div
            key={tag.id}
            className="rounded-[14px] p-[18px_20px]"
            style={{ background: `${tag.color}0f`, border: `1px solid ${tag.color}29` }}
          >
            <div className="mb-3.5 flex items-center gap-2.5">
              <span className="h-[11px] w-[11px] rounded-full" style={{ background: tag.color }} />
              <span className="text-[15px] font-bold" style={{ color: tag.color }}>
                {tag.name}
              </span>
            </div>
            <div className="font-display text-[26px] font-bold text-ink">{tag._count.tickets}</div>
            <div className="mt-0.5 text-[12.5px] text-muted">tagged tickets</div>
          </div>
        ))}
      </div>

      {!isLoading && tags.length === 0 && (
        <div className="p-12 text-center text-sm text-faint">No tags yet.</div>
      )}
    </div>
  );
}
