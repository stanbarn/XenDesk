/** Tiny className combiner (truthy strings joined with spaces). */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
