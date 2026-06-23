import { z } from "zod";

export const createTagSchema = z.object({
  // Tag names are case-insensitively unique; we normalise to lower case in
  // the service before persisting.
  name: z
    .string()
    .trim()
    .min(2, "Tag name must be at least 2 characters.")
    .max(50),
});

export type CreateTagInput = z.infer<typeof createTagSchema>;
