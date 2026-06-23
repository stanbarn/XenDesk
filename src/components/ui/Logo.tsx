import { cn } from "@/lib/cn";

/** The crossing-stroke "X" swoosh glyph, reproduced in code (no raster asset). */
export function LogoGlyph({
  size = 37,
  variant = "brand",
}: {
  size?: number;
  variant?: "brand" | "panel";
}) {
  const stroke = "#fff";
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-[11px]",
        variant === "brand"
          ? "bg-brand-gradient"
          : "bg-white/15 border border-white/30",
      )}
      style={{ width: size, height: size }}
    >
      <svg width={size * 0.57} height={size * 0.57} viewBox="0 0 24 24" fill="none">
        <path d="M5 5C11 5 13 19 19 19" stroke={stroke} strokeWidth="3.2" strokeLinecap="round" />
        <path d="M19 5C13 5 11 19 5 19" stroke={stroke} strokeWidth="3.2" strokeLinecap="round" />
      </svg>
    </span>
  );
}

/** Glyph + "XenDesk" wordmark. */
export function Logo({
  size = 37,
  variant = "brand",
  className,
}: {
  size?: number;
  variant?: "brand" | "panel";
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-[11px]", className)}>
      <LogoGlyph size={size} variant={variant} />
      <span
        className={cn(
          "font-display font-bold tracking-[-0.01em]",
          variant === "panel" ? "text-white" : "text-ink",
        )}
        style={{ fontSize: size * 0.49 }}
      >
        XenDesk
      </span>
    </div>
  );
}
