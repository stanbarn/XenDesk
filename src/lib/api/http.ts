import { NextResponse } from "next/server";
import { z, ZodError } from "zod";

import { isHttpError } from "@/lib/errors";

/** JSON success response. */
export function json<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/** Standard error envelope. */
type ErrorBody = { error: string; details?: unknown };

function errorResponse(status: number, error: string, details?: unknown) {
  const body: ErrorBody = { error };
  if (details !== undefined) body.details = details;
  return NextResponse.json(body, { status });
}

/**
 * Wraps a route handler so every thrown error maps to a consistent JSON
 * response: ZodError -> 400 with field errors, HttpError -> its status,
 * anything else -> 500 (logged, not leaked).
 */
export function route<Args extends unknown[]>(
  handler: (request: Request, ...args: Args) => Promise<NextResponse>,
) {
  return async (request: Request, ...args: Args): Promise<NextResponse> => {
    try {
      return await handler(request, ...args);
    } catch (error) {
      if (error instanceof ZodError) {
        return errorResponse(400, "Validation failed.", z.flattenError(error).fieldErrors);
      }
      if (isHttpError(error)) {
        return errorResponse(error.status, error.message, error.details);
      }
      console.error("Unhandled API error:", error);
      return errorResponse(500, "Internal server error.");
    }
  };
}

/** Parse a JSON request body against a schema (throws on invalid JSON/shape). */
export async function parseBody<S extends z.ZodType>(
  request: Request,
  schema: S,
): Promise<z.infer<S>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new ZodError([
      { code: "custom", message: "Request body must be valid JSON.", path: [] },
    ]);
  }
  return schema.parse(raw);
}

/** Parse URL search params against a schema. */
export function parseQuery<S extends z.ZodType>(
  searchParams: URLSearchParams,
  schema: S,
): z.infer<S> {
  return schema.parse(Object.fromEntries(searchParams));
}
