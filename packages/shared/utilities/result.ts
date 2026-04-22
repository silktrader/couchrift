type Empty = Record<never, never>

// Prevents overriding `ok` in the success payload
type NoOk = { ok?: never }

export type Failure<E extends string> =
  | { readonly ok: false, readonly error: E }
  | { readonly ok: false, readonly error: E, readonly details: string }

type SuccessPayload = Record<string, unknown> & NoOk

export type Success<T extends SuccessPayload = Empty> = ({ readonly ok: true } & Readonly<T>)

export type Result<E extends string, T extends SuccessPayload = Empty> = Success<T> | Failure<E>

export function fail<const E extends string>(error: E): Failure<E> {
  return { ok: false, error }
}

export function failWithDetails<const E extends string>(error: E, details: string):
  Failure<E> {
  return { ok: false, error, details }
}

export function succeed<const T extends SuccessPayload>(value: T): Success<T>

export function succeed(): Success

export function succeed(value?: NoOk) {
  if (value == null)
    return { ok: true }
  return { ok: true, ...value }
}
