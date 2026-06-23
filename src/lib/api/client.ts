// Browser-side API client. Thin wrapper over fetch that talks to /api,
// surfaces the server's error envelope, and powers SWR.

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  // 204/empty bodies are valid for some mutations.
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status})`;
    throw new ApiError(res.status, message, data?.details);
  }
  return data as T;
}

/** SWR fetcher. */
export const fetcher = <T>(path: string): Promise<T> => request<T>(path);

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
