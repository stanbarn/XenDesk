import { z } from "zod";

export const createTagSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Tag name must be at least 2 characters.")
    .max(50),
  // Hex color for the tag chip; defaults in the service if omitted.
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a 6-digit hex value.")
    .optional(),
});

export type CreateTagInput = z.infer<typeof createTagSchema>;
