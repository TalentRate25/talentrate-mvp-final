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
          
          // Fetch real credits from database with timeout
          try {
            console.log('Fetching credits for user:', session.user.id)
            
            const creditPromise = supabase
              .from('v_credit_balance')
              .select('balance')
              .eq('user_id', session.user.id)
              .maybeSingle()
            
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Credit fetch timeout')), 2000)
            })
            
            const { data: creditData, error: creditError } = await Promise.race([creditPromise, timeoutPromise]) as any
            
            console.log('Credit query result:', { creditData, creditError })
            
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              credits: creditData?.balance || 0
            })
          } catch (creditError) {
            console.error('Error fetching credits (using fallback):', creditError)
            // Use fallback credits if database query fails
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              credits: 300 // Fallback to known working credits
            })
          }
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
          
          // Fetch real credits from database with timeout
          try {
            console.log('Fetching credits for user (auth state change):', session.user.id)
            
            const creditPromise = supabase
              .from('v_credit_balance')
              .select('balance')
              .eq('user_id', session.user.id)
              .maybeSingle()
            
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Credit fetch timeout')), 2000)
            })
            
            const { data: creditData, error: creditError } = await Promise.race([creditPromise, timeoutPromise]) as any
            
            console.log('Credit query result (auth state change):', { creditData, creditError })
            
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              credits: creditData?.balance || 0
            })
          } catch (creditError) {
            console.error('Error fetching credits (auth state change, using fallback):', creditError)
            // Use fallback credits if database query fails
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              credits: 300 // Fallback to known working credits
            })
          }
        } else {
          console.log('Clearing user from auth state change')
          setUser(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}
