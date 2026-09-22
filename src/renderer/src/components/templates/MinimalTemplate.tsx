import type { TemplateProps } from './types'
import { hexToRgba } from './utils'

export default function MinimalTemplate({ cv, design }: TemplateProps) {
  const { colors, fonts } = design
  const secondary = hexToRgba(colors.text, 0.65)
  const labelColor = hexToRgba(colors.text, 0.35)
  return (
    <div style={{ fontFamily: fonts.body, color: colors.text, background: colors.background, padding: '56px 64px', minHeight: '297mm', fontSize: '12.5px', lineHeight: 1.6 }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: fonts.heading, fontSize: '36px', fontWeight: 700, color: colors.text, margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>{cv.name}</h1>
        {cv.title && <div style={{ fontSize: '15px', color: colors.primary, fontWeight: 500 }}>{cv.title}</div>}
        <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '11px', color: secondary }}>
          {cv.contact?.email && <span>{cv.contact.email}</span>}
          {cv.contact?.phone && <span>{cv.contact.phone}</span>}
          {cv.contact?.location && <span>{cv.contact.location}</span>}
          {cv.contact?.linkedin && <a href={cv.contact.linkedin} style={{ color: secondary, textDecoration: 'none' }}>{cv.contact.linkedin}</a>}
          {cv.contact?.github && <a href={cv.contact.github} style={{ color: secondary, textDecoration: 'none' }}>{cv.contact.github}</a>}
          {cv.contact?.website && <a href={cv.contact.website} style={{ color: secondary, textDecoration: 'none' }}>{cv.contact.website}</a>}
        </div>
      </div>

      {(cv.summary || cv.coreCompetencies?.length > 0) && (
        <div style={{ marginBottom: '32px' }}>
          {cv.summary && <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.8, color: secondary }}>{cv.summary}</p>}
          {cv.coreCompetencies?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: cv.summary ? '12px' : '0' }}>
              {cv.coreCompetencies.map((c: string, i: number) => (
                <span key={i} style={{ fontSize: '11px', padding: '2px 9px', border: `1px solid ${hexToRgba(colors.primary, 0.4)}`, borderRadius: '3px', color: colors.primary }}>{c}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {cv.experience?.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <SectionLabel label="Experience" labelColor={labelColor} />
          {cv.experience.map((exp, i) => (
            <div key={i} className="experience-entry" style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px', marginBottom: '20px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
              <div style={{ fontSize: '11px', color: secondary, paddingTop: '2px' }}>
                <div>{exp.startDate}</div>
                <div>— {exp.endDate}</div>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px' }}>{exp.title}</div>
                <div style={{ color: colors.primary, fontSize: '12px', marginBottom: '6px' }}>{exp.company}{exp.location ? `, ${exp.location}` : ''}</div>
                <ul style={{ margin: 0, paddingLeft: '14px', color: secondary }}>
                  {(exp.bullets ?? []).map((b, j) => <li key={j} style={{ marginBottom: '3px', breakInside: 'avoid' }}>{b}</li>)}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}

      {cv.education?.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <SectionLabel label="Education" labelColor={labelColor} />
          {cv.education.map((edu, i) => (
            <div key={i} className="education-entry" style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px', marginBottom: '12px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
              <div style={{ fontSize: '11px', color: secondary }}>{edu.year}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px' }}>{edu.degree}</div>
                <div style={{ color: colors.primary, fontSize: '12px' }}>{edu.institution}{edu.location ? `, ${edu.location}` : ''}</div>
                {edu.details && <div style={{ fontSize: '11px', color: secondary }}>{edu.details}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {((cv.skills?.technical?.length ?? 0) > 0 || (cv.skills?.soft?.length ?? 0) > 0) && (
        <div style={{ marginBottom: '24px' }}>
          <SectionLabel label="Skills" labelColor={labelColor} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {[...(cv.skills?.technical ?? []), ...(cv.skills?.soft ?? [])].map((s, i) => (
              <span key={i} style={{ fontSize: '11px', color: secondary, border: `1px solid ${hexToRgba(colors.primary, 0.25)}`, borderRadius: '4px', padding: '2px 8px' }}>{s}</span>
            ))}
          </div>
        </div>
      )}

      {cv.skills?.languages?.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <SectionLabel label="Languages" labelColor={labelColor} />
          <div style={{ fontSize: '12px', color: secondary }}>{cv.skills.languages.join(' · ')}</div>
        </div>
      )}

      {cv.certifications?.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <SectionLabel label="Certifications" labelColor={labelColor} />
          {cv.certifications.map((c, i) => (
            <div key={i} style={{ fontSize: '12px', color: secondary, marginBottom: '3px' }}>· {c}</div>
          ))}
        </div>
      )}

      {cv.projects?.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <SectionLabel label="Projects" labelColor={labelColor} />
          {cv.projects.map((p, i) => (
            <div key={i} className="project-entry" style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px', marginBottom: '12px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
              <div style={{ fontSize: '11px', color: secondary }}>{p.startDate}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '12px' }}>
                  {p.url ? <a href={p.url} style={{ color: colors.primary, textDecoration: 'none' }}>{p.name}</a> : p.name}
                </div>
                <div style={{ fontSize: '11px', color: secondary, marginTop: '2px' }}>{p.description}</div>
                {p.technologies?.length > 0 && (
                  <div style={{ fontSize: '10px', color: colors.primary, marginTop: '3px' }}>{p.technologies.join(' · ')}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {cv.achievements?.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <SectionLabel label="Achievements & Awards" labelColor={labelColor} />
          {cv.achievements.map((a, i) => (
            <div key={i} style={{ fontSize: '12px', color: secondary, marginBottom: '3px' }}>· {a}</div>
          ))}
        </div>
      )}

      {cv.publications?.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <SectionLabel label="Publications" labelColor={labelColor} />
          {cv.publications.map((p, i) => (
            <div key={i} style={{ fontSize: '12px', color: secondary, marginBottom: '3px' }}>· {p}</div>
          ))}
        </div>
      )}

      {cv.volunteer?.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <SectionLabel label="Volunteer & Community" labelColor={labelColor} />
          {cv.volunteer.map((v, i) => (
            <div key={i} style={{ fontSize: '12px', color: secondary, marginBottom: '3px' }}>· {v}</div>
          ))}
        </div>
      )}
    </div>
  )
}

function SectionLabel({ label, labelColor }: { label: string; labelColor: string }) {
  return (
    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: labelColor, margin: '0 0 16px 0', pageBreakAfter: 'avoid', breakAfter: 'avoid' }}>
      {label}
    </div>
  )
}
