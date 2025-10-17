import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { listRoles } from '@/lib/config'
import { parsePdfToText, extractContact } from '@/lib/parse'
import { scoreCandidate } from '@/lib/scoring'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Function to auto-detect role from job description
async function detectRoleFromJD(jdText: string): Promise<string> {
  try {
    const availableRoles = await listRoles()
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a job role classifier. Given a job description, determine which of the following roles it best matches. Return ONLY the exact role name from the list, nothing else.

Available roles: ${availableRoles.join(', ')}

If the job description doesn't clearly match any specific role, return the most similar one.`
        },
        {
          role: 'user',
          content: `Job Description:\n\n${jdText}`
        }
      ],
      temperature: 0.1,
      max_tokens: 50
    })

    const detectedRole = response.choices[0]?.message?.content?.trim()
    
    // Validate that the detected role is in our list
    if (detectedRole && availableRoles.includes(detectedRole)) {
      return detectedRole
    }
    
    // Fallback to first available role if detection fails
    return availableRoles[0] || 'SOFTWARE ENGINEER (FULL STACK)'
  } catch (error) {
    console.error('Role detection error:', error)
    // Fallback to first available role
    const availableRoles = await listRoles()
    return availableRoles[0] || 'SOFTWARE ENGINEER (FULL STACK)'
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Auth & credit balance check
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's credit balance
    const { data: creditData, error: creditError } = await supabase
      .from('v_credit_balance')
      .select('balance')
      .eq('user_id', user.id)
      .maybeSingle() // Use maybeSingle() instead of single() to handle 0 rows

    if (creditError) {
      console.error('Error fetching credit balance:', creditError)
      return NextResponse.json({ error: 'Failed to fetch credit balance' }, { status: 500 })
    }

    const currentCredits = creditData?.balance || 0

    // 2. Parse multipart form data
    const formData = await req.formData()
    const role = formData.get('role') as string
    const jdFile = formData.get('jd') as File
    const cvFiles = formData.getAll('cvs') as File[]

    // Validate required fields
    if (!role || !jdFile || !cvFiles || cvFiles.length === 0) {
      return NextResponse.json({ 
        error: 'Missing required fields: role, jd, and cvs are required' 
      }, { status: 400 })
    }

    // 3. Validate role ∈ listRoles() or AUTO_DETECT
    const availableRoles = await listRoles()
    if (role !== 'AUTO_DETECT' && !availableRoles.includes(role)) {
      return NextResponse.json({ 
        error: `Invalid role. Available roles: ${availableRoles.join(', ')} or AUTO_DETECT` 
      }, { status: 400 })
    }

    // Check if user has sufficient credits
    if (currentCredits < cvFiles.length) {
      return NextResponse.json({ 
        error: `Insufficient credits. Required: ${cvFiles.length}, Available: ${currentCredits}` 
      }, { status: 400 })
    }

    // 4. Parse JD + CVs (no storage)
    let jdText: string
    try {
      jdText = await parsePdfToText(jdFile)
    } catch (error) {
      return NextResponse.json({ 
        error: `Failed to parse job description: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }, { status: 400 })
    }

    // Auto-detect role if needed
    let finalRole = role
    if (role === 'AUTO_DETECT') {
      console.log('Auto-detecting role from job description...')
      finalRole = await detectRoleFromJD(jdText)
      console.log(`Auto-detected role: ${finalRole}`)
    }

    // Parse all CVs
    const cvTexts: string[] = []
    const cvContacts: Array<{ name?: string; email?: string }> = []
    
    for (const cvFile of cvFiles) {
      try {
        const cvText = await parsePdfToText(cvFile)
        const contact = extractContact(cvText)
        cvTexts.push(cvText)
        cvContacts.push(contact)
      } catch (error) {
        return NextResponse.json({ 
          error: `Failed to parse CV ${cvFile.name}: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }, { status: 400 })
      }
    }

    // 5. Score each CV
    const candidates = []
    for (let i = 0; i < cvTexts.length; i++) {
      try {
        const scoringResult = await scoreCandidate({
          jdText,
          cvText: cvTexts[i],
          role: finalRole
        })

        candidates.push({
          name: cvContacts[i].name || null,
          email: cvContacts[i].email || null,
          raw_text: cvTexts[i],
          score: scoringResult.score,
          reasons: scoringResult.reasons,
          bio: scoringResult.bio
        })
      } catch (error) {
        console.error(`Error scoring CV ${i + 1}:`, error)
        return NextResponse.json({ 
          error: `Failed to score CV ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }, { status: 500 })
      }
    }

    // 6. Transaction: insert job_run, candidates, and credit_ledger
    const { data: jobRun, error: jobRunError } = await supabase
      .from('job_runs')
      .insert({
        user_id: user.id,
        role: finalRole,
        jd_text: jdText
      })
      .select()
      .single()

    if (jobRunError) {
      console.error('Error creating job run:', jobRunError)
      return NextResponse.json({ error: 'Failed to create job run' }, { status: 500 })
    }

    // Insert candidates
    const candidatesWithJobRunId = candidates.map(candidate => ({
      ...candidate,
      job_run_id: jobRun.id,
      reasons: candidate.reasons // Store as JSONB
    }))

    const { error: candidatesError } = await supabase
      .from('candidates')
      .insert(candidatesWithJobRunId)

    if (candidatesError) {
      console.error('Error inserting candidates:', candidatesError)
      return NextResponse.json({ error: 'Failed to insert candidates' }, { status: 500 })
    }

    // Deduct credits
    const { error: deductError } = await supabase
      .from('credit_ledger')
      .insert({
        user_id: user.id,
        delta: -cvFiles.length,
        reason: 'processing'
      })

    if (deductError) {
      console.error('Error deducting credits:', deductError)
      return NextResponse.json({ error: 'Failed to deduct credits' }, { status: 500 })
    }

    // Return success response
    return NextResponse.json({ 
      jobRunId: jobRun.id,
      candidatesProcessed: candidates.length,
      creditsUsed: cvFiles.length,
      remainingCredits: currentCredits - cvFiles.length
    })

  } catch (error) {
    console.error('Process API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
