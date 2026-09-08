import { useMemo } from 'react'
import { displayAlgo } from '../explainers.js'

const SEV_RANK = { Critical: 0, High: 1, Medium: 2, Low: 3 }

export default function Heatmap({ findings, onSelect, selected }) {
  const tiles = useMemo(() => {
    const map = new Map()
    for (const f of findings) {
      const key = displayAlgo(f)
      const t = map.get(key) || { algo: key, count: 0, maxSev: 'Low', quantum: false }
      t.count += 1
      if (SEV_RANK[f.severity] < SEV_RANK[t.maxSev]) t.maxSev = f.severity
      t.quantum = t.quantum || f.quantum_vulnerable
      map.set(key, t)
    }
    return [...map.values()].sort(
      (a, b) => SEV_RANK[a.maxSev] - SEV_RANK[b.maxSev] || b.count - a.count,
    )
  }, [findings])

  const max = Math.max(...tiles.map((t) => t.count), 1)

  return (
    <div className="heatmap">
      {tiles.map((t) => (
        <button
          key={t.algo}
          className={`tile sev-${t.maxSev.toLowerCase()} ${selected === t.algo ? 'tile-selected' : ''}`}
          style={{ opacity: 0.45 + 0.55 * (t.count / max) }}
          onClick={() => onSelect(selected === t.algo ? null : t.algo)}
          title={`${t.algo}: ${t.count} finding(s), max severity ${t.maxSev}${t.quantum ? ', quantum-vulnerable' : ''}`}
        >
          <span className="tile-algo">{t.algo}</span>
          <span className="tile-count">×{t.count}</span>
          {t.quantum && <span className="tile-q" title="quantum-vulnerable">⚛</span>}
        </button>
      ))}
    </div>
  )
}
