import React from 'react'
import type { TemplateProps } from './types'
import { hexToRgba } from './utils'

export default function ModernTemplate({ cv, design }: TemplateProps) {
  const { colors, fonts } = design
  const mainSecondary = hexToRgba(colors.text, 0.56)
  return (
    <div style={{ fontFamily: fonts.body, color: colors.text, background: colors.background, display: 'flex', minHeight: '297mm', fontSize: '12px', lineHeight: 1.5 }}>
      {/* Sidebar */}
      <div style={{ width: '220px', background: colors.primary, color: '#fff', padding: '32px 20px', flexShrink: 0 }}>
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontFamily: fonts.heading, fontSize: '22px', fontWeight: 700, margin: '0 0 4px 0', lineHeight: 1.2 }}>{cv.name}</h1>
          {cv.title && <div style={{ fontSize: '11px', opacity: 0.85, fontWeight: 500 }}>{cv.title}</div>}
        </div>

        <SideSection title="Contact">
          {cv.contact?.email && <ContactItem label="Email" value={cv.contact.email} />}
          {cv.contact?.phone && <ContactItem label="Phone" value={cv.contact.phone} />}
          {cv.contact?.location && <ContactItem label="Location" value={cv.contact.location} />}
          {cv.contact?.linkedin && <ContactItem label="LinkedIn" value={cv.contact.linkedin} href={cv.contact.linkedin} />}
          {cv.contact?.github && <ContactItem label="GitHub" value={cv.contact.github} href={cv.contact.github} />}
          {cv.contact?.website && <ContactItem label="Web" value={cv.contact.website} href={cv.contact.website} />}
        </SideSection>

        {cv.skills?.technical?.length > 0 && (
          <SideSection title="Technical Skills">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {cv.skills.technical.map((s, i) => (
                <span key={i} style={{ fontSize: '10px', background: 'rgba(255,255,255,0.15)', borderRadius: '4px', padding: '2px 6px' }}>{s}</span>
              ))}
            </div>
          </SideSection>
        )}

        {cv.skills?.soft?.length > 0 && (
          <SideSection title="Soft Skills">
            {cv.skills.soft.map((s, i) => (
              <div key={i} style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', marginBottom: '2px' }}>· {s}</div>
            ))}
          </SideSection>
        )}

        {cv.skills?.languages?.length > 0 && (
          <SideSection title="Languages">
            {cv.skills.languages.map((s, i) => (
              <div key={i} style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', marginBottom: '2px' }}>· {s}</div>
            ))}
          </SideSection>
        )}

        {cv.certifications?.length > 0 && (
          <SideSection title="Certifications">
            {cv.certifications.map((c, i) => (
              <div key={i} style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', marginBottom: '2px' }}>· {c}</div>
            ))}
          </SideSection>
        )}
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: '32px' }}>
        {(cv.summary || cv.coreCompetencies?.length > 0) && (
          <div style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: `2px solid ${colors.primary}` }}>
            <h2 style={{ fontFamily: fonts.heading, fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: colors.primary, margin: '0 0 8px 0', pageBreakAfter: 'avoid', breakAfter: 'avoid' }}>Profile</h2>
            {cv.summary && <p style={{ margin: 0, lineHeight: 1.7 }}>{cv.summary}</p>}
            {cv.coreCompetencies?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: cv.summary ? '10px' : '0' }}>
                {cv.coreCompetencies.map((c: string, i: number) => (
                  <span key={i} style={{ fontSize: '10px', padding: '2px 8px', border: `1px solid ${colors.primary}`, borderRadius: '3px', color: colors.primary, fontWeight: 500 }}>{c}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {cv.experience?.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontFamily: fonts.heading, fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: colors.primary, margin: '0 0 16px 0', pageBreakAfter: 'avoid', breakAfter: 'avoid' }}>Experience</h2>
            {cv.experience.map((exp, i) => (
              <div key={i} className="experience-entry" style={{ marginBottom: '18px', paddingLeft: '12px', borderLeft: `3px solid ${colors.accent}`, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px' }}>{exp.title}</div>
                    <div style={{ color: colors.primary, fontSize: '12px', fontWeight: 600 }}>{exp.company}{exp.location ? ` · ${exp.location}` : ''}</div>
                  </div>
                  <div style={{ fontSize: '11px', color: mainSecondary, whiteSpace: 'nowrap', marginLeft: '8px' }}>{exp.startDate} – {exp.endDate}</div>
                </div>
                <ul style={{ margin: '6px 0 0 0', paddingLeft: '16px' }}>
                  {(exp.bullets ?? []).map((b, j) => <li key={j} style={{ marginBottom: '3px', fontSize: '12px', breakInside: 'avoid' }}>{b}</li>)}
                </ul>
              </div>
            ))}
          </div>
        )}

        {cv.education?.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontFamily: fonts.heading, fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: colors.primary, margin: '0 0 12px 0', pageBreakAfter: 'avoid', breakAfter: 'avoid' }}>Education</h2>
            {cv.education.map((edu, i) => (
              <div key={i} className="education-entry" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13px' }}>{edu.degree}</div>
                  <div style={{ color: colors.primary, fontSize: '12px' }}>{edu.institution}{edu.location ? ` · ${edu.location}` : ''}</div>
                  {edu.details && <div style={{ fontSize: '11px', color: mainSecondary }}>{edu.details}</div>}
                </div>
                <div style={{ fontSize: '11px', color: mainSecondary, whiteSpace: 'nowrap' }}>{edu.year}</div>
              </div>
            ))}
          </div>
        )}

        {cv.projects?.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontFamily: fonts.heading, fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: colors.primary, margin: '0 0 12px 0', pageBreakAfter: 'avoid', breakAfter: 'avoid' }}>Projects</h2>
            {cv.projects.map((p, i) => (
              <div key={i} className="project-entry" style={{ marginBottom: '12px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <div style={{ fontWeight: 700, fontSize: '13px' }}>
                  {p.url ? <a href={p.url} style={{ color: colors.primary, textDecoration: 'none' }}>{p.name}</a> : p.name}
                  {p.startDate && <span style={{ fontSize: '11px', color: mainSecondary, marginLeft: '8px' }}>{p.startDate}</span>}
                </div>
                <div style={{ fontSize: '12px', marginTop: '2px' }}>{p.description}</div>
                {p.technologies?.length > 0 && (
                  <div style={{ fontSize: '11px', color: mainSecondary, marginTop: '3px' }}>{p.technologies.join(' · ')}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {cv.achievements?.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontFamily: fonts.heading, fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: colors.primary, margin: '0 0 12px 0', pageBreakAfter: 'avoid', breakAfter: 'avoid' }}>Achievements & Awards</h2>
            <ul style={{ margin: 0, paddingLeft: '16px' }}>
              {cv.achievements.map((a, i) => <li key={i} style={{ marginBottom: '3px', fontSize: '12px' }}>{a}</li>)}
            </ul>
          </div>
        )}

        {cv.publications?.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontFamily: fonts.heading, fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: colors.primary, margin: '0 0 12px 0', pageBreakAfter: 'avoid', breakAfter: 'avoid' }}>Publications</h2>
            <ul style={{ margin: 0, paddingLeft: '16px' }}>
              {cv.publications.map((p, i) => <li key={i} style={{ marginBottom: '3px', fontSize: '12px' }}>{p}</li>)}
            </ul>
          </div>
        )}

        {cv.volunteer?.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontFamily: fonts.heading, fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: colors.primary, margin: '0 0 12px 0', pageBreakAfter: 'avoid', breakAfter: 'avoid' }}>Volunteer & Community</h2>
            <ul style={{ margin: 0, paddingLeft: '16px' }}>
              {cv.volunteer.map((v, i) => <li key={i} style={{ marginBottom: '3px', fontSize: '12px' }}>{v}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

function SideSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '4px' }}>{title}</div>
      {children}
    </div>
  )
}

function ContactItem({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div style={{ marginBottom: '5px' }}>
      <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.5)' }}>{label}</div>
      {href ? (
        <a href={href} style={{ fontSize: '11px', color: 'rgba(255,255,255,0.9)', wordBreak: 'break-all', textDecoration: 'none' }}>{value}</a>
      ) : (
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.9)', wordBreak: 'break-all' }}>{value}</div>
      )}
    </div>
  )
}
