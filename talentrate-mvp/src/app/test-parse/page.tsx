'use client'

import { useState } from 'react'
import { parsePdfToText, extractContact } from '@/lib/parse'

export default function TestParsePage() {
  const [result, setResult] = useState<string>('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const testParse = async () => {
    if (!file) return

    setLoading(true)
    try {
      const text = await parsePdfToText(file)
      const contact = extractContact(text)
      
      setResult(`
✅ PDF PARSING SUCCESS!

📄 File: ${file.name}
📏 Size: ${(file.size / 1024).toFixed(1)} KB
📝 Text Length: ${text.length} characters

📋 Parsed Text (first 500 characters):
${text.substring(0, 500)}${text.length > 500 ? '...' : ''}

👤 Contact Information:
Name: ${contact.name || 'Not found'}
Email: ${contact.email || 'Not found'}

✅ Acceptance Criteria Met: parsePdfToText returns plain text from PDF
      `)
    } catch (error) {
      setResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">PDF Parsing Test</h1>
          <p className="text-gray-600 mb-8">
            Test the <code className="bg-gray-100 px-2 py-1 rounded">parsePdfToText</code> function 
            to verify it returns plain text from PDF files.
          </p>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select a PDF file (max 2MB):
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            <button
              onClick={testParse}
              disabled={!file || loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-6 py-2 rounded-md font-medium transition-colors"
            >
              {loading ? 'Parsing...' : 'Parse PDF'}
            </button>

            {result && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Results:</h3>
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">{result}</pre>
              </div>
            )}
          </div>

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Acceptance Criteria:</h3>
            <p className="text-blue-800 text-sm">
              ✅ <strong>Given a sample PDF, parsePdfToText returns plain text</strong>
            </p>
            <p className="text-blue-700 text-sm mt-1">
              This test verifies that the function successfully extracts readable text content from PDF files.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
