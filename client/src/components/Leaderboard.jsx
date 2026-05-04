import { useEffect, useState } from 'react'

const MEDALS = ['🥇', '🥈', '🥉']

const TABS = [
  { id: 'roasted', label: '🔥 Most Roasted',  endpoint: '/api/leaderboard/roasted' },
  { id: 'battled', label: '⚔️ Most Battled',  endpoint: '/api/leaderboard/battled' },
  { id: 'winrate', label: '🏆 Win Rate',       endpoint: '/api/leaderboard/winrate' },
  { id: 'starred', label: '⭐ Top Starred',    endpoint: '/api/leaderboard/starred' },
]

const ROAST_TITLES = [
  'Legendary Roastee', 'Hall of Flame', 'Certified Cooked',
  'Thoroughly Toasted', 'Medium Rare Dev', 'Lightly Scorched',
  'Barely Singed', 'First Timer', 'Just Arrived', 'Fresh Meat',
]

function Medal({ i }) {
  if (i === 0) return <span style={{ fontSize: '1.3rem' }}>{MEDALS[0]}</span>
  if (i === 1) return <span style={{ fontSize: '1.3rem' }}>{MEDALS[1]}</span>
  if (i === 2) return <span style={{ fontSize: '1.3rem' }}>{MEDALS[2]}</span>
  return <span style={{ color: 'var(--muted)', fontWeight: 700 }}>{'#' + (i + 1)}</span>
}

function StatBadge({ label, value, highlight }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      background: highlight ? 'rgba(239,68,68,0.1)' : 'var(--surface2)',
      border: '1px solid ' + (highlight ? 'rgba(239,68,68,0.25)' : 'var(--border)'),
      borderRadius: 10, padding: '6px 14px', flexShrink: 0,
    }}>
      <span style={{ fontSize: '1rem', fontWeight: 800, color: highlight ? '#ef4444' : 'var(--text)' }}>
        {value}
      </span>
      <span style={{ fontSize: '0.68rem', color: 'var(--muted)', marginTop: 1 }}>{label}</span>
    </div>
  )
}

function RoastedRow({ entry, i }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      background: i <= 2 ? 'var(--surface2)' : 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 12, padding: '14px 18px',
    }}>
      <div style={{ width: 32, textAlign: 'center', flexShrink: 0 }}><Medal i={i} /></div>
      <img src={entry.avatar} alt="" style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <a href={'https://github.com/' + entry.username} target="_blank" rel="noreferrer"
            style={{ color: 'var(--text)', textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem' }}>
            {entry.name}
          </a>
          <span style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>@{entry.username}</span>
        </div>
        <div style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: 3 }}>
          {ROAST_TITLES[i] || 'Roasted'} · Last roasted {new Date(entry.lastRoasted).toLocaleDateString()}
        </div>
      </div>
      <StatBadge value={entry.roastCount} label={entry.roastCount === 1 ? 'roast' : 'roasts'} highlight={i <= 2} />
    </div>
  )
}

function BattledRow({ entry, i }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      background: i <= 2 ? 'var(--surface2)' : 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 12, padding: '14px 18px',
    }}>
      <div style={{ width: 32, textAlign: 'center', flexShrink: 0 }}><Medal i={i} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <a href={'https://github.com/' + entry.username} target="_blank" rel="noreferrer"
          style={{ color: 'var(--text)', textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem' }}>
          @{entry.username}
        </a>
        {entry.repos && entry.repos.length > 0 && (
          <div style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: 3 }}>
            Repos battled: {entry.repos.slice(0, 3).join(', ')}
            {entry.repos.length > 3 ? ' +' + (entry.repos.length - 3) + ' more' : ''}
          </div>
        )}
      </div>
      <StatBadge value={entry.battles} label="battles" highlight={i <= 2} />
    </div>
  )
}

function WinRateRow({ entry, i }) {
  const rate = entry.winRate + '%'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      background: i <= 2 ? 'var(--surface2)' : 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 12, padding: '14px 18px',
    }}>
      <div style={{ width: 32, textAlign: 'center', flexShrink: 0 }}><Medal i={i} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <a href={'https://github.com/' + entry.username} target="_blank" rel="noreferrer"
          style={{ color: 'var(--text)', textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem' }}>
          @{entry.username}
        </a>
        <div style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: 3 }}>
          {entry.wins}W / {entry.losses}L across {entry.battles} battles
        </div>
        <div style={{ marginTop: 8, background: 'var(--surface2)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
          <div style={{
            width: rate, height: '100%',
            background: 'linear-gradient(90deg, #22c55e, #16a34a)',
            borderRadius: 4, transition: 'width 0.6s ease',
          }} />
        </div>
      </div>
      <StatBadge value={rate} label="win rate" highlight={i <= 2} />
    </div>
  )
}

function StarredRow({ entry, i }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      background: i <= 2 ? 'var(--surface2)' : 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 12, padding: '14px 18px',
    }}>
      <div style={{ width: 32, textAlign: 'center', flexShrink: 0 }}><Medal i={i} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <a href={'https://github.com/' + entry.username} target="_blank" rel="noreferrer"
          style={{ color: 'var(--text)', textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem' }}>
          @{entry.username}
        </a>
        {entry.repos && entry.repos.length > 0 && (
          <div style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: 3 }}>
            Top repo: {entry.repos[0]}
          </div>
        )}
      </div>
      <StatBadge value={'⭐ ' + entry.topStars} label="top stars" highlight={i <= 2} />
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 16, padding: 40, textAlign: 'center',
    }}>
      <p style={{ fontSize: '2rem', marginBottom: 12 }}>🌵</p>
      <p style={{ color: 'var(--muted)' }}>Nothing here yet.</p>
      <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: 4 }}>
        Start roasting and battling profiles to populate this board.
      </p>
    </div>
  )
}

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState('roasted')
  const [data, setData]           = useState({})
  const [loading, setLoading]     = useState(false)

  function fetchTab(tabId) {
    const tab = TABS.find(function(t) { return t.id === tabId })
    if (!tab) return
    if (data[tabId]) return
    setLoading(true)
    fetch(tab.endpoint)
      .then(function(r) { return r.json() })
      .then(function(d) {
        setData(function(prev) {
          const next = Object.assign({}, prev)
          next[tabId] = d
          return next
        })
        setLoading(false)
      })
      .catch(function() { setLoading(false) })
  }

  useEffect(function() { fetchTab('roasted') }, [])

  function switchTab(tabId) {
    setActiveTab(tabId)
    fetchTab(tabId)
  }

  function refresh() {
    setData({})
    setLoading(true)
    const tab = TABS.find(function(t) { return t.id === activeTab })
    fetch(tab.endpoint)
      .then(function(r) { return r.json() })
      .then(function(d) {
        setData(function(prev) {
          const next = Object.assign({}, prev)
          next[activeTab] = d
          return next
        })
        setLoading(false)
      })
      .catch(function() { setLoading(false) })
  }

  const current = data[activeTab] || []

  return (
    <div style={{ marginTop: 56, paddingTop: 40, borderTop: '1px solid var(--border)' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <p style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 6 }}>🔥 Hall of Flame</p>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Live rankings — roasts, battles, win rates and stars</p>
        </div>
        <button onClick={refresh} style={{
          padding: '8px 16px', background: 'var(--surface)',
          border: '1px solid var(--border)', borderRadius: 8,
          color: 'var(--muted)', fontSize: '0.82rem', cursor: 'pointer',
        }}>
          ↻ Refresh
        </button>
      </div>

      {/* Tab toggle */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
        {TABS.map(function(tab) {
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={function() { switchTab(tab.id) }}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
                background: active ? 'var(--accent-glow)' : 'var(--surface)',
                color: active ? 'var(--accent)' : 'var(--muted)',
                fontSize: '0.85rem', fontWeight: active ? 700 : 400,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '32px 0' }}>
          Loading...
        </div>
      ) : current.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {current.map(function(entry, i) {
            if (activeTab === 'roasted') return <RoastedRow key={entry.username} entry={entry} i={i} />
            if (activeTab === 'battled') return <BattledRow key={entry.username} entry={entry} i={i} />
            if (activeTab === 'winrate') return <WinRateRow key={entry.username} entry={entry} i={i} />
            return <StarredRow key={entry.username} entry={entry} i={i} />
          })}
        </div>
      )}

    </div>
  )
}