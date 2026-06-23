import { cn } from "@/lib/cn";
import { initials } from "@/lib/ui/tokens";

// Agent avatars use the brand gradient; customers use a neutral chip.
export function Avatar({
  name,
  variant,
  size = 34,
  className,
}: {
  name: string;
  variant: "agent" | "customer";
  size?: number;
  className?: string;
}) {
  const isAgent = variant === "agent";
  return (
    <span
      className={cn(
        "inline-flex flex-shrink-0 items-center justify-center rounded-[10px] font-bold",
        isAgent ? "bg-brand-gradient text-white" : "bg-[#EEF2F7] text-[#475569]",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.34) }}
    >
      {initials(name)}
    </span>
  );
}
