import { SetErrorFunction, DefaultErrorFunction } from '@sinclair/typebox/errors'
import { FormatRegistry } from '@sinclair/typebox'

// FormatRegistry: Register Email Format
FormatRegistry.Set('email',
  value => /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(
    value))

// SetErrorFunction: Intercept schemas with errorMessage property
SetErrorFunction((parameter) => {
  return 'errorMessage' in (parameter.schema as any)
         ? (parameter.schema as any).errorMessage
         : DefaultErrorFunction(parameter)
})
