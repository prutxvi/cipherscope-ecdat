export default function FindingsTable({ findings }) {
  if (!findings.length) return <div className="empty">no findings match the current filters</div>

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>severity</th>
            <th>location</th>
            <th>algorithm</th>
            <th>category</th>
            <th className="center">weak today</th>
            <th className="center">quantum</th>
            <th>recommendation</th>
          </tr>
        </thead>
        <tbody>
          {findings.map((f, i) => (
            <tr key={`${f.file}:${f.line}:${f.algorithm}:${i}`}>
              <td>
                <span className={`badge badge-${f.severity.toLowerCase()}`}>{f.severity}</span>
              </td>
              <td className="mono loc" title={`${f.file}:${f.line}`}>
                {f.file}
                <span className="line-no">:{f.line}</span>
              </td>
              <td className="mono">
                {f.algorithm}
                {f.key_size ? <span className="key-size"> · {f.key_size}-bit</span> : null}
              </td>
              <td>{f.category}</td>
              <td className="center">{f.weak_today ? <span className="yes">✓</span> : <span className="no">—</span>}</td>
              <td className="center">{f.quantum_vulnerable ? <span className="yes">✓</span> : <span className="no">—</span>}</td>
              <td className="rec">{f.recommendation}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
