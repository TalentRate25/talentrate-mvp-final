import { readFileSync } from 'fs'
import { join } from 'path'
import { TraitsConfigSchema, RoleWeightsConfigSchema, validateRoleWeightsSum, type TraitsConfig, type RoleWeightsConfig, type Trait, type RoleWeights } from '@/config/schemas'

// Cache for loaded configurations
let traitsCache: TraitsConfig | null = null
let roleWeightsCache: RoleWeightsConfig | null = null

/**
 * Loads and validates the traits configuration from /config/traits.json
 * @returns Parsed and validated traits configuration
 * @throws Error if file is invalid or missing
 */
export function loadTraits(): TraitsConfig {
  if (traitsCache) {
    return traitsCache
  }

  try {
    const traitsPath = join(process.cwd(), 'src/config/traits.json')
    const traitsData = JSON.parse(readFileSync(traitsPath, 'utf-8'))
    
    const result = TraitsConfigSchema.safeParse(traitsData)
    
    if (!result.success) {
      const errorMessages = result.error.issues.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ')
      throw new Error(`Invalid traits configuration: ${errorMessages}`)
    }

    // Additional validation: ensure we have exactly T1-T44
    const traitIds = result.data.traits.map(t => t.id)
    const expectedIds = Array.from({ length: 44 }, (_, i) => `T${i + 1}`)
    const missingIds = expectedIds.filter(id => !traitIds.includes(id))
    const extraIds = traitIds.filter(id => !expectedIds.includes(id))

    if (missingIds.length > 0) {
      throw new Error(`Missing trait IDs: ${missingIds.join(', ')}`)
    }

    if (extraIds.length > 0) {
      throw new Error(`Extra trait IDs: ${extraIds.join(', ')}`)
    }

    traitsCache = result.data
    return result.data
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to load traits configuration: ${error.message}`)
    }
    throw new Error('Failed to load traits configuration: Unknown error')
  }
}

/**
 * Loads and validates the role weights configuration from /config/role_weights.json
 * @returns Parsed and validated role weights configuration
 * @throws Error if file is invalid or missing
 */
export function loadRoleWeights(): RoleWeightsConfig {
  if (roleWeightsCache) {
    return roleWeightsCache
  }

  try {
    const roleWeightsPath = join(process.cwd(), 'src/config/role_weights.json')
    const roleWeightsData = JSON.parse(readFileSync(roleWeightsPath, 'utf-8'))
    
    const result = RoleWeightsConfigSchema.safeParse(roleWeightsData)
    
    if (!result.success) {
      const errorMessages = result.error.issues.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ')
      throw new Error(`Invalid role weights configuration: ${errorMessages}`)
    }

    // Additional validation: ensure all roles have weights summing to 100%
    const expectedTraitIds = Array.from({ length: 44 }, (_, i) => `T${i + 1}`)
    const invalidRoles: string[] = []

    for (const [roleName, weights] of Object.entries(result.data.role_weights)) {
      // Check if all T1-T44 are present
      const weightKeys = Object.keys(weights)
      const missingTraits = expectedTraitIds.filter(id => !weightKeys.includes(id))
      
      if (missingTraits.length > 0) {
        invalidRoles.push(`${roleName} (missing traits: ${missingTraits.join(', ')})`)
        continue
      }

      // Check if weights sum to 100%
      if (!validateRoleWeightsSum(weights)) {
        const sum = Object.values(weights).reduce((acc, weight) => acc + weight, 0)
        invalidRoles.push(`${roleName} (weights sum to ${sum.toFixed(1)}%, not 100%)`)
      }
    }

    if (invalidRoles.length > 0) {
      throw new Error(`Invalid role weights: ${invalidRoles.join(', ')}`)
    }

    roleWeightsCache = result.data
    return result.data
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to load role weights configuration: ${error.message}`)
    }
    throw new Error('Failed to load role weights configuration: Unknown error')
  }
}

/**
 * Returns a list of all available roles from the role weights configuration
 * @returns Array of role names
 * @throws Error if role weights configuration is invalid
 */
export function listRoles(): string[] {
  const roleWeights = loadRoleWeights()
  return Object.keys(roleWeights.role_weights).sort()
}

/**
 * Gets the trait weights for a specific role
 * @param role - The role name to get weights for
 * @returns Object with trait weights (T1-T44)
 * @throws Error if role not found or configuration is invalid
 */
export function getRoleWeights(role: string): RoleWeights {
  const roleWeights = loadRoleWeights()
  
  if (!(role in roleWeights.role_weights)) {
    const availableRoles = Object.keys(roleWeights.role_weights).sort()
    throw new Error(`Role "${role}" not found. Available roles: ${availableRoles.join(', ')}`)
  }

  return roleWeights.role_weights[role]
}

/**
 * Gets a specific trait definition by ID
 * @param traitId - The trait ID (e.g., "T1", "T2", etc.)
 * @returns Trait definition object
 * @throws Error if trait not found or configuration is invalid
 */
export function getTrait(traitId: string): Trait {
  const traits = loadTraits()
  const trait = traits.traits.find(t => t.id === traitId)
  
  if (!trait) {
    const availableTraits = traits.traits.map(t => t.id).sort()
    throw new Error(`Trait "${traitId}" not found. Available traits: ${availableTraits.join(', ')}`)
  }

  return trait
}

/**
 * Gets all trait definitions
 * @returns Array of all trait definitions
 * @throws Error if traits configuration is invalid
 */
export function getAllTraits(): Trait[] {
  const traits = loadTraits()
  return traits.traits
}

/**
 * Validates that a role exists in the configuration
 * @param role - The role name to validate
 * @returns True if role exists, false otherwise
 */
export function isValidRole(role: string): boolean {
  try {
    const roleWeights = loadRoleWeights()
    return role in roleWeights.role_weights
  } catch {
    return false
  }
}

/**
 * Gets the total number of roles available
 * @returns Number of roles in the configuration
 * @throws Error if role weights configuration is invalid
 */
export function getRoleCount(): number {
  const roleWeights = loadRoleWeights()
  return Object.keys(roleWeights.role_weights).length
}

/**
 * Clears the configuration cache (useful for testing or hot reloading)
 */
export function clearCache(): void {
  traitsCache = null
  roleWeightsCache = null
}
