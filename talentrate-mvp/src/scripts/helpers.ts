// Helper scripts and utilities for TalentRate MVP

import { UPLOAD_CONFIG } from '@/config/constants'

export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > UPLOAD_CONFIG.maxFileSize) {
    return {
      valid: false,
      error: `File size must be less than ${UPLOAD_CONFIG.maxFileSize / (1024 * 1024)}MB`,
    }
  }

  // Check file type
  if (!UPLOAD_CONFIG.allowedTypes.includes(file.type as (typeof UPLOAD_CONFIG.allowedTypes)[number])) {
    return {
      valid: false,
      error: 'File type not supported. Please upload a PDF, DOC, DOCX, XLSX, or CSV file.',
    }
  }

  return { valid: true }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function generateMockAnalysisData() {
  const names = [
    'John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson', 'David Brown',
    'Emily Davis', 'Chris Miller', 'Lisa Garcia', 'Tom Anderson', 'Amy Taylor'
  ]
  
  const traits = [
    'Leadership', 'Communication', 'Problem Solving', 'Technical Skills',
    'Adaptability', 'Teamwork', 'Analytical Thinking', 'Attention to Detail',
    'Creativity', 'Time Management', 'Learning Agility', 'Strategic Thinking'
  ]

  return names.slice(0, 5).map((name) => ({
    name,
    score: Math.floor(Math.random() * 30) + 70, // 70-100
    traits: traits
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 4) + 2), // 2-5 traits
  }))
}

export function simulateApiDelay(ms: number = 1000): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
