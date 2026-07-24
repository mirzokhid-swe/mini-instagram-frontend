import { ApiError, type FieldError } from './types'

const TOKEN_KEY = 'lumen_token'
const BASE_URL = (import.meta.env.VITE_API_URL ?? '') + '/api/v1'

// Endpoints that don't require (and must not send) a bearer token.
const PUBLIC_PATHS = new Set(['/auth/sign-up', '/auth/login'])

let unauthorizedHandler: (() => void) | null = null

/** Registered once by the auth store so a 401 anywhere clears the session. */
export function setUnauthorizedHandler(fn: () => void): void {
  unauthorizedHandler = fn
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

/** Reads the `user_id` claim out of the JWT payload without verifying the signature (fine client-side; the server is the source of truth). */
export function userIdFromToken(token: string | null): number | null {
  if (!token) return null
  try {
    const payload = token.split('.')[1]
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = JSON.parse(decodeURIComponent(escape(atob(base64))))
    return typeof json.user_id === 'number' ? json.user_id : null
  } catch {
    return null
  }
}

interface RequestOptions {
  method?: string
  query?: Record<string, string | number | undefined>
  json?: unknown
  formData?: FormData
}

function buildQuery(query?: RequestOptions['query']): string {
  if (!query) return ''
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value))
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

interface Envelope {
  status: string
  description: string
  data: unknown
  errors?: FieldError[]
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const isPublic = PUBLIC_PATHS.has(path)
  const headers: Record<string, string> = {}

  const token = getToken()
  if (token && !isPublic) {
    headers.Authorization = `Bearer ${token}`
  }

  let body: BodyInit | undefined
  if (options.formData) {
    body = options.formData
  } else if (options.json !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(options.json)
  }

  const res = await fetch(`${BASE_URL}${path}${buildQuery(options.query)}`, {
    method: options.method ?? 'GET',
    headers,
    body,
  })

  const text = await res.text()
  const envelope: Envelope | null = text ? JSON.parse(text) : null

  if (!res.ok) {
    if (res.status === 401 && !isPublic) {
      clearToken()
      unauthorizedHandler?.()
    }
    throw new ApiError(res.status, envelope?.description ?? 'Request failed', envelope?.errors ?? [])
  }

  return envelope?.data as T
}

export const apiClient = {
  get: <T>(path: string, query?: RequestOptions['query']) => request<T>(path, { method: 'GET', query }),
  post: <T>(path: string, json?: unknown) => request<T>(path, { method: 'POST', json }),
  put: <T>(path: string, json?: unknown) => request<T>(path, { method: 'PUT', json }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  postForm: <T>(path: string, formData: FormData) => request<T>(path, { method: 'POST', formData }),
  putForm: <T>(path: string, formData: FormData) => request<T>(path, { method: 'PUT', formData }),
}
