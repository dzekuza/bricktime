import { optimiseImage } from "@/lib/optimise-image"
import { supabase } from "@/lib/supabase"

type UploadBucket = "site-content" | "products"

// Every upload gets a fresh random name, so a file never changes under its URL
// and browsers and the CDN can keep it for a year.
const CACHE_SECONDS = "31536000"

export async function uploadToStorage(
  file: File,
  bucket: UploadBucket = "site-content"
): Promise<string> {
  const upload = await optimiseImage(file)
  const ext = upload.name.split(".").pop()
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from(bucket).upload(path, upload, {
    cacheControl: CACHE_SECONDS,
    contentType: upload.type || undefined,
  })
  if (error) throw error
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}
