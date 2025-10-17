// Constants
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const MAX_CVS_PER_RUN = 100

// Email regex pattern
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g

// Name extraction patterns - look for common CV name indicators
const NAME_PATTERNS = [
  // Full name at start of line (common CV format)
  /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s*$/gm,
  // Name followed by common CV keywords
  /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s*(?:CV|Resume|Curriculum|Profile)/gmi,
  // Name in header-like format
  /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s*$/m
]

/**
 * Validates file constraints
 */
function validateFile(file: File): void {
  if (file.type !== 'application/pdf') {
    throw new Error('Only PDF files are allowed')
  }
  
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`)
  }
}

/**
 * Parses a PDF file to plain text using PDF.js
 * @param file - The PDF file to parse
 * @returns Promise<string> - The extracted text content
 */
export async function parsePdfToText(file: File): Promise<string> {
  validateFile(file)
  
  try {
    // Dynamic import to avoid client-side bundling issues
    const pdfjsLib = await import('pdfjs-dist')
    
    // Set up the worker for PDF.js
    if (typeof window !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
    }
    
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    
    // Load the PDF document
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    
    let fullText = ''
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()
      
      // Combine all text items from the page
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
      
      fullText += pageText + '\n'
    }
    
    // ArrayBuffer cleanup is handled automatically by garbage collection
    
    return fullText.trim()
  } catch (error) {
    throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Extracts contact information from CV text
 * @param cvText - The parsed CV text content
 * @returns Object containing name and email if found
 */
export function extractContact(cvText: string): { name?: string; email?: string } {
  const result: { name?: string; email?: string } = {}
  
  // Extract email addresses
  const emailMatches = cvText.match(EMAIL_REGEX)
  if (emailMatches && emailMatches.length > 0) {
    // Take the first valid email
    result.email = emailMatches[0]
  }
  
  // Extract name using multiple patterns
  for (const pattern of NAME_PATTERNS) {
    const matches = cvText.match(pattern)
    if (matches && matches.length > 0) {
      // Clean up the match (remove extra whitespace, keywords)
      let name = matches[0].trim()
      
      // Remove common CV keywords that might be captured
      name = name.replace(/\s*(CV|Resume|Curriculum|Profile).*$/i, '').trim()
      
      // Validate name (should be at least 2 words, proper case)
      const nameParts = name.split(/\s+/)
      if (nameParts.length >= 2 && nameParts.every(part => /^[A-Z][a-z]+$/.test(part))) {
        result.name = name
        break
      }
    }
  }
  
  return result
}

/**
 * Validates the number of CVs in a batch
 * @param count - Number of CVs to process
 */
export function validateCvCount(count: number): void {
  if (count > MAX_CVS_PER_RUN) {
    throw new Error(`Maximum ${MAX_CVS_PER_RUN} CVs allowed per run`)
  }
}

/**
 * Parses multiple PDF files and extracts contact info
 * @param files - Array of PDF files
 * @returns Promise<Array> - Array of parsed CVs with contact info
 */
export async function parseCvBatch(files: File[]): Promise<Array<{
  text: string
  contact: { name?: string; email?: string }
  filename: string
}>> {
  validateCvCount(files.length)
  
  const results = await Promise.all(
    files.map(async (file) => {
      const text = await parsePdfToText(file)
      const contact = extractContact(text)
      
      return {
        text,
        contact,
        filename: file.name
      }
    })
  )
  
  return results
}
