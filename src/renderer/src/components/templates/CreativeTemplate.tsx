import React from 'react'
import type { TemplateProps } from './types'
import { hexToRgba } from './utils'

export default function CreativeTemplate({ cv, design }: TemplateProps) {
  const { colors, fonts } = design
  const secondary = hexToRgba(colors.text, 0.65)

  return (
    <div style={{ fontFamily: fonts.body, color: colors.text, background: colors.background, minHeight: '297mm', fontSize: '12px' }}>
      {/* Bold gradient header */}
      <div style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`, padding: '40px 48px 32px', color: '#fff' }}>
        <h1 style={{ fontFamily: fonts.heading, fontSize: '34px', fontWeight: 700, margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>{cv.name}</h1>
        {cv.title && <div style={{ fontSize: '16px', opacity: 0.9, fontWeight: 500, marginBottom: '16px' }}>{cv.title}</div>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '12px', color: 'rgba(255,255,255,0.85)' }}>
          {cv.contact?.email && <span>✉ {cv.contact.email}</span>}
          {cv.contact?.phone && <span>☎ {cv.contact.phone}</span>}
          {cv.contact?.location && <span>⊙ {cv.contact.location}</span>}
          {cv.contact?.linkedin && <a href={cv.contact.linkedin} style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }}>in {cv.contact.linkedin}</a>}
          {cv.contact?.github && <a href={cv.contact.github} style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }}>gh {cv.contact.github}</a>}
          {cv.contact?.website && <a href={cv.contact.website} style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }}>↗ {cv.contact.website}</a>}
        </div>
      </div>

      <div style={{ padding: '32px 48px' }}>
        {(cv.summary || cv.coreCompetencies?.length > 0) && (
          <div style={{ marginBottom: '28px', padding: '16px 20px', background: hexToRgba(colors.primary, 0.06), borderLeft: `4px solid ${colors.primary}`, borderRadius: '0 8px 8px 0' }}>
            {cv.summary && <p style={{ margin: 0, lineHeight: 1.7, color: secondary }}>{cv.summary}</p>}
            {cv.coreCompetencies?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: cv.summary ? '10px' : '0' }}>
                {cv.coreCompetencies.map((c: string, i: number) => (
                  <span key={i} style={{ fontSize: '10px', padding: '2px 8px', background: hexToRgba(colors.primary, 0.12), color: colors.primary, borderRadius: '3px', fontWeight: 600 }}>{c}</span>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1.5fr', gap: '32px' }}>
          {/* Main column */}
          <div>
            {cv.experience?.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <SectionTitle title="Experience" color={colors.primary} font={fonts.heading} />
                {cv.experience.map((exp, i) => (
                  <div key={i} className="experience-entry" style={{ marginBottom: '18px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '13px' }}>{exp.title}</div>
                        <div style={{ color: colors.primary, fontWeight: 600, fontSize: '12px' }}>{exp.company}{exp.location ? ` · ${exp.location}` : ''}</div>
                      </div>
                      <div style={{ fontSize: '11px', color: secondary, textAlign: 'right', flexShrink: 0, marginLeft: '8px' }}>
                        {exp.startDate}<br />{exp.endDate}
                      </div>
                    </div>
                    <ul style={{ margin: '6px 0 0', paddingLeft: '16px', color: secondary }}>
                      {(exp.bullets ?? []).map((b, j) => <li key={j} style={{ marginBottom: '3px', breakInside: 'avoid' }}>{b}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {cv.projects?.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <SectionTitle title="Projects" color={colors.primary} font={fonts.heading} />
                {cv.projects.map((p, i) => (
                  <div key={i} className="project-entry" style={{ marginBottom: '12px', padding: '10px 12px', background: hexToRgba(colors.primary, 0.04), borderRadius: '8px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                    <div style={{ fontWeight: 700, fontSize: '12px' }}>
                      {p.url ? <a href={p.url} style={{ color: colors.primary, textDecoration: 'none' }}>{p.name}</a> : p.name}
                      {p.startDate && <span style={{ fontSize: '10px', color: secondary, marginLeft: '8px' }}>{p.startDate}</span>}
                    </div>
                    <div style={{ fontSize: '11px', color: secondary, marginTop: '3px' }}>{p.description}</div>
                    {p.technologies?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                        {p.technologies.map((t, j) => (
                          <span key={j} style={{ fontSize: '10px', background: hexToRgba(colors.primary, 0.12), color: colors.primary, borderRadius: '4px', padding: '1px 6px' }}>{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {cv.achievements?.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <SectionTitle title="Achievements & Awards" color={colors.primary} font={fonts.heading} />
                {cv.achievements.map((a, i) => (
                  <div key={i} style={{ fontSize: '11px', color: secondary, marginBottom: '4px' }}>· {a}</div>
                ))}
              </div>
            )}

            {cv.publications?.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <SectionTitle title="Publications" color={colors.primary} font={fonts.heading} />
                {cv.publications.map((p, i) => (
                  <div key={i} style={{ fontSize: '11px', color: secondary, marginBottom: '4px' }}>· {p}</div>
                ))}
              </div>
            )}

            {cv.volunteer?.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <SectionTitle title="Volunteer & Community" color={colors.primary} font={fonts.heading} />
                {cv.volunteer.map((v, i) => (
                  <div key={i} style={{ fontSize: '11px', color: secondary, marginBottom: '4px' }}>· {v}</div>
                ))}
              </div>
            )}
          </div>

          {/* Side column */}
          <div>
            {cv.skills?.technical?.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <SectionTitle title="Technical Skills" color={colors.primary} font={fonts.heading} />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {cv.skills.technical.map((s, i) => (
                    <span key={i} style={{ fontSize: '10px', background: hexToRgba(colors.primary, 0.1), color: colors.primary, borderRadius: '4px', padding: '3px 8px', border: `1px solid ${hexToRgba(colors.primary, 0.2)}` }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            {cv.education?.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <SectionTitle title="Education" color={colors.primary} font={fonts.heading} />
                {cv.education.map((edu, i) => (
                  <div key={i} className="education-entry" style={{ marginBottom: '10px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                    <div style={{ fontWeight: 700, fontSize: '12px' }}>{edu.degree}</div>
                    <div style={{ color: colors.primary, fontSize: '11px' }}>{edu.institution}{edu.location ? `, ${edu.location}` : ''}</div>
                    {edu.details && <div style={{ fontSize: '10px', color: secondary, marginTop: '1px' }}>{edu.details}</div>}
                    <div style={{ fontSize: '11px', color: secondary }}>{edu.year}</div>
                  </div>
                ))}
              </div>
            )}

            {cv.skills?.soft?.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <SectionTitle title="Soft Skills" color={colors.primary} font={fonts.heading} />
                {cv.skills.soft.map((s, i) => (
                  <div key={i} style={{ fontSize: '11px', color: secondary, marginBottom: '3px' }}>· {s}</div>
                ))}
              </div>
            )}

            {cv.skills?.languages?.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <SectionTitle title="Languages" color={colors.primary} font={fonts.heading} />
                {cv.skills.languages.map((l, i) => (
                  <div key={i} style={{ fontSize: '12px', color: secondary, marginBottom: '3px' }}>· {l}</div>
                ))}
              </div>
            )}

            {cv.certifications?.length > 0 && (
              <div>
                <SectionTitle title="Certifications" color={colors.primary} font={fonts.heading} />
                {cv.certifications.map((c, i) => (
                  <div key={i} style={{ fontSize: '11px', color: secondary, marginBottom: '4px' }}>· {c}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function SectionTitle({ title, color, font }: { title: string; color: string; font: string }) {
  return (
    <h2 style={{ fontFamily: font, fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color, margin: '0 0 12px 0', paddingBottom: '6px', borderBottom: `2px solid ${color}`, pageBreakAfter: 'avoid', breakAfter: 'avoid' }}>
      {title}
    </h2>
  )
}
