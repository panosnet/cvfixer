import React from 'react'
import type { TemplateProps } from './types'
import { hexToRgba } from './utils'

export default function ClassicTemplate({ cv, design }: TemplateProps) {
  const { colors, fonts } = design
  const secondary = hexToRgba(colors.text, 0.6)

  return (
    <div style={{ fontFamily: fonts.body, color: colors.text, background: colors.background, padding: '48px', minHeight: '297mm', fontSize: '13px', lineHeight: 1.5 }}>
      {/* Header */}
      <div style={{ borderBottom: `3px solid ${colors.primary}`, paddingBottom: '16px', marginBottom: '20px' }}>
        <h1 style={{ fontFamily: fonts.heading, fontSize: '28px', fontWeight: 700, color: colors.primary, margin: 0 }}>{cv.name}</h1>
        {cv.title && <div style={{ color: colors.secondary, fontSize: '14px', marginTop: '4px', fontWeight: 500 }}>{cv.title}</div>}
        <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '12px', color: secondary }}>
          {cv.contact?.email && <span>{cv.contact.email}</span>}
          {cv.contact?.phone && <span>{cv.contact.phone}</span>}
          {cv.contact?.location && <span>{cv.contact.location}</span>}
          {cv.contact?.linkedin && <a href={cv.contact.linkedin} style={{ color: secondary, textDecoration: 'none' }}>{cv.contact.linkedin}</a>}
          {cv.contact?.github && <a href={cv.contact.github} style={{ color: secondary, textDecoration: 'none' }}>{cv.contact.github}</a>}
          {cv.contact?.website && <a href={cv.contact.website} style={{ color: secondary, textDecoration: 'none' }}>{cv.contact.website}</a>}
        </div>
      </div>

      {/* Summary + Core Competencies */}
      {(cv.summary || cv.coreCompetencies?.length > 0) && (
        <Section title="Professional Summary" primary={colors.primary} heading={fonts.heading} divider={hexToRgba(colors.text, 0.15)}>
          {cv.summary && <p style={{ margin: 0, lineHeight: 1.7 }}>{cv.summary}</p>}
          {cv.coreCompetencies?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: cv.summary ? '12px' : '0' }}>
              {cv.coreCompetencies.map((c: string, i: number) => (
                <span key={i} style={{ fontSize: '11px', padding: '3px 10px', border: `1px solid ${colors.primary}`, borderRadius: '3px', color: colors.primary, fontWeight: 500 }}>{c}</span>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Experience */}
      {cv.experience?.length > 0 && (
        <Section title="Experience" primary={colors.primary} heading={fonts.heading} divider={hexToRgba(colors.text, 0.15)}>
          {cv.experience.map((exp, i) => (
            <div key={i} className="experience-entry" style={{ marginBottom: '16px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>{exp.title}</div>
                  <div style={{ color: colors.primary, fontSize: '13px', fontWeight: 500 }}>{exp.company}{exp.location ? ` · ${exp.location}` : ''}</div>
                </div>
                <div style={{ fontSize: '12px', color: secondary, whiteSpace: 'nowrap', marginLeft: '8px' }}>{exp.startDate} – {exp.endDate}</div>
              </div>
              <ul style={{ margin: '6px 0 0 0', paddingLeft: '18px' }}>
                {(exp.bullets ?? []).map((b, j) => <li key={j} style={{ marginBottom: '3px', breakInside: 'avoid' }}>{b}</li>)}
              </ul>
            </div>
          ))}
        </Section>
      )}

      {/* Education */}
      {cv.education?.length > 0 && (
        <Section title="Education" primary={colors.primary} heading={fonts.heading} divider={hexToRgba(colors.text, 0.15)}>
          {cv.education.map((edu, i) => (
            <div key={i} className="education-entry" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>{edu.degree}</div>
                <div style={{ color: colors.primary, fontSize: '13px' }}>{edu.institution}{edu.location ? ` · ${edu.location}` : ''}</div>
                {edu.details && <div style={{ fontSize: '12px', color: secondary }}>{edu.details}</div>}
              </div>
              <div style={{ fontSize: '12px', color: secondary, whiteSpace: 'nowrap', marginLeft: '8px' }}>{edu.year}</div>
            </div>
          ))}
        </Section>
      )}

      {/* Skills */}
      {(cv.skills?.technical?.length > 0 || cv.skills?.soft?.length > 0 || cv.skills?.languages?.length > 0) && (
        <Section title="Skills" primary={colors.primary} heading={fonts.heading} divider={hexToRgba(colors.text, 0.15)}>
          {cv.skills?.technical?.length > 0 && <div style={{ marginBottom: '6px' }}><strong>Technical: </strong>{cv.skills.technical.join(' · ')}</div>}
          {cv.skills?.soft?.length > 0 && <div style={{ marginBottom: '6px' }}><strong>Soft Skills: </strong>{cv.skills.soft.join(' · ')}</div>}
          {cv.skills?.languages?.length > 0 && <div><strong>Languages: </strong>{cv.skills.languages.join(' · ')}</div>}
        </Section>
      )}

      {/* Certifications */}
      {cv.certifications?.length > 0 && (
        <Section title="Certifications" primary={colors.primary} heading={fonts.heading} divider={hexToRgba(colors.text, 0.15)}>
          <ul style={{ margin: 0, paddingLeft: '18px' }}>
            {cv.certifications.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </Section>
      )}

      {/* Achievements */}
      {cv.achievements?.length > 0 && (
        <Section title="Achievements & Awards" primary={colors.primary} heading={fonts.heading} divider={hexToRgba(colors.text, 0.15)}>
          <ul style={{ margin: 0, paddingLeft: '18px' }}>
            {cv.achievements.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </Section>
      )}

      {/* Projects */}
      {cv.projects?.length > 0 && (
        <Section title="Projects" primary={colors.primary} heading={fonts.heading} divider={hexToRgba(colors.text, 0.15)}>
          {cv.projects.map((p, i) => (
            <div key={i} className="project-entry" style={{ marginBottom: '10px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
              <div style={{ fontWeight: 700, fontSize: '13px' }}>
                {p.url ? <a href={p.url} style={{ color: colors.primary, textDecoration: 'none' }}>{p.name}</a> : p.name}
                {p.startDate && <span style={{ fontSize: '11px', color: secondary, marginLeft: '8px' }}>{p.startDate}</span>}
              </div>
              <div style={{ fontSize: '12px', marginTop: '2px' }}>{p.description}</div>
              {p.technologies?.length > 0 && <div style={{ fontSize: '11px', color: secondary, marginTop: '2px' }}>{p.technologies.join(' · ')}</div>}
            </div>
          ))}
        </Section>
      )}

      {/* Publications */}
      {cv.publications?.length > 0 && (
        <Section title="Publications" primary={colors.primary} heading={fonts.heading} divider={hexToRgba(colors.text, 0.15)}>
          <ul style={{ margin: 0, paddingLeft: '18px' }}>
            {cv.publications.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </Section>
      )}

      {/* Volunteer */}
      {cv.volunteer?.length > 0 && (
        <Section title="Volunteer & Community" primary={colors.primary} heading={fonts.heading} divider={hexToRgba(colors.text, 0.15)}>
          <ul style={{ margin: 0, paddingLeft: '18px' }}>
            {cv.volunteer.map((v, i) => <li key={i}>{v}</li>)}
          </ul>
        </Section>
      )}
    </div>
  )
}

function Section({ title, primary, heading, divider, children }: {
  title: string; primary: string; heading: string; divider: string; children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <h2 style={{ fontFamily: heading, fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: primary, borderBottom: `1px solid ${divider}`, paddingBottom: '4px', marginBottom: '12px', marginTop: 0, pageBreakAfter: 'avoid', breakAfter: 'avoid' }}>
        {title}
      </h2>
      {children}
    </div>
  )
}
