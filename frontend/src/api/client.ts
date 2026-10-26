const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

/** A non-2xx response, carrying the parsed body so callers can map server errors to fields. */
export class ApiError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(status: number, body: unknown) {
    super(`Request failed: ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

async function request<T>(url: URL, init?: RequestInit): Promise<T> {
  const response = await fetch(url.toString(), init)
  if (!response.ok) {
    throw new ApiError(response.status, await response.json().catch(() => null))
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export function apiGet<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(path, BASE_URL)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  return request<T>(url)
}

export function apiSend<T>(method: 'POST' | 'PATCH' | 'DELETE', path: string, body?: unknown): Promise<T> {
  return request<T>(new URL(path, BASE_URL), {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}
