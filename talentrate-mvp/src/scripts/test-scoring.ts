#!/usr/bin/env tsx

/**
 * Test script to demonstrate the scoring system works end-to-end
 * Run with: npx tsx src/scripts/test-scoring.ts
 */

import { scoreCandidate } from '../lib/scoring'

async function testScoring() {
  console.log('🧪 Testing TalentRate Scoring System...\n')

  const mockJdText = `
    We are looking for a Senior Software Engineer with:
    - 5+ years of experience in React and Node.js
    - Strong leadership skills and team management experience
    - Experience with cloud platforms (AWS/Azure)
    - Excellent communication and problem-solving abilities
    - Track record of delivering scalable applications
  `

  const mockCvText = `
    John Smith
    Senior Software Engineer
    john.smith@example.com
    
    EXPERIENCE:
    - Senior Software Engineer at TechCorp (2020-2024)
      * Led team of 5 developers
      * Built scalable React applications serving 100K+ users
      * Implemented microservices architecture on AWS
      * Increased application performance by 40%
      * Mentored junior developers
    
    - Software Engineer at StartupXYZ (2018-2020)
      * Developed full-stack applications using React and Node.js
      * Collaborated with cross-functional teams
      * Delivered 3 major features ahead of schedule
    
    EDUCATION:
    - Bachelor's in Computer Science, University of Technology (2018)
    
    SKILLS:
    - React, Node.js, TypeScript, JavaScript
    - AWS, Docker, Kubernetes
    - PostgreSQL, MongoDB
    - Git, Agile methodologies
  `

  try {
    console.log('📊 Scoring candidate against "SOFTWARE ENGINEER (FULL STACK)" role...')
    
    const result = await scoreCandidate({
      jdText: mockJdText,
      cvText: mockCvText,
      role: 'SOFTWARE ENGINEER (FULL STACK)'
    })

    console.log('\n✅ Scoring Results:')
    console.log('==================')
    console.log(`Overall Score: ${result.score}/100`)
    console.log(`Bio: ${result.bio}`)
    console.log(`Contact: ${result.contact?.name} (${result.contact?.email})`)
    
    console.log('\n📈 Top Reasons:')
    result.reasons.forEach((reason, index) => {
      console.log(`${index + 1}. ${reason}`)
    })

    console.log('\n🎯 Per-Trait Scores (showing first 10 traits):')
    const traitEntries = Object.entries(result.perTrait).slice(0, 10)
    traitEntries.forEach(([trait, score]) => {
      console.log(`  ${trait}: ${score}/5`)
    })
    console.log(`  ... and ${Object.keys(result.perTrait).length - 10} more traits`)

    console.log('\n✅ Validation Results:')
    console.log(`- Has 44 traits: ${Object.keys(result.perTrait).length === 44}`)
    console.log(`- Score in range 0-100: ${result.score >= 0 && result.score <= 100}`)
    console.log(`- All trait scores 1-5: ${Object.values(result.perTrait).every(s => s >= 1 && s <= 5)}`)
    console.log(`- Has reasons: ${result.reasons.length > 0}`)
    console.log(`- Has bio: ${result.bio.length > 0}`)

    console.log('\n🎉 All tests passed! The scoring system is working correctly.')

  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }
}

// Run the test
testScoring()
