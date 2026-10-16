const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('helpdesk_token')

  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(
      data?.error || data?.message || `Request failed (${response.status})`
    )
  }

  return data
}