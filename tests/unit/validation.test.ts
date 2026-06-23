import { describe, expect, it } from "vitest";

import { loginSchema, registerSchema } from "@/lib/validation/auth";
import { createCommentSchema } from "@/lib/validation/comment";
import { createTagSchema } from "@/lib/validation/tag";
import {
  createTicketSchema,
  listTicketsQuerySchema,
  updateTicketSchema,
} from "@/lib/validation/ticket";

describe("auth schemas", () => {
  it("normalises email to trimmed lowercase on login", () => {
    const parsed = loginSchema.parse({ email: "  USER@Example.COM ", password: "x" });
    expect(parsed.email).toBe("user@example.com");
  });

  it("rejects an invalid login email", () => {
    expect(loginSchema.safeParse({ email: "nope", password: "x" }).success).toBe(false);
  });

  it("requires an 8+ char password to register and allows optional company", () => {
    expect(registerSchema.safeParse({ name: "A", email: "a@b.com", password: "short" }).success).toBe(false);
    const ok = registerSchema.parse({ name: "Ada", email: "a@b.com", password: "longenough", company: " Acme " });
    expect(ok.company).toBe("Acme");
  });
});

describe("createTicketSchema", () => {
  it("defaults priority to MEDIUM and tagIds to []", () => {
    const parsed = createTicketSchema.parse({
      title: "Valid title",
      description: "A sufficiently long description.",
    });
    expect(parsed.priority).toBe("MEDIUM");
    expect(parsed.tagIds).toEqual([]);
  });

  it("rejects a too-short title or description", () => {
    expect(createTicketSchema.safeParse({ title: "ab", description: "A sufficiently long description." }).success).toBe(false);
    expect(createTicketSchema.safeParse({ title: "Valid title", description: "short" }).success).toBe(false);
  });

  it("rejects an invalid priority enum", () => {
    const r = createTicketSchema.safeParse({ title: "Valid title", description: "Long enough description", priority: "URGENT" });
    expect(r.success).toBe(false);
  });
});

describe("updateTicketSchema", () => {
  it("accepts a partial update with a null assignee", () => {
    expect(updateTicketSchema.parse({ agentId: null })).toEqual({ agentId: null });
  });

  it("rejects an empty update", () => {
    expect(updateTicketSchema.safeParse({}).success).toBe(false);
  });
});

describe("listTicketsQuerySchema", () => {
  it("coerces page/pageSize from strings and applies defaults", () => {
    const parsed = listTicketsQuerySchema.parse({ page: "2", pageSize: "50" });
    expect(parsed.page).toBe(2);
    expect(parsed.pageSize).toBe(50);
    expect(listTicketsQuerySchema.parse({}).page).toBe(1);
  });

  it("caps pageSize at 100", () => {
    expect(listTicketsQuerySchema.safeParse({ pageSize: "500" }).success).toBe(false);
  });
});

describe("comment & tag schemas", () => {
  it("trims and requires a non-empty comment body", () => {
    expect(createCommentSchema.parse({ body: "  hi  " }).body).toBe("hi");
    expect(createCommentSchema.safeParse({ body: "   " }).success).toBe(false);
  });

  it("validates tag color as a 6-digit hex when provided", () => {
    expect(createTagSchema.safeParse({ name: "Billing", color: "#abcdef" }).success).toBe(true);
    expect(createTagSchema.safeParse({ name: "Billing", color: "red" }).success).toBe(false);
    expect(createTagSchema.safeParse({ name: "Billing" }).success).toBe(true);
  });
});
