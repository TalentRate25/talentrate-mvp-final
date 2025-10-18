'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface User {
  id: string
  email: string
  credits: number
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('useUser hook is running')
    
    const supabase = createClient()
    
    // Simplified approach - just check session directly
    async function checkAuth() {
      try {
        console.log('Checking session directly...')
        const { data: { session }, error } = await supabase.auth.getSession()
        console.log('Session result:', { session, error })
        
        if (session?.user) {
          console.log('User found in session:', session.user.id)
          
          // Fetch real credits from database
          console.log('Fetching credits for user:', session.user.id)
          
          const { data: creditData, error: creditError } = await supabase
            .from('credit_ledger')
            .select('delta')
            .eq('user_id', session.user.id)
          
          console.log('Credit query result:', { creditData, creditError })
          
          if (creditError) {
            console.error('Error fetching credits:', creditError)
          }
          
          // Calculate total credits from ledger entries
          const credits = creditData?.reduce((sum, entry) => sum + entry.delta, 0) || 0
          
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            credits
          })
        } else {
          console.log('No session found')
          setUser(null)
        }
      } catch (error) {
        console.error('Error checking session:', error)
        setUser(null)
      }
      
      setLoading(false)
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id)
        
        if (session?.user) {
          console.log('Setting user from auth state change:', session.user.id)
          
          // Fetch real credits from database
          console.log('Fetching credits for user (auth state change):', session.user.id)
          
          const { data: creditData, error: creditError } = await supabase
            .from('credit_ledger')
            .select('delta')
            .eq('user_id', session.user.id)
          
          console.log('Credit query result (auth state change):', { creditData, creditError })
          
          if (creditError) {
            console.error('Error fetching credits (auth state change):', creditError)
          }
          
          // Calculate total credits from ledger entries
          const credits = creditData?.reduce((sum, entry) => sum + entry.delta, 0) || 0
          
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            credits
          })
        } else {
          console.log('Clearing user from auth state change')
          setUser(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}
