import { cn } from "@/lib/cn";

/** Standard surface card: white, 14px radius, hairline border + soft shadow. */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[14px] border border-line bg-surface shadow-[0_1px_2px_rgba(16,24,40,.04)]",
        className,
      )}
      {...props}
    />
  );
}
