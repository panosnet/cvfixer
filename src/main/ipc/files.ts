import { IpcMain, dialog } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import { parseFile } from '../services/fileParser'
import { fetchTextFromURL } from '../services/urlFetcher'

const MAX_FILE_SIZE_MB = 50

export function registerFileHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('files:openCV', async () => {
    try {
      const result = await dialog.showOpenDialog({
        title: 'Open CV File',
        filters: [
          { name: 'CV Documents', extensions: ['pdf', 'docx', 'rtf', 'txt'] },
          { name: 'All Files', extensions: ['*'] },
        ],
        properties: ['openFile'],
      })

      if (result.canceled || !result.filePaths[0]) return null

      const filePath = result.filePaths[0]
      const text = await parseFile(filePath)
      const fileName = path.basename(filePath)
      return { text, fileName, filePath }
    } catch (e: any) {
      return { error: e?.message ?? 'Failed to open file' }
    }
  })

  ipcMain.handle('files:parseCV', async (_event, filePath: string) => {
    try {
      const ext = path.extname(filePath).toLowerCase()
      if (!['.pdf', '.docx', '.rtf', '.txt'].includes(ext)) {
        return { error: `Unsupported file type: ${ext}. Accepted: PDF, DOCX, RTF, TXT.` }
      }
      const stats = await fs.promises.stat(filePath)
      if (stats.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        return { error: `File too large (${(stats.size / 1024 / 1024).toFixed(1)}MB). Maximum is ${MAX_FILE_SIZE_MB}MB.` }
      }
      const text = await parseFile(filePath)
      return { text }
    } catch (e: any) {
      return { error: e?.message ?? 'Failed to parse file' }
    }
  })

  ipcMain.handle('files:fetchURL', async (_event, url: string) => {
    try {
      const result = await fetchTextFromURL(url)
      return { success: !result.error || result.isJsBlocked, ...result }
    } catch (e: any) {
      return { success: false, error: e?.message ?? 'Unknown error' }
    }
  })
}
