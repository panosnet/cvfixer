import { IpcMain } from 'electron'
import { getSystemInfo } from '../services/systemInfo'

export function registerSystemHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('system:info', () => {
    try {
      return getSystemInfo()
    } catch {
      return null
    }
  })
}
