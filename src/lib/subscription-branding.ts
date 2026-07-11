const SUBSCRIPTION_BRANDING = {
  nano: {
    displayName: "Mėgėjas",
    brickImage: "/plans/how-nano.svg",
    brickSvg: "/bricks/brick-green.svg",
    theme: {
      bg: "#55DB9C",
      textColor: "#001B21",
      accentColor: "#001B21",
      ctaBg: "#001B21",
      ctaText: "#F5F1EB",
    },
  },
  mini: {
    displayName: "Kūrėjas",
    brickImage: "/plans/advanced.svg",
    brickSvg: "/bricks/brick-orange.svg",
    theme: {
      bg: "#FB4903",
      textColor: "#F5F1EB",
      accentColor: "#F5F1EB",
      ctaBg: "#F5F1EB",
      ctaText: "#001B21",
    },
  },
  standard: {
    displayName: "Meistras",
    brickImage: "/plans/how-standard.svg",
    brickSvg: "/bricks/brick-blue.svg",
    theme: {
      bg: "#4DA2FF",
      textColor: "#001B21",
      accentColor: "#001B21",
      ctaBg: "#001B21",
      ctaText: "#F5F1EB",
    },
  },
  pro: {
    displayName: "Legenda",
    brickImage: "/plans/master.svg",
    brickSvg: "/bricks/brick-pink.svg",
    theme: {
      bg: "#FFAEE7",
      textColor: "#001B21",
      accentColor: "#001B21",
      ctaBg: "#001B21",
      ctaText: "#F5F1EB",
    },
  },
  mega: {
    displayName: "Legenda",
    brickImage: "/plans/how-mega.svg",
    brickSvg: "/bricks/brick-purple.svg",
    theme: {
      bg: "#5C4ADE",
      textColor: "#F5F1EB",
      accentColor: "#F5F1EB",
      ctaBg: "#F5F1EB",
      ctaText: "#001B21",
    },
  },
  mystery_s: {
    displayName: "Mystery Box S",
    brickImage: null,
    brickSvg: "/bricks/brick-yellow.svg",
    theme: {
      bg: "#FFD731",
      textColor: "#001B21",
      accentColor: "#001B21",
      ctaBg: "#001B21",
      ctaText: "#F5F1EB",
    },
  },
  mystery_m: {
    displayName: "Mystery Box M",
    brickImage: null,
    brickSvg: "/bricks/brick-pink.svg",
    theme: {
      bg: "#FFAEE7",
      textColor: "#001B21",
      accentColor: "#001B21",
      ctaBg: "#001B21",
      ctaText: "#F5F1EB",
    },
  },
} as const

type SubscriptionBrandingKey = keyof typeof SUBSCRIPTION_BRANDING

function normalizeSubscriptionKey(
  plan: string | null | undefined
): SubscriptionBrandingKey | null {
  if (!plan) return null

  const normalized = plan.trim().toLowerCase().replace(/\+$/, "").trim()
  if (normalized in SUBSCRIPTION_BRANDING)
    return normalized as SubscriptionBrandingKey

  for (const key of Object.keys(
    SUBSCRIPTION_BRANDING
  ) as SubscriptionBrandingKey[]) {
    if (SUBSCRIPTION_BRANDING[key].displayName.toLowerCase() === normalized)
      return key
  }
  return null
}

function toTitleCase(plan: string | null | undefined) {
  if (!plan) return ""
  return plan.charAt(0).toUpperCase() + plan.slice(1)
}

export function getSubscriptionDisplayName(plan: string | null | undefined) {
  const key = normalizeSubscriptionKey(plan)
  return key ? SUBSCRIPTION_BRANDING[key].displayName : toTitleCase(plan)
}

export function getSubscriptionBrickImage(plan: string | null | undefined) {
  const key = normalizeSubscriptionKey(plan)
  return key ? SUBSCRIPTION_BRANDING[key].brickImage : null
}

export function getSubscriptionTheme(plan: string | null | undefined) {
  const key = normalizeSubscriptionKey(plan)
  return key ? SUBSCRIPTION_BRANDING[key].theme : null
}

export function getSubscriptionBrickSvg(
  plan: string | null | undefined
): string {
  const key = normalizeSubscriptionKey(plan)
  return key ? SUBSCRIPTION_BRANDING[key].brickSvg : "/bricks/brick-yellow.svg"
}
