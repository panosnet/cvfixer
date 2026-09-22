export type Provider = 'ollama' | 'anthropic' | 'openai' | 'google'
export type TemplateType = 'classic' | 'modern' | 'minimal' | 'creative' | 'executive'
export type ProviderKey = 'anthropic' | 'openai' | 'google'

export interface ModelConfig {
  provider: Provider
  model: string
  apiKey?: string
}

export interface CVAnalysisResult {
  score: number
  atsScore: number
  scoreBreakdown: {
    quantification: number
    keywords: number
    summary: number
    format: number
    completeness: number
  }
  topStrength: string
  topWeakness: string
  pageEstimate: number
  summary: string
  industryDetected: string
  keywordsFound: string[]
  keywordsMissing: string[]    // renamed from missingKeywords for clarity
  missingKeywords?: string[]   // kept for backward compat
  atsTips: string[]
  coverLetterOpening: string
  bulletQualityIssues: Array<{ job: string; bullet: string; issue: string; fix: string }>
  improvements: Array<{ section: string; issue: string; suggestion: string; priority: 'high' | 'medium' | 'low' }>
  interviewPrep: {
    likelyQuestions: string[]
    starStories: Array<{ question: string; situation: string; metrics: string }>
    technicalTopics: string[]
  }
  rewrittenCV: RewrittenCV
  design: DesignSuggestion
  _integrityWarnings?: string[]
}

export interface RewrittenCV {
  name: string
  title: string
  contact: {
    email: string
    phone: string
    location: string
    linkedin: string
    github: string
    website: string
  }
  summary: string
  coreCompetencies: string[]
  experience: Array<{
    title: string
    company: string
    location: string
    startDate: string
    endDate: string
    bullets: string[]
  }>
  education: Array<{
    degree: string
    institution: string
    location: string
    year: string
    details: string
  }>
  skills: {
    technical: string[]
    soft: string[]
    languages: string[]
  }
  certifications: string[]
  achievements: string[]
  publications: string[]
  volunteer: string[]
  projects: Array<{
    name: string
    description: string
    technologies: string[]
    url?: string
    startDate?: string
  }>
}

export interface DesignSuggestion {
  template: TemplateType
  reasoning: string
  colors: {
    primary: string
    secondary: string
    accent: string
    text: string
    background: string
  }
  fonts: {
    heading: string
    body: string
  }
}

export interface OllamaModelDef {
  id: string
  name: string
  size: string
  ramRequired: string
  ramGB: number
  description: string
  languages: string[]
  quality: string
  speed: string
  recommended: boolean
  tag: string
  tagColor: string
}

export interface PaidModelDef {
  provider: Provider
  id: string
  name: string
  description: string
  costInfo: string
  quality: string
  recommended: boolean
  keyName: ProviderKey
}

export interface Toast {
  id: string
  message: string
  type: 'error' | 'success' | 'info'
}

// Saved CV version for multiple-job-application workflow
export interface SavedCVVersion {
  id: string
  name: string
  savedAt: number
  analysisResult: CVAnalysisResult
  currentCV: RewrittenCV
  design: DesignSuggestion
  selectedTemplate: TemplateType
  cvText: string
  jobDescription: string
}
