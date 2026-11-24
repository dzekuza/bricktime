// Runs after `vite build`. The app is a client-rendered SPA, so crawlers that do not run
// JS (AI bots, link unfurlers) only ever see index.html. This writes one HTML file per
// public route with the right title/description/canonical/OG tags and crawlable fallback
// text, generates sitemap.xml, and emits a 404.html so unknown URLs get a real 404 status.
// Titles/descriptions mirror the <Seo> props in src/pages — keep them in sync.
import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const DIST = path.join(ROOT, "dist")
const SITE_URL = "https://www.bricktime.lt"
const SITE_NAME = "Brick Time"
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`

const STATIC_ROUTES = [
  {
    path: "/",
    title: "Brick Time – LEGO® rinkinių prenumerata",
    description:
      "Prenumeruok LEGO® rinkinius pagal savo biudžetą, laikyk kiek nori ir keisk į naujus, kai atsibosta. Pristatymas visoje Lietuvoje.",
    priority: "1.0",
  },
  {
    path: "/rinkiniai",
    title: "Katalogas",
    description:
      "Naršyk visą Brick Time LEGO® rinkinių katalogą – filtruok pagal prenumeratos planą ir amžiaus grupę, rink rinkinius pagal savo biudžetą.",
    priority: "0.9",
  },
  {
    path: "/prenumerata",
    title: "Prenumeratos planai",
    description:
      "Pasirink Brick Time prenumeratos planą pagal savo biudžetą – nuo Nano iki Mega – ir pradėk rinktis LEGO® rinkinius.",
    priority: "0.9",
  },
  {
    path: "/apie",
    title: "Apie mus",
    description:
      "Sužinok, kas yra Brick Time – LEGO® rinkinių prenumeratos paslauga Lietuvoje, ir kodėl konstruoti be ribų yra paprasta.",
    priority: "0.6",
  },
  {
    path: "/duk",
    title: "D.U.K.",
    description:
      "Čia rasi atsakymus į dažniausiai užduodamus klausimus apie Brick Time – nuo prenumeratų ir LEGO® rinkinių iki pristatymo, grąžinimo bei paslaugos veikimo.",
    priority: "0.7",
  },
  {
    path: "/pristatymas",
    title: "Pristatymas",
    description:
      "Brick Time rūpinasi, kad LEGO® rinkinių pristatymas būtų kuo sklandesnis. Čia rasi svarbiausią informaciją apie pristatymo būdus, terminus ir tai, ko tikėtis po užsakymo.",
    priority: "0.6",
  },
  {
    path: "/grazinimai",
    title: "Grąžinimai",
    description:
      "Baigei konstruoti? Laikas kitam rinkiniui. Grąžinimo procesas paprastas ir greitas. Čia sužinosi, kaip inicijuoti grąžinimą ir kada galėsi išsirinkti kitą LEGO® rinkinį.",
    priority: "0.6",
  },
  {
    path: "/praleisti-pristabdyti",
    title: "Praleisti / pristabdyti",
    description:
      "Kartais statybos ritmas sulėtėja. Šiame puslapyje aiškiai aprašyta, kada gali praleisti mėnesį, kaip veikia pristabdymas ir kas nutinka tavo prenumeratai tuo metu.",
    priority: "0.5",
  },
  {
    path: "/dovanu-kuponas",
    title: "Dovanų kortelės",
    description:
      "Padovanok Brick Time LEGO® rinkinių prenumeratą – pasirink dovanų kortelės sumą ir nustebink artimą žmogų.",
    priority: "0.5",
  },
  {
    path: "/merch",
    title: "Merch",
    description: "Brick Time apranga – džemperiai ir marškinėliai LEGO® fanams.",
    priority: "0.5",
  },
  {
    path: "/bendruomene",
    title: "Bendruomenė",
    description:
      "Prisijunk prie Brick Time bendruomenės – dalinkis savo LEGO® statiniais, sek naujausius numerius ir rink pasiekimus.",
    priority: "0.4",
  },
  {
    path: "/kontaktai",
    title: "Kontaktai",
    description:
      "Susisiek su Brick Time komanda el. paštu, telefonu ar socialiniuose tinkluose – atsakysime kuo greičiau.",
    priority: "0.4",
  },
  {
    path: "/privatumo-politika",
    title: "Privatumo politika",
    description:
      "Brick Time privatumo politika – kaip tvarkome tavo asmens duomenis naudojantis mūsų LEGO® rinkinių prenumeratos paslauga.",
    priority: "0.3",
  },
  {
    path: "/parduotuves-taisykles",
    title: "Parduotuvės taisyklės",
    description:
      "Brick Time elektroninės parduotuvės naudojimosi ir prenumeratos užsakymo taisyklės.",
    priority: "0.3",
  },
]

const NAV_LINKS = [
  ["/rinkiniai", "Katalogas"],
  ["/prenumerata", "Prenumeratos planai"],
  ["/duk", "D.U.K."],
  ["/pristatymas", "Pristatymas"],
  ["/grazinimai", "Grąžinimai"],
  ["/apie", "Apie mus"],
]

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")

const truncate = (value, max) => {
  const text = String(value ?? "").replace(/\s+/g, " ").trim()
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text
}

function buildHead({ title, description, urlPath, image, noindex, jsonLd }) {
  const url = `${SITE_URL}${urlPath}`
  const fullTitle = title === SITE_NAME || title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`
  const t = escapeHtml(fullTitle)
  const d = escapeHtml(description)
  return [
    `<title>${t}</title>`,
    `<meta data-prerender="true" name="description" content="${d}" />`,
    `<link data-prerender="true" rel="canonical" href="${escapeHtml(url)}" />`,
    `<meta data-prerender="true" name="robots" content="${noindex ? "noindex, nofollow" : "index, follow"}" />`,
    `<meta data-prerender="true" property="og:type" content="website" />`,
    `<meta data-prerender="true" property="og:site_name" content="${SITE_NAME}" />`,
    `<meta data-prerender="true" property="og:title" content="${t}" />`,
    `<meta data-prerender="true" property="og:description" content="${d}" />`,
    `<meta data-prerender="true" property="og:url" content="${escapeHtml(url)}" />`,
    `<meta data-prerender="true" property="og:image" content="${escapeHtml(image)}" />`,
    `<meta data-prerender="true" name="twitter:card" content="summary_large_image" />`,
    `<meta data-prerender="true" name="twitter:title" content="${t}" />`,
    `<meta data-prerender="true" name="twitter:description" content="${d}" />`,
    `<meta data-prerender="true" name="twitter:image" content="${escapeHtml(image)}" />`,
    ...(jsonLd
      ? [
          // "<" is escaped so a title like "</script>" cannot break out of the tag.
          `<script data-prerender="true" type="application/ld+json">${JSON.stringify(jsonLd).replaceAll("<", "\\u003c")}</script>`,
        ]
      : []),
  ].join("\n    ")
}

function buildFallback({ heading, description }) {
  const links = NAV_LINKS.map(
    ([href, label]) => `<li><a href="${href}">${escapeHtml(label)}</a></li>`
  ).join("")
  return `<noscript><main><h1>${escapeHtml(heading)}</h1><p>${escapeHtml(description)}</p><nav><ul>${links}</ul></nav></main></noscript>`
}

function renderPage(template, page) {
  // The shared template ships a default <title> + description; swap them for the page's own.
  const withoutDefaults = template
    .replace(/<[^>]*data-prerender="true"[^>]*>\s*/g, "")
    .replace(/<noscript><main>[\s\S]*?<\/main><\/noscript>\s*/, "")
    .replace(/<title>[\s\S]*?<\/title>\s*/, "")
    .replace(/<meta name="description"[^>]*>\s*/, "")
  const withHead = withoutDefaults.replace("</head>", `  ${buildHead(page)}\n  </head>`)
  return withHead.replace(
    '<div id="root"></div>',
    `<div id="root"></div>\n    ${buildFallback(page)}`
  )
}

async function writePage(template, page) {
  const dir = path.join(DIST, page.urlPath)
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, "index.html"), renderPage(template, page))
}

async function fetchRows(table, query) {
  const baseUrl = process.env.VITE_SUPABASE_URL
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY
  if (!baseUrl || !anonKey) {
    console.warn(`[seo] VITE_SUPABASE_* not set, skipping ${table} pages`)
    return []
  }
  try {
    const res = await fetch(`${baseUrl}/rest/v1/${table}?${query}`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (error) {
    // A failed fetch must not break the deploy; the SPA still serves these URLs.
    console.warn(`[seo] could not load ${table}: ${error.message}`)
    return []
  }
}

async function main() {
  const template = await readFile(path.join(DIST, "index.html"), "utf8")

  const faqs = await fetchRows("faq_items", "select=question,answer&order=sort_order")
  const faqSchema =
    faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: { "@type": "Answer", text: faq.answer },
          })),
        }
      : undefined

  for (const route of STATIC_ROUTES) {
    await writePage(template, {
      heading: route.title,
      title: route.title,
      description: route.description,
      urlPath: route.path,
      image: DEFAULT_IMAGE,
      jsonLd: route.path === "/duk" ? faqSchema : undefined,
    })
  }

  const now = Date.now()
  const allProducts = await fetchRows(
    "products",
    "select=id,slug,title,subtitle,description,category,min_age,image_url,gallery,release_date&order=id.desc"
  )
  // The archive hides drops whose release_date is still in the future; do the same here
  // so the sitemap and prerendered pages never advertise an unreleased set.
  const products = allProducts.filter(
    (product) => !product.release_date || new Date(product.release_date).getTime() <= now
  )
  for (const product of products) {
    const description = truncate(
      product.subtitle ||
        product.description ||
        "LEGO® rinkinys iš Brick Time katalogo – prieinamas su prenumerata.",
      200
    )
    const images = [product.image_url, ...(product.gallery ?? [])].filter(
      (url) => typeof url === "string" && url.startsWith("http")
    )
    await writePage(template, {
      heading: product.title,
      title: product.title,
      description,
      urlPath: `/rinkinys/${product.slug}`,
      image: images[0] ?? DEFAULT_IMAGE,
      // Mirrors the Product schema <Drop> renders client-side.
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.title,
        description: description || undefined,
        image: images.length > 0 ? images : undefined,
        category: product.category,
        brand: { "@type": "Brand", name: "LEGO" },
        audience: product.min_age
          ? { "@type": "PeopleAudience", suggestedMinAge: product.min_age }
          : undefined,
      },
    })
  }

  const merch = await fetchRows(
    "merch_items",
    "select=slug,name,description,image_url&status=in.(active,coming-soon)&order=sort_order"
  )
  for (const item of merch) {
    await writePage(template, {
      heading: item.name,
      title: item.name,
      description: truncate(item.description || "Brick Time apranga LEGO® fanams.", 200),
      urlPath: `/merch/${item.slug}`,
      image: item.image_url?.startsWith("http") ? item.image_url : DEFAULT_IMAGE,
    })
  }

  const urls = [
    ...STATIC_ROUTES.map((r) => ({ loc: r.path === "/" ? "/" : r.path, priority: r.priority })),
    ...products.map((p) => ({ loc: `/rinkinys/${p.slug}`, priority: "0.7" })),
    ...merch.map((m) => ({ loc: `/merch/${m.slug}`, priority: "0.4" })),
  ]
  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(
      (u) =>
        `  <url><loc>${escapeHtml(SITE_URL + u.loc)}</loc><priority>${u.priority}</priority></url>`
    ),
    "</urlset>",
    "",
  ].join("\n")
  await writeFile(path.join(DIST, "sitemap.xml"), sitemap)

  // Vercel serves dist/404.html with a real 404 status for any URL no file or rewrite matches.
  await writeFile(
    path.join(DIST, "404.html"),
    renderPage(template, {
      heading: "Puslapis nerastas",
      title: "Puslapis nerastas",
      description: "Šis puslapis neegzistuoja arba buvo perkeltas.",
      urlPath: "/404",
      image: DEFAULT_IMAGE,
      noindex: true,
    })
  )

  console.log(
    `[seo] wrote ${STATIC_ROUTES.length} static, ${products.length} product, ${merch.length} merch pages + sitemap + 404`
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
