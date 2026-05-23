import { z } from 'zod'

export const PlanSchema = z.enum(['free', 'solo', 'team', 'studio'])
export type Plan = z.infer<typeof PlanSchema>
