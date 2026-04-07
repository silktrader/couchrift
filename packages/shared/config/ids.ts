export const ID_LENGTH = {
  nanoid8:  8,
  nanoid12: 12,
  legible5: 5
} as const

// noinspection SpellCheckingInspection
export const ID_ALPHABETS = {
  alphanumeric: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  legible:      '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
} as const