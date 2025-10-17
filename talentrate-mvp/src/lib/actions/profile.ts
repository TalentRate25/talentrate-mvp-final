'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function upsertProfile(userId: string, email: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      email: email,
    })

  if (error) {
    console.error('Error upserting profile:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/')
  return { success: true }
}
