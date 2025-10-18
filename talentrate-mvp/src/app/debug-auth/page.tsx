'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DebugAuthPage() {
  const [authState, setAuthState] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    
    async function checkAuth() {
      try {
        // Check auth state
        const { data: { user }, error } = await supabase.auth.getUser()
        console.log('Debug - Auth user:', user)
        console.log('Debug - Auth error:', error)
        
        // Check session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        console.log('Debug - Session:', session)
        console.log('Debug - Session error:', sessionError)
        
        setAuthState({
          user,
          session,
          error,
          sessionError
        })
      } catch (err) {
        console.error('Debug - Error:', err)
        setAuthState({ error: err })
      }
      setLoading(false)
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Debug - Auth state change:', event, session)
        setAuthState(prev => ({
          ...prev,
          event,
          session,
          timestamp: new Date().toISOString()
        }))
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return <div>Loading auth debug info...</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Auth Debug Info</h1>
      
      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold">User:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(authState?.user, null, 2)}
          </pre>
        </div>
        
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold">Session:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(authState?.session, null, 2)}
          </pre>
        </div>
        
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold">Errors:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify({
              authError: authState?.error,
              sessionError: authState?.sessionError
            }, null, 2)}
          </pre>
        </div>
        
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold">Last Auth Event:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify({
              event: authState?.event,
              timestamp: authState?.timestamp
            }, null, 2)}
          </pre>
        </div>
      </div>
      
      <div className="mt-8">
        <a 
          href="/" 
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Go to Home
        </a>
      </div>
    </div>
  )
}
