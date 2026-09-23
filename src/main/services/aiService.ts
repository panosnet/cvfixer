import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'

export interface AIConfig {
  provider: 'ollama' | 'anthropic' | 'openai' | 'google'
  model: string
  apiKey?: string
}

export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  model: string
  provider: string
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
  keywordsMissing: string[]
  atsTips: string[]
  coverLetterOpening: string
  bulletQualityIssues: Array<{ job: string; bullet: string; issue: string; fix: string }>
  improvements: Array<{ section: string; issue: string; suggestion: string; priority: 'high' | 'medium' | 'low' }>
  interviewPrep: {
    likelyQuestions: string[]
    starStories: Array<{ question: string; situation: string; metrics: string }>
    technicalTopics: string[]
  }
  rewrittenCV: {
    name: string
    title: string
    contact: { email: string; phone: string; location: string; linkedin: string; github: string; website: string }
    summary: string
    coreCompetencies: string[]
    experience: Array<{
      title: string; company: string; location: string; startDate: string; endDate: string; bullets: string[]
    }>
    education: Array<{
      degree: string; institution: string; location: string; year: string; details: string
    }>
    skills: { technical: string[]; soft: string[]; languages: string[] }
    certifications: string[]
    achievements: string[]
    publications: string[]
    volunteer: string[]
    projects: Array<{ name: string; description: string; technologies: string[]; url?: string; startDate?: string }>
  }
  design: {
    template: 'classic' | 'modern' | 'minimal' | 'creative' | 'executive'
    reasoning: string
    colors: { primary: string; secondary: string; accent: string; text: string; background: string }
    fonts: { heading: string; body: string }
  }
  _integrityWarnings?: string[]
}

function normalizeHex(hex: string): string {
  if (!hex) return '#000000'
  let c = hex.replace('#', '')
  if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2]
  if (c.length === 8) c = c.slice(0, 6)
  if (!/^[0-9a-fA-F]{6}$/.test(c)) return '#000000'
  return '#' + c
}

function hexLuminance(hex: string): number {
  const c = normalizeHex(hex).replace('#', '')
  const r = parseInt(c.slice(0, 2), 16) / 255
  const g = parseInt(c.slice(2, 4), 16) / 255
  const b = parseInt(c.slice(4, 6), 16) / 255
  return 0.299 * r + 0.587 * g + 0.114 * b
}

// ─── Job extraction helper ───────────────────────────────────────────────────

function extractPositionHints(cvText: string): string[] {
  const lines = cvText.split('\n')
  const hints: string[] = []
  const datePattern = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december)\s*\.?\s*\d{4}\b|\b\d{4}\s*[-–—]\s*(present|current|now|\d{4})\b|\b(20\d{2}|19\d{2})\s*[-–—to]+\s*(20\d{2}|19\d{2}|present|current|now)\b/gi

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    if (datePattern.test(line)) {
      const context = lines.slice(Math.max(0, i - 1), i + 2).map(l => l.trim()).filter(Boolean).join(' | ')
      hints.push(context)
      datePattern.lastIndex = 0
    }
    datePattern.lastIndex = 0
  }
  return hints
}

// ─── Prompt ───────────────────────────────────────────────────────────────────

const CV_ANALYSIS_PROMPT = (cvText: string, jobDescription: string) => {
  const positionHints = extractPositionHints(cvText)
  const positionCount = Math.max(positionHints.length, 1)

  return `
You are a world-class CV/resume writer and career coach. Your goal is to help this candidate get shortlisted by both ATS systems and human recruiters.

═══ ABSOLUTE RULES — any violation invalidates the result ═══
1. Return ONLY the JSON object — nothing before {, nothing after }
2. No markdown, code fences, or formatting outside the JSON
3. All string values use double quotes and are properly escaped
4. NEVER truncate mid-JSON — close every { and [ before finishing; shorten bullets if needed
5. NEVER add experience, companies, degrees, skills, or achievements not in the original CV
6. NEVER invent numbers or percentages — if no real metric exists, describe scope qualitatively
7. NEVER copy job description responsibilities into CV bullets — the JD is READ-ONLY context
8. NEVER use these recruiter red-flag phrases: "results-driven", "passionate about", "proven track record", "dynamic professional", "detail-oriented", "spearheaded", "leveraged", "synergy", "thought leader"
9. Every experience entry MUST correspond to a real job from the CV below
10. Experience MUST be in REVERSE CHRONOLOGICAL ORDER (most recent first)

═══ CRITICAL: PRESERVE ALL POSITIONS ═══
I have detected approximately ${positionCount} positions/roles in this CV.
${positionHints.length > 0 ? `Here are date-bearing lines I found:\n${positionHints.map((h, i) => `  ${i + 1}. ${h}`).join('\n')}` : ''}

YOU MUST INCLUDE EVERY SINGLE POSITION. Do not skip, merge, or summarize any roles.
If you are running low on output space, use 2 bullets per older role instead of skipping entire positions.
BEFORE writing the JSON, mentally count every distinct role in the CV. Your output MUST have that many entries in the experience array.

ALSO PRESERVE: all certifications, awards/achievements, publications, volunteer activities, and projects from the original CV.
If any of these sections exist in the original CV, they MUST appear in your output — do not omit them.

═══ SOURCE OF TRUTH ═══
Candidate's CV (preserve ALL ${positionCount} jobs, education, skills):
---
${cvText.slice(0, 40000)}
---

${jobDescription ? `Target Job Description (READ-ONLY — keyword source and tailoring context only, never as CV content):
---
${jobDescription.slice(0, 10000)}
---` : 'No job description provided — give general best-practice improvements.'}

═══ HOW TO USE THE JOB DESCRIPTION ═══
- Extract keywords the candidate can HONESTLY claim based on their actual experience
- Use the JD's EXACT phrasing for keywords (ATS does not do semantic matching — "JavaScript" ≠ "JS", "Machine Learning" ≠ "ML")
- Every critical JD keyword should appear in at least 2 of: title, coreCompetencies, summary, OR experience bullets
- Tailor the professional headline to mirror the JD job title (within the candidate's honest experience)
- Do NOT add any claim not grounded in the original CV

═══ ACHIEVEMENT ENRICHMENT — THIS IS YOUR #1 JOB ═══
Before writing bullets, scan the ENTIRE CV and identify the candidate's 3–5 biggest achievements:
- Promotions, revenue impact, cost savings, awards, patents, publications, team growth, product launches
- Anything with a real number attached (users served, deals closed, budget managed, % improvement)
- Anything that shows career progression (promoted in X months, grew team from N to M)

These top achievements MUST:
1. Appear as the FIRST bullet in their respective job entries — lead with impact, not responsibilities
2. Be enriched with full context: WHO benefited, WHAT scale, WHY it mattered to the business
3. If a number exists anywhere near the achievement in the CV, connect it explicitly
4. If the achievement is vague in the original ("improved performance"), add the scope/context that IS in the CV ("improved performance of the payment processing pipeline serving 2M daily transactions")

The rest of the bullets fill in responsibilities — but the FIRST bullet of each role must be the strongest achievement from that role.

═══ BULLET QUALITY RULES ═══
- 3–5 bullets for current/most recent role; 2–3 for older roles
- Maximum 2 lines per bullet (keep them scannable)
- Format: [Strong verb in correct tense] + [specific action + context] + [result/scope]
- TENSE: Present tense for current role. Past tense for all previous roles. No mixing.
- Use REAL numbers from the CV. If none exist, describe scope: "across 12 countries", "for the company's top 3 enterprise clients", "supporting 500K daily active users" — but NEVER invent percentages or dollar amounts
- Do NOT start bullets with: "Responsible for", "Helped to", "Assisted with", "Worked on"
- Provide context + scale in each bullet — a metric without context is weak ("Reduced latency by 40%" → better: "Reduced API P99 latency from 2.1s to 1.2s for 8M daily active users, enabling expansion into latency-sensitive enterprise segment")
- WEAK bullets to STRONG examples:
  × "Managed a team" → ✓ "Led and mentored a cross-functional team of 12 engineers across 3 time zones"
  × "Improved sales" → ✓ "Grew enterprise pipeline from $2M to $8.5M ARR within 18 months by restructuring the outbound strategy"
  × "Developed software" → ✓ "Architected and shipped the real-time analytics platform processing 50K events/sec, adopted by 40+ enterprise clients"
  × "Handled customer issues" → ✓ "Resolved 95% of escalated enterprise accounts within SLA, retaining $3.2M in at-risk revenue"

═══ PROFESSIONAL SUMMARY FORMULA ═══
"[X]+ years [specialisation] in [industry/domain]. Expert in [specific skill 1], [skill 2], and [skill 3]. [Most impressive honest career achievement, quantified if real data exists]. [One sentence tailored value proposition for this specific role/industry]."
- No first-person pronouns (no "I", "me", "my")
- Do NOT use any of the banned phrases from Rule 8

═══ CORE COMPETENCIES ═══
Generate 6–12 core competency terms placed immediately after the summary. These must:
- Be exact matches to JD keywords the candidate genuinely has
- Be specific skills/tools, not generic attributes
- Be formatted as chips (short terms: "Python 3.x", "Stakeholder Management", "P&L Ownership")

═══ SCORING RUBRIC ═══
scoreBreakdown (calculate each category 0–100):
- quantification: % of bullets that have a real metric, scale indicator, or specific outcome
- keywords: % of critical JD keywords that appear in the rewritten CV
- summary: does it follow the formula above? Clear identity, expertise, achievement, value prop?
- format: reverse chronological? Standard headers? No invented dates? Consistent tense?
- completeness: all sections present? No unexplained gaps? Skills and education complete?
Overall score = weighted average: quant(25%) + keywords(25%) + summary(20%) + format(15%) + completeness(15%)

topStrength: the single most compelling thing about this candidate (quote a specific detail from their background)
topWeakness: the single most damaging gap to fix (be specific and honest)

═══ ATS GUIDANCE ═══
- Use standard section headers: Experience, Education, Skills, Certifications, Projects
- No tables, text boxes, or columns in critical content
- List skills as individual terms, not grouped categories
- File format note: "If uploading to a job portal, use the Classic template PDF — it is the most ATS-compatible"

═══ INDUSTRY-SPECIFIC NOTES ═══
Based on the detected industry, emphasise:
- Tech/Engineering: system scale, tech stack versions, GitHub contributions, deployment frequency
- Finance: regulatory knowledge, AUM/deal sizes, CFA/CPA/FRM certifications, specific frameworks (Basel, IFRS)
- Healthcare: patient outcomes, compliance (HIPAA, FDA, CQC), clinical settings, team sizes
- Marketing: CAC, LTV, conversion rates, campaign budgets, audience sizes, platform-specific metrics
- Consulting: client verticals, framework application, headcount/budget scope, cross-industry breadth
- Executive: P&L ownership ($M), board-level exposure, headcount managed, M&A or fundraising involvement
- Legal: bar admissions, deal value, case types, publications/articles
- Academic: research areas, grant funding, publications count, teaching roles

═══ PAGE ESTIMATE ═══
pageEstimate: estimate 1 if total content fits on one A4 page, 2 if it needs two. Base on experience count and bullet volume. Most candidates with <10 years should be 1 page.

═══ INTERVIEW PREP (keep brief — save output tokens for the CV) ═══
- 3 likely interview questions (short, 1 sentence each)
- 1 STAR story framework (brief)
- 3 technical topics (just names, no descriptions)

═══ OUTPUT TOKEN BUDGET ═══
Prioritize completeness of rewrittenCV over analysis depth.
If you must choose between writing a thorough interviewPrep section or including all ${positionCount} experience entries, ALWAYS include all positions.
Keep bulletQualityIssues to the 3 worst bullets only.
Keep improvements to the top 5 most impactful only.
Keep atsTips to 3 maximum.

IMPORTANT OUTPUT ORDER: Write rewrittenCV FIRST (most important), then all analysis fields.

Return this exact JSON structure:
{
  "rewrittenCV": {
    "name": "<full name from CV>",
    "title": "<professional headline tailored to JD>",
    "contact": {
      "email": "<email>", "phone": "<phone>", "location": "<city, country>",
      "linkedin": "<full url or empty>", "github": "<full url or empty>", "website": "<full url or empty>"
    },
    "summary": "<summary following the formula above — no banned phrases, no I/me/my>",
    "coreCompetencies": ["skill1", "skill2", "skill3", "skill4", "skill5", "skill6"],
    "experience": [
      {
        "title": "<job title>", "company": "<company>", "location": "<location>",
        "startDate": "<Month Year>", "endDate": "<Month Year or Present>",
        "bullets": ["<[Verb] + [context] + [outcome/scope]>"]
      }
    ],
    "education": [
      { "degree": "<degree name>", "institution": "<school>", "location": "<city, country>", "year": "<year>", "details": "<GPA if strong, honors, relevant coursework>" }
    ],
    "skills": {
      "technical": ["exact skill name"],
      "soft": [],
      "languages": ["Language - Proficiency Level"]
    },
    "certifications": ["cert name — issuing body — year"],
    "achievements": ["award or recognition"],
    "publications": [],
    "volunteer": [],
    "projects": [
      { "name": "<name>", "description": "<one-line impact>", "technologies": ["tech"], "url": "<url or empty>", "startDate": "<year or empty>" }
    ]
  },
  "score": <0-100, weighted from scoreBreakdown>,
  "atsScore": <0-100, based on keyword coverage, format, section headers>,
  "scoreBreakdown": {
    "quantification": <0-100>,
    "keywords": <0-100>,
    "summary": <0-100>,
    "format": <0-100>,
    "completeness": <0-100>
  },
  "topStrength": "<the single most impressive, specific thing about this candidate>",
  "topWeakness": "<the most damaging gap — be specific>",
  "pageEstimate": <1 or 2>,
  "summary": "<honest 2-3 sentence assessment of the CV — direct, specific, no fluff>",
  "industryDetected": "<e.g. Software Engineering, Investment Banking, Healthcare>",
  "keywordsFound": ["keyword from JD that appears in the rewritten CV"],
  "keywordsMissing": ["critical JD keyword not in the CV"],
  "atsTips": ["specific ATS optimization tip for this CV"],
  "coverLetterOpening": "<2 compelling sentences that open a cover letter — specific to this candidate and role>",
  "bulletQualityIssues": [
    { "job": "<company name>", "bullet": "<original weak bullet>", "issue": "<what is wrong>", "fix": "<improved version>" }
  ],
  "improvements": [
    { "section": "<section name>", "issue": "<specific problem>", "suggestion": "<concrete fix>", "priority": "high" }
  ],
  "interviewPrep": {
    "likelyQuestions": ["question1", "question2", "question3", "question4"],
    "starStories": [
      { "question": "<likely interview question>", "situation": "<which role/project to draw from>", "metrics": "<real data points to include>" }
    ],
    "technicalTopics": ["topic1", "topic2", "topic3"]
  },
  "design": {
    "template": "<classic|modern|minimal|creative|executive>",
    "reasoning": "<why this template and industry>",
    "colors": {
      "primary": "<6-digit hex>", "secondary": "<6-digit hex>", "accent": "<6-digit hex>",
      "text": "<dark 6-digit hex, always dark like #1a1a2e or #333333 — NEVER light/white>",
      "background": "#ffffff"
    },
    "fonts": { "heading": "<one of: Playfair Display, Montserrat, Raleway, Lato, Source Serif 4, Inter, Roboto>", "body": "<one of: Inter, Lato, Open Sans, Roboto, Nunito, Source Sans 3>" }
  }
}
`
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateResult(result: unknown, originalCvText?: string): CVAnalysisResult {
  const r = result as any
  if (!r || typeof r !== 'object') throw new Error('AI response is not a JSON object')

  // Top-level defaults
  if (typeof r.score !== 'number') r.score = 50
  r.score = Math.max(0, Math.min(100, r.score))
  if (typeof r.atsScore !== 'number') r.atsScore = 50
  r.atsScore = Math.max(0, Math.min(100, r.atsScore))
  if (!r.scoreBreakdown) r.scoreBreakdown = { quantification: 50, keywords: 50, summary: 50, format: 50, completeness: 50 }
  for (const k of ['quantification', 'keywords', 'summary', 'format', 'completeness'] as const) {
    if (typeof r.scoreBreakdown[k] !== 'number') r.scoreBreakdown[k] = 50
    r.scoreBreakdown[k] = Math.max(0, Math.min(100, r.scoreBreakdown[k]))
  }
  if (!r.topStrength) r.topStrength = ''
  if (!r.topWeakness) r.topWeakness = ''
  if (typeof r.pageEstimate !== 'number') r.pageEstimate = 1
  if (!r.summary) r.summary = 'Analysis complete.'
  if (!r.industryDetected) r.industryDetected = 'General'
  if (!Array.isArray(r.keywordsFound)) r.keywordsFound = []
  if (!Array.isArray(r.keywordsMissing)) r.keywordsMissing = r.missingKeywords ?? []
  r.missingKeywords = r.keywordsMissing
  if (!Array.isArray(r.atsTips)) r.atsTips = []
  if (!r.coverLetterOpening) r.coverLetterOpening = ''
  if (!Array.isArray(r.bulletQualityIssues)) r.bulletQualityIssues = []
  if (!Array.isArray(r.improvements)) r.improvements = []
  if (!r.interviewPrep) r.interviewPrep = { likelyQuestions: [], starStories: [], technicalTopics: [] }
  if (!Array.isArray(r.interviewPrep.likelyQuestions)) r.interviewPrep.likelyQuestions = []
  if (!Array.isArray(r.interviewPrep.starStories)) r.interviewPrep.starStories = []
  if (!Array.isArray(r.interviewPrep.technicalTopics)) r.interviewPrep.technicalTopics = []

  if (!r.rewrittenCV) throw new Error('AI did not return a rewritten CV. Try a more capable model or paid API.')
  const cv = r.rewrittenCV
  if (!cv.name) cv.name = 'Name not found'
  if (!cv.title) cv.title = ''
  if (!cv.contact) cv.contact = { email: '', phone: '', location: '', linkedin: '', github: '', website: '' }
  if (!cv.summary) cv.summary = ''
  if (!Array.isArray(cv.coreCompetencies)) cv.coreCompetencies = []
  if (!Array.isArray(cv.experience)) cv.experience = []
  if (!Array.isArray(cv.education)) cv.education = []
  if (!cv.skills) cv.skills = { technical: [], soft: [], languages: [] }
  if (!Array.isArray(cv.skills.technical)) cv.skills.technical = []
  if (!Array.isArray(cv.skills.soft)) cv.skills.soft = []
  if (!Array.isArray(cv.skills.languages)) cv.skills.languages = []
  if (!Array.isArray(cv.certifications)) cv.certifications = []
  if (!Array.isArray(cv.achievements)) cv.achievements = []
  if (!Array.isArray(cv.publications)) cv.publications = []
  if (!Array.isArray(cv.volunteer)) cv.volunteer = []
  if (!Array.isArray(cv.projects)) cv.projects = []
  for (const exp of cv.experience) {
    if (!exp.title) exp.title = ''
    if (!exp.company) exp.company = ''
    if (!exp.location) exp.location = ''
    if (!exp.startDate) exp.startDate = ''
    if (!exp.endDate) exp.endDate = ''
    if (!Array.isArray(exp.bullets)) exp.bullets = []
  }
  for (const edu of cv.education) {
    if (!edu.degree) edu.degree = ''
    if (!edu.institution) edu.institution = ''
    if (!edu.location) edu.location = ''
    if (!edu.year) edu.year = ''
    if (!edu.details) edu.details = ''
  }
  if (!r.design) {
    r.design = {
      template: 'classic',
      reasoning: '',
      colors: { primary: '#1e3a5f', secondary: '#2d5a8e', accent: '#4a90d9', text: '#1a1a2e', background: '#ffffff' },
      fonts: { heading: 'Montserrat', body: 'Inter' },
    }
  }

  const validTemplates = ['classic', 'modern', 'minimal', 'creative', 'executive']
  if (!validTemplates.includes(r.design.template)) r.design.template = 'classic'

  const validHeadingFonts = ['Playfair Display', 'Montserrat', 'Raleway', 'Lato', 'Source Serif 4', 'Inter', 'Roboto']
  const validBodyFonts = ['Inter', 'Lato', 'Open Sans', 'Roboto', 'Nunito', 'Source Sans 3']
  if (!r.design.fonts) r.design.fonts = { heading: 'Montserrat', body: 'Inter' }
  if (!validHeadingFonts.includes(r.design.fonts.heading)) r.design.fonts.heading = 'Montserrat'
  if (!validBodyFonts.includes(r.design.fonts.body)) r.design.fonts.body = 'Inter'

  const dc = r.design.colors
  if (dc) {
    const hexRe = /^#[0-9a-fA-F]{3,8}$/
    if (!dc.primary || !hexRe.test(dc.primary)) dc.primary = '#1e3a5f'
    else dc.primary = normalizeHex(dc.primary)
    if (!dc.secondary || !hexRe.test(dc.secondary)) dc.secondary = '#2d5a8e'
    else dc.secondary = normalizeHex(dc.secondary)
    if (!dc.accent || !hexRe.test(dc.accent)) dc.accent = '#4a90d9'
    else dc.accent = normalizeHex(dc.accent)
    if (!dc.background || !hexRe.test(dc.background)) dc.background = '#ffffff'
    else dc.background = normalizeHex(dc.background)
    if (!dc.text || !hexRe.test(dc.text)) dc.text = '#1a1a2e'
    else dc.text = normalizeHex(dc.text)
    if (hexLuminance(dc.text) > 0.5) dc.text = '#1a1a2e'
    if (hexLuminance(dc.background) < 0.3) dc.background = '#ffffff'
  }

  if (originalCvText) {
    r._integrityWarnings = checkIntegrity(cv, originalCvText)
  }

  return r as CVAnalysisResult
}

function checkIntegrity(cv: any, originalText: string): string[] {
  const warnings: string[] = []
  const lower = originalText.toLowerCase()

  const positionHints = extractPositionHints(originalText)
  const years = new Set((lower.match(/\b(20\d{2}|19\d{2})\b/g) ?? []))
  const estimatedJobs = Math.max(positionHints.length, Math.max(1, Math.floor(years.size / 2)))
  const presentCount = (lower.match(/\b(present|current|now)\b/g) ?? []).length
  const multipleJobs = years.size >= 4 || presentCount >= 1

  if (cv.experience.length === 0) {
    warnings.push(`Experience section is empty — the model did not return any jobs. The original CV appears to have ${estimatedJobs}+ roles. Try a paid API (Claude Sonnet, GPT-4o) for reliable results with long CVs.`)
  } else if (multipleJobs && cv.experience.length < estimatedJobs - 1 && estimatedJobs > 2) {
    warnings.push(`Only ${cv.experience.length} job${cv.experience.length === 1 ? '' : 's'} returned but your CV appears to have ~${estimatedJobs}. Some positions may be missing — check the Edit tab, or re-analyze with a larger model.`)
  }

  // Check if specific companies from the original CV are missing in the output
  if (cv.experience.length > 0 && cv.experience.length < estimatedJobs) {
    const outputCompanies = cv.experience.map((e: any) => (e.company ?? '').toLowerCase().trim())
    const lines = originalText.split('\n').map(l => l.trim()).filter(Boolean)
    const possibleCompanies: string[] = []
    for (const line of lines) {
      const cleaned = line.toLowerCase()
      for (const comp of outputCompanies) {
        if (comp && cleaned.includes(comp)) break
      }
      // Heuristic: lines near date patterns that contain proper-case words might be company names
    }
    // Even without precise matching, the count mismatch is enough
  }

  const hasEducation = lower.includes('university') || lower.includes('college') || lower.includes('bachelor') || lower.includes('master') || lower.includes('degree') || lower.includes('phd') || lower.includes('mba') || lower.includes('bsc') || lower.includes('msc')
  if (cv.education.length === 0 && hasEducation) {
    warnings.push('Education section is empty but your original CV includes a degree or institution.')
  }

  if (cv.skills.technical.length === 0 && cv.skills.soft.length === 0) {
    const hasSkills = lower.includes('skill') || lower.includes('proficien') || lower.includes('experienced in')
    if (hasSkills) {
      warnings.push('Skills section is empty. The model may have truncated before reaching them.')
    }
  }

  return warnings
}

// ─── Analysis entry point ─────────────────────────────────────────────────────

export async function analyzeCV(
  config: AIConfig,
  cvText: string,
  jobDescription: string,
  onStream?: (chunk: string) => void,
  onUsage?: (usage: TokenUsage) => void
): Promise<CVAnalysisResult> {
  if (!cvText?.trim()) throw new Error('CV text is empty')

  const prompt = CV_ANALYSIS_PROMPT(cvText, jobDescription)
  let rawText = ''

  try {
    if (config.provider === 'anthropic') {
      rawText = await runAnthropic(config, prompt, onStream, onUsage)
    } else if (config.provider === 'openai') {
      rawText = await runOpenAI(config, prompt, onStream, onUsage)
    } else if (config.provider === 'google') {
      rawText = await runGoogle(config, prompt, onStream, onUsage)
    } else {
      rawText = await runOllama(config, prompt, onStream, onUsage)
    }
  } catch (e: any) {
    throw new Error(`AI request failed: ${e?.message ?? String(e)}`)
  }

  const parsed = parseJSON(rawText)
  return validateResult(parsed, cvText)
}

// ─── Cover letter generation ──────────────────────────────────────────────────

export async function generateCoverLetter(
  config: AIConfig,
  cv: CVAnalysisResult['rewrittenCV'],
  jobDescription: string,
  tone: 'professional' | 'conversational',
  onStream?: (chunk: string) => void
): Promise<string> {
  const prompt = `You are an expert cover letter writer. Write a complete, compelling cover letter for this candidate.

Candidate background:
- Name: ${cv.name}
- Title: ${cv.title}
- Summary: ${cv.summary}
- Most recent role: ${cv.experience[0]?.title ?? ''} at ${cv.experience[0]?.company ?? ''}
- Key achievements: ${cv.experience[0]?.bullets?.slice(0, 3).join('; ') ?? ''}
- Core competencies: ${cv.coreCompetencies?.join(', ') ?? ''}

Job Description:
---
${jobDescription.slice(0, 5000)}
---

Tone: ${tone === 'conversational' ? 'Warm and personable — still professional but with personality' : 'Formal and polished — authoritative and precise'}

Write a complete cover letter (280-350 words) structured as:
1. Opening: Hook that immediately demonstrates understanding of the role + company (NOT "I am writing to apply for...")
2. Value paragraph: What the candidate uniquely brings (cite a specific achievement from their background)
3. Evidence paragraph: One more specific example matching a key JD requirement
4. Closing: Clear call to action, confident without being arrogant

RULES:
- No "I am writing to apply" or "Please find attached"
- No generic claims — every sentence must be specific to this candidate and this role
- No banned phrases: "results-driven", "passionate about", "proven track record"
- Use the candidate's REAL achievements only — never invent metrics
- Address the hiring company by name if identifiable from the JD

Return ONLY the letter text, no JSON, no formatting markers.`

  let text = ''
  const stub = { provider: config.provider, model: config.model, apiKey: config.apiKey } as AIConfig

  try {
    if (config.provider === 'anthropic') {
      text = await runAnthropic(stub, prompt, onStream)
    } else if (config.provider === 'openai') {
      text = await runOpenAI(stub, prompt, onStream)
    } else if (config.provider === 'google') {
      text = await runGoogle(stub, prompt, onStream)
    } else {
      text = await runOllama(stub, prompt, onStream)
    }
  } catch (e: any) {
    throw new Error(`Cover letter generation failed: ${e?.message ?? String(e)}`)
  }

  return text.trim()
}

// ─── CV Chat Edit ────────────────────────────────────────────────────────────

export async function chatEditCV(
  config: AIConfig,
  cv: CVAnalysisResult['rewrittenCV'],
  userMessage: string,
  onStream?: (chunk: string) => void
): Promise<CVAnalysisResult['rewrittenCV']> {
  const prompt = `You are a CV editing assistant. The user wants to modify their CV.

Current CV (JSON):
${JSON.stringify(cv, null, 2)}

User request: "${userMessage}"

Apply the user's requested change to the CV JSON. Return ONLY the complete, modified CV as a JSON object — same structure as above.

RULES:
1. Return ONLY valid JSON — no markdown, no code fences, no explanation
2. Keep ALL existing fields and data unless the user specifically asks to change them
3. Do not add fake achievements, numbers, or experience the user didn't ask for
4. If the user asks to add something, add it to the appropriate section
5. If the user asks to remove something, remove only that specific item
6. If unclear which field to modify, make a reasonable guess and include ALL data

Return the complete modified CV JSON now:`

  let rawText = ''
  const stub = { provider: config.provider, model: config.model, apiKey: config.apiKey } as AIConfig

  try {
    if (config.provider === 'anthropic') {
      rawText = await runAnthropic(stub, prompt, onStream)
    } else if (config.provider === 'openai') {
      rawText = await runOpenAI(stub, prompt, onStream)
    } else if (config.provider === 'google') {
      rawText = await runGoogle(stub, prompt, onStream)
    } else {
      rawText = await runOllama(stub, prompt, onStream)
    }
  } catch (e: any) {
    throw new Error(`CV edit failed: ${e?.message ?? String(e)}`)
  }

  const parsed = parseJSON(rawText) as any
  if (!parsed || typeof parsed !== 'object') throw new Error('AI returned invalid JSON')

  // Validate the returned CV has the basic structure
  if (!parsed.name) parsed.name = cv.name
  if (!parsed.contact) parsed.contact = cv.contact
  if (!Array.isArray(parsed.experience)) parsed.experience = cv.experience
  parsed.experience = parsed.experience.map((e: any, i: number) => ({
    title: e.title ?? cv.experience[i]?.title ?? '',
    company: e.company ?? cv.experience[i]?.company ?? '',
    location: e.location ?? cv.experience[i]?.location ?? '',
    startDate: e.startDate ?? cv.experience[i]?.startDate ?? '',
    endDate: e.endDate ?? cv.experience[i]?.endDate ?? '',
    bullets: Array.isArray(e.bullets) ? e.bullets : cv.experience[i]?.bullets ?? [],
  }))
  if (!Array.isArray(parsed.education)) parsed.education = cv.education
  if (!parsed.skills) parsed.skills = cv.skills
  if (!Array.isArray(parsed.certifications)) parsed.certifications = cv.certifications ?? []
  if (!Array.isArray(parsed.coreCompetencies)) parsed.coreCompetencies = cv.coreCompetencies ?? []
  if (!Array.isArray(parsed.achievements)) parsed.achievements = cv.achievements ?? []
  if (!Array.isArray(parsed.publications)) parsed.publications = cv.publications ?? []
  if (!Array.isArray(parsed.volunteer)) parsed.volunteer = cv.volunteer ?? []
  if (!Array.isArray(parsed.projects)) parsed.projects = cv.projects ?? []

  return parsed as CVAnalysisResult['rewrittenCV']
}

// ─── Provider implementations ─────────────────────────────────────────────────

async function runAnthropic(
  config: AIConfig, prompt: string,
  onStream?: (chunk: string) => void,
  onUsage?: (usage: TokenUsage) => void
): Promise<string> {
  if (!config.apiKey) throw new Error('Anthropic API key is required. Set it in API Keys settings.')
  const client = new Anthropic({ apiKey: config.apiKey })
  let text = ''
  let inputTokens = 0
  let outputTokens = 0

  const stream = client.messages.stream({
    model: config.model,
    max_tokens: 16000,
    temperature: 0.3,
    messages: [{ role: 'user', content: prompt }],
  })

  for await (const event of stream) {
    if (event.type === 'message_start') {
      inputTokens = event.message.usage?.input_tokens ?? 0
    }
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      text += event.delta.text
      onStream?.(event.delta.text)
    }
    if (event.type === 'message_delta' && (event as any).usage) {
      outputTokens = (event as any).usage.output_tokens ?? 0
    }
  }
  if (inputTokens > 0 || outputTokens > 0) {
    onUsage?.({ inputTokens, outputTokens, model: config.model, provider: 'anthropic' })
  }
  return text
}

async function runOpenAI(
  config: AIConfig, prompt: string,
  onStream?: (chunk: string) => void,
  onUsage?: (usage: TokenUsage) => void
): Promise<string> {
  if (!config.apiKey) throw new Error('OpenAI API key is required. Set it in API Keys settings.')
  const client = new OpenAI({ apiKey: config.apiKey })
  let text = ''

  const isO1O3 = /^(o1|o3)/.test(config.model)
  const stream = await client.chat.completions.create({
    model: config.model,
    ...(isO1O3 ? { max_completion_tokens: 16384 } : { max_tokens: 16384 }),
    ...(isO1O3 ? {} : { temperature: 0.3 }),
    messages: [{ role: 'user', content: prompt }],
    stream: true,
    stream_options: { include_usage: true },
  })

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content || ''
    text += delta
    if (delta) onStream?.(delta)
    if (chunk.usage) {
      onUsage?.({ inputTokens: chunk.usage.prompt_tokens ?? 0, outputTokens: chunk.usage.completion_tokens ?? 0, model: config.model, provider: 'openai' })
    }
  }
  return text
}

async function runGoogle(
  config: AIConfig, prompt: string,
  onStream?: (chunk: string) => void,
  onUsage?: (usage: TokenUsage) => void
): Promise<string> {
  if (!config.apiKey) throw new Error('Google API key is required. Set it in API Keys settings.')
  const genAI = new GoogleGenerativeAI(config.apiKey)
  const model = genAI.getGenerativeModel({ model: config.model })
  let text = ''

  const streamResult = await model.generateContentStream({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 16384, temperature: 0.3 },
  })

  for await (const chunk of streamResult.stream) {
    const delta = chunk.text()
    text += delta
    if (delta) onStream?.(delta)
  }

  try {
    const response = await streamResult.response
    const meta = response.usageMetadata
    if (meta) {
      onUsage?.({ inputTokens: meta.promptTokenCount ?? 0, outputTokens: meta.candidatesTokenCount ?? 0, model: config.model, provider: 'google' })
    }
  } catch {}

  return text
}

async function runOllama(
  config: AIConfig, prompt: string,
  onStream?: (chunk: string) => void,
  onUsage?: (usage: TokenUsage) => void
): Promise<string> {
  let text = ''
  let inputTokens = 0
  let outputTokens = 0

  const response = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      options: {
        num_predict: 16384,
        temperature: 0.3,
      },
    }),
  })

  if (!response.ok) {
    const errBody = await response.text().catch(() => '')
    throw new Error(`Ollama error ${response.status}: ${errBody.slice(0, 200)}`)
  }
  if (!response.body) throw new Error('No response body from Ollama')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.trim()) continue
      try {
        const data = JSON.parse(line)
        if (data.message?.content) {
          text += data.message.content
          onStream?.(data.message.content)
        }
        if (data.done) {
          inputTokens = data.prompt_eval_count ?? 0
          outputTokens = data.eval_count ?? 0
          onUsage?.({ inputTokens, outputTokens, model: config.model, provider: 'ollama' })
        }
      } catch {}
    }
  }

  if (buffer.trim()) {
    try {
      const data = JSON.parse(buffer)
      if (data.message?.content) {
        text += data.message.content
        onStream?.(data.message.content)
      }
      if (data.done) {
        inputTokens = data.prompt_eval_count ?? 0
        outputTokens = data.eval_count ?? 0
        onUsage?.({ inputTokens, outputTokens, model: config.model, provider: 'ollama' })
      }
    } catch {}
  }

  return text
}

// ─── JSON parsing ─────────────────────────────────────────────────────────────

function parseJSON(raw: string): unknown {
  let text = raw.trim()
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (fenced) text = fenced[1].trim()

  const start = text.indexOf('{')
  if (start === -1) throw new Error('No JSON object found in AI response')
  text = text.slice(start)

  let depth = 0, inString = false, escape = false, end = -1
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (escape) { escape = false; continue }
    if (ch === '\\' && inString) { escape = true; continue }
    if (ch === '"') { inString = !inString; continue }
    if (inString) continue
    if (ch === '{') depth++
    else if (ch === '}') { depth--; if (depth === 0) { end = i; break } }
  }

  let candidate: string
  if (end !== -1) {
    candidate = text.slice(0, end + 1)
  } else {
    candidate = text
    if (inString) candidate += '"'
    candidate += '}'.repeat(Math.max(1, depth))
  }

  // Strip trailing commas (common AI output error)
  candidate = candidate.replace(/,\s*([\]}])/g, '$1')

  try {
    return JSON.parse(candidate)
  } catch {
    for (let i = candidate.length - 1; i > 10; i--) {
      if (candidate[i] === '}') {
        try { return JSON.parse(candidate.slice(0, i + 1)) } catch {}
      }
    }
    throw new Error('AI response JSON was malformed. Try a larger or more capable model.')
  }
}
