import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { supabase, type Tables } from "@/lib/supabase"
import { HeroTab } from "@/components/content/HeroTab"
import { MarqueeTab } from "@/components/content/MarqueeTab"
import { HowItWorksTab } from "@/components/content/HowItWorksTab"
import { TestimonialsTab } from "@/components/content/TestimonialsTab"
import { FaqCtaTab } from "@/components/content/FaqCtaTab"
import { CategoriesTab } from "@/components/content/CategoriesTab"
import { FaqQuestionsTab } from "@/components/content/FaqQuestionsTab"
import { PageHeadersTab } from "@/components/content/PageHeadersTab"

type HomeContent = Tables<"home_content">
type MarqueeItem = Tables<"home_marquee_items">
type Step = Tables<"home_how_it_works_steps">
type Testimonial = Tables<"home_testimonials">
type FaqItem = Tables<"faq_items">
type PageHeader = Tables<"page_headers">

const SCOPES = [
  { value: "home", label: "Home page" },
  { value: "shared", label: "Shared (used on multiple pages)" },
]

export function Content() {
  const [scope, setScope] = useState<"home" | "shared">("home")
  const [content, setContent] = useState<HomeContent | null>(null)
  const [marqueeItems, setMarqueeItems] = useState<MarqueeItem[]>([])
  const [steps, setSteps] = useState<Step[]>([])
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [faqItems, setFaqItems] = useState<FaqItem[]>([])
  const [pageHeaders, setPageHeaders] = useState<PageHeader[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [
        contentRes,
        marqueeRes,
        stepsRes,
        testimonialsRes,
        faqRes,
        pageHeadersRes,
      ] = await Promise.all([
        supabase.from("home_content").select("*").eq("id", 1).single(),
        supabase.from("home_marquee_items").select("*").order("sort_order"),
        supabase
          .from("home_how_it_works_steps")
          .select("*")
          .order("sort_order"),
        supabase.from("home_testimonials").select("*").order("sort_order"),
        supabase.from("faq_items").select("*").order("sort_order"),
        supabase.from("page_headers").select("*").order("slug"),
      ])
      if (contentRes.error)
        console.error("Failed to load home content:", contentRes.error.message)
      if (contentRes.data) setContent(contentRes.data)
      if (marqueeRes.data) setMarqueeItems(marqueeRes.data)
      if (stepsRes.data) setSteps(stepsRes.data)
      if (testimonialsRes.data) setTestimonials(testimonialsRes.data)
      if (faqRes.data) setFaqItems(faqRes.data)
      if (pageHeadersRes.data) setPageHeaders(pageHeadersRes.data)
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Content</h1>
          <p className="text-sm text-muted-foreground">
            Headings, copy and images shown across the storefront.
          </p>
        </div>
        <Select
          value={scope}
          onValueChange={(v) => setScope(v as "home" | "shared")}
        >
          <SelectTrigger className="w-[260px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SCOPES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading || !content ? (
        <div className="py-20 text-center text-sm text-muted-foreground">
          Loading content…
        </div>
      ) : scope === "home" ? (
        <Tabs defaultValue="hero" className="flex flex-col gap-4">
          <TabsList className="w-fit">
            <TabsTrigger value="hero">Hero</TabsTrigger>
            <TabsTrigger value="marquee">Marquee</TabsTrigger>
            <TabsTrigger value="how-it-works">How It Works</TabsTrigger>
            <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
            <TabsTrigger value="faq-cta">FAQ CTA</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          <TabsContent value="hero">
            <HeroTab content={content} onChange={setContent} />
          </TabsContent>

          <TabsContent value="marquee">
            <MarqueeTab items={marqueeItems} onChange={setMarqueeItems} />
          </TabsContent>

          <TabsContent value="how-it-works">
            <HowItWorksTab
              content={content}
              onChangeContent={setContent}
              steps={steps}
              onChangeSteps={setSteps}
            />
          </TabsContent>

          <TabsContent value="testimonials">
            <TestimonialsTab
              content={content}
              onChangeContent={setContent}
              items={testimonials}
              onChange={setTestimonials}
            />
          </TabsContent>

          <TabsContent value="faq-cta">
            <FaqCtaTab content={content} onChangeContent={setContent} />
          </TabsContent>

          <TabsContent value="categories">
            <CategoriesTab />
          </TabsContent>
        </Tabs>
      ) : (
        <Tabs defaultValue="faq-questions" className="flex flex-col gap-4">
          <TabsList className="w-fit">
            <TabsTrigger value="faq-questions">FAQ Questions</TabsTrigger>
            <TabsTrigger value="page-headers">Page Headers</TabsTrigger>
          </TabsList>

          <TabsContent value="faq-questions">
            <FaqQuestionsTab items={faqItems} onChange={setFaqItems} />
          </TabsContent>

          <TabsContent value="page-headers">
            <PageHeadersTab items={pageHeaders} onChange={setPageHeaders} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
