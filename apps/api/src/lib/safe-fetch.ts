import { fail, failWithDetails, succeed } from '@couchrift/shared/utilities'

// Fetch wrapper with comprehensive error handling by way of result objects
export async function safeFetch<T>(url: string, options: RequestInit = {}) {
  let response: Response

  try {
    response = await fetch(url, options)
  } catch (error) {
    if (error instanceof DOMException) {
      if (error.name === 'TimeoutError' || error.name === 'AbortError') return fail('TIMEOUT')
    }
    if (error instanceof TypeError) return fail('NETWORK')
    return failWithDetails('UNKNOWN', error instanceof Error ? error.message : String(error))
  }

  // Handle HTTP errors
  if (!response.ok) return failWithDetails('HTTP_ERROR', await extractErrorMessage(response))

  // Handle JSON parsing errors
  try {
    return succeed({ data: await response.json() as T })
  } catch (error) {
    return fail('JSON')
  }
}

async function extractErrorMessage(response: Response): Promise<string> {

  const fallback = `HTTP ${response.status} ${response.statusText}`

  try {
    // Consume the body first
    const text = (await response.text()).trim()
    if (!text) return fallback

    try {
      const body = JSON.parse(text)
      if (body && typeof body === 'object') return JSON.stringify(body)
    } catch { /* not JSON, fall through */ }

    return text
  } catch {
    return fallback
  }
}
