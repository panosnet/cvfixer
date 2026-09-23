import { IpcMain } from 'electron'
import { analyzeCV, generateCoverLetter, chatEditCV, CV_ANALYSIS_PROMPT, AIConfig } from '../services/aiService'

export function registerAIHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('ai:getPrompt', (_event, cvText: string, jobDescription: string, customInstructions?: string) => {
    return CV_ANALYSIS_PROMPT(cvText || '(paste your CV here)', jobDescription || '', customInstructions)
  })
  ipcMain.handle(
    'ai:analyzeCV',
    async (event, config: AIConfig, cvText: string, jobDescription: string, customInstructions?: string) => {
      try {
        const result = await analyzeCV(
          config, cvText, jobDescription,
          (chunk) => { if (!event.sender.isDestroyed()) event.sender.send('ai:stream', chunk) },
          (usage) => { if (!event.sender.isDestroyed()) event.sender.send('ai:usage', usage) },
          customInstructions
        )
        return { success: true, result }
      } catch (e: any) {
        return { success: false, error: e?.message ?? String(e) }
      }
    }
  )

  ipcMain.handle(
    'ai:generateCoverLetter',
    async (event, config: AIConfig, cv: unknown, jobDescription: string, tone: 'professional' | 'conversational') => {
      try {
        const text = await generateCoverLetter(
          config, cv as any, jobDescription, tone,
          (chunk) => { if (!event.sender.isDestroyed()) event.sender.send('ai:coverLetterStream', chunk) }
        )
        return { success: true, text }
      } catch (e: any) {
        return { success: false, error: e?.message ?? String(e) }
      }
    }
  )

  ipcMain.handle(
    'ai:chatEditCV',
    async (event, config: AIConfig, cv: unknown, message: string, customInstructions?: string) => {
      try {
        const result = await chatEditCV(
          config, cv as any, message,
          (chunk) => { if (!event.sender.isDestroyed()) event.sender.send('ai:chatStream', chunk) },
          customInstructions
        )
        return { success: true, cv: result }
      } catch (e: any) {
        return { success: false, error: e?.message ?? String(e) }
      }
    }
  )
}
