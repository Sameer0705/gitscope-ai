import {
  PieChart, Pie, Cell, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'

const COLORS = [
  '#3b82f6', '#a855f7', '#22c55e', '#f59e0b',
  '#ef4444', '#06b6d4', '#f97316', '#ec4899',
]

// ── Commit Heatmap ─────────────────────────────────────────────────────────────
export function CommitHeatmap({ data, compact }) {
  const countMap = {}
  if (data) {
    data.forEach(function(d) { countMap[d.date] = d.count })
  }

  const days = []
  const today = new Date()
  const numDays = compact ? 63 : 91
  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    days.push({ date: key, count: countMap[key] || 0 })
  }

  const weeks = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  function getColor(count) {
    if (count === 0) return '#1a1d24'
    if (count <= 2)  return '#1d4ed8'
    if (count <= 5)  return '#2563eb'
    if (count <= 10) return '#3b82f6'
    return '#60a5fa'
  }

  const cellSize = compact ? 11 : 14
  const cellGap  = compact ? 3  : 4

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 16, padding: compact ? 16 : 28, marginBottom: 20,
    }}>
      <p style={{ fontWeight: 600, marginBottom: 16, fontSize: compact ? '0.85rem' : '1rem' }}>
        🗓️ Commit Activity
      </p>
      <div style={{ display: 'flex', gap: cellGap, overflowX: 'auto', paddingBottom: 4 }}>
        {weeks.map(function(week, wi) {
          return (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: cellGap }}>
              {week.map(function(day, di) {
                return (
                  <div
                    key={di}
                    title={day.date + ': ' + day.count + ' commits'}
                    style={{
                      width: cellSize, height: cellSize,
                      borderRadius: 2,
                      background: getColor(day.count),
                      cursor: 'default',
                      transition: 'transform 0.1s',
                    }}
                    onMouseEnter={function(e) { e.target.style.transform = 'scale(1.4)' }}
                    onMouseLeave={function(e) { e.target.style.transform = 'scale(1)' }}
                  />
                )
              })}
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
        <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>Less</span>
        {['#1a1d24', '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa'].map(function(c) {
          return <div key={c} style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
        })}
        <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>More</span>
      </div>
    </div>
  )
}

// ── Language Pie Chart ─────────────────────────────────────────────────────────
export function LanguageChart({ data, compact }) {
  if (!data || data.length === 0) return null

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 16, padding: compact ? 16 : 28, marginBottom: 20,
    }}>
      <p style={{ fontWeight: 600, marginBottom: 16, fontSize: compact ? '0.85rem' : '1rem' }}>
        🔵 Language Breakdown
      </p>
      <ResponsiveContainer width="100%" height={compact ? 180 : 260}>
        <PieChart>
          <Pie
            data={data}
            cx="50%" cy="50%"
            innerRadius={compact ? 40 : 60}
            outerRadius={compact ? 70 : 100}
            paddingAngle={3}
            dataKey="count"
          >
            {data.map(function(_, i) {
              return <Cell key={i} fill={COLORS[i % COLORS.length]} />
            })}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: 8, color: 'var(--text)',
            }}
            formatter={function(value, name) { return [value + ' repos', name] }}
          />
          <Legend
            formatter={function(value) {
              return (
                <span style={{ color: 'var(--text)', fontSize: '0.82rem' }}>{value}</span>
              )
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}