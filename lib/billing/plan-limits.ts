import { z } from 'zod'

// Re-declared here (not imported from lib/validations/plan.ts) so this file
// is safely importable in Edge middleware context without pulling in any
// server-only module resolution chain.
export const PlanSchema = z.enum(['free', 'solo', 'team', 'studio'])
export type Plan = z.infer<typeof PlanSchema>

// null = unlimited (no numeric cap enforced)
type ResourceLimit = number | null

type PlanConfig = {
  projects: ResourceLimit
  templates: ResourceLimit
  stacks: ResourceLimit
  playbookRuns: ResourceLimit
  decisionLog: boolean    // feature gate: true = Solo+ has access
  teamAccess: boolean     // feature gate: true = team features accessible
  teamSeats: ResourceLimit // 0 = no team, null = unlimited seats
}

export const planLimits: Record<Plan, PlanConfig> = {
  free: {
    projects: 3,
    templates: 15,
    stacks: 3,
    playbookRuns: 3,
    decisionLog: false,
    teamAccess: false,
    teamSeats: 0,
  },
  solo: {
    projects: null,
    templates: null,
    stacks: null,
    playbookRuns: null,
    decisionLog: true,
    teamAccess: false,
    teamSeats: 0,
  },
  team: {
    projects: null,
    templates: null,
    stacks: null,
    playbookRuns: null,
    decisionLog: true,
    teamAccess: true,
    teamSeats: 8,
  },
  studio: {
    projects: null,
    templates: null,
    stacks: null,
    playbookRuns: null,
    decisionLog: true,
    teamAccess: true,
    teamSeats: null,
  },
}

export type LimitCheckResult =
  | { allowed: true }
  | { allowed: false; current: number; max: number }

/**
 * Check whether a user on the given plan can create another resource.
 * Call this before every resource-creation DB write.
 *
 * @param plan - The user's current plan
 * @param resource - Which resource cap to check (numeric limits only)
 * @param getCurrentCount - Async function that returns the user's current count
 * @returns LimitCheckResult — allowed:true or allowed:false with current+max for error messages
 */
export async function enforcePlanLimit(
  plan: Plan,
  resource: keyof Pick<PlanConfig, 'projects' | 'templates' | 'stacks' | 'playbookRuns'>,
  getCurrentCount: () => Promise<number>
): Promise<LimitCheckResult> {
  const limit = planLimits[plan][resource]

  // null = unlimited — always allowed
  if (limit === null) return { allowed: true }

  const current = await getCurrentCount()
  if (current < limit) return { allowed: true }
  return { allowed: false, current, max: limit }
}

/**
 * Check whether the plan has access to a feature (boolean gate).
 * Does not count resources — binary access check only.
 */
export function checkFeatureAccess(
  plan: Plan,
  feature: 'decisionLog' | 'teamAccess'
): boolean {
  return planLimits[plan][feature]
}
