#!/usr/bin/env node

import { readFileSync } from 'fs'
import { join } from 'path'
import { TraitsConfigSchema, RoleWeightsConfigSchema, validateRoleWeightsSum } from '../config/schemas'

function validateConfig() {
  console.log('🔍 Validating TalentRate configuration files...\n')

  let hasErrors = false

  // Validate traits.json
  try {
    console.log('📋 Validating traits.json...')
    const traitsPath = join(__dirname, '../config/traits.json')
    const traitsData = JSON.parse(readFileSync(traitsPath, 'utf-8'))
    
    const traitsResult = TraitsConfigSchema.safeParse(traitsData)
    
    if (traitsResult.success) {
      console.log('✅ traits.json is valid')
      console.log(`   - Found ${traitsResult.data.traits.length} traits`)
      
      // Validate trait IDs are T1-T44
      const traitIds = traitsResult.data.traits.map(t => t.id)
      const expectedIds = Array.from({ length: 44 }, (_, i) => `T${i + 1}`)
      const missingIds = expectedIds.filter(id => !traitIds.includes(id))
      const extraIds = traitIds.filter(id => !expectedIds.includes(id))
      
      if (missingIds.length > 0) {
        console.log(`❌ Missing trait IDs: ${missingIds.join(', ')}`)
        hasErrors = true
      }
      
      if (extraIds.length > 0) {
        console.log(`❌ Extra trait IDs: ${extraIds.join(', ')}`)
        hasErrors = true
      }
      
      if (missingIds.length === 0 && extraIds.length === 0) {
        console.log('✅ All trait IDs are present (T1-T44)')
      }
    } else {
      console.log('❌ traits.json validation failed:')
      traitsResult.error.issues.forEach(error => {
        console.log(`   - ${error.path.join('.')}: ${error.message}`)
      })
      hasErrors = true
    }
  } catch (error) {
    console.log(`❌ Error reading traits.json: ${error}`)
    hasErrors = true
  }

  console.log()

  // Validate role_weights.json
  try {
    console.log('⚖️  Validating role_weights.json...')
    const roleWeightsPath = join(__dirname, '../config/role_weights.json')
    const roleWeightsData = JSON.parse(readFileSync(roleWeightsPath, 'utf-8'))
    
    const roleWeightsResult = RoleWeightsConfigSchema.safeParse(roleWeightsData)
    
    if (roleWeightsResult.success) {
      console.log('✅ role_weights.json is valid')
      console.log(`   - Found ${Object.keys(roleWeightsResult.data.role_weights).length} roles`)
      
      // Validate each role's weights sum to 100%
      let rolesWithInvalidSums = 0
      for (const [roleName, weights] of Object.entries(roleWeightsResult.data.role_weights)) {
        if (!validateRoleWeightsSum(weights)) {
          const sum = Object.values(weights).reduce((acc, weight) => acc + weight, 0)
          console.log(`❌ ${roleName}: weights sum to ${sum.toFixed(1)}%, not 100%`)
          rolesWithInvalidSums++
        }
      }
      
      if (rolesWithInvalidSums === 0) {
        console.log('✅ All role weights sum to 100% (±0.1%)')
      } else {
        console.log(`❌ ${rolesWithInvalidSums} roles have invalid weight sums`)
        hasErrors = true
      }
      
      // Validate all roles have T1-T44 weights
      const expectedTraitIds = Array.from({ length: 44 }, (_, i) => `T${i + 1}`)
      let rolesWithMissingTraits = 0
      
      for (const [roleName, weights] of Object.entries(roleWeightsResult.data.role_weights)) {
        const weightKeys = Object.keys(weights)
        const missingTraits = expectedTraitIds.filter(id => !weightKeys.includes(id))
        
        if (missingTraits.length > 0) {
          console.log(`❌ ${roleName}: missing traits ${missingTraits.join(', ')}`)
          rolesWithMissingTraits++
        }
      }
      
      if (rolesWithMissingTraits === 0) {
        console.log('✅ All roles have weights for T1-T44')
      } else {
        console.log(`❌ ${rolesWithMissingTraits} roles are missing trait weights`)
        hasErrors = true
      }
    } else {
      console.log('❌ role_weights.json validation failed:')
      roleWeightsResult.error.issues.forEach(error => {
        console.log(`   - ${error.path.join('.')}: ${error.message}`)
      })
      hasErrors = true
    }
  } catch (error) {
    console.log(`❌ Error reading role_weights.json: ${error}`)
    hasErrors = true
  }

  console.log()

  if (hasErrors) {
    console.log('❌ Config validation failed. Please fix the errors above.')
    process.exit(1)
  } else {
    console.log('✅ Config OK')
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  validateConfig()
}

export { validateConfig }
