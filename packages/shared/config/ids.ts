export const ID_LENGTH = {
    nanoid8: 8,
    nanoid12: 12,
    // shortcodes length can change between runs, but must range between 2 and 8 as per validation rules
    shortcode: 4
} as const

// noinspection SpellCheckingInspection
export const ID_ALPHABETS = {
    alphanumeric: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
    shortcode: '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
} as const