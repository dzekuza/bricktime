import { supabase } from "@/lib/supabase"

export async function uploadToStorage(file: File): Promise<string> {
  const ext = file.name.split(".").pop()
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage
    .from("site-content")
    .upload(path, file)
  if (error) throw error
  const { data } = supabase.storage.from("site-content").getPublicUrl(path)
  return data.publicUrl
}
