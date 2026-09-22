<p align="center">
  <h1 align="center">CV Fixer</h1>
  <p align="center">
    <strong>AI-powered CV optimizer that gets you past ATS filters and in front of recruiters.</strong>
  </p>
  <p align="center">
    Desktop app &nbsp;·&nbsp; Works offline with Ollama &nbsp;·&nbsp; PDF &amp; DOCX export &nbsp;·&nbsp; 5 professional templates
  </p>
</p>

---

## What it does

CV Fixer takes your existing CV, analyzes it against a job description, and rewrites it to maximize your chances of getting an interview. It scores your CV, identifies keyword gaps, rewrites weak bullets into achievement-driven statements, and generates a polished visual CV you can export as PDF or DOCX.

**The problem:** Most CVs are written to describe responsibilities. Recruiters and ATS systems look for quantified achievements, targeted keywords, and clean formatting. The gap between the two is where opportunities die.

**The solution:** Paste your CV and a job description. The AI rewrites your CV to lead with impact, match the job's keywords, and present everything in a recruiter-optimized layout — all in under 60 seconds.

## Features

### AI Analysis & Rewriting
- **CV Scoring** — overall score + ATS compatibility score with detailed breakdown (quantification, keywords, summary quality, format, completeness)
- **Keyword Gap Analysis** — shows which job description keywords are present and which are missing from your CV
- **Smart Bullet Rewriting** — transforms responsibility-based bullets into achievement-driven statements with metrics
- **Achievement Enrichment** — identifies your 3-5 biggest career achievements and makes them the lead bullet in each role
- **Section Preservation** — certifications, publications, volunteer work, projects — nothing gets dropped
- **Interview Prep** — generates likely interview questions, STAR stories from your experience, and technical topics to review
- **Recruiter View** — shows how a recruiter would perceive your CV in a 6-second scan

### Visual CV Builder
- **5 Professional Templates** — Classic, Modern, Minimal, Creative, Executive — each designed for different industries
- **ATS Safety Ratings** — each template shows whether it's ATS-safe, risky, or poor for automated parsing
- **Live Customization** — change colors (8 presets + custom picker), heading fonts, body fonts — all with instant preview
- **Inline Content Editor** — edit every field directly: name, title, contact, summary, experience bullets, education, skills, certifications, projects
- **AI Chat Editor** — tell the AI what to change in natural language ("make my summary shorter", "add Python to skills", "rewrite first job bullets")
- **Zoom Controls** — scale the preview from 40% to 150%

### Export
- **PDF Export** — pixel-perfect PDF with Google Fonts, correct backgrounds, clickable links, proper page breaks
- **ATS-Safe PDF** — one-click export of a Classic-template version optimized for ATS parsing
- **DOCX Export** — Word document with all sections, clickable hyperlinks, and professional formatting

### AI Providers
- **Ollama (Free, Offline)** — run locally with any model. Auto-detects available RAM and recommends the right model size
- **Anthropic (Claude)** — Claude Sonnet, Haiku, Opus
- **OpenAI (GPT)** — GPT-4o, GPT-4o-mini, o1, o3
- **Google (Gemini)** — Gemini Pro, Flash

The app auto-detects your system specs (RAM, CPU, Apple Silicon) and recommends which Ollama models will run well on your machine.

### Other
- **Drag & Drop** — drop a PDF, DOCX, RTF, or TXT file to import your CV
- **URL Fetching** — paste a job posting URL to auto-extract the job description
- **Session Persistence** — your CV, analysis results, edits, and design choices survive app restarts
- **Cross-Platform** — macOS (Apple Silicon + Intel), Windows, Linux

## Screenshots

> Coming soon — run the app locally to see it in action.

## Getting Started

### Prerequisites

- **Node.js 20+** — [Download](https://nodejs.org/)
- **Ollama** (optional, for free local AI) — [Download](https://ollama.ai/)

### Install & Run

```bash
# Clone the repo
git clone https://github.com/panosnet/cvfixer.git
cd cvfixer

# Install dependencies
npm install

# Start the app in development mode
npm run dev
```

### Using Ollama (Free, Offline)

1. Install Ollama from [ollama.ai](https://ollama.ai/)
2. Pull a model: `ollama pull llama3.1:8b` (or any model that fits your RAM)
3. Open CV Fixer — it will auto-detect Ollama and show available models

### Using Paid APIs

1. Open the app and go to **API Keys** in the sidebar
2. Enter your API key for Anthropic, OpenAI, or Google
3. Select a model from the **Models** page

## Build for Production

```bash
# Build for your current platform
npm run dist

# Platform-specific builds
npm run dist:mac     # macOS (DMG — arm64 + x64)
npm run dist:win     # Windows (NSIS installer)
npm run dist:linux   # Linux (AppImage)
```

Built packages are output to the `dist/` directory.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Electron 32 + electron-vite |
| Frontend | React 18 + TypeScript + Tailwind CSS |
| AI | Anthropic SDK, OpenAI SDK, Google Generative AI, Ollama REST API |
| File Parsing | pdf-parse (PDF), mammoth (DOCX), custom RTF/TXT parsers |
| Export | Electron printToPDF (PDF), docx library (DOCX) |
| State | Custom module-level reactive store with localStorage persistence |

## Project Structure

```
src/
├── main/                    # Electron main process
│   ├── index.ts             # App lifecycle, window creation
│   ├── ipc/                 # IPC handlers (ai, export, files, ollama, system)
│   └── services/            # Business logic (aiService, docxExporter, fileParser, etc.)
├── preload/                 # Preload bridge (contextIsolation API)
│   └── index.ts
└── renderer/                # React frontend
    └── src/
        ├── pages/           # Main views (Welcome, ModelManager, CVWorkspace, CVBuilder)
        ├── components/      # UI components + 5 CV templates
        ├── store/           # Reactive state management
        └── types/           # TypeScript interfaces
```

## How It Works

1. **Upload** your CV (PDF, DOCX, RTF, or plain text) and optionally paste a job description
2. **Analyze** — the AI scores your CV, identifies gaps, rewrites every section, and suggests a visual design
3. **Customize** — switch templates, tweak colors and fonts, edit content inline, or chat with the AI to make changes
4. **Export** — download as a styled PDF, an ATS-safe PDF, or a DOCX file

The AI prompt is engineered to:
- Preserve every position, date, and company from the original CV (no hallucinated jobs)
- Lead each role with the strongest achievement, enriched with metrics and business impact
- Match job description keywords naturally without keyword stuffing
- Maintain all sections: certifications, publications, volunteer work, projects
- Suggest a template, color palette, and font pairing based on detected industry

## License

MIT

---

<p align="center">
  <sub>Built to help people land the job they deserve.</sub>
</p>
