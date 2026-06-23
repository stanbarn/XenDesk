import { cn } from "@/lib/cn";

// Chip = color text on color@8% bg with a color@18% border (hex alpha suffixes).
export function TagChip({
  name,
  color,
  className,
}: {
  name: string;
  color: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[7px] px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
        className,
      )}
      style={{ color, background: `${color}14`, border: `1px solid ${color}2e` }}
    >
      {name}
    </span>
  );
}
