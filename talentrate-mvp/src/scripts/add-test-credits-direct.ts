import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addTestCredits() {
  try {
    // Get all users from auth.users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('Error fetching users:', usersError)
      return
    }

    console.log('Found users:', users.users.length)
    
    if (users.users.length === 0) {
      console.log('No users found. Please sign up first.')
      return
    }

    // Get the most recent user
    const latestUser = users.users[0]
    console.log('Adding credits to user:', latestUser.id, latestUser.email)

    // Add 100 test credits
    const { data, error } = await supabase
      .from('credit_ledger')
      .insert({
        user_id: latestUser.id,
        delta: 100,
        reason: 'test_credits',
        stripe_payment_id: null
      })

    if (error) {
      console.error('Error adding credits:', error)
      return
    }

    console.log('✅ Added 100 test credits successfully!')
    console.log('User can now test the application.')

    // Check the user's current balance
    const { data: balanceData, error: balanceError } = await supabase
      .from('v_credit_balance')
      .select('balance')
      .eq('user_id', latestUser.id)
      .single()

    if (balanceError) {
      console.error('Error fetching balance:', balanceError)
    } else {
      console.log(`User now has ${balanceData.balance} credits`)
    }

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

addTestCredits()
