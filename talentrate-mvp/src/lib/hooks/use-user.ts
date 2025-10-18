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
        const { data: { user: authUser }, error } = await supabase.auth.getUser()
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
          console.log('No auth user found')
          setUser(null)
        }
      } catch (error) {
        console.error('Error in getUser:', error)
        setUser(null)
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
