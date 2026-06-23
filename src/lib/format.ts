/** Compact relative time, e.g. "12m ago", "2h ago", "Yesterday", "3d ago". */
export function relativeTime(input: string | Date): string {
  const date = typeof input === "string" ? new Date(input) : input;
  const diffMs = Date.now() - date.getTime();
  const sec = Math.round(diffMs / 1000);
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);
  const day = Math.round(hr / 24);

  if (sec < 45) return "Just now";
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  if (day === 1) return "Yesterday";
  if (day < 7) return `${day}d ago`;
  if (day < 30) return `${Math.round(day / 7)}w ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Absolute date, e.g. "12 May 2026". */
export function formatDate(input: string | Date): string {
  const date = typeof input === "string" ? new Date(input) : input;
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
