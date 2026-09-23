import type { ModelConfig, CVAnalysisResult } from './index'

// Helper interfaces declared before the global augmentation
interface OllamaAPI {
  status: () => Promise<{ running: boolean; installed: boolean; ram: number; platform: string }>
  start: () => Promise<{ success: boolean; error?: string }>
  openDownload: () => void
  installLinux: () => Promise<{ success: boolean; error?: string }>
  listModels: () => Promise<Array<{ name: string; size: number; modified_at: string }>>
  pullModel: (name: string) => Promise<{ success: boolean; error?: string }>
  deleteModel: (name: string) => Promise<{ success: boolean; error?: string }>
  onPullProgress: (cb: (data: { modelName: string; status: string; percent: number }) => void) => () => void
  onInstallProgress: (cb: (msg: string) => void) => () => void
}

interface FilesAPI {
  openCV: () => Promise<{ text: string; fileName: string; filePath: string; error?: string } | null>
  parseCV: (filePath: string) => Promise<{ text?: string; error?: string }>
  fetchURL: (url: string) => Promise<{
    success: boolean
    text?: string
    error?: string
    isJsBlocked?: boolean
  }>
}

interface TokenUsage {
  inputTokens: number
  outputTokens: number
  model: string
  provider: string
}

interface AIAPI {
  getPrompt: (cvText: string, jobDescription: string, customInstructions?: string) => Promise<string>
  analyzeCV: (config: ModelConfig, cvText: string, jobDescription: string, customInstructions?: string) => Promise<{
    success: boolean
    result?: CVAnalysisResult
    error?: string
  }>
  onStream: (cb: (chunk: string) => void) => () => void
  onUsage: (cb: (usage: TokenUsage) => void) => () => void
  generateCoverLetter: (config: ModelConfig, cv: unknown, jobDescription: string, tone: 'professional' | 'conversational') => Promise<{ success: boolean; text?: string; error?: string }>
  onCoverLetterStream: (cb: (chunk: string) => void) => () => void
  chatEditCV: (config: ModelConfig, cv: unknown, message: string, customInstructions?: string) => Promise<{ success: boolean; cv?: import('./index').RewrittenCV; error?: string }>
  onChatStream: (cb: (chunk: string) => void) => () => void
}

interface ExportAPI {
  pdf: (html: string, candidateName?: string) => Promise<{ success: boolean; path?: string; error?: string }>
  docx: (cvJson: string, candidateName?: string) => Promise<{ success: boolean; path?: string; error?: string }>
}

// IMPORTANT: use `declare global` so this augments the actual global Window
// (a plain `interface Window` inside a module is module-scoped and invisible globally)
interface SystemInfo {
  totalRAM: number
  freeRAM: number
  usedRAM: number
  cpuModel: string
  cpuCores: number
  cpuSpeed: number
  platform: string
  hasAppleSilicon: boolean
}

declare global {
  interface Window {
    api: {
      ollama: OllamaAPI
      files: FilesAPI
      ai: AIAPI
      export: ExportAPI
      platform: string
      system: {
        info: () => Promise<SystemInfo | null>
      }
    }
  }
}

export type {} // keep this as a module so imports above work
