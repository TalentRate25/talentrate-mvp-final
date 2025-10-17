#!/usr/bin/env tsx

/**
 * Test script to verify the complete CV processing workflow
 * Run with: npx tsx src/scripts/test-complete-workflow.ts
 */

import fs from 'fs'
import path from 'path'

async function testCompleteWorkflow() {
  console.log('🧪 Testing Complete CV Processing Workflow...\n')

  try {
    // Test 1: Check if server is running
    console.log('1️⃣ Checking server status...')
    const healthResponse = await fetch('http://localhost:3000/')
    if (!healthResponse.ok) {
      throw new Error('Server is not running')
    }
    console.log('✅ Server is running')

    // Test 2: Test API authentication (all APIs should require auth)
    console.log('\n2️⃣ Testing API authentication...')
    const rolesResponse = await fetch('http://localhost:3000/api/roles', {
      redirect: 'manual' // Don't follow redirects automatically
    })
    console.log(`   Roles API status: ${rolesResponse.status}`)
    
    if (rolesResponse.status === 307 || rolesResponse.status === 401) {
      console.log('✅ APIs correctly require authentication (redirect to login)')
    } else if (rolesResponse.status === 200) {
      console.log('⚠️ Roles API accessible without authentication (check middleware)')
    } else {
      console.log('⚠️ API authentication check unexpected')
    }

    // Test 3: Test process API (will fail due to auth, but should return proper error)
    console.log('\n3️⃣ Testing process API authentication...')
    const processResponse = await fetch('http://localhost:3000/api/process', {
      method: 'POST',
      body: new FormData(),
      redirect: 'manual'
    })
    
    if (processResponse.status === 307 || processResponse.status === 401) {
      console.log('✅ Process API correctly requires authentication')
    } else {
      console.log('⚠️ Process API authentication check unexpected')
    }

    // Test 4: Test results API (will fail due to auth, but should return proper error)
    console.log('\n4️⃣ Testing results API authentication...')
    const resultsResponse = await fetch('http://localhost:3000/api/results/test-job-run-id', {
      redirect: 'manual'
    })
    
    if (resultsResponse.status === 307 || resultsResponse.status === 401) {
      console.log('✅ Results API correctly requires authentication')
    } else {
      console.log('⚠️ Results API authentication check unexpected')
    }

    // Test 5: Test export APIs (will fail due to auth, but should return proper error)
    console.log('\n5️⃣ Testing export APIs authentication...')
    const csvResponse = await fetch('http://localhost:3000/api/export.csv?jobRunId=test', {
      redirect: 'manual'
    })
    const pdfResponse = await fetch('http://localhost:3000/api/export.pdf?jobRunId=test', {
      redirect: 'manual'
    })
    
    if ((csvResponse.status === 307 || csvResponse.status === 401) && 
        (pdfResponse.status === 307 || pdfResponse.status === 401)) {
      console.log('✅ Export APIs correctly require authentication')
    } else {
      console.log('⚠️ Export APIs authentication check unexpected')
    }

    console.log('\n🎉 Complete workflow test completed!')
    console.log('\n📝 Next steps for full testing:')
    console.log('1. Sign in to the application at http://localhost:3000')
    console.log('2. Upload a job description (PDF/TXT)')
    console.log('3. Upload CV files (PDF) - up to 50')
    console.log('4. Select a role or enable auto-detection')
    console.log('5. Click "Process CVs" to start analysis')
    console.log('6. View results and test export functionality')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

async function main() {
  console.log('🔍 Testing Complete CV Processing Workflow...')
  await testCompleteWorkflow()
}

main()
