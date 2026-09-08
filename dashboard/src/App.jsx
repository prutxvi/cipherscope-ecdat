import { useMemo, useState } from 'react'
import findings from './findings.json'
import Gauge from './components/Gauge.jsx'
import Heatmap from './components/Heatmap.jsx'
import FindingsTable from './components/FindingsTable.jsx'

const SEVERITIES = ['All', 'Critical', 'High', 'Medium', 'Low']

export const displayAlgo = (f) => (f.key_size ? `${f.algorithm}-${f.key_size}` : f.algorithm)

export default function App() {
  const [category, setCategory] = useState('All')
  const [severity, setSeverity] = useState('All')
  const [algo, setAlgo] = useState(null)

  const stats = useMemo(() => {
    const total = findings.length
    const q = findings.filter((f) => f.quantum_vulnerable).length
    const weak = findings.filter((f) => f.weak_today).length
    const critical = findings.filter((f) => f.severity === 'Critical').length
    const files = new Set(findings.map((f) => f.file)).size
    const ready = findings.filter((f) => !f.quantum_vulnerable && !f.weak_today).length
    return {
      total,
      q,
      qPct: total ? Math.round((100 * q) / total) : 0,
      weak,
      critical,
      files,
      readyPct: total ? Math.round((100 * ready) / total) : 0,
    }
  }, [])

  const categories = useMemo(() => ['All', ...new Set(findings.map((f) => f.category))], [])

  const filtered = findings.filter(
    (f) =>
      (category === 'All' || f.category === category) &&
      (severity === 'All' || f.severity === severity) &&
      (!algo || displayAlgo(f) === algo),
  )

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <span className="logo">◢ CipherScope</span>
          <span className="tagline">cryptographic discovery · PQC readiness</span>
        </div>
        <div className="header-right mono">
          <span className="prompt">$</span> cipherscope --scan demo-repo
          <span className="cursor">▊</span>
          <button
            className="export-btn"
            onClick={() => {
              const blob = new Blob([JSON.stringify(findings, null, 2)], { type: 'application/json' })
              const a = document.createElement('a')
              a.href = URL.createObjectURL(blob)
              a.download = 'cipherscope-findings.json'
              a.click()
              URL.revokeObjectURL(a.href)
            }}
          >
            ⬇ export report
          </button>
        </div>
      </header>

      <section className="metrics-row">
        <div className="card hero">
          <div className="hero-label">CRYPTO ESTATE QUANTUM-VULNERABLE</div>
          <div className="hero-value">
            {stats.qPct}
            <span className="hero-pct">%</span>
          </div>
          <div className="hero-sub">
            {stats.q} of {stats.total} findings · Shor-vulnerable (RSA / ECC / weak hashes)
          </div>
        </div>

        <div className="stat-grid">
          <div className="card stat">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">findings</div>
          </div>
          <div className="card stat">
            <div className="stat-value critical-text">{stats.critical}</div>
            <div className="stat-label">critical</div>
          </div>
          <div className="card stat">
            <div className="stat-value">{stats.weak}</div>
            <div className="stat-label">weak today</div>
          </div>
          <div className="card stat">
            <div className="stat-value">{stats.files}</div>
            <div className="stat-label">files affected</div>
          </div>
        </div>

        <div className="card gauge-card">
          <div className="card-title">PQC READINESS</div>
          <Gauge value={stats.readyPct} />
          <div className="gauge-sub">% of estate neither weak today nor quantum-vulnerable</div>
        </div>
      </section>

      <section className="card heatmap-card">
        <div className="card-title">RISK HEATMAP — ALGORITHM DISTRIBUTION</div>
        <Heatmap findings={findings} onSelect={setAlgo} selected={algo} />
      </section>

      <section className="filters">
        <div className="filter-group">
          <span className="filter-label">category</span>
          {categories.map((c) => (
            <button
              key={c}
              className={`chip ${category === c ? 'chip-active' : ''}`}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="filter-group">
          <span className="filter-label">severity</span>
          {SEVERITIES.map((s) => (
            <button
              key={s}
              className={`chip sev-chip-${s.toLowerCase()} ${severity === s ? 'chip-active' : ''}`}
              onClick={() => setSeverity(s)}
            >
              {s}
            </button>
          ))}
        </div>
        {algo && (
          <div className="filter-group">
            <button className="chip chip-active" onClick={() => setAlgo(null)}>
              {algo} ✕
            </button>
          </div>
        )}
      </section>

      <section className="card table-card">
        <div className="card-title">
          FINDINGS <span className="count-badge">{filtered.length}</span>
        </div>
        <FindingsTable findings={filtered} />
      </section>

      <footer className="footer mono">
        CipherScope v0.1 · hackathon prototype · Mosca horizon 15y (10y data lifetime + 6y migration → HIGH
        quantum risk)
      </footer>
    </div>
  )
}
