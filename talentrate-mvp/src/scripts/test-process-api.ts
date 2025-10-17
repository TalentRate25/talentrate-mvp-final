#!/usr/bin/env tsx

/**
 * Test script to verify the /api/process endpoint works end-to-end
 * Run with: npx tsx src/scripts/test-process-api.ts
 */

import fs from 'fs'
import path from 'path'

// Mock files for testing
const createMockPdf = (content: string, filename: string) => {
  // Create a simple text file that simulates a PDF
  const mockPdfPath = path.join(process.cwd(), 'test-files', filename)
  fs.mkdirSync(path.dirname(mockPdfPath), { recursive: true })
  fs.writeFileSync(mockPdfPath, content)
  return mockPdfPath
}

const createMockFiles = () => {
  const jdContent = `
    Job Description: Senior Software Engineer
    
    We are looking for a Senior Software Engineer with:
    - 5+ years of experience in React and Node.js
    - Strong leadership skills and team management experience
    - Experience with cloud platforms (AWS/Azure)
    - Excellent communication and problem-solving abilities
    - Track record of delivering scalable applications
  `

  const cv1Content = `
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

  const cv2Content = `
    Jane Doe
    Full Stack Developer
    jane.doe@example.com
    
    EXPERIENCE:
    - Full Stack Developer at WebCorp (2019-2024)
      * Developed responsive web applications using React and Node.js
      * Implemented RESTful APIs and microservices
      * Worked with PostgreSQL and MongoDB databases
      * Collaborated with UX/UI designers and product managers
    
    - Junior Developer at StartupABC (2017-2019)
      * Built frontend components using React and Redux
      * Participated in code reviews and agile ceremonies
      * Gained experience with Git version control
    
    EDUCATION:
    - Bachelor's in Software Engineering, Tech University (2017)
    
    SKILLS:
    - React, Node.js, Express.js, TypeScript
    - PostgreSQL, MongoDB, Redis
    - Docker, AWS, CI/CD
    - Git, Jira, Agile methodologies
  `

  return {
    jdPath: createMockPdf(jdContent, 'job-description.pdf'),
    cv1Path: createMockPdf(cv1Content, 'cv-john-smith.pdf'),
    cv2Path: createMockPdf(cv2Content, 'cv-jane-doe.pdf')
  }
}

async function testProcessAPI() {
  console.log('🧪 Testing /api/process endpoint...\n')

  try {
    // Create mock files
    console.log('📁 Creating mock files...')
    const { jdPath, cv1Path, cv2Path } = createMockFiles()
    console.log('✅ Mock files created')

    // Create form data
    const formData = new FormData()
    formData.append('role', 'SOFTWARE ENGINEER (FULL STACK)')
    formData.append('jd', new Blob([fs.readFileSync(jdPath)], { type: 'application/pdf' }), 'job-description.pdf')
    formData.append('cvs', new Blob([fs.readFileSync(cv1Path)], { type: 'application/pdf' }), 'cv-john-smith.pdf')
    formData.append('cvs', new Blob([fs.readFileSync(cv2Path)], { type: 'application/pdf' }), 'cv-jane-doe.pdf')

    console.log('📤 Sending request to /api/process...')
    
    // Make request to the API
    const response = await fetch('http://localhost:3000/api/process', {
      method: 'POST',
      body: formData
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('❌ API Error:', result)
      return
    }

    console.log('\n✅ Process API Response:')
    console.log('========================')
    console.log(`Job Run ID: ${result.jobRunId}`)
    console.log(`Candidates Processed: ${result.candidatesProcessed}`)
    console.log(`Credits Used: ${result.creditsUsed}`)
    console.log(`Remaining Credits: ${result.remainingCredits}`)

    console.log('\n🎉 Process API test completed successfully!')

  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    // Clean up test files
    try {
      const testDir = path.join(process.cwd(), 'test-files')
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true })
        console.log('🧹 Cleaned up test files')
      }
    } catch (cleanupError) {
      console.warn('⚠️ Failed to clean up test files:', cleanupError)
    }
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000/api/process', { method: 'HEAD' })
    return response.status !== 404
  } catch {
    return false
  }
}

async function main() {
  console.log('🔍 Checking if server is running...')
  const serverRunning = await checkServer()
  
  if (!serverRunning) {
    console.log('❌ Server is not running. Please start the development server first:')
    console.log('   npm run dev')
    console.log('\nThen run this test again.')
    return
  }

  console.log('✅ Server is running')
  await testProcessAPI()
}

main()
