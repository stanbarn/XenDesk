import type { Priority, TicketStatus } from "@/lib/types";
import { cn } from "@/lib/cn";
import {
  PRIORITY_LABEL,
  PRIORITY_STYLE,
  STATUS_LABEL,
  STATUS_STYLE,
} from "@/lib/ui/tokens";

type PillProps = { className?: string };

function Pill({ fg, bg, dot, label, className }: { fg: string; bg: string; dot: string; label: string } & PillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        className,
      )}
      style={{ color: fg, background: bg }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: dot }} />
      {label}
    </span>
  );
}

export function StatusPill({ status, className }: { status: TicketStatus } & PillProps) {
  const s = STATUS_STYLE[status];
  return <Pill fg={s.fg} bg={s.bg} dot={s.dot} label={STATUS_LABEL[status]} className={className} />;
}

export function PriorityPill({ priority, className }: { priority: Priority } & PillProps) {
  const p = PRIORITY_STYLE[priority];
  return <Pill fg={p.fg} bg={p.bg} dot={p.dot} label={PRIORITY_LABEL[priority]} className={className} />;
}
