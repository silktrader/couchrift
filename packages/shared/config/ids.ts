export const ID_LENGTH = {
  nanoid8:   8,
  nanoid12:  12,
  shortcode: 5
} as const

// noinspection SpellCheckingInspection
export const ID_ALPHABETS = {
  alphanumeric: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  shortcode:    '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
} as const