import { Helmet } from "react-helmet-async"

const SITE_NAME = "Brick Time"
const SITE_URL = "https://www.bricktime.lt"
const DEFAULT_DESCRIPTION =
  "LEGO® rinkinių prenumerata Lietuvoje. Rinkis rinkinius pagal savo mėnesinį biudžetą, laikyk kiek nori, grąžink ir keisk į naujus."
const DEFAULT_IMAGE = "/og-image.png"

type SeoProps = {
  title: string
  description?: string
  path?: string
  noindex?: boolean
  image?: string
}

export function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  noindex = false,
  image = DEFAULT_IMAGE,
}: SeoProps) {
  const url = `${SITE_URL}${path}`
  const fullTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`
  const imageUrl = image.startsWith("http") ? image : `${SITE_URL}${image}`

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={imageUrl} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
    </Helmet>
  )
}
