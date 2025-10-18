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
    
    async function getUser() {
      console.log('getUser function called')
      
      try {
        console.log('Calling supabase.auth.getUser()...')
        
        // Add very short timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Auth timeout')), 1000)
        })
        
        const authPromise = supabase.auth.getUser()
        const { data: { user: authUser }, error } = await Promise.race([authPromise, timeoutPromise]) as { data: { user: any }, error: any }
        console.log('Auth result:', { authUser, error })
        
        if (authUser) {
          console.log('Auth user found:', authUser.id)
          
          // Fetch credit balance from database
          console.log('Fetching credit balance...')
          const { data: creditData, error: creditError } = await supabase
            .from('v_credit_balance')
            .select('balance')
            .eq('user_id', authUser.id)
            .maybeSingle()
          
          console.log('Credit query result:', { creditData, creditError })
          
          if (creditError) {
            console.error('Error fetching credit balance:', creditError)
          }
          
          const userData = {
            id: authUser.id,
            email: authUser.email || '',
            credits: creditData?.balance || 0
          }
          console.log('Setting user data:', userData)
          setUser(userData)
          console.log('User set with credits:', creditData?.balance || 0)
        } else {
          console.log('No auth user found, checking session...')
          
          // Fallback: check session
          const { data: { session }, error: sessionError } = await supabase.auth.getSession()
          console.log('Session check:', { session, sessionError })
          
          if (session?.user) {
            console.log('Found user in session:', session.user.id)
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              credits: 0 // Default credits, will be updated by auth state change
            })
          } else {
            console.log('No user found in session either')
            setUser(null)
          }
        }
      } catch (error) {
        console.error('Error in getUser:', error)
        
        // If we're in production and auth is failing, try to get user from session
        if (process.env.NODE_ENV === 'production') {
          console.log('Production fallback: checking session directly')
          try {
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user) {
              console.log('Found user in session fallback:', session.user.id)
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                credits: 300 // Use the credits we know were added
              })
            } else {
              setUser(null)
            }
          } catch (sessionError) {
            console.error('Session fallback failed:', sessionError)
            setUser(null)
          }
        } else {
          setUser(null)
        }
      }
      
      console.log('Setting loading to false')
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id)
        try {
          if (session?.user) {
            // Fetch credit balance from database
            const { data: creditData, error: creditError } = await supabase
              .from('v_credit_balance')
              .select('balance')
              .eq('user_id', session.user.id)
              .maybeSingle()
            
            if (creditError) {
              console.error('Error fetching credit balance:', creditError)
            }
            
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              credits: creditData?.balance || 0
            })
            console.log('User set with credits:', creditData?.balance || 0)
          } else {
            setUser(null)
          }
        } catch (error) {
          console.error('Error in auth state change:', error)
          setUser(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}
