import { customAlphabet } from 'nanoid'
import { ID_ALPHABETS, ID_LENGTH } from '@couchrift/shared/config/ids'

export const createUserId = customAlphabet(ID_ALPHABETS.alphanumeric, ID_LENGTH.nanoid8)
export const createImageUrl = customAlphabet(ID_ALPHABETS.alphanumeric, ID_LENGTH.nanoid8)
export const createLoungeId = customAlphabet(ID_ALPHABETS.alphanumeric, ID_LENGTH.nanoid12)
export const createShortcode = customAlphabet(ID_ALPHABETS.shortcode, ID_LENGTH.shortcode)

