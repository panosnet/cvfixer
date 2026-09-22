import { createRequire } from 'module'
const _require = createRequire(import.meta.url)

function getDocx() {
  return _require('docx') as typeof import('docx')
}

interface RewrittenCV {
  name: string
  title: string
  contact: {
    email: string; phone: string; location: string
    linkedin: string; github: string; website: string
  }
  summary: string
  coreCompetencies: string[]
  experience: Array<{
    title: string; company: string; location: string
    startDate: string; endDate: string; bullets: string[]
  }>
  education: Array<{
    degree: string; institution: string; location: string; year: string; details: string
  }>
  skills: { technical: string[]; soft: string[]; languages: string[] }
  certifications: string[]
  achievements: string[]
  publications: string[]
  volunteer: string[]
  projects: Array<{ name: string; description: string; technologies: string[]; url?: string; startDate?: string }>
}

export async function exportToDocx(cv: RewrittenCV): Promise<Buffer> {
  const {
    Document, Paragraph, TextRun, AlignmentType,
    BorderStyle, Packer, ExternalHyperlink,
  } = getDocx()

  const PRIMARY = '1e3a5f'
  const HR = new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: PRIMARY } },
    spacing: { after: 160 },
  })

  function heading(text: string) {
    return new Paragraph({
      children: [new TextRun({ text, bold: true, size: 24, color: PRIMARY, font: 'Calibri' })],
      spacing: { before: 240, after: 80 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: PRIMARY } },
    })
  }

  function bullet(text: string) {
    return new Paragraph({
      children: [new TextRun({ text, size: 20, font: 'Calibri' })],
      bullet: { level: 0 },
      spacing: { after: 40 },
    })
  }

  function para(text: string, opts?: { bold?: boolean; italic?: boolean; size?: number }) {
    return new Paragraph({
      children: [new TextRun({ text, bold: opts?.bold, italics: opts?.italic, size: opts?.size ?? 20, font: 'Calibri' })],
      spacing: { after: 60 },
    })
  }

  const children: any[] = []

  // Name
  children.push(new Paragraph({
    children: [new TextRun({ text: cv.name || '', bold: true, size: 52, color: PRIMARY, font: 'Calibri' })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
  }))

  // Title
  if (cv.title) {
    children.push(new Paragraph({
      children: [new TextRun({ text: cv.title, size: 24, color: '555555', font: 'Calibri' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
    }))
  }

  // Contact line with clickable links
  const contactChildren: any[] = []
  const plainParts = [cv.contact?.email, cv.contact?.phone, cv.contact?.location].filter(Boolean)
  const linkParts = [
    { value: cv.contact?.linkedin, prefix: 'https://linkedin.com/in/' },
    { value: cv.contact?.github, prefix: 'https://github.com/' },
    { value: cv.contact?.website, prefix: '' },
  ]

  if (plainParts.length > 0) {
    contactChildren.push(new TextRun({ text: plainParts.join('  |  '), size: 18, color: '555555', font: 'Calibri' }))
  }

  for (const lp of linkParts) {
    if (!lp.value) continue
    if (contactChildren.length > 0) {
      contactChildren.push(new TextRun({ text: '  |  ', size: 18, color: '555555', font: 'Calibri' }))
    }
    const href = lp.value.startsWith('http') ? lp.value : (lp.prefix ? lp.prefix + lp.value : lp.value)
    contactChildren.push(new ExternalHyperlink({
      children: [new TextRun({ text: lp.value, size: 18, color: PRIMARY, font: 'Calibri', underline: {} })],
      link: href,
    }))
  }

  if (contactChildren.length > 0) {
    children.push(new Paragraph({
      children: contactChildren,
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
    }))
  }

  children.push(HR)

  // Summary
  if (cv.summary) {
    children.push(heading('Professional Summary'))
    children.push(para(cv.summary))
  }

  // Core Competencies
  if (cv.coreCompetencies?.length > 0) {
    children.push(heading('Core Competencies'))
    children.push(para(cv.coreCompetencies.join('  ·  ')))
  }

  // Experience
  if (cv.experience?.length > 0) {
    children.push(heading('Experience'))
    for (const exp of cv.experience) {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: exp.title, bold: true, size: 22, font: 'Calibri' }),
          new TextRun({ text: `  |  ${exp.company}${exp.location ? `, ${exp.location}` : ''}`, size: 20, color: PRIMARY, font: 'Calibri' }),
        ],
        spacing: { after: 40 },
      }))
      children.push(para(`${exp.startDate} – ${exp.endDate}`, { italic: true, size: 18 }))
      for (const b of exp.bullets ?? []) {
        children.push(bullet(b))
      }
    }
  }

  // Education
  if (cv.education?.length > 0) {
    children.push(heading('Education'))
    for (const edu of cv.education) {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: edu.degree, bold: true, size: 22, font: 'Calibri' }),
          new TextRun({ text: `  |  ${edu.institution}${edu.location ? `, ${edu.location}` : ''}`, size: 20, color: PRIMARY, font: 'Calibri' }),
          new TextRun({ text: `  ${edu.year}`, size: 18, italics: true, font: 'Calibri' }),
        ],
        spacing: { after: 60 },
      }))
      if (edu.details) children.push(para(edu.details, { italic: true, size: 18 }))
    }
  }

  // Skills
  const allSkills = [
    cv.skills?.technical?.length ? `Technical: ${cv.skills.technical.join(', ')}` : null,
    cv.skills?.soft?.length ? `Soft Skills: ${cv.skills.soft.join(', ')}` : null,
    cv.skills?.languages?.length ? `Languages: ${cv.skills.languages.join(', ')}` : null,
  ].filter(Boolean)
  if (allSkills.length > 0) {
    children.push(heading('Skills'))
    for (const s of allSkills) children.push(para(s!))
  }

  // Certifications
  if (cv.certifications?.length > 0) {
    children.push(heading('Certifications'))
    for (const c of cv.certifications) children.push(bullet(c))
  }

  // Projects
  if (cv.projects?.length > 0) {
    children.push(heading('Projects'))
    for (const p of cv.projects) {
      const projectChildren: any[] = [new TextRun({ text: p.name, bold: true, size: 22, font: 'Calibri' })]
      if (p.startDate) {
        projectChildren.push(new TextRun({ text: `  (${p.startDate})`, size: 18, italics: true, color: '555555', font: 'Calibri' }))
      }
      children.push(new Paragraph({ children: projectChildren, spacing: { after: 40 } }))
      if (p.url) {
        children.push(new Paragraph({
          children: [
            new ExternalHyperlink({
              children: [new TextRun({ text: p.url, size: 18, color: PRIMARY, font: 'Calibri', underline: {} })],
              link: p.url,
            }),
          ],
          spacing: { after: 40 },
        }))
      }
      children.push(para(p.description))
      if (p.technologies?.length) {
        children.push(para(`Technologies: ${p.technologies.join(', ')}`, { italic: true, size: 18 }))
      }
    }
  }

  // Achievements
  if (cv.achievements?.length > 0) {
    children.push(heading('Achievements & Awards'))
    for (const a of cv.achievements) children.push(bullet(a))
  }

  // Publications
  if (cv.publications?.length > 0) {
    children.push(heading('Publications'))
    for (const p of cv.publications) children.push(bullet(p))
  }

  // Volunteer
  if (cv.volunteer?.length > 0) {
    children.push(heading('Volunteer & Community'))
    for (const v of cv.volunteer) children.push(bullet(v))
  }

  const doc = new Document({
    sections: [{
      properties: {},
      children,
    }],
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 20 },
        },
      },
    },
  })

  return Packer.toBuffer(doc)
}
