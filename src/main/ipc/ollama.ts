import { IpcMain } from 'electron'
import {
  isOllamaRunning,
  isOllamaInstalled,
  startOllama,
  listInstalledModels,
  pullModel,
  deleteModel,
  getSystemRAM,
  openOllamaDownloadPage,
  installOllamaLinux,
} from '../services/ollamaService'

export function registerOllamaHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('ollama:status', async () => {
    try {
      const running = await isOllamaRunning()
      const installed = running ? true : await isOllamaInstalled()
      const ram = getSystemRAM()
      return { running, installed, ram, platform: process.platform }
    } catch (e: any) {
      return { running: false, installed: false, ram: 8, platform: process.platform }
    }
  })

  ipcMain.handle('ollama:start', async () => {
    try {
      await startOllama()
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })

  ipcMain.handle('ollama:openDownload', () => {
    openOllamaDownloadPage()
  })

  ipcMain.handle('ollama:installLinux', async (event) => {
    try {
      await installOllamaLinux((msg) => {
        event.sender.send('ollama:installProgress', msg)
      })
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })

  ipcMain.handle('ollama:listModels', async () => {
    try {
      return await listInstalledModels()
    } catch {
      return []
    }
  })

  ipcMain.handle('ollama:pullModel', async (event, modelName: string) => {
    try {
      await pullModel(modelName, (progress) => {
        event.sender.send('ollama:pullProgress', { modelName, ...progress })
      })
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })

  ipcMain.handle('ollama:deleteModel', async (_event, modelName: string) => {
    try {
      await deleteModel(modelName)
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })
}
