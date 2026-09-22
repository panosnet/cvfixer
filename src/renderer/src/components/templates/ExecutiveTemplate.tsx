import type { TemplateProps } from './types'
import { hexToRgba } from './utils'

export default function ExecutiveTemplate({ cv, design }: TemplateProps) {
  const { colors, fonts } = design
  const secondary = hexToRgba(colors.text, 0.5)
  const tertiary = hexToRgba(colors.text, 0.35)

  return (
    <div style={{ fontFamily: fonts.body, color: colors.text, background: colors.background, padding: '0', minHeight: '297mm', fontSize: '12px' }}>
      <div style={{ height: '6px', background: colors.primary }} />

      <div style={{ padding: '44px 56px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px', paddingBottom: '20px', borderBottom: `1px solid ${hexToRgba(colors.text, 0.1)}` }}>
          <div>
            <h1 style={{ fontFamily: fonts.heading, fontSize: '32px', fontWeight: 700, color: colors.primary, margin: 0, letterSpacing: '-0.3px' }}>{cv.name}</h1>
            {cv.title && <div style={{ fontSize: '14px', color: secondary, marginTop: '4px', fontWeight: 500 }}>{cv.title}</div>}
          </div>
          <div style={{ textAlign: 'right', fontSize: '11px', color: secondary, lineHeight: 1.8 }}>
            {cv.contact?.email && <div>{cv.contact.email}</div>}
            {cv.contact?.phone && <div>{cv.contact.phone}</div>}
            {cv.contact?.location && <div>{cv.contact.location}</div>}
            {cv.contact?.linkedin && <div><a href={cv.contact.linkedin} style={{ color: secondary, textDecoration: 'none' }}>{cv.contact.linkedin}</a></div>}
            {cv.contact?.github && <div><a href={cv.contact.github} style={{ color: secondary, textDecoration: 'none' }}>{cv.contact.github}</a></div>}
            {cv.contact?.website && <div><a href={cv.contact.website} style={{ color: secondary, textDecoration: 'none' }}>{cv.contact.website}</a></div>}
          </div>
        </div>

        {(cv.summary || cv.coreCompetencies?.length > 0) && (
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ fontFamily: fonts.heading, fontSize: '13px', fontWeight: 700, color: colors.primary, margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '1px', pageBreakAfter: 'avoid', breakAfter: 'avoid' }}>Executive Profile</h2>
            {cv.summary && <p style={{ margin: 0, lineHeight: 1.75, color: secondary, fontSize: '13px' }}>{cv.summary}</p>}
            {cv.coreCompetencies?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: cv.summary ? '12px' : '0' }}>
                {cv.coreCompetencies.map((c: string, i: number) => (
                  <span key={i} style={{ fontSize: '11px', padding: '3px 10px', border: `1px solid ${hexToRgba(colors.text, 0.2)}`, borderRadius: '3px', color: colors.text, fontWeight: 500 }}>{c}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {cv.experience?.length > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ fontFamily: fonts.heading, fontSize: '13px', fontWeight: 700, color: colors.primary, margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '1px', pageBreakAfter: 'avoid', breakAfter: 'avoid' }}>Professional Experience</h2>
            {cv.experience.map((exp, i) => (
              <div key={i} className="experience-entry" style={{ marginBottom: '20px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px dotted ${hexToRgba(colors.text, 0.15)}`, paddingBottom: '4px', marginBottom: '8px' }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '13px' }}>{exp.title}</span>
                    <span style={{ color: secondary, marginLeft: '8px' }}>|</span>
                    <span style={{ color: colors.primary, fontWeight: 600, marginLeft: '8px', fontSize: '12px' }}>{exp.company}</span>
                    {exp.location && <span style={{ color: tertiary, fontSize: '11px', marginLeft: '6px' }}>{exp.location}</span>}
                  </div>
                  <div style={{ fontSize: '11px', color: secondary, flexShrink: 0 }}>{exp.startDate} – {exp.endDate}</div>
                </div>
                <ul style={{ margin: 0, paddingLeft: '16px', color: secondary }}>
                  {(exp.bullets ?? []).map((b, j) => <li key={j} style={{ marginBottom: '4px', lineHeight: 1.6, breakInside: 'avoid' }}>{b}</li>)}
                </ul>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '32px' }}>
          <div>
            {cv.education?.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontFamily: fonts.heading, fontSize: '13px', fontWeight: 700, color: colors.primary, margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '1px', pageBreakAfter: 'avoid', breakAfter: 'avoid' }}>Education</h2>
                {cv.education.map((edu, i) => (
                  <div key={i} className="education-entry" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '12px' }}>{edu.degree}</div>
                      <div style={{ color: colors.primary, fontSize: '11px' }}>{edu.institution}{edu.location ? ` · ${edu.location}` : ''}</div>
                      {edu.details && <div style={{ fontSize: '11px', color: secondary }}>{edu.details}</div>}
                    </div>
                    <div style={{ fontSize: '11px', color: secondary }}>{edu.year}</div>
                  </div>
                ))}
              </div>
            )}

            {cv.projects?.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontFamily: fonts.heading, fontSize: '13px', fontWeight: 700, color: colors.primary, margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '1px', pageBreakAfter: 'avoid', breakAfter: 'avoid' }}>Notable Projects</h2>
                {cv.projects.map((p, i) => (
                  <div key={i} className="project-entry" style={{ marginBottom: '10px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                    <div style={{ fontWeight: 700, fontSize: '12px' }}>
                      {p.url ? <a href={p.url} style={{ color: colors.primary, textDecoration: 'none' }}>{p.name}</a> : p.name}
                      {p.startDate && <span style={{ fontSize: '10px', color: tertiary, marginLeft: '8px' }}>{p.startDate}</span>}
                    </div>
                    <div style={{ fontSize: '11px', color: secondary, marginTop: '2px' }}>{p.description}</div>
                    {p.technologies?.length > 0 && <div style={{ fontSize: '10px', color: tertiary, marginTop: '2px' }}>{p.technologies.join(' · ')}</div>}
                  </div>
                ))}
              </div>
            )}

            {cv.certifications?.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <h2 style={{ fontFamily: fonts.heading, fontSize: '13px', fontWeight: 700, color: colors.primary, margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '1px', pageBreakAfter: 'avoid', breakAfter: 'avoid' }}>Certifications</h2>
                {cv.certifications.map((c, i) => (
                  <div key={i} style={{ fontSize: '11px', color: secondary, marginBottom: '3px' }}>· {c}</div>
                ))}
              </div>
            )}

            {cv.achievements?.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <h2 style={{ fontFamily: fonts.heading, fontSize: '13px', fontWeight: 700, color: colors.primary, margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '1px', pageBreakAfter: 'avoid', breakAfter: 'avoid' }}>Achievements & Awards</h2>
                {cv.achievements.map((a, i) => (
                  <div key={i} style={{ fontSize: '11px', color: secondary, marginBottom: '3px' }}>· {a}</div>
                ))}
              </div>
            )}

            {cv.publications?.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <h2 style={{ fontFamily: fonts.heading, fontSize: '13px', fontWeight: 700, color: colors.primary, margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '1px', pageBreakAfter: 'avoid', breakAfter: 'avoid' }}>Publications</h2>
                {cv.publications.map((p, i) => (
                  <div key={i} style={{ fontSize: '11px', color: secondary, marginBottom: '3px' }}>· {p}</div>
                ))}
              </div>
            )}

            {cv.volunteer?.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <h2 style={{ fontFamily: fonts.heading, fontSize: '13px', fontWeight: 700, color: colors.primary, margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '1px', pageBreakAfter: 'avoid', breakAfter: 'avoid' }}>Volunteer & Community</h2>
                {cv.volunteer.map((v, i) => (
                  <div key={i} style={{ fontSize: '11px', color: secondary, marginBottom: '3px' }}>· {v}</div>
                ))}
              </div>
            )}
          </div>

          <div>
            {((cv.skills?.technical?.length ?? 0) > 0 || (cv.skills?.soft?.length ?? 0) > 0) && (
              <div style={{ marginBottom: '16px' }}>
                <h2 style={{ fontFamily: fonts.heading, fontSize: '13px', fontWeight: 700, color: colors.primary, margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '1px', pageBreakAfter: 'avoid', breakAfter: 'avoid' }}>Core Competencies</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                  {[...(cv.skills?.technical ?? []), ...(cv.skills?.soft ?? [])].map((s, i) => (
                    <div key={i} style={{ fontSize: '11px', color: secondary, display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: colors.primary, flexShrink: 0, display: 'inline-block' }} />
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {cv.skills?.languages?.length > 0 && (
              <div>
                <h2 style={{ fontFamily: fonts.heading, fontSize: '13px', fontWeight: 700, color: colors.primary, margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '1px', pageBreakAfter: 'avoid', breakAfter: 'avoid' }}>Languages</h2>
                {cv.skills.languages.map((l, i) => (
                  <div key={i} style={{ fontSize: '11px', color: secondary, marginBottom: '3px' }}>· {l}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ height: '3px', background: colors.primary, opacity: 0.3 }} />
    </div>
  )
}
