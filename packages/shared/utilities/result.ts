// Prevents overriding `ok` in the success payload
type NoOk = { ok?: never }

// Ensures that `null` isn't spread or returned in `succeed()`
type Payload = (Record<string, unknown> & NoOk) | void

export function fail<const E extends string>(error: E): { readonly ok: false, readonly error: E } {
  return { ok: false, error } as const
}

export function failWithDetails<const E extends string>(error: E, details: string):
  { readonly ok: false, readonly error: E, details: string } {
  return { ok: false, error, details } as const
}

export function succeed(): { readonly ok: true }

export function succeed<const T extends Record<string, unknown> & NoOk>(
  value: T
): { readonly ok: true } & T

export function succeed(value?: Payload) {
  if (value == null) return { ok: true }
  return { ok: true, ...value }
}