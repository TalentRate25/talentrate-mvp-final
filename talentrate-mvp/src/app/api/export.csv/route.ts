import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const jobRunId = searchParams.get('jobRunId')

    if (!jobRunId) {
      return NextResponse.json({ error: 'Job run ID is required' }, { status: 400 })
    }

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
      .eq('user_id', user.id)
      .single()

    if (jobRunError || !jobRun) {
      return NextResponse.json({ error: 'Job run not found' }, { status: 404 })
    }

    // Fetch candidates ordered by score desc
    const { data: candidates, error: candidatesError } = await supabase
      .from('candidates')
      .select('name, email, bio, score, reasons')
      .eq('job_run_id', jobRunId)
      .order('score', { ascending: false })

    if (candidatesError) {
      console.error('Error fetching candidates:', candidatesError)
      return NextResponse.json({ error: 'Failed to fetch candidates' }, { status: 500 })
    }

    // Generate CSV content
    const csvHeaders = [
      'Name',
      'Email', 
      'Bio',
      'Score',
      'Top Reason 1',
      'Top Reason 2',
      'Top Reason 3'
    ]

    const csvRows = (candidates || []).map(candidate => [
      candidate.name || '',
      candidate.email || '',
      `"${(candidate.bio || '').replace(/"/g, '""')}"`, // Escape quotes in bio
      candidate.score?.toString() || '0',
      (candidate.reasons?.[0] || '').replace(/"/g, '""'),
      (candidate.reasons?.[1] || '').replace(/"/g, '""'),
      (candidate.reasons?.[2] || '').replace(/"/g, '""')
    ])

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n')

    // Return CSV as stream
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="talent-results-${jobRunId}.csv"`,
        'Cache-Control': 'no-cache'
      }
    })

  } catch (error) {
    console.error('CSV export error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
