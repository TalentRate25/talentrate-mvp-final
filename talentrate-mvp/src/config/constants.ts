// Configuration constants for TalentRate MVP

export const APP_CONFIG = {
  name: 'TalentRate',
  description: 'AI-powered talent analysis platform',
  version: '1.0.0',
} as const

export const UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
  ],
  allowedExtensions: ['.pdf', '.doc', '.docx', '.xlsx', '.csv'],
} as const

export const CREDIT_PACKAGES = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 10,
    price: 9.99,
    description: 'Perfect for small teams',
  },
  {
    id: 'professional',
    name: 'Professional',
    credits: 50,
    price: 39.99,
    popular: true,
    description: 'Most popular for growing teams',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    credits: 200,
    price: 129.99,
    description: 'For large organizations',
  },
] as const

export const ANALYSIS_TRAITS = [
  'Leadership',
  'Communication',
  'Problem Solving',
  'Technical Skills',
  'Adaptability',
  'Teamwork',
  'Analytical Thinking',
  'Attention to Detail',
  'Creativity',
  'Time Management',
  'Learning Agility',
  'Strategic Thinking',
  'Emotional Intelligence',
  'Innovation',
  'Decision Making',
] as const
