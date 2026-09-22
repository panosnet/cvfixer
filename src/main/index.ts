import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { registerOllamaHandlers } from './ipc/ollama'
import { registerFileHandlers } from './ipc/files'
import { registerAIHandlers } from './ipc/ai'
import { registerExportHandlers } from './ipc/export'
import { registerSystemHandlers } from './ipc/system'

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#0f172a',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
    },
    show: false,
  })

  win.once('ready-to-show', () => win.show())

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
    win.webContents.openDevTools()
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}

app.whenReady().then(() => {
  createWindow()

  registerSystemHandlers(ipcMain)
  registerOllamaHandlers(ipcMain)
  registerFileHandlers(ipcMain)
  registerAIHandlers(ipcMain)
  registerExportHandlers(ipcMain)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

process.on('uncaughtException', (err) => {
  if (err.message?.includes('EPIPE') || err.message?.includes('write EPIPE')) return
  console.error('Uncaught exception:', err)
})
