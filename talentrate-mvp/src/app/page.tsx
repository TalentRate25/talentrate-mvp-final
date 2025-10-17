'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/hooks/use-user'
import Link from 'next/link'

interface Role {
  name: string
  value: string
}

export default function HomePage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [selectedRole, setSelectedRole] = useState('')
  const [autoDetectRole, setAutoDetectRole] = useState(false)
  const [jdFile, setJdFile] = useState<File | null>(null)
  const [cvFiles, setCvFiles] = useState<File[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { user, loading } = useUser()

  // Load roles on component mount
  useEffect(() => {
    if (user) {
      loadRoles()
    }
  }, [user])

  const loadRoles = async () => {
    try {
      const response = await fetch('/api/roles')
      if (response.ok) {
        const rolesData = await response.json()
        setRoles(rolesData.roles)
        if (rolesData.roles.length > 0) {
          setSelectedRole(rolesData.roles[0].value)
        }
      }
    } catch (error) {
      console.error('Failed to load roles:', error)
    }
  }

  const handleJdFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setJdFile(file)
    }
  }

  const handleCvFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 50) {
      setError('Maximum 50 CVs allowed per run')
      return
    }
    setCvFiles(files)
    setError(null)
  }

  const handleAutoDetectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAutoDetectRole(e.target.checked)
    if (e.target.checked) {
      setSelectedRole('') // Clear selected role when auto-detect is enabled
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!jdFile || cvFiles.length === 0) {
      setError('Please select both job description and CV files')
      return
    }

    if (!autoDetectRole && !selectedRole) {
      setError('Please select a role or enable auto-detection')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('role', autoDetectRole ? 'AUTO_DETECT' : selectedRole)
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

      // Redirect to results page
      router.push(`/results/${data.jobRunId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsProcessing(false)
    }
  }

  console.log('Page render - loading:', loading, 'user:', user)

  if (loading) {
    console.log('Showing loading screen')
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
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
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to TalentRate
            </h1>
            <p className="text-gray-600">
              Sign in to start analyzing talent with AI-powered insights
            </p>
          </div>

          <div className="mt-8 space-y-4">
            <Link
              href="/login"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign In / Sign Up
            </Link>
            
            <div className="text-center">
              <p className="text-sm text-gray-500">
                Get started with magic link authentication
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Need help? Check out our{' '}
              <a href="#" className="text-blue-600 hover:text-blue-500">
                documentation
              </a>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Analyze Talent with AI
          </h1>
          <p className="text-gray-600">
            Upload job descriptions and CVs to get AI-powered talent rankings
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                Job Role
              </label>
              <div className="space-y-3">
                <select
                  id="role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  disabled={autoDetectRole}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.name}
                    </option>
                  ))}
                </select>
                
                <div className="flex items-center">
                  <input
                    id="auto-detect"
                    type="checkbox"
                    checked={autoDetectRole}
                    onChange={handleAutoDetectChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="auto-detect" className="ml-2 block text-sm text-gray-700">
                    Auto-detect role from job description
                  </label>
                </div>
              </div>
            </div>

            {/* Job Description Upload */}
            <div>
              <label htmlFor="jd" className="block text-sm font-medium text-gray-700 mb-2">
                Job Description (PDF/TXT)
              </label>
              <input
                id="jd"
                type="file"
                accept=".pdf,.txt"
                onChange={handleJdFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {jdFile && (
                <p className="mt-1 text-sm text-gray-500">
                  Selected: {jdFile.name} ({(jdFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            {/* CV Upload */}
            <div>
              <label htmlFor="cvs" className="block text-sm font-medium text-gray-700 mb-2">
                CVs (PDF) - Up to 50 files
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
              {cvFiles.length > 0 && (
                <p className="mt-1 text-sm text-gray-500">
                  Selected: {cvFiles.length} file(s)
                  {cvFiles.length > 10 && (
                    <span className="text-blue-600"> - Showing first 10: {cvFiles.slice(0, 10).map(f => f.name).join(', ')}</span>
                  )}
                </p>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
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

            {/* Process Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isProcessing || !jdFile || cvFiles.length === 0 || (!autoDetectRole && !selectedRole)}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-3 rounded-md font-medium transition-colors flex items-center justify-center"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing CVs...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Process CVs ({cvFiles.length} files)
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Need help? Check out our{' '}
            <a href="#" className="text-blue-600 hover:text-blue-500">
              documentation
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}