import { createImageUrl } from '../lib/id'
import { getUserAvatar, setUserAvatar } from './user.repository'
import { fail, succeed } from '@couchrift/shared/utilities'
import { mkdirSync } from 'node:fs'
import { statSync } from 'node:fs'

export const AVATAR_CONFIG = {
  maxSize:      2 * 1024 * 1024, // 2MB input limit
  uploadDir:    `${Bun.env.UPLOAD_DIR}/avatars`,
  webpQuality:  90, // 0-100
  maxDimension: 512 // Max width and height in pixels
} as const

// Attempt to create the avatar directory when missing or fail
mkdirSync(AVATAR_CONFIG.uploadDir, { recursive: true })
if (!statSync(AVATAR_CONFIG.uploadDir))
  throw new Error(`Upload directory missing: ${AVATAR_CONFIG.uploadDir}`)

// Update the user's avatar with a new image from an uploaded file.
export async function addAvatar(file: File, userId: string) {

  // Generate an image first
  const conversion = await convertAvatar(file)
  if (!conversion.ok) return fail('CONVERSION_ERROR')

  // Generate file name and path
  const fileName = `${createImageUrl()}.webp`
  const filePath = `${AVATAR_CONFIG.uploadDir}/${fileName}`

  // Attempt to write the file
  try {
    await Bun.write(filePath, conversion.data)
  } catch (error) {
    console.error('Failed to write avatar file:', error)
    return fail('WRITE_ERROR')
  }

  // Cache the old avatar's image name for later deletion
  const oldFileName = getUserAvatar(userId)

  // Update the users' table by way of BetterAuth
  const update = setUserAvatar(userId, fileName)

  // On failure to update the table, delete the created file
  if (!update) {
    await Bun.file(filePath).delete().catch(console.error)
    return fail('UPDATE_ERROR')
  }

  // On success delete the old image
  if (oldFileName)
    await Bun.file(`${AVATAR_CONFIG.uploadDir}/${oldFileName}`).delete().catch(console.error)

  return succeed(fileName)
}

async function convertAvatar(file: File) {

  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const webpBuffer = await new Bun.Image(buffer)
      .resize(AVATAR_CONFIG.maxDimension, AVATAR_CONFIG.maxDimension, {
        fit:                'fill',
        withoutEnlargement: true
      })
      .webp({ quality: AVATAR_CONFIG.webpQuality })
      .toBuffer()

    return succeed(webpBuffer)
  } catch (error) {
    console.error('Image conversion error:', error)
    return fail('INVALID_IMAGE')
  }
}