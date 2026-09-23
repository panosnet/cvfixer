import { useState, useEffect } from 'react'
import type {
  ModelConfig, CVAnalysisResult, RewrittenCV,
  DesignSuggestion, TemplateType, Toast
} from '../types'

export interface ActivityLogEntry {
  id: string
  timestamp: number
  type: 'analysis' | 'chat'
  label: string
  content: string
  model: string
}

export interface AppState {
  page: 'welcome' | 'models' | 'apikeys' | 'workspace' | 'builder'
  ollamaRunning: boolean
  ollamaInstalled: boolean
  systemRAM: number     // total RAM in GB
  freeRAM: number       // available RAM right now, updated periodically
  cpuModel: string
  cpuCores: number
  hasAppleSilicon: boolean
  platform: string
  activeConfig: ModelConfig | null
  apiKeys: { anthropic: string; openai: string; google: string }
  cvText: string
  cvFileName: string
  jobDescription: string
  analysisResult: CVAnalysisResult | null
  isAnalyzing: boolean
  streamBuffer: string
  currentCV: RewrittenCV | null
  design: DesignSuggestion | null
  selectedTemplate: TemplateType
  templateOverridden: boolean
  pdfExported: boolean
  toasts: Toast[]
  tokenUsage: { inputTokens: number; outputTokens: number; model: string; provider: string } | null
  analysisStartTime: number | null
  customInstructions: string
  aiActivityLog: ActivityLogEntry[]
}

// ─── Persistence ─────────────────────────────────────────────────────────────

function saveSession(s: AppState) {
  try {
    localStorage.setItem('cvfixer_session', JSON.stringify({
      activeConfig: s.activeConfig,
      cvText: s.cvText.slice(0, 60000),
      cvFileName: s.cvFileName,
      jobDescription: s.jobDescription.slice(0, 15000),
      selectedTemplate: s.selectedTemplate,
      templateOverridden: s.templateOverridden,
      pdfExported: s.pdfExported,
      customInstructions: s.customInstructions,
    }))
  } catch {}
  try {
    const logJson = JSON.stringify(s.aiActivityLog)
    if (logJson.length < 400_000) localStorage.setItem('cvfixer_activityLog', logJson)
  } catch {}
  try {
    if (s.analysisResult) {
      const json = JSON.stringify(s.analysisResult)
      if (json.length < 500_000) localStorage.setItem('cvfixer_result', json)
    } else {
      localStorage.removeItem('cvfixer_result')
    }
  } catch {}
  try {
    if (s.currentCV) {
      const cvJson = JSON.stringify(s.currentCV)
      if (cvJson.length < 500_000) localStorage.setItem('cvfixer_editedCV', cvJson)
    } else {
      localStorage.removeItem('cvfixer_editedCV')
    }
    if (s.design) {
      localStorage.setItem('cvfixer_editedDesign', JSON.stringify(s.design))
    } else {
      localStorage.removeItem('cvfixer_editedDesign')
    }
  } catch {}
}

// Debounced save — used for high-frequency edits (keystroke-level)
let saveTimer: ReturnType<typeof setTimeout> | null = null
function debouncedSave(s: AppState) {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => saveSession(s), 500)
}

function loadSession(): Partial<AppState> {
  try {
    const session = JSON.parse(localStorage.getItem('cvfixer_session') || '{}')
    let analysisResult: CVAnalysisResult | null = null
    let currentCV: RewrittenCV | null = null
    let design: DesignSuggestion | null = null
    try {
      const r = localStorage.getItem('cvfixer_result')
      if (r) {
        analysisResult = JSON.parse(r)
        currentCV = analysisResult?.rewrittenCV ?? null
        design = analysisResult?.design ?? null
      }
    } catch {}
    try {
      const editedCV = localStorage.getItem('cvfixer_editedCV')
      if (editedCV) currentCV = JSON.parse(editedCV)
      const editedDesign = localStorage.getItem('cvfixer_editedDesign')
      if (editedDesign) design = JSON.parse(editedDesign)
    } catch {}
    let aiActivityLog: ActivityLogEntry[] = []
    try {
      const log = localStorage.getItem('cvfixer_activityLog')
      if (log) aiActivityLog = JSON.parse(log)
    } catch {}
    return { ...session, analysisResult, currentCV, design, aiActivityLog }
  } catch {
    return {}
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────

const listeners = new Set<() => void>()

function getInitialKeys() {
  try { return JSON.parse(localStorage.getItem('cvfixer_keys') || '{}') } catch { return {} }
}

const savedKeys = getInitialKeys()
const persisted = loadSession()
let toastCounter = 0
let activityCounter = 0

let state: AppState = {
  page: 'welcome',
  ollamaRunning: false,
  ollamaInstalled: false,
  systemRAM: 0,
  freeRAM: 0,
  cpuModel: '',
  cpuCores: 0,
  hasAppleSilicon: false,
  platform: 'unknown',
  activeConfig: persisted.activeConfig ?? null,
  apiKeys: {
    anthropic: savedKeys.anthropic || '',
    openai: savedKeys.openai || '',
    google: savedKeys.google || '',
  },
  cvText: persisted.cvText ?? '',
  cvFileName: persisted.cvFileName ?? '',
  jobDescription: persisted.jobDescription ?? '',
  analysisResult: persisted.analysisResult ?? null,
  isAnalyzing: false,
  streamBuffer: '',
  currentCV: persisted.currentCV ?? null,
  design: persisted.design ?? null,
  selectedTemplate: persisted.selectedTemplate ?? 'modern',
  templateOverridden: persisted.templateOverridden ?? false,
  pdfExported: persisted.pdfExported ?? false,
  toasts: [],
  tokenUsage: null,
  analysisStartTime: null,
  customInstructions: persisted.customInstructions ?? '',
  aiActivityLog: persisted.aiActivityLog ?? [],
}

function notify() {
  listeners.forEach((l) => l())
}

function updateTransient(partial: Partial<AppState>) {
  state = { ...state, ...partial }
  notify()
}

function update(partial: Partial<AppState>) {
  state = { ...state, ...partial }
  saveSession(state)
  notify()
}

function updateDebounced(partial: Partial<AppState>) {
  state = { ...state, ...partial }
  debouncedSave(state)
  notify()
}

export const actions = {
  setPage: (page: AppState['page']) => updateTransient({ page }),

  setOllamaStatus: (s: { running: boolean; installed: boolean; ram: number; platform: string }) =>
    updateTransient({ ollamaRunning: s.running, ollamaInstalled: s.installed, systemRAM: s.ram, platform: s.platform }),

  setSystemInfo: (info: { totalRAM: number; freeRAM: number; cpuModel: string; cpuCores: number; hasAppleSilicon: boolean }) =>
    updateTransient({ systemRAM: info.totalRAM, freeRAM: info.freeRAM, cpuModel: info.cpuModel, cpuCores: info.cpuCores, hasAppleSilicon: info.hasAppleSilicon }),

  setActiveConfig: (activeConfig: ModelConfig | null) => update({ activeConfig }),

  setApiKey: (provider: 'anthropic' | 'openai' | 'google', key: string) => {
    const apiKeys = { ...state.apiKeys, [provider]: key }
    localStorage.setItem('cvfixer_keys', JSON.stringify(apiKeys))
    // Also patch the active config's apiKey so stale keys don't get used
    let activeConfig = state.activeConfig
    if (activeConfig && activeConfig.provider === provider) {
      activeConfig = { ...activeConfig, apiKey: key }
    }
    update({ apiKeys, activeConfig })
  },

  setCVText: (cvText: string, cvFileName?: string) =>
    update({ cvText, cvFileName: cvFileName !== undefined ? cvFileName : state.cvFileName }),

  setJobDescription: (jobDescription: string) => update({ jobDescription }),

  setIsAnalyzing: (isAnalyzing: boolean) => updateTransient({ isAnalyzing }),

  appendStream: (chunk: string) => {
    updateTransient({ streamBuffer: state.streamBuffer + chunk })
  },

  clearStream: () => updateTransient({ streamBuffer: '' }),

  clearAnalysisResult: () => update({ analysisResult: null, currentCV: null, design: null, tokenUsage: null, analysisStartTime: null }),

  startAnalysisTiming: () => updateTransient({ analysisStartTime: Date.now(), tokenUsage: null }),

  setTokenUsage: (tokenUsage: AppState['tokenUsage']) => updateTransient({ tokenUsage }),

  setCurrentCV: (currentCV: RewrittenCV) => update({ currentCV }),

  setDesign: (design: DesignSuggestion) =>
    update({ design, selectedTemplate: design.template, templateOverridden: false }),

  setSelectedTemplate: (selectedTemplate: TemplateType) =>
    update({ selectedTemplate, templateOverridden: true }),

  updateColors: (colors: Partial<DesignSuggestion['colors']>) => {
    if (!state.design) return
    update({ design: { ...state.design, colors: { ...state.design.colors, ...colors } } })
  },

  updateFonts: (fonts: Partial<DesignSuggestion['fonts']>) => {
    if (!state.design) return
    update({ design: { ...state.design, fonts: { ...state.design.fonts, ...fonts } } })
  },

  applyAnalysisResult: (result: CVAnalysisResult) => {
    const selectedTemplate = state.templateOverridden
      ? state.selectedTemplate
      : result.design.template
    update({
      analysisResult: result,
      currentCV: result.rewrittenCV,
      design: result.design,
      selectedTemplate,
    })
  },

  updateCurrentCV: (partial: Partial<RewrittenCV>) => {
    if (!state.currentCV) return
    // Ensure new fields always have defaults
    const base: Partial<RewrittenCV> = {
      coreCompetencies: [],
      achievements: [],
      publications: [],
      volunteer: [],
      ...state.currentCV,
    }
    updateDebounced({ currentCV: { ...base, ...partial } as RewrittenCV })
  },

  updateExperienceBullet: (expIndex: number, bulletIndex: number, value: string) => {
    if (!state.currentCV) return
    const experience = state.currentCV.experience.map((exp, i) =>
      i === expIndex
        ? { ...exp, bullets: (exp.bullets ?? []).map((b, j) => (j === bulletIndex ? value : b)) }
        : exp
    )
    updateDebounced({ currentCV: { ...state.currentCV, experience } })
  },

  addExperienceBullet: (expIndex: number) => {
    if (!state.currentCV) return
    const experience = state.currentCV.experience.map((exp, i) =>
      i === expIndex ? { ...exp, bullets: [...(exp.bullets ?? []), ''] } : exp
    )
    updateDebounced({ currentCV: { ...state.currentCV, experience } })
  },

  removeExperienceBullet: (expIndex: number, bulletIndex: number) => {
    if (!state.currentCV) return
    const experience = state.currentCV.experience.map((exp, i) =>
      i === expIndex
        ? { ...exp, bullets: (exp.bullets ?? []).filter((_, j) => j !== bulletIndex) }
        : exp
    )
    updateDebounced({ currentCV: { ...state.currentCV, experience } })
  },

  updateExperienceEntry: (expIndex: number, partial: Partial<RewrittenCV['experience'][0]>) => {
    if (!state.currentCV) return
    const experience = state.currentCV.experience.map((exp, i) =>
      i === expIndex ? { ...exp, ...partial } : exp
    )
    updateDebounced({ currentCV: { ...state.currentCV, experience } })
  },

  updateEducation: (index: number, partial: Partial<RewrittenCV['education'][0]>) => {
    if (!state.currentCV) return
    const education = state.currentCV.education.map((edu, i) =>
      i === index ? { ...edu, ...partial } : edu
    )
    updateDebounced({ currentCV: { ...state.currentCV, education } })
  },

  updateCertifications: (certifications: string[]) => {
    if (!state.currentCV) return
    updateDebounced({ currentCV: { ...state.currentCV, certifications } })
  },

  updateProject: (index: number, partial: Partial<RewrittenCV['projects'][0]>) => {
    if (!state.currentCV) return
    const projects = state.currentCV.projects.map((p, i) =>
      i === index ? { ...p, ...partial } : p
    )
    updateDebounced({ currentCV: { ...state.currentCV, projects } })
  },

  updateSkills: (category: 'technical' | 'soft' | 'languages', values: string[]) => {
    if (!state.currentCV) return
    updateDebounced({ currentCV: { ...state.currentCV, skills: { ...state.currentCV.skills, [category]: values } } })
  },

  addExperience: () => {
    if (!state.currentCV) return
    const entry = { title: '', company: '', location: '', startDate: '', endDate: 'Present', bullets: [''] }
    updateDebounced({ currentCV: { ...state.currentCV, experience: [...state.currentCV.experience, entry] } })
  },

  removeExperience: (index: number) => {
    if (!state.currentCV) return
    updateDebounced({ currentCV: { ...state.currentCV, experience: state.currentCV.experience.filter((_, i) => i !== index) } })
  },

  addEducation: () => {
    if (!state.currentCV) return
    const entry = { degree: '', institution: '', location: '', year: '', details: '' }
    updateDebounced({ currentCV: { ...state.currentCV, education: [...state.currentCV.education, entry] } })
  },

  removeEducation: (index: number) => {
    if (!state.currentCV) return
    updateDebounced({ currentCV: { ...state.currentCV, education: state.currentCV.education.filter((_, i) => i !== index) } })
  },

  addProject: () => {
    if (!state.currentCV) return
    const entry = { name: '', description: '', technologies: [] as string[] }
    updateDebounced({ currentCV: { ...state.currentCV, projects: [...state.currentCV.projects, entry] } })
  },

  removeProject: (index: number) => {
    if (!state.currentCV) return
    updateDebounced({ currentCV: { ...state.currentCV, projects: state.currentCV.projects.filter((_, i) => i !== index) } })
  },

  resetCurrentCV: () => {
    if (!state.analysisResult) return
    update({ currentCV: state.analysisResult.rewrittenCV, design: state.analysisResult.design, selectedTemplate: state.analysisResult.design.template, templateOverridden: false })
  },

  markPdfExported: () => update({ pdfExported: true }),

  setCustomInstructions: (customInstructions: string) =>
    update({ customInstructions: customInstructions.slice(0, 2000).replace(/[═]/g, '-') }),

  addActivityLog: (entry: Omit<ActivityLogEntry, 'id'>) => {
    const id = String(++activityCounter)
    const newEntry: ActivityLogEntry = { ...entry, content: entry.content.slice(0, 200_000) }
    Object.assign(newEntry, { id })
    // Budget-aware eviction: keep dropping oldest until total log is under ~400KB
    let log = [newEntry, ...state.aiActivityLog]
    while (log.length > 1 && JSON.stringify(log).length > 400_000) log.pop()
    if (log.length > 50) log = log.slice(0, 50)
    updateDebounced({ aiActivityLog: log })
  },

  clearActivityLog: () => update({ aiActivityLog: [] }),

  addToast: (message: string, type: Toast['type'] = 'info') => {
    if (state.toasts.length >= 5) {
      const id = String(++toastCounter)
      updateTransient({ toasts: [...state.toasts.slice(1), { id, message, type }] })
      setTimeout(() => actions.removeToast(id), type === 'error' ? 6000 : 4000)
      return
    }
    const id = String(++toastCounter)
    const toast: Toast = { id, message, type }
    updateTransient({ toasts: [...state.toasts, toast] })
    setTimeout(() => actions.removeToast(id), type === 'error' ? 6000 : 4000)
  },

  removeToast: (id: string) => {
    if (!state.toasts.some((t) => t.id === id)) return // already gone, skip re-render
    updateTransient({ toasts: state.toasts.filter((t) => t.id !== id) })
  },

  clearSession: () => {
    ;['cvfixer_session','cvfixer_result','cvfixer_editedCV','cvfixer_editedDesign','cvfixer_activityLog']
      .forEach(k => localStorage.removeItem(k))
    update({
      page: 'workspace', cvText: '', cvFileName: '', jobDescription: '',
      analysisResult: null, currentCV: null, design: null, streamBuffer: '',
      templateOverridden: false, pdfExported: false, selectedTemplate: 'modern',
    })
  },
}

export function useStore(): AppState & typeof actions {
  const [, forceUpdate] = useState(0)
  useEffect(() => {
    const handler = () => forceUpdate((n) => n + 1)
    listeners.add(handler)
    return () => { listeners.delete(handler) }
  }, [])
  return { ...state, ...actions }
}

export function getState(): AppState {
  return state
}
