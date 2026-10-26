const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export async function apiGet<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(path, BASE_URL)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }
  return response.json() as Promise<T>
}
