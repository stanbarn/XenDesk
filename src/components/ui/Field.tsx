import { cn } from "@/lib/cn";

const base =
  "w-full bg-surface border border-input rounded-[11px] text-ink px-3.5 py-3 text-sm outline-none transition " +
  "focus:border-brand focus:ring-[3px] focus:ring-[rgba(14,159,110,0.13)] placeholder:text-[#9AA6B8]";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-[13px] font-semibold text-secondary", className)}
      {...props}
    />
  );
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(base, className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(base, "resize-y leading-relaxed", className)} {...props} />;
}

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full cursor-pointer rounded-[9px] border border-input bg-surface px-3 py-2.5 text-[13.5px] font-semibold text-ink outline-none transition focus:border-brand focus:ring-[3px] focus:ring-[rgba(14,159,110,0.13)]",
        className,
      )}
      {...props}
    />
  );
}
