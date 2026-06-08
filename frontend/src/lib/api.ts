import type { Campaign, CampaignRequest } from '@/types/api'

const BASE = 'http://localhost:8000'

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail ?? `API ${res.status}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  campaign: (body: CampaignRequest) =>
    apiFetch<Campaign>('/campaign', { method: 'POST', body: JSON.stringify(body) }),
  health: () =>
    apiFetch<Record<string, string>>('/health'),
}