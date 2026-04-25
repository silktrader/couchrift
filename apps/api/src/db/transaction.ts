import type { Success, Failure } from '@couchrift/shared/utilities/result.ts'
import db from './index.ts'

class TransactionRollback<T> extends Error {
  constructor(public readonly result: T) {
    super('Rollback')
  }
}

/**
 * Wraps the provided function within an `IMMEDIATE` transaction that detects `Failure` return types
 * and throws exceptions for rollbacks.
 */
export function runTransactionWithRollback<E extends string, T>(
  fn: () => Success<T> | Failure<E>): Success<T> | Failure<E> {
  const tx = db.transaction(() => {
    const result = fn()

    // Trigger a rollback when the function returns a failure object
    if (!result.ok) throw new TransactionRollback(result)
    return result
  })

  try {
    // Ensure the write lock is acquired
    return tx.immediate()
  } catch (e) {
    if (e instanceof TransactionRollback)
      return e.result

    throw e // re-throw to bubble up unexpected DB errors
  }
}