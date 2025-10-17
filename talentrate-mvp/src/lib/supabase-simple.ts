import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

// Create Supabase client for client-side usage
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Create Supabase client for server-side usage with service role key
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Helper function to get user's credit balance
export async function getUserCreditBalance(userId: string): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from('v_credit_balance')
    .select('balance')
    .eq('user_id', userId)
    .single()
  
  if (error) {
    console.error('Error getting user credit balance:', error)
    return 0
  }
  
  return data?.balance || 0
}

// Helper function to add credits to user's account
export async function addCredits(
  userId: string, 
  credits: number, 
  reason: string, 
  stripePaymentId?: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabaseAdmin
    .from('credit_ledger')
    .insert({
      user_id: userId,
      delta: credits,
      reason,
      stripe_payment_id: stripePaymentId
    })
  
  if (error) {
    console.error('Error adding credits:', error)
    return { success: false, error: error.message }
  }
  
  return { success: true }
}

// Helper function to deduct credits from user's account
export async function deductCredits(
  userId: string, 
  credits: number, 
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabaseAdmin
    .from('credit_ledger')
    .insert({
      user_id: userId,
      delta: -credits,
      reason
    })
  
  if (error) {
    console.error('Error deducting credits:', error)
    return { success: false, error: error.message }
  }
  
  return { success: true }
}

// Helper function to check if user has sufficient credits
export async function hasSufficientCredits(
  userId: string, 
  requiredCredits: number
): Promise<boolean> {
  const balance = await getUserCreditBalance(userId)
  return balance >= requiredCredits
}
