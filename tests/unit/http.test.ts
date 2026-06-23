import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { json, parseBody, parseQuery, route } from "@/lib/api/http";
import { ConflictError } from "@/lib/errors";

function req(body?: unknown) {
  return new Request("http://localhost/api/test", {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("route() error mapping", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns the handler's response on success", async () => {
    const handler = route(async () => json({ ok: true }, 201));
    const res = await handler(req());
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("maps a ZodError to 400 with field errors", async () => {
    const schema = z.object({ name: z.string() });
    const handler = route(async () => {
      schema.parse({});
      return json({});
    });
    const res = await handler(req());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Validation failed.");
    expect(body.details).toHaveProperty("name");
  });

  it("maps an HttpError to its status", async () => {
    const handler = route(async () => {
      throw new ConflictError("Already exists.");
    });
    const res = await handler(req());
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe("Already exists.");
  });

  it("maps an unexpected error to 500 without leaking the message", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const handler = route(async () => {
      throw new Error("secret internal detail");
    });
    const res = await handler(req());
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("Internal server error.");
  });
});

describe("parseBody / parseQuery", () => {
  const schema = z.object({ title: z.string() });

  it("parses a valid JSON body", async () => {
    await expect(parseBody(req({ title: "hi" }), schema)).resolves.toEqual({ title: "hi" });
  });

  it("throws on a non-object / invalid body", async () => {
    await expect(parseBody(req({ title: 123 }), schema)).rejects.toBeTruthy();
  });

  it("parses URL search params", () => {
    const params = new URL("http://x/api?title=hello").searchParams;
    expect(parseQuery(params, schema)).toEqual({ title: "hello" });
  });
});
