
import { algoTitle, fileFriendly } from '../explainers.js'

const SEV = { Critical: 0, High: 1, Medium: 2, Low: 3 }

export default function WorstIssues({ findings, max = 5 }) {
  const picked = []
  const seen = new Set()
  for (const f of findings) {
    if (picked.length >= max) break
    const key = f.file.replace(/^.*\/(services\/|infra\/|web-portal\/|docs\/)?/, '')
    const uniq = `${f.algorithm}|${key}`
    if (seen.has(uniq)) continue
    if (!['Critical', 'High'].includes(f.severity)) continue
    seen.add(uniq)
    picked.push(f)
  }
  // order Critical before High, keep at most max
  picked.sort((a, b) => SEV[a.severity] - SEV[b.severity])

  return (
    <div className="worst-grid">
      {picked.map((f, i) => (
        <article key={`${f.file}:${f.line}:${f.algorithm}`} className={`issue-card sev-edge-${f.severity.toLowerCase()}`}>
          <div className="issue-top">
            <span className={`badge badge-${f.severity.toLowerCase()}`}>{f.severity}</span>
            <span className="issue-num">#{i + 1}</span>
          </div>
          <h3 className="issue-title">{algoTitle(f.algorithm)}</h3>
          <div className="issue-where">
            <span className="issue-where-file">{fileFriendly(f.file)}</span>
            <span className="issue-where-path">{f.file.replace(/^.*?(services|infra|web-portal)/, '$1')}:{f.line}</span>
          </div>
          {f.code && <pre className="issue-code">{f.code}</pre>}
          <div className="issue-fix">
            <span className="issue-fix-label">what to do →</span>{' '}
            {f.recommendation}
          </div>
        </article>
      ))}
    </div>
  )
}
