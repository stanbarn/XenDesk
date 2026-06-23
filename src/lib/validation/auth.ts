import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("A valid email is required."),
  password: z.string().min(1, "Password is required."),
});

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120),
  email: z.string().trim().toLowerCase().email("A valid email is required."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(72, "Password must be at most 72 characters."), // bcrypt truncates beyond 72 bytes
  company: z.string().trim().max(120).optional(),
});

// Onboarding a teammate: the creator supplies name + email; the password is
// system-generated and returned once.
export const onboardAgentSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120),
  email: z.string().trim().toLowerCase().email("A valid email is required."),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type OnboardAgentInput = z.infer<typeof onboardAgentSchema>;
