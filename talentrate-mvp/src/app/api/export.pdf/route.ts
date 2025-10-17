import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { jsPDF } from 'jspdf'

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

    // Fetch top 50 candidates ordered by score desc
    const { data: candidates, error: candidatesError } = await supabase
      .from('candidates')
      .select('name, email, bio, score, reasons')
      .eq('job_run_id', jobRunId)
      .order('score', { ascending: false })
      .limit(50)

    if (candidatesError) {
      console.error('Error fetching candidates:', candidatesError)
      return NextResponse.json({ error: 'Failed to fetch candidates' }, { status: 500 })
    }

    // Create PDF
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const contentWidth = pageWidth - (margin * 2)
    let yPosition = margin

    // Helper function to add text with word wrapping
    const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 10) => {
      doc.setFontSize(fontSize)
      const lines = doc.splitTextToSize(text, maxWidth)
      doc.text(lines, x, y)
      return y + (lines.length * fontSize * 0.4) + 5
    }

    // Helper function to check if we need a new page
    const checkNewPage = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        doc.addPage()
        yPosition = margin
        return true
      }
      return false
    }

    // Header
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('TalentRate Analysis Report', margin, yPosition)
    yPosition += 15

    // Job details
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    yPosition = addWrappedText(`Role: ${jobRun.role}`, margin, yPosition, contentWidth)
    yPosition = addWrappedText(`Processed: ${new Date(jobRun.created_at).toLocaleString()}`, margin, yPosition, contentWidth)
    yPosition = addWrappedText(`Total Candidates: ${candidates?.length || 0}`, margin, yPosition, contentWidth)
    yPosition += 10

    // Job Description Summary
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Job Description Summary', margin, yPosition)
    yPosition += 10

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const jdSummary = jobRun.jd_text.length > 500 
      ? jobRun.jd_text.substring(0, 500) + '...'
      : jobRun.jd_text
    yPosition = addWrappedText(jdSummary, margin, yPosition, contentWidth, 10)
    yPosition += 15

    // Candidates table header
    checkNewPage(20)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Top Candidates (Ranked by Score)', margin, yPosition)
    yPosition += 15

    // Table headers
    const tableHeaders = ['Rank', 'Name', 'Email', 'Score', 'Top Reasons']
    const colWidths = [15, 40, 50, 20, 60]
    let xPosition = margin

    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    tableHeaders.forEach((header, index) => {
      doc.text(header, xPosition, yPosition)
      xPosition += colWidths[index]
    })
    yPosition += 10

    // Draw table line
    doc.setLineWidth(0.5)
    doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5)

    // Candidates data
    doc.setFont('helvetica', 'normal')
    const candidatesList = candidates || []
    
    candidatesList.forEach((candidate, index) => {
      checkNewPage(15)
      
      xPosition = margin
      const rank = index + 1
      
      // Rank
      doc.text(rank.toString(), xPosition, yPosition)
      xPosition += colWidths[0]
      
      // Name
      const name = candidate.name || 'N/A'
      doc.text(name.length > 20 ? name.substring(0, 20) + '...' : name, xPosition, yPosition)
      xPosition += colWidths[1]
      
      // Email
      const email = candidate.email || 'N/A'
      doc.text(email.length > 25 ? email.substring(0, 25) + '...' : email, xPosition, yPosition)
      xPosition += colWidths[2]
      
      // Score
      doc.text(candidate.score?.toFixed(1) || '0', xPosition, yPosition)
      xPosition += colWidths[3]
      
      // Top reasons (first one only for space)
      const topReason = candidate.reasons?.[0] || 'N/A'
      doc.text(topReason.length > 30 ? topReason.substring(0, 30) + '...' : topReason, xPosition, yPosition)
      
      yPosition += 8
    })

    // Footer
    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - 30, pageHeight - 10)
      doc.text('Generated by TalentRate', margin, pageHeight - 10)
    }

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    // Return PDF as stream
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="talent-results-${jobRunId}.pdf"`,
        'Cache-Control': 'no-cache'
      }
    })

  } catch (error) {
    console.error('PDF export error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
