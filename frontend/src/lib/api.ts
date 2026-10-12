export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type Options = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  json?: unknown;
  body?: BodyInit;
  contentType?: string;
};

/**
 * Calls the API. Every request carries X-Requested-With: the server refuses
 * changes without it, which keeps other sites from posting on a user's behalf.
 */
export async function api<T>(path: string, { method = "GET", json, body, contentType }: Options = {}): Promise<T> {
  const headers: Record<string, string> = { "X-Requested-With": "fetch" };
  if (json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(json);
  } else if (contentType) {
    headers["Content-Type"] = contentType;
  }
  let res: Response;
  try {
    res = await fetch(path, { method, headers, body, credentials: "same-origin" });
  } catch {
    throw new ApiError("Geen verbinding met de server. Controleer je internet en probeer opnieuw.", 0);
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(data?.error ?? `Er ging iets mis (${res.status}).`, res.status);
  return data as T;
}
