import { customAlphabet } from 'nanoid'
import { ID_ALPHABETS, ID_LENGTH } from '@couchrift/shared/config/ids'

export const nanoid8 = customAlphabet(ID_ALPHABETS.alphanumeric, ID_LENGTH.nanoid8)
export const nanoid12 = customAlphabet(ID_ALPHABETS.alphanumeric, ID_LENGTH.nanoid12)
export const legible5 = customAlphabet(ID_ALPHABETS.shortcode, ID_LENGTH.shortcode)

