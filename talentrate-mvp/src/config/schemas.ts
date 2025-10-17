import { z } from 'zod'

// Schema for individual trait definition
export const TraitSchema = z.object({
  id: z.string().regex(/^T\d+$/, 'Trait ID must be in format T1, T2, etc.'),
  name: z.string().min(1, 'Trait name is required'),
  category: z.string().min(1, 'Category is required'),
  definition: z.string().min(1, 'Definition is required'),
  evidence: z.string().min(1, 'Evidence description is required'),
  keywords: z.array(z.string()).min(1, 'At least one keyword is required')
})

// Schema for traits configuration
export const TraitsConfigSchema = z.object({
  traits: z.array(TraitSchema).length(44, 'Must have exactly 44 traits')
})

// Schema for role weights (T1-T44 with percentages)
export const RoleWeightsSchema = z.record(
  z.string().regex(/^T\d+$/, 'Must be trait ID format'),
  z.number().min(0).max(100, 'Weight must be between 0 and 100')
)

// Schema for role weights configuration
export const RoleWeightsConfigSchema = z.object({
  role_weights: z.record(
    z.string().min(1, 'Role name is required'),
    RoleWeightsSchema
  )
})

// Validation function for role weights sum
export function validateRoleWeightsSum(weights: Record<string, number>): boolean {
  const sum = Object.values(weights).reduce((acc, weight) => acc + weight, 0)
  return Math.abs(sum - 100) <= 0.1 // Allow ±0.1% tolerance
}

// Type exports
export type Trait = z.infer<typeof TraitSchema>
export type TraitsConfig = z.infer<typeof TraitsConfigSchema>
export type RoleWeights = z.infer<typeof RoleWeightsSchema>
export type RoleWeightsConfig = z.infer<typeof RoleWeightsConfigSchema>
