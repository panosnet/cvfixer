import { app, BrowserWindow, ipcMain, session } from 'electron'
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
  // Content Security Policy — applied only in production (dev needs HMR websockets)
  if (!process.env['ELECTRON_RENDERER_URL']) {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            [
              "default-src 'self' 'unsafe-inline'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob:",
              "connect-src 'self' http://localhost:11434 https://api.anthropic.com https://api.openai.com https://generativelanguage.googleapis.com https://fonts.googleapis.com https://fonts.gstatic.com",
              "frame-src 'none'",
              "object-src 'none'",
            ].join('; '),
          ],
        },
      })
    })
  }

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
