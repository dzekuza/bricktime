const PLAN_BRANDING = {
  nano: {
    displayName: "Starter",
    brickImage: "/plans/starter.svg",
    theme: {
      bg: "#FB4903",
      textColor: "#F5F1EB",
      accentColor: "#F5F1EB",
      ctaBg: "#F5F1EB",
      ctaText: "#001B21",
    },
  },
  mini: {
    displayName: "Builder",
    brickImage: "/plans/builder.svg",
    theme: {
      bg: "#5C4ADE",
      textColor: "#F5F1EB",
      accentColor: "#F5F1EB",
      ctaBg: "#F5F1EB",
      ctaText: "#001B21",
    },
  },
  standard: {
    displayName: "Advanced",
    brickImage: "/plans/advanced.svg",
    theme: {
      bg: "#55DB9C",
      textColor: "#001B21",
      accentColor: "#001B21",
      ctaBg: "#001B21",
      ctaText: "#F5F1EB",
    },
  },
  pro: {
    displayName: "Master",
    brickImage: "/plans/master.svg",
    theme: {
      bg: "#FFAEE7",
      textColor: "#001B21",
      accentColor: "#001B21",
      ctaBg: "#001B21",
      ctaText: "#F5F1EB",
    },
  },
  mega: {
    displayName: "Legend",
    brickImage: "/plans/legend.svg",
    theme: {
      bg: "#4DA2FF",
      textColor: "#001B21",
      accentColor: "#001B21",
      ctaBg: "#001B21",
      ctaText: "#F5F1EB",
    },
  },
} as const

type PlanBrandingKey = keyof typeof PLAN_BRANDING

function normalizePlanKey(
  plan: string | null | undefined
): PlanBrandingKey | null {
  if (!plan) return null

  const normalized = plan.trim().toLowerCase()
  return normalized in PLAN_BRANDING ? (normalized as PlanBrandingKey) : null
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
