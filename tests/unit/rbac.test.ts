import { describe, expect, it } from "vitest";

import { Role } from "@/generated/prisma/enums";
import {
  type Actor,
  AuthError,
  assertAgent,
  assertCanAccessTicket,
  canAccessTicket,
  isAgent,
} from "@/lib/auth/rbac";

const agent: Actor = { id: "agent-1", role: Role.AGENT };
const customer: Actor = { id: "cust-1", role: Role.CUSTOMER };
const otherCustomer: Actor = { id: "cust-2", role: Role.CUSTOMER };

describe("isAgent", () => {
  it("distinguishes agents from customers", () => {
    expect(isAgent(agent)).toBe(true);
    expect(isAgent(customer)).toBe(false);
  });
});

describe("canAccessTicket", () => {
  const ticket = { customerId: customer.id };

  it("lets an agent access any ticket", () => {
    expect(canAccessTicket(agent, ticket)).toBe(true);
  });

  it("lets a customer access their own ticket", () => {
    expect(canAccessTicket(customer, ticket)).toBe(true);
  });

  it("denies a customer access to someone else's ticket", () => {
    expect(canAccessTicket(otherCustomer, ticket)).toBe(false);
  });
});

describe("assertCanAccessTicket", () => {
  it("throws AuthError(403) for a foreign customer", () => {
    try {
      assertCanAccessTicket(otherCustomer, { customerId: customer.id });
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(AuthError);
      expect((error as AuthError).status).toBe(403);
    }
  });

  it("does not throw for the owning customer", () => {
    expect(() => assertCanAccessTicket(customer, { customerId: customer.id })).not.toThrow();
  });
});

describe("assertAgent", () => {
  it("throws AuthError(403) for a customer", () => {
    expect(() => assertAgent(customer)).toThrow(AuthError);
  });

  it("does not throw for an agent", () => {
    expect(() => assertAgent(agent)).not.toThrow();
  });
});
