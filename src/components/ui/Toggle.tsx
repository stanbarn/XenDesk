"use client";

import { cn } from "@/lib/cn";

export function Toggle({
  checked,
  onChange,
  "aria-label": ariaLabel,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  "aria-label"?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-[22px] w-[38px] flex-shrink-0 cursor-pointer rounded-full transition-colors",
        checked ? "bg-brand" : "bg-input",
      )}
    >
      <span
        className="absolute top-[3px] h-4 w-4 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,.2)] transition-[left]"
        style={{ left: checked ? 19 : 3 }}
      />
    </button>
  );
}
