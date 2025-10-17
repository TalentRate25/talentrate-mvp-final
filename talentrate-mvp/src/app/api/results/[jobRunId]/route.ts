import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobRunId: string }> }
) {
  try {
    const { jobRunId } = await params
    
    // Auth check
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch job run details
    const { data: jobRun, error: jobRunError } = await supabase
      .from('job_runs')
      .select('id, role, jd_text, created_at')
      .eq('id', jobRunId)
      .eq('user_id', user.id) // Ensure user owns this job run
      .single()

    if (jobRunError || !jobRun) {
      return NextResponse.json({ error: 'Job run not found' }, { status: 404 })
    }

    // Fetch candidates ordered by score desc
    const { data: candidates, error: candidatesError } = await supabase
      .from('candidates')
      .select('id, name, email, bio, score, reasons')
      .eq('job_run_id', jobRunId)
      .order('score', { ascending: false })

    if (candidatesError) {
      console.error('Error fetching candidates:', candidatesError)
      return NextResponse.json({ error: 'Failed to fetch candidates' }, { status: 500 })
    }

    return NextResponse.json({
      jobRun,
      candidates: candidates || []
    })

  } catch (error) {
    console.error('Results API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
