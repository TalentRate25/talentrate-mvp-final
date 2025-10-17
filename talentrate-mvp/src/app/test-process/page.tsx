'use client'

import { useState } from 'react'
import { useUser } from '@/lib/hooks/use-user'

export default function TestProcessPage() {
  const [role, setRole] = useState('SOFTWARE ENGINEER (FULL STACK)')
  const [jdFile, setJdFile] = useState<File | null>(null)
  const [cvFiles, setCvFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const { user, loading: userLoading } = useUser()

  const handleJdFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setJdFile(file)
    }
  }

  const handleCvFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setCvFiles(files)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!jdFile || cvFiles.length === 0) {
      setError('Please select both job description and CV files')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('role', role)
      formData.append('jd', jdFile)
      cvFiles.forEach(cv => {
        formData.append('cvs', cv)
      })

      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process files')
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-4">Please sign in to test the process API</p>
          <a href="/login" className="text-blue-600 hover:text-blue-500">
            Sign In
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Test Process API</h1>
        
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Process CVs</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="SOFTWARE ENGINEER (FULL STACK)">Software Engineer (Full Stack)</option>
                <option value="SENIOR SOFTWARE ENGINEER / TECH LEAD">Senior Software Engineer / Tech Lead</option>
                <option value="FRONTEND DEVELOPER">Frontend Developer</option>
                <option value="BACKEND DEVELOPER">Backend Developer</option>
                <option value="DEVOPS ENGINEER">DevOps Engineer</option>
              </select>
            </div>

            <div>
              <label htmlFor="jd" className="block text-sm font-medium text-gray-700 mb-2">
                Job Description (PDF)
              </label>
              <input
                id="jd"
                type="file"
                accept=".pdf"
                onChange={handleJdFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="cvs" className="block text-sm font-medium text-gray-700 mb-2">
                CVs (PDF) - Select multiple files
              </label>
              <input
                id="cvs"
                type="file"
                accept=".pdf"
                multiple
                onChange={handleCvFilesChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Selected: {cvFiles.length} file(s)
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !jdFile || cvFiles.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              {loading ? 'Processing...' : 'Process CVs'}
            </button>
          </form>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Success!</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p><strong>Job Run ID:</strong> {result.jobRunId}</p>
                  <p><strong>Candidates Processed:</strong> {result.candidatesProcessed}</p>
                  <p><strong>Credits Used:</strong> {result.creditsUsed}</p>
                  <p><strong>Remaining Credits:</strong> {result.remainingCredits}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Acceptance Criteria</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>✅ Auth & credit balance check</li>
            <li>✅ Validate role ∈ listRoles()</li>
            <li>✅ Parse JD + CVs (no storage)</li>
            <li>✅ For each CV → scoreCandidate()</li>
            <li>✅ Transaction: insert job_run, candidates, credit_ledger</li>
            <li>✅ Return {`{ jobRunId }`}</li>
            <li>✅ Works end-to-end and decrements credits</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
