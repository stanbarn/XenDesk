import { cn } from "@/lib/cn";

type Variant = "primary" | "ghost" | "resolve";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-brand-gradient text-white shadow-[0_6px_16px_rgba(14,159,110,.24)] hover:brightness-[1.04]",
  ghost:
    "bg-surface border border-input text-secondary hover:bg-[#F4F7FB]",
  resolve:
    "bg-[#E5F6EE] text-[#067A5B] border border-[#BEEBD6] hover:bg-[#D9F1E6]",
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[11px] px-4 py-2.5 text-sm font-bold cursor-pointer transition disabled:opacity-60 disabled:cursor-not-allowed",
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
