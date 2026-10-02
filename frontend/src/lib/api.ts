const API_BASE = import.meta.env.VITE_API_BASE_URL ?? `${window.location.protocol}//${window.location.hostname}:3000/api/v1`;
export class ApiError extends Error { constructor(public status: number, public code: string, message: string, public details?: unknown) { super(message); this.name = "ApiError"; } }
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { ...options, credentials: "include", headers: { "Content-Type": "application/json", ...options.headers } });
  if (response.status === 204) return undefined as T;
  const payload = await response.json().catch(() => null) as { data?: T; error?: { code: string; message: string; details?: unknown } } | null;
  if (!response.ok || !payload?.data) throw new ApiError(response.status, payload?.error?.code ?? "REQUEST_FAILED", payload?.error?.message ?? "The request could not be completed.", payload?.error?.details);
  return payload.data;
}
export const money = (minor: number) => new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(minor / 100);
export const dateTime = (value: string) => new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Karachi" }).format(new Date(value));
