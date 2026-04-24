type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type ApiResponse<T> =
  | { type: 'success'; data: T }
  | { type: 'empty' } // used with 204 responses
  | { type: 'networkError'; message: string }
  | { type: 'serverError'; message: string; code: number }
  | { type: 'clientError'; message: string; code: number }
  | { type: 'parseError'; message: string; code: number }

/**
 * A wrapper around fetch to handle authenticated common API requests and response logic,
 * specifically redirecting on 400-level errors for authentication.
 */
async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {

  let response: Response
  try {
    response = await fetch(`/api/${url}`, { ...options, credentials: 'include' })
  } catch (error) {
    return { type: 'networkError', message: error instanceof Error ? error.message : String(error) }
  }

  if (response.status === 204) return { type: 'empty' }

  if (response.status >= 400 && response.status < 500)
    return { type: 'clientError', message: await extractErrorMessage(response), code: response.status }

  if (response.status >= 500)
    return { type: 'serverError', message: await extractErrorMessage(response), code: response.status }

  if (!response.ok)
    return { type: 'serverError', message: `Unexpected status ${response.status}`, code: response.status }

  try {
    return { type: 'success', data: (await response.json()) as T }
  } catch (e) {
    return { type: 'parseError', message: e instanceof Error ? e.message : String(e), code: response.status }
  }
}

async function extractErrorMessage(response: Response): Promise<string> {
  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    try {
      const body = await response.json()
      if (body && typeof body === 'object') {
        return body.message ?? body.error ?? JSON.stringify(body)
      }
    } catch {
      // Fall through to text handling
    }
  }

  try {
    const text = (await response.text()).trim()
    return text || `HTTP ${response.status} ${response.statusText}`
  } catch {
    return `HTTP ${response.status} ${response.statusText}`
  }
}

async function apiRequest<O>(url: string, method: Method, data?: unknown): Promise<ApiResponse<O>> {
  const headers = new Headers({ Accept: 'application/json' })
  if (data !== undefined) headers.set('Content-Type', 'application/json')

  return apiFetch<O>(url, {
    method,
    headers,
    body: data !== undefined ? JSON.stringify(data) : undefined
  })
}

export const apiGet = <T>(url: string) => apiRequest<T>(url, 'GET')
export const apiPost = <O>(url: string, data?: unknown) => apiRequest<O>(url, 'POST', data)
export const apiDelete = <O>(url: string) => apiRequest<O>(url, 'DELETE')
export const apiUpload = <O>(url: string, data: FormData) => apiFetch<O>(url, {
  method: 'POST',
  body:   data
  // no Content-Type header — browser sets multipart boundary automatically
})