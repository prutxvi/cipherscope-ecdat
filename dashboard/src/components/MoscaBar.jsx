
// Visual "race against the clock" — Mosca theorem as a timeline.
export default function MoscaBar({ mosca }) {
  const data = mosca || { data_lifetime_years: 10, migration_years: 6, quantum_horizon_years: 15, total_years: 16, high_risk: true }
  const d = data.data_lifetime_years
  const m = data.migration_years
  const h = data.quantum_horizon_years
  const total = data.total_years || d + m
  // scale: draw 0..(total+2) across 100%
  const scale = total + 2
  const pct = (y) => `${(100 * y) / scale}%`
  const late = total > h

  return (
    <div className="mosca">
      <div className="mosca-track">
        <div className="mosca-lane">
          <div className="mosca-seg seg-data" style={{ width: pct(d) }}>
            <span>🔒 data must stay secret <b>{d}y</b></span>
          </div>
          <div className="mosca-seg seg-migrate" style={{ width: pct(m) }}>
            <span>🛠 time to migrate <b>{m}y</b></span>
          </div>
          <div className="mosca-seg seg-safety" style={{ width: pct(total + 2 - d - m) }} />
          <div className={`mosca-marker ${late ? 'marker-late' : ''}`} style={{ left: pct(h) }}>
            <span className="mosca-marker-label">⚛ quantum arrives ~{h}y</span>
          </div>
        </div>
        <div className="mosca-total">
          Total secret-keeping time: <b>{total} years</b> vs {h} years of runway
        </div>
      </div>
      <div className={`mosca-verdict ${late ? 'verdict-bad' : 'verdict-ok'}`}>
        {late
          ? <>⚠️ <b>Too late.</b> The data must stay secret longer than we have to migrate — every year of delay makes it worse.</>
          : <>✅ <b>On time.</b> Enough runway to migrate before quantum arrives.</>}
      </div>
    </div>
  )
}
