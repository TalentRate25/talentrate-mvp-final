import { scoreCandidate, validateScoringResult } from '../scoring'

// Mock the config module
jest.mock('../config', () => ({
  loadTraits: jest.fn().mockResolvedValue({
    T1: 'Career progression velocity - Rate of advancement and promotions',
    T2: 'Tenure stability pattern - Balance between job stability and mobility',
    T3: 'Role complexity evolution - Trajectory of increasing responsibility',
    T4: 'Industry depth vs breadth - Pattern of specialization vs cross-sector experience',
    T5: 'Seniority alignment - Current career level relative to years of experience',
    T6: 'Qualification level - Highest level of formal education attained',
    T7: 'Institutional caliber - Reputation and relevance of educational institutions',
    T8: 'Field-of-study relevance - Alignment between academic background and career path',
    T9: 'Continuous learning evidence - Recent professional development and ongoing education',
    T10: 'Technical skill breadth - Range and variety of technical tools/technologies known',
    T11: 'Technical skill depth - Evidence of mastery level in technical competencies',
    T12: 'Technology currency - Recency and modernity of technology stack',
    T13: 'Tool proficiency density - Number of demonstrated competencies per career year',
    T14: 'Cross-domain technical ability - Technical proficiency across multiple domains',
    T15: 'Quantified accomplishment density - Frequency of metrics and numbers used to describe achievements',
    T16: 'Project scale indicators - Evidence of large-scale project involvement',
    T17: 'Business impact evidence - Direct contributions to business outcomes',
    T18: 'Awards & recognition - Formal acknowledgments and honors received',
    T19: 'Publication/patent record - Thought leadership through publications or patents',
    T20: 'People management evidence - Experience managing, supervising, or leading people',
    T21: 'Strategic influence indicators - Involvement in strategic planning and decision-making',
    T22: 'Cross-functional coordination - Experience working across departments and functions',
    T23: 'Mentorship & development - Experience developing others through mentoring/coaching',
    T24: 'Written communication quality - Quality of writing evident in CV itself',
    T25: 'Language mastery - Number and proficiency level of languages spoken',
    T26: 'Professional presentation - Quality of CV formatting and organization',
    T27: 'Articulation precision - Clarity and specificity in describing roles and achievements',
    T28: 'Role diversity index - Variety in types of positions held throughout career',
    T29: 'Industry transition ability - Success in navigating changes between industry sectors',
    T30: 'Skill acquisition rate - Pace of learning new competencies over time',
    T31: 'Geographic/cultural mobility - Experience working in different locations or cultures',
    T32: 'Technology adoption speed - Pace of adopting emerging tools and technologies',
    T33: 'Innovation indicators - Evidence of creating new solutions or approaches',
    T34: 'Process improvement evidence - Track record of optimizing and enhancing systems',
    T35: 'Initiative demonstration - Evidence of self-started projects and proactive work',
    T36: 'Complex problem context - Difficulty level of challenges and problems addressed',
    T37: 'Achievement density - Number of accomplishments relative to time in role',
    T38: 'Extra-curricular engagement - Professional engagement beyond primary role',
    T39: 'Certification pursuit - Professional development commitment through certifications',
    T40: 'Tenure productivity - Output and impact achieved within each role period',
    T41: 'Team collaboration frequency - Frequency of collaborative work mentions',
    T42: 'Stakeholder management evidence - Experience managing relationships with diverse stakeholders',
    T43: 'Cross-cultural experience - Exposure to and work with international or diverse teams',
    T44: 'Soft skill demonstration - Evidence of interpersonal and emotional intelligence skills'
  }),
  loadRoleWeights: jest.fn().mockResolvedValue({}),
  getRoleWeights: jest.fn().mockResolvedValue({
    T1: 2.5, T2: 2.0, T3: 3.0, T4: 1.5, T5: 2.0, T6: 1.5, T7: 1.0, T8: 2.0, T9: 2.5, T10: 3.5,
    T11: 4.0, T12: 3.0, T13: 2.5, T14: 3.0, T15: 3.5, T16: 2.5, T17: 3.0, T18: 1.5, T19: 1.0, T20: 2.0,
    T21: 1.5, T22: 2.0, T23: 1.5, T24: 2.0, T25: 1.0, T26: 1.5, T27: 2.0, T28: 1.5, T29: 1.0, T30: 2.5,
    T31: 1.0, T32: 2.5, T33: 2.0, T34: 2.5, T35: 2.0, T36: 2.0, T37: 2.5, T38: 1.0, T39: 1.5, T40: 2.0,
    T41: 2.0, T42: 1.5, T43: 1.0, T44: 1.5
  })
}))

// Mock the parse module
jest.mock('../parse', () => ({
  extractContact: jest.fn().mockReturnValue({
    name: 'John Doe',
    email: 'john.doe@example.com'
  })
}))

// Mock OpenAI
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: JSON.stringify({
                  perTrait: Object.fromEntries(
                    Array.from({ length: 44 }, (_, i) => [`T${i + 1}`, Math.floor(Math.random() * 5) + 1])
                  ),
                  reasons: [
                    'Strong technical skills demonstrated',
                    'Good career progression shown',
                    'Relevant experience in the field'
                  ],
                  bio: 'Experienced software engineer with strong technical background and proven track record.'
                })
              }
            }]
          })
        }
      }
    }))
  }
})

describe('Scoring System', () => {
  const mockJdText = 'We are looking for a senior software engineer with 5+ years experience in React and Node.js.'
  const mockCvText = 'John Doe\nSoftware Engineer\n5 years experience with React, Node.js, and TypeScript\nLed team of 3 developers\nIncreased performance by 40%'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('scoreCandidate returns valid structure with 44 traits', async () => {
    const result = await scoreCandidate({
      jdText: mockJdText,
      cvText: mockCvText,
      role: 'Software Engineer'
    })

    // Check perTrait has exactly 44 keys (T1-T44)
    expect(Object.keys(result.perTrait)).toHaveLength(44)
    
    // Check all trait IDs are T1-T44
    const expectedTraitIds = Array.from({ length: 44 }, (_, i) => `T${i + 1}`)
    expect(Object.keys(result.perTrait)).toEqual(expect.arrayContaining(expectedTraitIds))

    // Check trait scores are 1-5
    Object.values(result.perTrait).forEach(score => {
      expect([1, 2, 3, 4, 5]).toContain(score)
    })

    // Check score is 0-100
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)

    // Check reasons array
    expect(Array.isArray(result.reasons)).toBe(true)
    expect(result.reasons.length).toBeGreaterThan(0)

    // Check bio is string and not empty
    expect(typeof result.bio).toBe('string')
    expect(result.bio.trim().length).toBeGreaterThan(0)

    // Check contact info
    expect(result.contact).toBeDefined()
    expect(result.contact?.name).toBe('John Doe')
    expect(result.contact?.email).toBe('john.doe@example.com')
  })

  test('validateScoringResult correctly validates valid result', () => {
    const validResult = {
      perTrait: Object.fromEntries(
        Array.from({ length: 44 }, (_, i) => [`T${i + 1}`, 3])
      ),
      score: 75.5,
      reasons: ['Good technical skills', 'Strong experience'],
      bio: 'Experienced professional with strong background'
    }

    expect(validateScoringResult(validResult)).toBe(true)
  })

  test('validateScoringResult correctly rejects invalid results', () => {
    // Missing traits
    const invalidResult1 = {
      perTrait: { T1: 3, T2: 4 }, // Only 2 traits instead of 44
      score: 75.5,
      reasons: ['Good technical skills'],
      bio: 'Experienced professional'
    }
    expect(validateScoringResult(invalidResult1)).toBe(false)

    // Invalid trait scores
    const invalidResult2 = {
      perTrait: Object.fromEntries(
        Array.from({ length: 44 }, (_, i) => [`T${i + 1}`, 6]) // Invalid score 6
      ),
      score: 75.5,
      reasons: ['Good technical skills'],
      bio: 'Experienced professional'
    }
    expect(validateScoringResult(invalidResult2)).toBe(false)

    // Invalid score range
    const invalidResult3 = {
      perTrait: Object.fromEntries(
        Array.from({ length: 44 }, (_, i) => [`T${i + 1}`, 3])
      ),
      score: 150, // Invalid score > 100
      reasons: ['Good technical skills'],
      bio: 'Experienced professional'
    }
    expect(validateScoringResult(invalidResult3)).toBe(false)

    // Empty reasons
    const invalidResult4 = {
      perTrait: Object.fromEntries(
        Array.from({ length: 44 }, (_, i) => [`T${i + 1}`, 3])
      ),
      score: 75.5,
      reasons: [], // Empty reasons
      bio: 'Experienced professional'
    }
    expect(validateScoringResult(invalidResult4)).toBe(false)

    // Empty bio
    const invalidResult5 = {
      perTrait: Object.fromEntries(
        Array.from({ length: 44 }, (_, i) => [`T${i + 1}`, 3])
      ),
      score: 75.5,
      reasons: ['Good technical skills'],
      bio: '' // Empty bio
    }
    expect(validateScoringResult(invalidResult5)).toBe(false)
  })

  test('scoreCandidate handles OpenAI errors gracefully', async () => {
    // We need to re-import the module to get the new mock
    jest.resetModules()
    
    // Mock OpenAI to throw an error
    jest.doMock('openai', () => {
      return {
        __esModule: true,
        default: jest.fn().mockImplementation(() => ({
          chat: {
            completions: {
              create: jest.fn().mockRejectedValue(new Error('OpenAI API error'))
            }
          }
        }))
      }
    })

    // Re-import scoreCandidate with the new mock
    const { scoreCandidate: scoreCandidateWithError } = await import('../scoring')

    await expect(scoreCandidateWithError({
      jdText: mockJdText,
      cvText: mockCvText,
      role: 'Software Engineer'
    })).rejects.toThrow('Failed to score candidate')
  })

  test('scoreCandidate handles invalid role gracefully', async () => {
    // Reset modules to clear previous mocks
    jest.resetModules()
    
    // Mock config module to return null for role weights
    jest.doMock('../config', () => ({
      loadTraits: jest.fn().mockResolvedValue({}),
      loadRoleWeights: jest.fn().mockResolvedValue({}),
      getRoleWeights: jest.fn().mockResolvedValue(null)
    }))

    // Re-import scoreCandidate with the new mock
    const { scoreCandidate: scoreCandidateWithInvalidRole } = await import('../scoring')

    await expect(scoreCandidateWithInvalidRole({
      jdText: mockJdText,
      cvText: mockCvText,
      role: 'Invalid Role'
    })).rejects.toThrow('Role weights not found for: Invalid Role')
  })
})
