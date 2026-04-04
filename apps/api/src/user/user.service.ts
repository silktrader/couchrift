import sharp from 'sharp'
import { nanoid8 } from '../lib/id'
import path from 'node:path'
import { mkdir, unlink } from 'node:fs/promises'
import { getUserAvatar, setUserAvatar } from './user.repository'
import { auth } from '../lib/auth'

// Configuration
export const AVATAR_CONFIG = {
  maxSize:   2 * 1024 * 1024, // 2MB input limit
  uploadDir: path.resolve('./uploads/avatars'),
  // WebP conversion settings
  webpQuality:  90, // 0-100
  maxDimension: 512 // Max width and height in pixels
} as const

// Update the user's avatar with a new image from an uploaded file.
export async function addAvatar(file: File, userId: string):
  Promise<{ ok: true, fileName: string } | { ok: false, error: 'CONVERSION_ERROR' | 'WRITE_ERROR' | 'UPDATE_ERROR' }> {

  // Generate an image first
  const conversion = await convertAvatar(file)
  if (!conversion.ok) return { ok: false, error: 'CONVERSION_ERROR' }

  // Generate file name and path
  const fileName = `${nanoid8()}.webp`
  const filePath = path.join(AVATAR_CONFIG.uploadDir, fileName)

  // Attempt to write the file
  try {
    await Bun.write(filePath, conversion.buffer)
  } catch (error) {
    console.error('Failed to write avatar file:', error)
    return { ok: false, error: 'WRITE_ERROR' }
  }

  // Cache the old avatar's image name for later deletion
  const oldFileName = getUserAvatar(userId)

  // Update the users' table by way of BetterAuth
  const update = setUserAvatar(userId, fileName)

  // On failure to update the table, delete the created file
  if (!update) {
    unlink(filePath).catch()
    return { ok: false, error: 'UPDATE_ERROR' }
  }

  // On success delete the old image
  if (oldFileName)
    await unlink(path.join(AVATAR_CONFIG.uploadDir, oldFileName)).catch()

  return { ok: true, fileName }

}

async function convertAvatar(file: File):
  Promise<{ ok: true; buffer: Buffer } | { ok: false; error: string }> {

  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const webpBuffer = await sharp(buffer)
      .resize(AVATAR_CONFIG.maxDimension, AVATAR_CONFIG.maxDimension, {
        fit:      'cover', // Crop to square
        position: 'center'
      })
      .webp({ quality: AVATAR_CONFIG.webpQuality })
      .toBuffer()

    return {
      ok:     true,
      buffer: webpBuffer
    }
  } catch (error) {
    console.error('Image conversion error:', error)
    return {
      ok:    false,
      error: 'Invalid image file or unsupported format'
    }
  }
}