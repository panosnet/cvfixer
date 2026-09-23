import { IpcMain, BrowserWindow, dialog } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { exportToDocx } from '../services/docxExporter'

const ALL_FONTS = `https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;600;700&family=Montserrat:wght@300;400;500;600;700&family=Lato:wght@300;400;700&family=Source+Serif+4:wght@400;600&family=Raleway:wght@300;400;500;600;700&family=Roboto:wght@300;400;500;700&family=Open+Sans:wght@300;400;600;700&family=Nunito:wght@300;400;600;700&family=Source+Sans+3:wght@300;400;600;700&display=swap`

const PRINT_CSS = `
  @page {
    size: A4;
    margin: 0;
  }
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    box-sizing: border-box;
  }
  html, body {
    margin: 0;
    padding: 0;
    width: 210mm;
  }

  /* Kill minHeight — it forces a full-page gap when content overflows to page 2+ */
  [style*="min-height"] {
    min-height: auto !important;
  }

  /* Headings stay with their content */
  h1, h2, h3 {
    page-break-after: avoid;
    break-after: avoid;
  }

  /* Individual entries stay together — but sections CAN split across pages */
  .experience-entry, .education-entry, .project-entry {
    page-break-inside: avoid;
    break-inside: avoid;
  }
  li {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  /* Prevent orphaned headings and widowed lines */
  p, li { orphans: 2; widows: 2; }

  /* Links stay clickable in PDF */
  a { color: inherit; }
`

export function registerExportHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('export:pdf', async (_event, htmlContent: string, candidateName?: string) => {
    const focusedWin = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0]
    if (!focusedWin) return { success: false, error: 'No window available' }

    const safeName = candidateName
      ? candidateName.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-').toLowerCase()
      : ''
    const defaultFile = safeName ? `${safeName}-cv.pdf` : 'my-cv.pdf'

    const savePath = await dialog.showSaveDialog(focusedWin, {
      title: 'Save CV as PDF',
      defaultPath: defaultFile,
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    })

    if (savePath.canceled || !savePath.filePath) return { success: false }

    // Extract the background color from the template root element's inline style
    // Chromium serializes hex colors as rgb() in innerHTML, so handle both formats
    const bgMatch = htmlContent.match(/background:\s*((?:rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[\d.]+)?\s*\))|(?:#[0-9a-fA-F]{3,8}))/)
    // Only accept validated hex or rgb() — default to white if anything else matches
    const rawBg = bgMatch ? bgMatch[1].trim() : '#ffffff'
    const bgColor = /^(#[0-9a-fA-F]{3,8}|rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[\d.]+)?\s*\))$/.test(rawBg) ? rawBg : '#ffffff'

    const htmlPage = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${ALL_FONTS}" rel="stylesheet">
  <style>${PRINT_CSS}
  body { background: ${bgColor} !important; }
  </style>
</head>
<body>${htmlContent}</body>
</html>`

    // Use a random temp dir to avoid TOCTOU race
    let tmpDir: string | null = null
    const win = new BrowserWindow({
      show: false,
      width: 794,
      height: 1123,
      useContentSize: true,
      webPreferences: { sandbox: true },
    })

    try {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cvfixer-'))
      const tmpPath = path.join(tmpDir, 'export.html')
      await fs.promises.writeFile(tmpPath, htmlPage, 'utf-8')
      await win.loadFile(tmpPath)

      // Wait for Google Fonts to fully load
      await win.webContents.executeJavaScript('document.fonts.ready')
      await new Promise((r) => setTimeout(r, 500))

      const pdfData = await win.webContents.printToPDF({
        printBackground: true,
        pageSize: 'A4',
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
      })

      await fs.promises.writeFile(savePath.filePath!, pdfData)
      return { success: true, path: savePath.filePath }
    } catch (e: any) {
      return { success: false, error: e?.message ?? 'Export failed' }
    } finally {
      if (!win.isDestroyed()) win.close()
      if (tmpDir) {
        try { fs.rmSync(tmpDir, { recursive: true, force: true }) } catch {}
      }
    }
  })

  ipcMain.handle('export:docx', async (_event, cvJson: string, candidateName?: string) => {
    const focusedWin = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0]
    if (!focusedWin) return { success: false, error: 'No window available' }

    const safeName = candidateName
      ? candidateName.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-').toLowerCase()
      : ''
    const defaultFile = safeName ? `${safeName}-cv.docx` : 'my-cv.docx'

    const savePath = await dialog.showSaveDialog(focusedWin, {
      title: 'Save CV as Word Document',
      defaultPath: defaultFile,
      filters: [{ name: 'Word Document', extensions: ['docx'] }],
    })

    if (savePath.canceled || !savePath.filePath) return { success: false }

    try {
      const cv = JSON.parse(cvJson)
      const buffer = await exportToDocx(cv)
      await fs.promises.writeFile(savePath.filePath!, buffer)
      return { success: true, path: savePath.filePath }
    } catch (e: any) {
      return { success: false, error: e?.message ?? 'DOCX export failed' }
    }
  })
}
