<p align="center">
  <h1 align="center">CV Fixer</h1>
  <p align="center">
    <strong>AI-powered CV optimizer that gets you past ATS filters and in front of recruiters.</strong>
  </p>
  <p align="center">
    Desktop app &nbsp;·&nbsp; Works offline with Ollama &nbsp;·&nbsp; PDF &amp; DOCX export &nbsp;·&nbsp; 5 professional templates
  </p>
  <p align="center">
    <a href="https://github.com/panosnet/cvfixer/releases/latest"><img src="https://img.shields.io/github/v/release/panosnet/cvfixer?label=Download&style=for-the-badge&color=7c3aed" alt="Download latest release"></a>
  </p>
</p>

---

## Install

### Option A — Download the app (no coding required)

Go to the [**Releases page**](https://github.com/panosnet/cvfixer/releases/latest) and download the file for your platform:

| Platform | File to download |
|----------|-----------------|
| macOS Apple Silicon (M1/M2/M3/M4) | `CV.Fixer-*-arm64.dmg` |
| macOS Intel | `CV.Fixer-*-x64.dmg` |
| Windows | `CV.Fixer.Setup.*.exe` |
| Linux | `CV.Fixer-*.AppImage` |

**macOS first launch:** Right-click the app → **Open** → **Open**. You only need to do this once (macOS requires this for apps not from the App Store).

Or remove the quarantine flag from Terminal:
```sh
xattr -d com.apple.quarantine "/Applications/CV Fixer.app"
```

**Linux:** Make the AppImage executable before running:
```sh
chmod +x CV.Fixer-*.AppImage && ./CV.Fixer-*.AppImage
```

---

### Option B — Run from source (developers)

**One command:**
```sh
git clone https://github.com/panosnet/cvfixer.git && cd cvfixer && bash scripts/setup.sh
```

Then start the app:
```sh
npm run dev
```

**Requirements:** Node.js 20+ ([download](https://nodejs.org))

---

## First run

1. **Choose an AI model** — either install [Ollama](https://ollama.ai) (free, runs locally) or paste an API key for Claude, GPT, or Gemini
2. **Upload your CV** — drag & drop a PDF or DOCX, or paste your CV text
3. **Add a job description** — paste from the job posting, or drop a URL (recommended — improves results significantly)
4. **Click Analyze & Rewrite** — the AI scores your CV, rewrites every bullet, and designs a visual CV

That's it. The whole flow takes under 2 minutes.

---

## What it does

CV Fixer takes your existing CV, analyzes it against a job description, and rewrites it to maximize your chances of getting an interview. It scores your CV, identifies keyword gaps, rewrites weak bullets into achievement-driven statements, and generates a polished visual CV you can export as PDF or DOCX.

**The problem:** Most CVs are written to describe responsibilities. Recruiters and ATS systems look for quantified achievements, targeted keywords, and clean formatting. The gap between the two is where opportunities die.

**The solution:** The AI rewrites your CV to lead with impact, match the job's keywords, and present everything in a recruiter-optimized layout — in under 60 seconds.

---

## AI Providers

| Provider | Cost | Privacy | Setup |
|----------|------|---------|-------|
| **Ollama** | Free | Fully local, nothing leaves your machine | [Install Ollama](https://ollama.ai), pull a model |
| **Anthropic (Claude)** | Pay-as-you-go | Sent to Anthropic API | Paste API key in settings |
| **OpenAI (GPT)** | Pay-as-you-go | Sent to OpenAI API | Paste API key in settings |
| **Google (Gemini)** | Free tier + pay | Sent to Google API | Paste API key in settings |

For best results with free local AI, the app recommends a model size based on your available RAM. 8GB RAM → 7B model, 16GB → 14B model, 32GB → 32B model.

---

## Features

### AI Analysis
- **CV Score** — overall + ATS score with breakdown (quantification, keywords, summary, format, completeness)
- **Keyword gap analysis** — which JD keywords are missing from your CV
- **Achievement enrichment** — identifies your 3-5 biggest career wins and makes them the lead bullet in each role
- **Bullet rewriting** — weak responsibility statements → strong achievement-driven bullets with metrics
- **Section preservation** — certifications, publications, volunteer work, projects — nothing gets dropped
- **Anti-hallucination** — strict rules: never adds languages, skills, or facts not in your original CV
- **Interview prep** — likely questions, STAR stories, technical topics to review

### Visual CV Builder
- **5 templates** — Classic, Modern, Minimal, Creative, Executive (each rated for ATS compatibility)
- **Live customization** — colors (8 presets + custom), heading font, body font
- **Full content editor** — edit every field: name, contact, summary, experience, education, skills, certifications, achievements, publications, volunteer, projects
- **AI chat editor** — "make my summary shorter", "add Python to skills", "rewrite first job bullets"
- **Custom instructions** — tell the AI your preferences before analyzing ("focus on leadership", "keep formal tone")
- **Prompt viewer** — see and copy the exact prompt being sent to the AI

### Export
- **PDF** — pixel-perfect with Google Fonts, clickable links, proper page breaks
- **ATS-safe PDF** — one-click Classic template export optimized for ATS parsing
- **DOCX** — Word document with all sections and clickable hyperlinks

### Transparency
- **AI Log** — permanent history of all AI operations with full raw output, filterable and copyable
- **Thinking display** — see the AI's raw stream output live during analysis and chat edits

---

## Build from source

```sh
# macOS (produces arm64 + x64 DMG)
npm run dist:mac

# Windows
npm run dist:win

# Linux
npm run dist:linux
```

Output goes to `dist/`.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Electron 32 + electron-vite |
| Frontend | React 18 + TypeScript + Tailwind CSS |
| AI | Anthropic SDK, OpenAI SDK, Google Generative AI, Ollama REST API |
| File parsing | pdf-parse, mammoth, custom RTF/TXT |
| Export | Electron printToPDF, docx library |

See [ARCHITECTURE.md](ARCHITECTURE.md) for a complete file-by-file breakdown.

---

## Privacy

- **Ollama:** Nothing leaves your machine. All processing is local.
- **Paid APIs:** Your CV text is sent to the respective API provider for processing. It is not stored or used to train models (per each provider's API terms).
- **API keys:** Stored in your local browser profile. Never transmitted anywhere except to the provider's API.

---

<p align="center">
  <sub>Built to help people land the job they deserve.</sub>
</p>
