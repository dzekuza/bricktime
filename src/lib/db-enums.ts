import type { Database } from "./database.types"

/**
 * Hand-maintained aliases for Postgres enums.
 *
 * These deliberately live outside database.types.ts. That file is overwritten
 * wholesale by `supabase gen types`, and PlanTier used to be appended to it by
 * hand — so every regeneration silently deleted it and broke the build. It had
 * to be restored six separate times (see `git log --grep PlanTier`). Keeping
 * the alias here means a regen cannot touch it.
 *
 * Add new enum aliases here, never to database.types.ts.
 */
export type PlanTier = Database["public"]["Enums"]["plan_tier"]
