
import { useMemo, useState } from 'react'
import findings from '../findings.json'
import Heatmap from '../components/Heatmap.jsx'
import FindingsTable from '../components/FindingsTable.jsx'
import WorstIssues from '../components/WorstIssues.jsx'
import MoscaBar from '../components/MoscaBar.jsx'
import { categoryFriendly, displayAlgo, GLOSSARY } from '../explainers.js'

const SEVERITIES = ['All', 'Critical', 'High', 'Medium', 'Low']

export default function Dashboard({ onBack }) {
  const [showHelp, setShowHelp] = useState(false)
  const [category, setCategory] = useState('All')
  const [severity, setSeverity] = useState('All')
  const [algo, setAlgo] = useState(null)

  const stats = useMemo(() => {
    const total = findings.length
    const q = findings.filter((f) => f.quantum_vulnerable).length
    const weak = findings.filter((f) => f.weak_today).length
    const ok = findings.filter((f) => !f.quantum_vulnerable && !f.weak_today).length
    const critical = findings.filter((f) => f.severity === 'Critical').length
    const files = new Set(findings.map((f) => f.file)).size
    const mosca = findings.find((f) => f.mosca)?.mosca || null
    return { total, q, qPct: total ? Math.round((100 * q) / total) : 0, weak, ok, critical, files, mosca }
  }, [])

  const categories = useMemo(() => ['All', ...new Set(findings.map((f) => f.category))], [])

  const filtered = findings.filter(
    (f) =>
      (category === 'All' || f.category === category) &&
      (severity === 'All' || f.severity === severity) &&
      (!algo || displayAlgo(f) === algo),
  )

  const verdictClass = stats.qPct >= 50 ? 'verdict-high' : stats.qPct >= 25 ? 'verdict-mid' : 'verdict-low'

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <span className="logo">◢ CipherScope</span>
          <span className="tagline">post-quantum security report · plain language edition</span>
        </div>
        <div className="header-right">
          {onBack && (
            <button className="ghost-btn" onClick={onBack}>
              ← home
            </button>
          )}
          <button className="ghost-btn" onClick={() => setShowHelp((v) => !v)}>
            {showHelp ? '✕ close explainer' : '❓ what is this?'}
          </button>
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
            ⬇ raw report
          </button>
        </div>
      </header>

      {showHelp && (
        <section className="explain-panel">
          <h2>What is this report?</h2>
          <div className="explain-cols">
            <div>
              <p><b>We scanned a whole codebase</b> — every file that touches passwords, encryption, certificates, or secure connections (6 services in Python, Java, Go, C, JavaScript + server configs).</p>
              <p><b>Why this matters:</b> a future <b>quantum computer</b> can crack the math behind today's RSA / ECC encryption. Attackers are already <i>stealing encrypted data today</i> to decrypt later. This report finds every spot at risk — <b>before</b> the machines arrive.</p>
            </div>
            <div>
              <p className="legend-line"><span className="swatch sw-danger" /> <b>Weak today</b> — breakable with ordinary computers, right now.</p>
              <p className="legend-line"><span className="swatch sw-quantum" /> <b>Quantum risk</b> — safe today, but a quantum computer cracks it.</p>
              <p className="legend-line"><span className="swatch sw-ok" /> <b>Strong</b> — safe today and quantum-safe (the goal).</p>
              <p>Scroll to the bottom for a full glossary.</p>
            </div>
          </div>
        </section>
      )}

      {/* 1 · THE VERDICT */}
      <section className={`verdict ${verdictClass}`}>
        <div className="verdict-main">
          <div className="verdict-kicker">verdict</div>
          <h1 className="verdict-title">
            {stats.qPct}% of this codebase's encryption is <span className="hero-q">quantum-vulnerable</span>
          </h1>
          <p className="verdict-sub">
            {stats.q} of {stats.total} findings break under a quantum computer · {stats.critical} already
            Critical today · Mosca clock says <b>HIGH risk</b>.
          </p>
        </div>
        <div className="verdict-num">{stats.qPct}<span>%</span></div>
      </section>

      {/* 2 · AT A GLANCE */}
      <section className="section">
        <h2 className="section-title">At a glance</h2>
        <div className="buckets">
          <div className="bucket bucket-danger">
            <div className="bucket-icon">🚨</div>
            <div className="bucket-num">{stats.weak}</div>
            <div className="bucket-label">weak <b>today</b></div>
            <div className="bucket-note">breakable with normal computers</div>
          </div>
          <div className="bucket bucket-quantum">
            <div className="bucket-icon">⚛️</div>
            <div className="bucket-num">{stats.q}<span className="bucket-pct"> ({stats.qPct}%)</span></div>
            <div className="bucket-label">quantum risk</div>
            <div className="bucket-note">breaks when quantum computers arrive</div>
          </div>
          <div className="bucket bucket-ok">
            <div className="bucket-icon">✅</div>
            <div className="bucket-num">{stats.ok}</div>
            <div className="bucket-label">already strong</div>
            <div className="bucket-note">safe today <i>and</i> quantum-safe</div>
          </div>
        </div>
      </section>

      {/* 3 · WORST ISSUES FIRST */}
      <section className="section">
        <h2 className="section-title">Fix these first <span className="section-sub">the biggest problems, in plain words</span></h2>
        <WorstIssues findings={findings} max={5} />
      </section>

      {/* 4 · WHY NOW (MOSCA) */}
      <section className="section">
        <h2 className="section-title">Why now? The Mosca clock <span className="section-sub">are we running out of time?</span></h2>
        <div className="card mosca-card">
          <MoscaBar mosca={stats.mosca} />
        </div>
      </section>

      {/* 5 · HEATMAP */}
      <section className="section">
        <h2 className="section-title">Every algorithm we found <span className="section-sub">click a tile to filter the list below</span></h2>
        <div className="card heatmap-card">
          <div className="heatmap-legend">
            <span><span className="swatch sw-danger" /> worst is broken today</span>
            <span><span className="swatch sw-quantum" /> worst is quantum risk</span>
            <span><span className="swatch sw-ok" /> fine</span>
          </div>
          <Heatmap findings={findings} onSelect={setAlgo} selected={algo} />
        </div>
      </section>

      {/* 6 · FULL LIST */}
      <section className="section">
        <h2 className="section-title">Every finding <span className="count-badge">{filtered.length} shown</span></h2>
        <div className="filters">
          <div className="filter-group">
            <span className="filter-label">type</span>
            {categories.map((c) => (
              <button key={c} className={`chip ${category === c ? 'chip-active' : ''}`} onClick={() => setCategory(c)}>
                {c === 'All' ? 'All' : categoryFriendly(c)}
              </button>
            ))}
          </div>
          <div className="filter-group">
            <span className="filter-label">severity</span>
            {SEVERITIES.map((s) => (
              <button key={s} className={`chip sev-chip-${s.toLowerCase()} ${severity === s ? 'chip-active' : ''}`} onClick={() => setSeverity(s)}>
                {s}
              </button>
            ))}
          </div>
          {algo && (
            <div className="filter-group">
              <button className="chip chip-active" onClick={() => setAlgo(null)}>{algo} ✕</button>
            </div>
          )}
        </div>
        <div className="card table-card">
          <FindingsTable findings={filtered} />
        </div>
      </section>

      {/* GLOSSARY */}
      <section className="section">
        <h2 className="section-title">Handy glossary <span className="section-sub">no jargon left behind</span></h2>
        <div className="card glossary-card">
          {GLOSSARY.map(([term, def]) => (
            <div className="glossary-row" key={term}>
              <dt>{term}</dt>
              <dd>{def}</dd>
            </div>
          ))}
        </div>
      </section>

      <footer className="footer">
        Demo data: CipherScope scanned a purpose-built sample codebase (ACME Corp payments platform).
        Results are real scanner output · Mosca: {stats.mosca ? `${stats.mosca.data_lifetime_years}y data + ${stats.mosca.migration_years}y migration vs ${stats.mosca.quantum_horizon_years}y horizon` : '10y + 6y vs 15y'}.
      </footer>
    </div>
  )
}
