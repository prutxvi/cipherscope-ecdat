
import { algoTitle, categoryFriendly, fileFriendly } from '../explainers.js'

export default function FindingsTable({ findings }) {
  if (!findings.length) return <div className="empty">Nothing matches the current filters — clear them to see all findings.</div>

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>severity</th>
            <th>issue</th>
            <th>where</th>
            <th className="center" title="can be broken with today's computers">weak today</th>
            <th className="center" title="breaks when quantum computers arrive">quantum</th>
            <th>what to do</th>
          </tr>
        </thead>
        <tbody>
          {findings.map((f, i) => (
            <tr key={`${f.file}:${f.line}:${f.algorithm}:${i}`}>
              <td><span className={`badge badge-${f.severity.toLowerCase()}`}>{f.severity}</span></td>
              <td className="issue-cell">
                <div className="issue-cell-algo">
                  {f.algorithm}{f.key_size ? <span className="key-size"> · {f.key_size}-bit</span> : null}
                </div>
                <div className="issue-cell-desc">
                  {algoTitle(f.algorithm)} <span className="cat-tag">{categoryFriendly(f.category)}</span>
                </div>
              </td>
              <td className="mono loc" title={`${f.file}:${f.line}`}>
                {fileFriendly(f.file)}
                <span className="line-no"> · {f.file.replace(/^.*?(services|infra|web-portal)/, '$1').split('/').slice(-2).join('/')}:{f.line}</span>
              </td>
              <td className="center">{f.weak_today ? <span className="yes">⚠</span> : <span className="no">·</span>}</td>
              <td className="center">{f.quantum_vulnerable ? <span className="yes q">⚛</span> : <span className="no">·</span>}</td>
              <td className="rec">{f.recommendation}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
