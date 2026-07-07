import { useState, useEffect, useRef } from 'react'
import { ImagePlusIcon, XIcon, UploadIcon, Loader2Icon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { type Product, type Tier, type ProductStatus, type BagItem, type CompatItem, type KitItem } from '@/data/products'

interface ProductEditDialogProps {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (product: Product) => void
  nextId?: number
}

const CATEGORIES = ['Cityscape', 'Nature', 'Vehicles', 'Sci-fi', 'Architecture', 'Fantasy']
const TIERS: Tier[] = ['nano', 'mini', 'standard', 'pro', 'mega']
const STATUSES: ProductStatus[] = ['available', 'sold_out', 'limited']

const BLANK: Omit<Product, 'id'> = {
  title: '',
  subtitle: '',
  description: '',
  category: 'Cityscape',
  year: new Date().getFullYear(),
  bricks: 0,
  minifigs: '1 minifig',
  build_time: '',
  value: 0,
  tier: 'standard',
  status: 'available',
  gallery: [],
  faq: [],
  bags: [],
  story: null,
  minifig: null,
  compatibility: [],
  release_date: null,
  early_access_tiers: [],
  early_access_hours: 48,
  isDangerous: false,
}

export function ProductEditDialog({ product, open, onOpenChange, onSave, nextId = 0 }: ProductEditDialogProps) {
  const isAdd = product === null
  const [form, setForm] = useState<Product>({ id: nextId, ...BLANK })
  const [galleryInput, setGalleryInput] = useState('')
  const [faqDraft, setFaqDraft] = useState<{ q: string; a: string }>({ q: '', a: '' })
  const [bagDraft, setBagDraft] = useState<BagItem>({ num: '', label: '', desc: '', bg: '#F5F1EB' })
  const [compatDraft, setCompatDraft] = useState<CompatItem>({ drop: '', title: '', desc: '', bg: '#F5F1EB' })
  const [kitDraft, setKitDraft] = useState<KitItem>({ title: '', body: '' })
  const [coverDragging, setCoverDragging] = useState(false)
  const [galleryDragging, setGalleryDragging] = useState(false)
  const [coverUploading, setCoverUploading] = useState(false)
  const [galleryUploading, setGalleryUploading] = useState(false)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setForm(product ? { ...product, gallery: product.gallery ?? [], faq: product.faq ?? [], bags: product.bags ?? [], compatibility: product.compatibility ?? [] } : { id: nextId, ...BLANK })
    setGalleryInput('')
    setFaqDraft({ q: '', a: '' })
    setBagDraft({ num: '', label: '', desc: '', bg: '#F5F1EB' })
    setCompatDraft({ drop: '', title: '', desc: '', bg: '#F5F1EB' })
    setKitDraft({ title: '', body: '' })
  }, [open, product, nextId])

  function set<K extends keyof Product>(key: K, value: Product[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function uploadToStorage(file: File): Promise<string> {
    const ext = file.name.split('.').pop()
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('products').upload(path, file)
    if (error) throw error
    const { data } = supabase.storage.from('products').getPublicUrl(path)
    return data.publicUrl
  }

  async function handleCoverFile(file: File) {
    setCoverUploading(true)
    try {
      const url = await uploadToStorage(file)
      set('image_url', url)
    } finally {
      setCoverUploading(false)
    }
  }

  function handleCoverDrop(e: React.DragEvent) {
    e.preventDefault()
    setCoverDragging(false)
    const file = e.dataTransfer.files[0]
    if (file?.type.startsWith('image/')) handleCoverFile(file)
  }

  // Gallery
  function addGalleryUrl() {
    const url = galleryInput.trim()
    if (!url) return
    set('gallery', [...(form.gallery ?? []), url])
    setGalleryInput('')
  }

  async function handleGalleryFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (!files.length) return
    setGalleryUploading(true)
    try {
      const urls = await Promise.all(files.map(uploadToStorage))
      set('gallery', [...(form.gallery ?? []), ...urls])
    } finally {
      setGalleryUploading(false)
    }
  }

  async function handleGalleryDrop(e: React.DragEvent) {
    e.preventDefault()
    setGalleryDragging(false)
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'))
    if (!files.length) return
    setGalleryUploading(true)
    try {
      const urls = await Promise.all(files.map(uploadToStorage))
      set('gallery', [...(form.gallery ?? []), ...urls])
    } finally {
      setGalleryUploading(false)
    }
  }

  function removeGalleryItem(i: number) {
    set('gallery', (form.gallery ?? []).filter((_, idx) => idx !== i))
  }

  function addFaqItem() {
    if (!faqDraft.q.trim() || !faqDraft.a.trim()) return
    set('faq', [...(form.faq ?? []), { q: faqDraft.q.trim(), a: faqDraft.a.trim() }])
    setFaqDraft({ q: '', a: '' })
  }

  function removeFaqItem(i: number) {
    set('faq', (form.faq ?? []).filter((_, idx) => idx !== i))
  }

  function addBag() {
    if (!bagDraft.num.trim() || !bagDraft.label.trim()) return
    set('bags', [...(form.bags ?? []), { ...bagDraft }])
    setBagDraft({ num: '', label: '', desc: '', bg: '#F5F1EB' })
  }
  function removeBag(i: number) { set('bags', (form.bags ?? []).filter((_, idx) => idx !== i)) }

  function addCompat() {
    if (!compatDraft.drop.trim() || !compatDraft.title.trim()) return
    set('compatibility', [...(form.compatibility ?? []), { ...compatDraft }])
    setCompatDraft({ drop: '', title: '', desc: '', bg: '#F5F1EB' })
  }
  function removeCompat(i: number) { set('compatibility', (form.compatibility ?? []).filter((_, idx) => idx !== i)) }

  function setStory<K extends keyof NonNullable<Product['story']>>(key: K, value: NonNullable<Product['story']>[K]) {
    const base = form.story ?? { headline: '', body: [''], image_url: null, author_name: '', author_role: '' }
    set('story', { ...base, [key]: value })
  }
  function setStoryBody(i: number, value: string) {
    const body = [...(form.story?.body ?? [''])]
    body[i] = value
    setStory('body', body)
  }
  function addStoryParagraph() { setStory('body', [...(form.story?.body ?? ['']), '']) }
  function removeStoryParagraph(i: number) { setStory('body', (form.story?.body ?? ['']).filter((_, idx) => idx !== i)) }

  function setMinifig<K extends keyof NonNullable<Product['minifig']>>(key: K, value: NonNullable<Product['minifig']>[K]) {
    const base = form.minifig ?? { name: '', description: '', image_url: null, edition: '', kit_headline: '', kit_items: [] }
    set('minifig', { ...base, [key]: value })
  }
  function addKitItem() {
    if (!kitDraft.title.trim()) return
    const base = form.minifig ?? { name: '', description: '', image_url: null, edition: '', kit_headline: '', kit_items: [] }
    set('minifig', { ...base, kit_items: [...base.kit_items, { ...kitDraft }] })
    setKitDraft({ title: '', body: '' })
  }
  function removeKitItem(i: number) {
    const base = form.minifig!
    set('minifig', { ...base, kit_items: base.kit_items.filter((_, idx) => idx !== i) })
  }

  function handleSave() {
    onSave(form)
    onOpenChange(false)
  }

  const canSave = form.title.trim().length > 0 && form.bricks > 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col gap-0 sm:max-w-2xl w-full p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle>{isAdd ? 'Add product' : 'Edit product'}</SheetTitle>
          <SheetDescription>
            {isAdd ? 'Fill in the details to add a new set to the catalogue.' : `Editing "${product?.title}"`}
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="details" className="flex flex-col flex-1 min-h-0">
          <TabsList className="mx-6 mt-4 w-fit">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* ── Details tab ─────────────────────────────────────────── */}
          <TabsContent value="details" className="flex-1 overflow-y-auto px-6 py-5">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g. Bakery corner"
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  placeholder="e.g. + Baker Anna"
                  value={form.subtitle}
                  onChange={(e) => set('subtitle', e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe this set — what makes it special, what's included, any crossovers…"
                  className="min-h-[120px] resize-y"
                  value={form.description ?? ''}
                  onChange={(e) => set('description', e.target.value)}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => set('category', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="year">Year</Label>
                  <Input id="year" type="number" value={form.year} onChange={(e) => set('year', Number(e.target.value))} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="bricks">Brick count</Label>
                  <Input
                    id="bricks"
                    type="number"
                    placeholder="0"
                    value={form.bricks || ''}
                    onChange={(e) => set('bricks', Number(e.target.value))}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="value">Rental value (€)</Label>
                  <Input
                    id="value"
                    type="number"
                    placeholder="0"
                    value={form.value || ''}
                    onChange={(e) => set('value', Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">Used to calculate how many products a subscriber can hold.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="minifigs">Minifigs</Label>
                  <Input id="minifigs" value={form.minifigs} onChange={(e) => set('minifigs', e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="build_time">Build time</Label>
                  <Input
                    id="build_time"
                    placeholder="e.g. 4–6h"
                    value={form.build_time ?? ''}
                    onChange={(e) => set('build_time', e.target.value || undefined)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="rating">Rating <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input
                  id="rating"
                  placeholder="e.g. 4.92"
                  value={form.rating ?? ''}
                  onChange={(e) => set('rating', e.target.value || undefined)}
                />
              </div>

              <Separator />

              {/* FAQ */}
              <div className="flex flex-col gap-3">
                <Label>FAQ <span className="text-muted-foreground text-xs">(optional)</span></Label>

                {(form.faq ?? []).length > 0 && (
                  <div className="flex flex-col gap-2">
                    {(form.faq ?? []).map((item, i) => (
                      <div key={i} className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.q}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.a}</p>
                        </div>
                        <button
                          onClick={() => removeFaqItem(i)}
                          className="shrink-0 rounded-md p-1 hover:bg-muted transition-colors"
                        >
                          <XIcon className="size-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-col gap-2 rounded-lg border border-dashed p-3">
                  <Input
                    placeholder="Question"
                    value={faqDraft.q}
                    onChange={(e) => setFaqDraft((d) => ({ ...d, q: e.target.value }))}
                  />
                  <Textarea
                    placeholder="Answer"
                    className="min-h-[72px] resize-y"
                    value={faqDraft.a}
                    onChange={(e) => setFaqDraft((d) => ({ ...d, a: e.target.value }))}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="self-end"
                    onClick={addFaqItem}
                    disabled={!faqDraft.q.trim() || !faqDraft.a.trim()}
                  >
                    Add FAQ item
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── Media tab ───────────────────────────────────────────── */}
          <TabsContent value="media" className="flex-1 overflow-y-auto px-6 py-5">
            <div className="flex flex-col gap-6">
              {/* Cover image */}
              <div className="flex flex-col gap-2">
                <Label>Cover image</Label>

                {form.image_url ? (
                  <div className="relative group rounded-xl overflow-hidden border aspect-video bg-muted">
                    <img
                      src={form.image_url}
                      alt="Cover"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => coverInputRef.current?.click()}
                      >
                        <UploadIcon className="size-3.5 mr-1.5" />
                        Replace
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => set('image_url', undefined)}
                      >
                        <XIcon className="size-3.5 mr-1.5" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={cn(
                      'rounded-xl border-2 border-dashed aspect-video flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors',
                      coverDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50',
                    )}
                    onDragOver={(e) => { e.preventDefault(); setCoverDragging(true) }}
                    onDragLeave={() => setCoverDragging(false)}
                    onDrop={handleCoverDrop}
                    onClick={() => coverInputRef.current?.click()}
                  >
                    <UploadIcon className="size-8 text-muted-foreground" />
                    <div className="text-center">
                      <p className="text-sm font-medium">Drop image here or click to upload</p>
                      <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP up to 10MB</p>
                    </div>
                  </div>
                )}

                {coverUploading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2Icon className="size-4 animate-spin" />
                    Uploading…
                  </div>
                )}

                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverFile(f); e.target.value = '' }}
                />

                <div className="flex gap-2">
                  <Input
                    placeholder="Or paste image URL…"
                    value={form.image_url?.startsWith('blob:') ? '' : (form.image_url ?? '')}
                    onChange={(e) => set('image_url', e.target.value || undefined)}
                  />
                </div>
              </div>

              <Separator />

              {/* Gallery */}
              <div className="flex flex-col gap-3">
                <Label>Gallery</Label>

                {(form.gallery ?? []).length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {(form.gallery ?? []).map((url, i) => (
                      <div key={i} className="relative group rounded-lg overflow-hidden border aspect-square bg-muted">
                        <img src={url} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          className="absolute top-1 right-1 size-6 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeGalleryItem(i)}
                        >
                          <XIcon className="size-3 text-white" />
                        </button>
                      </div>
                    ))}

                    {/* Add more slot */}
                    <label
                      className={cn(
                        'rounded-lg border-2 border-dashed aspect-square flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors',
                        galleryDragging
                          ? 'border-primary bg-primary/5'
                          : 'border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50',
                      )}
                      onDragOver={(e) => { e.preventDefault(); setGalleryDragging(true) }}
                      onDragLeave={() => setGalleryDragging(false)}
                      onDrop={handleGalleryDrop}
                    >
                      <ImagePlusIcon className="size-5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Add</span>
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryFile} />
                    </label>
                  </div>
                )}

                {(form.gallery ?? []).length === 0 && (
                  <label
                    className={cn(
                      'rounded-xl border-2 border-dashed py-8 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors',
                      galleryDragging
                        ? 'border-primary bg-primary/5'
                        : 'border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50',
                    )}
                    onDragOver={(e) => { e.preventDefault(); setGalleryDragging(true) }}
                    onDragLeave={() => setGalleryDragging(false)}
                    onDrop={handleGalleryDrop}
                  >
                    <ImagePlusIcon className="size-7 text-muted-foreground" />
                    <div className="text-center">
                      <p className="text-sm font-medium">Drop images here or click to upload</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG, WEBP — multiple allowed</p>
                    </div>
                    <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryFile} />
                  </label>
                )}

                {galleryUploading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2Icon className="size-4 animate-spin" />
                    Uploading…
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    placeholder="Or paste image URL…"
                    value={galleryInput}
                    onChange={(e) => setGalleryInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addGalleryUrl())}
                  />
                  <Button variant="outline" size="sm" onClick={addGalleryUrl}>Add</Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── Content tab ──────────────────────────────────────────── */}
          <TabsContent value="content" className="flex-1 overflow-y-auto px-6 py-5">
            <div className="flex flex-col gap-7">

              {/* Bags */}
              <div className="flex flex-col gap-3">
                <div>
                  <p className="font-semibold text-sm">What's in the bag</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Up to 4 bag tiles shown on the product page.</p>
                </div>
                {(form.bags ?? []).map((bag, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg border p-3 text-sm">
                    <div className="w-6 h-6 rounded border flex-none mt-0.5" style={{ background: bag.bg }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-mono font-bold">Bag {bag.num}</p>
                      <p className="truncate font-medium">{bag.label}</p>
                      {bag.desc && <p className="text-muted-foreground truncate">{bag.desc}</p>}
                    </div>
                    <Button variant="ghost" size="icon" className="flex-none" onClick={() => removeBag(i)}><XIcon className="size-3.5" /></Button>
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1"><Label className="text-xs">Bag №</Label><Input placeholder="01" value={bagDraft.num} onChange={e => setBagDraft(d => ({ ...d, num: e.target.value }))} /></div>
                  <div className="flex flex-col gap-1"><Label className="text-xs">Color</Label><Input type="color" value={bagDraft.bg} onChange={e => setBagDraft(d => ({ ...d, bg: e.target.value }))} className="h-9 px-1 py-1" /></div>
                  <div className="flex flex-col gap-1 col-span-2"><Label className="text-xs">Label</Label><Input placeholder="Foundation row. Street level." value={bagDraft.label} onChange={e => setBagDraft(d => ({ ...d, label: e.target.value }))} /></div>
                  <div className="flex flex-col gap-1 col-span-2"><Label className="text-xs">Description</Label><Input placeholder="Short bag description…" value={bagDraft.desc} onChange={e => setBagDraft(d => ({ ...d, desc: e.target.value }))} /></div>
                </div>
                <Button variant="outline" size="sm" onClick={addBag} disabled={(form.bags?.length ?? 0) >= 4}>Add bag</Button>
              </div>

              <Separator />

              {/* Story */}
              <div className="flex flex-col gap-3">
                <div>
                  <p className="font-semibold text-sm">Story section</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Editorial text shown alongside an art image.</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Headline</Label>
                  <Input placeholder="Otto has been delivering mail…" value={form.story?.headline ?? ''} onChange={e => setStory('headline', e.target.value)} />
                </div>
                {(form.story?.body ?? ['']).map((para, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <Textarea placeholder={`Paragraph ${i + 1}…`} rows={3} className="flex-1 text-sm" value={para} onChange={e => setStoryBody(i, e.target.value)} />
                    {(form.story?.body?.length ?? 1) > 1 && (
                      <Button variant="ghost" size="icon" className="mt-1 flex-none" onClick={() => removeStoryParagraph(i)}><XIcon className="size-3.5" /></Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addStoryParagraph}>+ Add paragraph</Button>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Art image URL</Label>
                  <Input placeholder="https://…" value={form.story?.image_url ?? ''} onChange={e => setStory('image_url', e.target.value || null)} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1"><Label className="text-xs">Author name</Label><Input placeholder="Marek Polčák" value={form.story?.author_name ?? ''} onChange={e => setStory('author_name', e.target.value)} /></div>
                  <div className="flex flex-col gap-1"><Label className="text-xs">Author role</Label><Input placeholder="Senior brick designer" value={form.story?.author_role ?? ''} onChange={e => setStory('author_role', e.target.value)} /></div>
                </div>
              </div>

              <Separator />

              {/* Minifig */}
              <div className="flex flex-col gap-3">
                <div>
                  <p className="font-semibold text-sm">Exclusive minifig</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Featured character with kit list.</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1"><Label className="text-xs">Name</Label><Input placeholder="Postman Otto" value={form.minifig?.name ?? ''} onChange={e => setMinifig('name', e.target.value)} /></div>
                  <div className="flex flex-col gap-1"><Label className="text-xs">Edition (e.g. 3,500)</Label><Input placeholder="3,500" value={form.minifig?.edition ?? ''} onChange={e => setMinifig('edition', e.target.value)} /></div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Description</Label>
                  <Textarea placeholder="Numbered, never re-released…" rows={2} className="text-sm" value={form.minifig?.description ?? ''} onChange={e => setMinifig('description', e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Minifig image URL</Label>
                  <Input placeholder="https://…" value={form.minifig?.image_url ?? ''} onChange={e => setMinifig('image_url', e.target.value || null)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Kit headline</Label>
                  <Input placeholder="Mail satchel, folding bike, printed lanyard." value={form.minifig?.kit_headline ?? ''} onChange={e => setMinifig('kit_headline', e.target.value)} />
                </div>
                {(form.minifig?.kit_items ?? []).map((item, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg border p-3 text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{item.title}</p>
                      {item.body && <p className="text-muted-foreground text-xs mt-0.5">{item.body}</p>}
                    </div>
                    <Button variant="ghost" size="icon" className="flex-none" onClick={() => removeKitItem(i)}><XIcon className="size-3.5" /></Button>
                  </div>
                ))}
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-1"><Label className="text-xs">Kit item title</Label><Input placeholder="Removable satchel piece" value={kitDraft.title} onChange={e => setKitDraft(d => ({ ...d, title: e.target.value }))} /></div>
                  <div className="flex flex-col gap-1"><Label className="text-xs">Kit item description</Label><Textarea placeholder="Short description…" rows={2} className="text-sm" value={kitDraft.body} onChange={e => setKitDraft(d => ({ ...d, body: e.target.value }))} /></div>
                </div>
                <Button variant="outline" size="sm" onClick={addKitItem}>Add kit item</Button>
              </div>

              <Separator />

              {/* Compatibility */}
              <div className="flex flex-col gap-3">
                <div>
                  <p className="font-semibold text-sm">Compatibility</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Other products this one connects with.</p>
                </div>
                {(form.compatibility ?? []).map((c, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg border p-3 text-sm">
                    <div className="w-6 h-6 rounded border flex-none mt-0.5" style={{ background: c.bg }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-mono font-bold text-xs">{c.drop}</p>
                      <p className="font-medium">{c.title}</p>
                      {c.desc && <p className="text-muted-foreground truncate text-xs">{c.desc}</p>}
                    </div>
                    <Button variant="ghost" size="icon" className="flex-none" onClick={() => removeCompat(i)}><XIcon className="size-3.5" /></Button>
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1"><Label className="text-xs">Drop code (e.g. ⬢ Drop 14)</Label><Input placeholder="⬢ Drop 14" value={compatDraft.drop} onChange={e => setCompatDraft(d => ({ ...d, drop: e.target.value }))} /></div>
                  <div className="flex flex-col gap-1"><Label className="text-xs">Color</Label><Input type="color" value={compatDraft.bg} onChange={e => setCompatDraft(d => ({ ...d, bg: e.target.value }))} className="h-9 px-1 py-1" /></div>
                  <div className="flex flex-col gap-1 col-span-2"><Label className="text-xs">Title</Label><Input placeholder="Transit Bus Line" value={compatDraft.title} onChange={e => setCompatDraft(d => ({ ...d, title: e.target.value }))} /></div>
                  <div className="flex flex-col gap-1 col-span-2"><Label className="text-xs">Description</Label><Input placeholder="Connects via the brass hinge pin…" value={compatDraft.desc} onChange={e => setCompatDraft(d => ({ ...d, desc: e.target.value }))} /></div>
                </div>
                <Button variant="outline" size="sm" onClick={addCompat}>Add compatible product</Button>
              </div>

            </div>
          </TabsContent>

          {/* ── Settings tab ─────────────────────────────────────────── */}
          <TabsContent value="settings" className="flex-1 overflow-y-auto px-6 py-5">
            <div className="flex flex-col gap-5">

              {/* Release schedule */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label>Release date &amp; time</Label>
                  <Input
                    type="datetime-local"
                    value={form.release_date ? form.release_date.slice(0, 16) : ''}
                    onChange={(e) =>
                      set('release_date', e.target.value ? new Date(e.target.value).toISOString() : null)
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave blank to publish immediately. Set a future date to schedule the drop.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <Label>Early access</Label>
                  <div className="flex flex-col gap-2">
                    {(['nano', 'mini', 'standard', 'mega', 'mystery_s', 'mystery_m'] as const).map((t) => {
                      const labels: Record<string, string> = {
                        nano: 'Mėgėjas', mini: 'Kūrėjas', standard: 'Masteris',
                        mega: 'Legenda', mystery_s: 'Mystery Box S', mystery_m: 'Mystery Box M',
                      }
                      const checked = (form.early_access_tiers ?? []).includes(t)
                      return (
                        <label key={t} className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              set(
                                'early_access_tiers',
                                checked
                                  ? (form.early_access_tiers ?? []).filter((x) => x !== t)
                                  : [...(form.early_access_tiers ?? []), t]
                              )
                            }
                            className="rounded border-border"
                          />
                          <span className="text-sm capitalize">{labels[t]}</span>
                        </label>
                      )
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={168}
                      className="w-24"
                      value={form.early_access_hours ?? 48}
                      onChange={(e) => set('early_access_hours', Number(e.target.value))}
                    />
                    <span className="text-sm text-muted-foreground">hours before public release</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Selected tiers can see this product before the public release date.
                  </p>
                </div>
              </div>
              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label>Required tier</Label>
                  <Select value={form.tier} onValueChange={(v) => set('tier', v as Tier)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIERS.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Minimum plan needed to rent this set.</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => set('status', v as ProductStatus)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Controls visibility and availability.</p>
                </div>
              </div>

              <Separator />

              <div className="flex flex-col gap-1.5">
                <Label>Safety warning</Label>
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.isDangerous ?? false}
                    onChange={(e) => set('isDangerous', e.target.checked)}
                    className="rounded border-border size-4"
                  />
                  <span className="text-sm">Mark as dangerous / not suitable for young children</span>
                </label>
                <p className="text-xs text-muted-foreground">Shows a warning badge on the product image gallery.</p>
              </div>

              <Separator />

              <div className="flex flex-col gap-1.5">
                <Label>Product ID</Label>
                <Input value={form.id} disabled className="font-mono text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Auto-assigned. Used in checkout URLs.</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {isAdd ? 'Add product' : 'Save changes'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
