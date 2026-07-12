import type { ApplyConfigResult, DialConfig, DialStateResult, SerialPort } from './types'

const API = 'http://127.0.0.1:8765/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const timeoutMs = path === '/connect' ? 9000 : 5000
  const signal = init?.signal ?? AbortSignal.timeout(timeoutMs)
  const response = await fetch(`${API}${path}`, {
    ...init,
    signal,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
  const body = await response.json()
  if (!response.ok) throw new Error(body.error ?? `Request failed (${response.status})`)
  return body as T
}

export const api = {
  ports: () => request<{ ports: SerialPort[]; connected?: string }>('/ports'),
  connect: (port: string) => request('/connect', { method: 'POST', body: JSON.stringify({ port }) }),
  disconnect: () => request('/disconnect', { method: 'POST', body: '{}' }),
  status: () => request<Record<string, unknown>>('/status'),
  dialState: () => request<DialStateResult>('/dial-state'),
  applyConfig: (config: DialConfig) => request<ApplyConfigResult>('/config', {
    method: 'POST', body: JSON.stringify(config),
  }),
  persistAndReboot: () => request<{ ok: boolean; rebooting: boolean }>('/persist-reboot', {
    method: 'POST', body: '{}',
  }),
  restoreDefaults: () => request<{ ok: boolean; rebooting: boolean }>('/restore-defaults', {
    method: 'POST', body: '{}',
  }),
}
