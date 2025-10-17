#!/usr/bin/env tsx

/**
 * Script to add test credits to a user
 * Run with: npx tsx src/scripts/add-test-credits.ts
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function addTestCredits() {
  console.log('🪙 Adding test credits...\n')

  try {
    // Get all users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('Error fetching users:', usersError)
      return
    }

    if (!users || users.users.length === 0) {
      console.log('No users found. Please sign up first.')
      return
    }

    const user = users.users[0] // Get the first user
    console.log(`Adding credits for user: ${user.email} (${user.id})`)

    // Add 100 test credits
    const { error: creditError } = await supabase
      .from('credit_ledger')
      .insert({
        user_id: user.id,
        delta: 100,
        reason: 'test_credits',
        stripe_payment_id: null
      })

    if (creditError) {
      console.error('Error adding credits:', creditError)
      return
    }

    console.log('✅ Successfully added 100 test credits!')
    
    // Verify the balance
    const { data: balanceData, error: balanceError } = await supabase
      .from('v_credit_balance')
      .select('balance')
      .eq('user_id', user.id)
      .single()

    if (balanceError) {
      console.error('Error fetching balance:', balanceError)
      return
    }

    console.log(`💰 Current balance: ${balanceData.balance} credits`)

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

addTestCredits()
