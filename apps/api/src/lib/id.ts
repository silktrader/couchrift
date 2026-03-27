import { customAlphabet } from 'nanoid'

// noinspection SpellCheckingInspection
const alphanumeric = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

// noinspection SpellCheckingInspection
const legible = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'

export const nanoid8 = customAlphabet(alphanumeric, 8)
export const nanoid12 = customAlphabet(alphanumeric, 12)
export const legible5 = customAlphabet(legible, 5)

