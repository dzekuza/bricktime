import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { supabase, type Tables } from "@/lib/supabase"
import { MediaDropzone } from "@/components/content/MediaDropzone"
import { uploadToStorage } from "@/lib/upload-to-storage"

type PageHeader = Tables<"page_headers">

interface PageHeadersTabProps {
  items: PageHeader[]
  onChange: (items: PageHeader[]) => void
}

const PAGES: { slug: PageHeader["slug"]; label: string; fallback: string }[] = [
  {
    slug: "archive",
    label: "Rinkiniai (catalog)",
    fallback: "build-castle.jpg",
  },
  { slug: "merch", label: "Merch", fallback: "build-sailboat.jpg" },
  {
    slug: "gift_cards",
    label: "Dovanų kuponai",
    fallback: "build-spaceship.jpg",
  },
  { slug: "community", label: "Bendruomenė", fallback: "build-cactus.jpg" },
]

export function PageHeadersTab({ items, onChange }: PageHeadersTabProps) {
  async function setImage(slug: PageHeader["slug"], url: string | null) {
    const { error } = await supabase
      .from("page_headers")
      .update({ image_url: url, updated_at: new Date().toISOString() })
      .eq("slug", slug)
    if (error) {
      console.error("Failed to save page header image:", error.message)
      return
    }
    onChange(
      items.map((item) =>
        item.slug === slug ? { ...item, image_url: url } : item
      )
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Page headers</CardTitle>
        <CardDescription>
          The photo shown next to the headline at the top of the Rinkiniai,
          Merch, Dovanų kuponai and Bendruomenė pages. Each change saves
          immediately. Leave empty to fall back to the site's bundled default
          photo for that page.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 sm:grid-cols-2">
        {PAGES.map(({ slug, label, fallback }) => {
          const item = items.find((i) => i.slug === slug)
          return (
            <div key={slug} className="flex flex-col gap-2">
              <Label>{label}</Label>
              <MediaDropzone
                value={item?.image_url ?? null}
                accept="image/*"
                acceptPrefix="image/"
                placeholder={`Drop image here or click to upload (default: ${fallback})`}
                aspectClassName="aspect-[2/1]"
                onUpload={async (file) =>
                  setImage(slug, await uploadToStorage(file))
                }
                onRemove={() => setImage(slug, null)}
                renderPreview={(url) => (
                  <img
                    src={url}
                    alt={label}
                    className="h-full w-full object-cover"
                  />
                )}
              />
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
