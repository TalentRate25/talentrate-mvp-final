'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DebugCreditsPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function testCredits() {
      const supabase = createClient()
      
      try {
        // Test 1: Get session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        console.log('Session test:', { session, sessionError })
        
        if (!session?.user) {
          setResult({ error: 'No session found' })
          setLoading(false)
          return
        }

        // Test 2: Direct credit query
        const { data: creditData, error: creditError } = await supabase
          .from('v_credit_balance')
          .select('balance')
          .eq('user_id', session.user.id)
          .maybeSingle()
        
        console.log('Credit query test:', { creditData, creditError })
        
        setResult({
          session: {
            user_id: session.user.id,
            email: session.user.email
          },
          credits: {
            data: creditData,
            error: creditError
          }
        })
        
      } catch (error) {
        console.error('Test error:', error)
        setResult({ error: error.message })
      }
      
      setLoading(false)
    }

    testCredits()
  }, [])

  if (loading) {
    return <div>Testing credits...</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Credit Debug Test</h1>
      
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold">Result:</h2>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
      
      <div className="mt-4">
        <a href="/" className="bg-blue-500 text-white px-4 py-2 rounded">
          Back to Home
        </a>
      </div>
    </div>
  )
}
