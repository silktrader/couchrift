export type Success<T = void> = { readonly ok: true, readonly data: T };

export type Failure<E extends string> = {
  readonly ok: false;
  readonly error: E;
}

export type FailureWithDetails<E extends string> = {
  readonly ok: false;
  readonly error: E;
  readonly details: string;
}

export type Result<T = void, E extends string = never, D extends string = never> =
  | Success<T>
  | Failure<E>
  | FailureWithDetails<D>;

export function succeed<T>(data: T): Success<T>
export function succeed(): Success

// Catch-all implementation that callers never see
export function succeed(data?: unknown): Success<unknown> {
  // Simplified: standard JS object creation handles `undefined` perfectly well here.
  return { ok: true, data }
}

export function fail<E extends string>(error: E): Failure<E> {
  return { ok: false, error }
}

export function failWithDetails<E extends string>(error: E, details: string): FailureWithDetails<E> {
  return { ok: false, error, details }
}