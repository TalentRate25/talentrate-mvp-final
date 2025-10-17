#!/usr/bin/env tsx

/**
 * Test script to verify export functionality works
 * Run with: npx tsx src/scripts/test-export.ts
 */

import fs from 'fs'
import path from 'path'

async function testExport() {
  console.log('🧪 Testing Export Functionality...\n')

  try {
    // Test CSV export
    console.log('📊 Testing CSV Export...')
    const csvResponse = await fetch('http://localhost:3000/api/export.csv?jobRunId=test-job-run-id')
    
    if (csvResponse.ok) {
      const csvContent = await csvResponse.text()
      console.log('✅ CSV Export Response:')
      console.log('Content-Type:', csvResponse.headers.get('content-type'))
      console.log('Content-Disposition:', csvResponse.headers.get('content-disposition'))
      console.log('CSV Preview (first 200 chars):')
      console.log(csvContent.substring(0, 200) + '...')
    } else {
      const error = await csvResponse.text()
      console.log('❌ CSV Export Error:', error)
    }

    console.log('\n📄 Testing PDF Export...')
    const pdfResponse = await fetch('http://localhost:3000/api/export.pdf?jobRunId=test-job-run-id')
    
    if (pdfResponse.ok) {
      const pdfBuffer = await pdfResponse.arrayBuffer()
      console.log('✅ PDF Export Response:')
      console.log('Content-Type:', pdfResponse.headers.get('content-type'))
      console.log('Content-Disposition:', pdfResponse.headers.get('content-disposition'))
      console.log('PDF Size:', pdfBuffer.byteLength, 'bytes')
      
      // Save test PDF
      const testPdfPath = path.join(process.cwd(), 'test-export.pdf')
      fs.writeFileSync(testPdfPath, Buffer.from(pdfBuffer))
      console.log(`📁 Test PDF saved to: ${testPdfPath}`)
    } else {
      const error = await pdfResponse.text()
      console.log('❌ PDF Export Error:', error)
    }

    console.log('\n🎉 Export functionality test completed!')
    console.log('\n📝 Note: These tests use mock data. For real testing:')
    console.log('1. Sign in to the application')
    console.log('2. Process some CVs via /test-process')
    console.log('3. Visit the results page and test exports')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000/api/export.csv', { method: 'HEAD' })
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
  await testExport()
}

main()
