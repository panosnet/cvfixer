import { IpcMain } from 'electron'
import { analyzeCV, generateCoverLetter, chatEditCV, AIConfig } from '../services/aiService'

export function registerAIHandlers(ipcMain: IpcMain): void {
  ipcMain.handle(
    'ai:analyzeCV',
    async (event, config: AIConfig, cvText: string, jobDescription: string) => {
      try {
        const result = await analyzeCV(
          config, cvText, jobDescription,
          (chunk) => { if (!event.sender.isDestroyed()) event.sender.send('ai:stream', chunk) },
          (usage) => { if (!event.sender.isDestroyed()) event.sender.send('ai:usage', usage) }
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
    async (event, config: AIConfig, cv: unknown, message: string) => {
      try {
        const result = await chatEditCV(
          config, cv as any, message,
          (chunk) => { if (!event.sender.isDestroyed()) event.sender.send('ai:chatStream', chunk) }
        )
        return { success: true, cv: result }
      } catch (e: any) {
        return { success: false, error: e?.message ?? String(e) }
      }
    }
  )
}
