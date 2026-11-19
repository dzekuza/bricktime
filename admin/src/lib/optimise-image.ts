// Uploads used to go to Storage untouched, so a phone photo of 6048x8064 px was
// served as-is to a 385 px card. Images are shrunk and re-encoded as WebP here,
// in the browser, before they are uploaded.

const MAX_EDGE_PX = 1600
const WEBP_QUALITY = 0.82
const OPTIMISABLE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])

/**
 * Returns a smaller WebP copy of a JPEG/PNG/WebP file (longest side at most
 * 1600 px). Anything else (GIF, SVG, video, ...) is returned unchanged, and so
 * is an image the conversion would not make smaller.
 */
export async function optimiseImage(file: File): Promise<File> {
  if (!OPTIMISABLE_TYPES.has(file.type)) return file

  let bitmap: ImageBitmap
  try {
    // "from-image" applies the EXIF rotation, which the canvas would drop.
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" })
  } catch {
    return file
  }

  const scale = Math.min(1, MAX_EDGE_PX / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const context = canvas.getContext("2d")
  if (!context) {
    bitmap.close()
    return file
  }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", WEBP_QUALITY)
  )
  // A browser without WebP encoding hands back PNG; keep the original then.
  if (!blob || blob.type !== "image/webp" || blob.size >= file.size) return file

  const baseName = file.name.replace(/\.[^.]+$/, "")
  return new File([blob], `${baseName}.webp`, { type: "image/webp" })
}
