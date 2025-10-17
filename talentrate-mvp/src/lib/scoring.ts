import OpenAI from 'openai'
import { z } from 'zod'
import { loadTraits, loadRoleWeights, getRoleWeights } from '@/lib/config'
import { extractContact } from '@/lib/parse'

// OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Zod schema for OpenAI response validation
const TraitScore = z.object({
  perTrait: z.record(
    z.string().regex(/^T\d+$/), // T1, T2, ..., T44
    z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)])
  ),
  reasons: z.array(z.string()).min(1).max(3),
  bio: z.string().min(10).max(200)
})

type TraitScore = z.infer<typeof TraitScore>

// Type for the complete scoring result
export interface ScoringResult {
  perTrait: Record<string, 1 | 2 | 3 | 4 | 5>
  score: number
  reasons: string[]
  bio: string
  contact?: {
    name?: string
    email?: string
  }
}

/**
 * Scores a candidate against the 44 universal traits for a specific role
 * @param params - Object containing job description, CV text, and role
 * @returns Promise<ScoringResult> - Complete scoring results
 */
export async function scoreCandidate({
  jdText,
  cvText,
  role
}: {
  jdText: string
  cvText: string
  role: string
}): Promise<ScoringResult> {
  try {
    // Load trait definitions and role weights
    const traits = await loadTraits()
    const roleWeights = await getRoleWeights(role)
    
    if (!roleWeights) {
      throw new Error(`Role weights not found for: ${role}`)
    }

    // Extract contact information from CV
    const contact = extractContact(cvText)

    // Build trait definitions for the prompt
    const traitDefinitions = Object.entries(traits)
      .map(([traitId, definition]) => `${traitId}: ${definition}`)
      .join('\n')

    // Build role weights for the prompt
    const roleWeightText = Object.entries(roleWeights)
      .filter(([_, weight]) => weight > 0)
      .map(([traitId, weight]) => `${traitId}: ${weight}%`)
      .join('\n')

    // Create the scoring prompt
    const prompt = `You are an expert talent evaluator using the TalentRate Universal Trait Framework™.

EVALUATION TASK:
Score this candidate's CV against 44 universal traits (1-5 scale) for the role: ${role}

TRAIT DEFINITIONS:
${traitDefinitions}

ROLE WEIGHTS (most important traits for this role):
${roleWeightText}

CANDIDATE CV:
${cvText}

JOB DESCRIPTION:
${jdText}

INSTRUCTIONS:
1. Score each trait T1-T44 from 1-5 based on evidence in the CV:
   - 1 = No Evidence
   - 2 = Minimal Evidence  
   - 3 = Moderate Evidence
   - 4 = Strong Evidence
   - 5 = Exceptional Evidence

2. Provide exactly 3 reasons focusing on the highest-weighted traits for this role

3. Write a 1-2 sentence professional bio summary (no personal/demographic content)

4. Be objective and evidence-based - only use information explicitly stated in the CV

RESPOND WITH VALID JSON ONLY:
{
  "perTrait": {
    "T1": 3,
    "T2": 4,
    ...
    "T44": 2
  },
  "reasons": [
    "Strong evidence of technical leadership (T20: 4/5)",
    "Demonstrates quantified achievements (T15: 5/5)", 
    "Shows career progression (T1: 4/5)"
  ],
  "bio": "Senior software engineer with 8+ years experience leading full-stack development teams and delivering scalable web applications."
}`

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert talent evaluator. Always respond with valid JSON matching the exact schema provided.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1, // Low temperature for consistent scoring
      max_tokens: 2000
    })

    const responseText = completion.choices[0]?.message?.content
    if (!responseText) {
      throw new Error('No response from OpenAI')
    }

    // Parse and validate the response
    let parsedResponse: TraitScore
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      
      const jsonText = jsonMatch[0]
      const parsed = JSON.parse(jsonText)
      parsedResponse = TraitScore.parse(parsed)
    } catch (error) {
      console.error('OpenAI response parsing error:', error)
      console.error('Response text:', responseText)
      throw new Error(`Failed to parse OpenAI response: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Calculate weighted score
    const score = calculateWeightedScore(parsedResponse.perTrait, roleWeights)

    return {
      perTrait: parsedResponse.perTrait,
      score: Math.round(score * 100) / 100, // Round to 2 decimal places
      reasons: parsedResponse.reasons,
      bio: parsedResponse.bio,
      contact
    }

  } catch (error) {
    console.error('Scoring error:', error)
    throw new Error(`Failed to score candidate: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Calculates the weighted score using the formula: Σ((perTrait[Tk]/5) * weight[Tk])
 * @param perTrait - Trait scores (1-5)
 * @param roleWeights - Role-specific weights (0-100)
 * @returns Weighted score (0-100)
 */
function calculateWeightedScore(
  perTrait: Record<string, 1 | 2 | 3 | 4 | 5>,
  roleWeights: Record<string, number>
): number {
  let weightedSum = 0
  let totalWeight = 0

  // Ensure we have all 44 traits
  const allTraitIds = Array.from({ length: 44 }, (_, i) => `T${i + 1}`)
  
  for (const traitId of allTraitIds) {
    const traitScore = perTrait[traitId] || 1 // Default to 1 if missing
    const weight = roleWeights[traitId] || 0
    
    // Convert trait score to 0-1 scale, then multiply by weight
    const normalizedScore = (traitScore - 1) / 4 // (1-5) -> (0-1)
    weightedSum += normalizedScore * weight
    totalWeight += weight
  }

  // Return percentage score
  return totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0
}

/**
 * Validates that a scoring result has the correct structure
 * @param result - The scoring result to validate
 * @returns boolean - True if valid
 */
export function validateScoringResult(result: ScoringResult): boolean {
  try {
    // Check perTrait has exactly 44 keys (T1-T44)
    const traitKeys = Object.keys(result.perTrait)
    if (traitKeys.length !== 44) {
      return false
    }

    // Check all trait IDs are T1-T44
    const expectedTraitIds = Array.from({ length: 44 }, (_, i) => `T${i + 1}`)
    for (const expectedId of expectedTraitIds) {
      if (!traitKeys.includes(expectedId)) {
        return false
      }
    }

    // Check trait scores are 1-5
    for (const score of Object.values(result.perTrait)) {
      if (![1, 2, 3, 4, 5].includes(score)) {
        return false
      }
    }

    // Check score is 0-100
    if (result.score < 0 || result.score > 100) {
      return false
    }

    // Check reasons array
    if (!Array.isArray(result.reasons) || result.reasons.length === 0) {
      return false
    }

    // Check bio is string and not empty
    if (typeof result.bio !== 'string' || result.bio.trim().length === 0) {
      return false
    }

    return true
  } catch {
    return false
  }
}
