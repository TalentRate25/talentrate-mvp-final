import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addCreditsToUser() {
  try {
    // Get the user ID from the first argument
    const userId = process.argv[2]
    const creditsToAdd = parseInt(process.argv[3]) || 100

    if (!userId) {
      console.error('Please provide a user ID as the first argument')
      console.log('Usage: tsx add-credits-to-user.ts <user-id> [credits]')
      process.exit(1)
    }

    console.log(`Adding ${creditsToAdd} credits to user ${userId}...`)

    // Add credits to the user
    const { data, error } = await supabase
      .from('credit_ledger')
      .insert({
        user_id: userId,
        delta: creditsToAdd,
        reason: 'test_credits',
        stripe_payment_id: null
      })

    if (error) {
      console.error('Error adding credits:', error)
      process.exit(1)
    }

    console.log('Credits added successfully!')
    console.log('Data:', data)

    // Check the user's current balance
    const { data: balanceData, error: balanceError } = await supabase
      .from('v_credit_balance')
      .select('balance')
      .eq('user_id', userId)
      .single()

    if (balanceError) {
      console.error('Error fetching balance:', balanceError)
    } else {
      console.log(`User now has ${balanceData.balance} credits`)
    }

  } catch (error) {
    console.error('Unexpected error:', error)
    process.exit(1)
  }
}

addCreditsToUser()
