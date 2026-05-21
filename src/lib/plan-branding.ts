const PLAN_BRANDING = {
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
    displayName: "Pro",
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
} as const

type PlanBrandingKey = keyof typeof PLAN_BRANDING

function normalizePlanKey(
  plan: string | null | undefined
): PlanBrandingKey | null {
  if (!plan) return null

  const normalized = plan.trim().toLowerCase().replace(/\+$/, "").trim()
  if (normalized in PLAN_BRANDING) return normalized as PlanBrandingKey

  for (const key of Object.keys(PLAN_BRANDING) as PlanBrandingKey[]) {
    if (PLAN_BRANDING[key].displayName.toLowerCase() === normalized) return key
  }
  return null
}

function toTitleCase(plan: string | null | undefined) {
  if (!plan) return ""
  return plan.charAt(0).toUpperCase() + plan.slice(1)
}

export function getPlanDisplayName(plan: string | null | undefined) {
  const key = normalizePlanKey(plan)
  return key ? PLAN_BRANDING[key].displayName : toTitleCase(plan)
}

export function getPlanBrickImage(plan: string | null | undefined) {
  const key = normalizePlanKey(plan)
  return key ? PLAN_BRANDING[key].brickImage : null
}

export function getPlanTheme(plan: string | null | undefined) {
  const key = normalizePlanKey(plan)
  return key ? PLAN_BRANDING[key].theme : null
}

export function getPlanBrickSvg(plan: string | null | undefined): string {
  const key = normalizePlanKey(plan)
  return key ? PLAN_BRANDING[key].brickSvg : "/bricks/brick-yellow.svg"
}
