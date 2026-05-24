import { auth } from "../auth"

const API_URL = process.env.API_URL ?? process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001"

export async function apiClient(path: string, options?: RequestInit) {
  const session = await auth()
  const accessToken = (session as { accessToken?: string } | null)?.accessToken

  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options?.headers,
    },
  })
}
