import { useState } from 'react'
import { CommitHeatmap, LanguageChart } from './Charts'

const MODES = [
  { id: 'single', label: '🎯 One repo each', desc: 'Pick one specific repo per dev' },
  { id: 'multi',  label: '📦 Multiple repos', desc: 'Pick several repos per dev' },
  { id: 'whole',  label: '👤 Whole profile',  desc: 'Judge their entire GitHub' },
]

const MULTI_MODES = [
  { id: 'combined', label: '➕ Add all stats together', desc: 'Combined score battle' },
  { id: 'best',     label: '🏆 Best repo wins',         desc: 'Pick the strongest repo automatically' },
  { id: 'ranked',   label: '📊 Rank by importance',     desc: 'Order matters — top repo weighted most' },
]

function RepoCheckList({ repos, selected, onToggle, max }) {
  return (
    <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
      {repos.map(repo => {
        const checked = selected.includes(repo.name)
        const disabled = !checked && max && selected.length >= max
        return (
          <div
            key={repo.name}
            onClick={() => !disabled && onToggle(repo.name)}
            style={{
              padding: '9px 14px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              borderBottom: '1px solid var(--border)',
              background: checked ? 'var(--accent-glow)' : 'transparent',
              borderLeft: checked ? '3px solid var(--accent)' : '3px solid transparent',
              opacity: disabled ? 0.4 : 1,
              transition: 'all 0.15s',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.87rem', color: checked ? 'var(--accent)' : 'var(--text)' }}>
                {repo.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 2 }}>
                ⭐ {repo.stars} {repo.language ? `· ${repo.language}` : ''}
              </div>
            </div>
            {checked && <span style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>✓</span>}
          </div>
        )
      })}
    </div>
  )
}

function DevColumn({ label, accentColor, username, setUsername, repos, loadRepos, loadingRepos,
  battleMode, selectedRepos, toggleRepo }) {

  return (
    <div style={{
      flex: 1, background: 'var(--surface)',
      border: `1px solid ${accentColor}22`,
      borderRadius: 14, padding: 20
    }}>
      <p style={{ fontWeight: 700, fontSize: '0.9rem', color: accentColor, marginBottom: 12 }}>{label}</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          value={username}
          onChange={e => setUsername(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && loadRepos()}
          placeholder="GitHub username..."
          style={{
            flex: 1, padding: '8px 12px', borderRadius: 8,
            border: '1px solid var(--border)', background: 'var(--surface2)',
            color: 'var(--text)', fontSize: '0.9rem', outline: 'none'
          }}
        />
        <button
          onClick={loadRepos}
          disabled={loadingRepos}
          style={{
            padding: '8px 14px',
            background: loadingRepos ? '#1e3a5f' : accentColor,
            color: 'white', border: 'none', borderRadius: 8,
            fontSize: '0.85rem', fontWeight: 600,
            cursor: loadingRepos ? 'not-allowed' : 'pointer'
          }}
        >
          {loadingRepos ? '...' : 'Load'}
        </button>
      </div>

      {repos.length > 0 && battleMode !== 'whole' && (
        <>
          <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: 8 }}>
            {battleMode === 'single' ? 'Pick one repo:' : 'Pick repos:'}
          </p>
          <RepoCheckList
            repos={repos}
            selected={selectedRepos}
            onToggle={toggleRepo}
            max={battleMode === 'single' ? 1 : null}
          />
          {selectedRepos.length > 0 && (
            <p style={{ fontSize: '0.78rem', color: 'var(--accent)', marginTop: 8 }}>
              ✅ {selectedRepos.length} selected
            </p>
          )}
        </>
      )}

      {repos.length > 0 && battleMode === 'whole' && (
        <p style={{ fontSize: '0.82rem', color: 'var(--green)', marginTop: 4 }}>
          ✅ {repos.length} repos loaded — whole profile will be judged
        </p>
      )}
    </div>
  )
}

export default function UnifiedBattle() {
  const [battleMode, setBattleMode] = useState('')
  const [multiMode, setMultiMode] = useState('combined')

  const [username1, setUsername1] = useState('')
  const [username2, setUsername2] = useState('')
  const [repos1, setRepos1] = useState([])
  const [repos2, setRepos2] = useState([])
  const [loading1, setLoading1] = useState(false)
  const [loading2, setLoading2] = useState(false)
  const [selected1, setSelected1] = useState([])
  const [selected2, setSelected2] = useState([])

  const [result, setResult] = useState(null)
  const [battling, setBattling] = useState(false)
  const [error, setError] = useState('')

  async function loadRepos(num) {
    const username = num === 1 ? username1 : username2
    const setLoading = num === 1 ? setLoading1 : setLoading2
    const setRepos = num === 1 ? setRepos1 : setRepos2
    const setSelected = num === 1 ? setSelected1 : setSelected2

    if (!username.trim()) return
    setLoading(true)
    setSelected([])

    try {
      const res = await fetch(`/api/repos/${username.trim()}`)
      const data = await res.json()
      setRepos(data)
    } catch {
      setRepos([])
    } finally {
      setLoading(false)
    }
  }

  function toggleRepo(num, name) {
    const selected = num === 1 ? selected1 : selected2
    const setSelected = num === 1 ? setSelected1 : setSelected2

    if (battleMode === 'single') {
      setSelected([name])
    } else {
      setSelected(prev =>
        prev.includes(name) ? prev.filter(r => r !== name) : [...prev, name]
      )
    }
  }

  function canBattle() {
    if (!username1.trim() || !username2.trim()) return false
    if (battleMode === 'whole') return repos1.length > 0 && repos2.length > 0
    if (battleMode === 'single') return selected1.length === 1 && selected2.length === 1
    if (battleMode === 'multi') return selected1.length >= 2 && selected2.length >= 2
    return false
  }

  async function handleBattle() {
    setBattling(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/battle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user1: username1.trim(),
          user2: username2.trim(),
          mode: battleMode,
          repos1: selected1,
          repos2: selected2,
          multiMode,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data)
    } catch (err) {
      setError(err.message || 'Battle failed. Check both usernames.')
    } finally {
      setBattling(false)
    }
  }

  const btnReady = canBattle()

  return (
    <div style={{ marginTop: 56, paddingTop: 40, borderTop: '1px solid var(--border)' }}>

      {/* Header */}
      <p style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 6 }}>⚔️ Unified Battle Mode</p>
      <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: 28 }}>
        Choose how you want to battle — then let the AI decide who's better
      </p>

      {/* Battle mode selector */}
      <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Battle Type
      </p>
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {MODES.map(m => (
          <div
            key={m.id}
            onClick={() => { setBattleMode(m.id); setSelected1([]); setSelected2([]) }}
            style={{
              flex: 1, minWidth: 140, padding: '12px 16px',
              borderRadius: 10, cursor: 'pointer',
              border: battleMode === m.id ? '2px solid var(--accent)' : '1px solid var(--border)',
              background: battleMode === m.id ? 'var(--accent-glow)' : 'var(--surface)',
              transition: 'all 0.15s'
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>{m.label}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{m.desc}</div>
          </div>
        ))}
      </div>

      {/* Multi mode sub-selector */}
      {battleMode === 'multi' && (
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Judging Style
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {MULTI_MODES.map(m => (
              <div
                key={m.id}
                onClick={() => setMultiMode(m.id)}
                style={{
                  flex: 1, minWidth: 140, padding: '12px 16px',
                  borderRadius: 10, cursor: 'pointer',
                  border: multiMode === m.id ? '2px solid var(--purple)' : '1px solid var(--border)',
                  background: multiMode === m.id ? 'var(--purple-glow)' : 'var(--surface)',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>{m.label}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{m.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dev columns */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
        <DevColumn
          label="⚔️ Fighter 1"
          accentColor="#3b82f6"
          username={username1}
          setUsername={setUsername1}
          repos={repos1}
          loadRepos={() => loadRepos(1)}
          loadingRepos={loading1}
          battleMode={battleMode}
          selectedRepos={selected1}
          toggleRepo={name => toggleRepo(1, name)}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
          <span style={{
            fontWeight: 900, fontSize: '0.85rem', color: 'var(--red)',
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 20, padding: '4px 10px', letterSpacing: 1
          }}>VS</span>
        </div>

        <DevColumn
          label="⚔️ Fighter 2"
          accentColor="#a855f7"
          username={username2}
          setUsername={setUsername2}
          repos={repos2}
          loadRepos={() => loadRepos(2)}
          loadingRepos={loading2}
          battleMode={battleMode}
          selectedRepos={selected2}
          toggleRepo={name => toggleRepo(2, name)}
        />
      </div>

      {/* Helper text */}
      {!btnReady && (
        <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: 16, textAlign: 'center' }}>
          {battleMode === 'single' && 'Load repos for both fighters and pick one each'}
          {battleMode === 'multi' && 'Load repos for both fighters and pick at least 2 each'}
          {battleMode === 'whole' && 'Load repos for both fighters to begin'}
        </p>
      )}

      {error && <div className="error-box">{error}</div>}

      {/* Battle button */}
      <button
        onClick={handleBattle}
        disabled={battling || !btnReady}
        style={{
          width: '100%', padding: 14,
          background: battling || !btnReady
            ? '#2d1f4e'
            : 'linear-gradient(135deg, #a855f7, #3b82f6)',
          color: 'white', border: 'none', borderRadius: 12,
          fontSize: '1rem', fontWeight: 700,
          cursor: battling || !btnReady ? 'not-allowed' : 'pointer',
          marginBottom: 28, transition: 'all 0.2s'
        }}
      >
        {battling ? '⚔️ Battling...' : '⚔️ Start Battle'}
      </button>

      {/* Results */}
      {result && (
        <>
          {/* Profile cards + charts side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>

            {/* Fighter 1 */}
            <div>
              <div style={{
                background: 'var(--surface)',
                border: '1px solid #3b82f633',
                borderRadius: 14, padding: 20, textAlign: 'center',
                marginBottom: 14,
              }}>
                <img src={result.profile1.avatar} alt=""
                  style={{ width: 68, height: 68, borderRadius: '50%', marginBottom: 10 }} />
                <h4 style={{ fontWeight: 700, marginBottom: 4 }}>{result.profile1.name}</h4>
                <p style={{ color: '#3b82f6', fontSize: '0.85rem', marginBottom: 14 }}>
                  @{result.profile1.username}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    '⭐ ' + result.profile1.totalStars + ' stars',
                    '👥 ' + result.profile1.followers + ' followers',
                    '📦 ' + result.profile1.public_repos + ' repos',
                  ].map(function(stat) {
                    return (
                      <span key={stat} style={{
                        background: 'var(--surface2)', border: '1px solid var(--border)',
                        borderRadius: 8, padding: '5px 10px', fontSize: '0.8rem',
                      }}>{stat}</span>
                    )
                  })}
                </div>
              </div>
              {result.stats1 && (
                <>
                  <CommitHeatmap data={result.stats1.commitActivity} compact={true} />
                  <LanguageChart data={result.stats1.languages} compact={true} />
                </>
              )}
            </div>

            {/* Fighter 2 */}
            <div>
              <div style={{
                background: 'var(--surface)',
                border: '1px solid #a855f733',
                borderRadius: 14, padding: 20, textAlign: 'center',
                marginBottom: 14,
              }}>
                <img src={result.profile2.avatar} alt=""
                  style={{ width: 68, height: 68, borderRadius: '50%', marginBottom: 10 }} />
                <h4 style={{ fontWeight: 700, marginBottom: 4 }}>{result.profile2.name}</h4>
                <p style={{ color: '#a855f7', fontSize: '0.85rem', marginBottom: 14 }}>
                  @{result.profile2.username}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    '⭐ ' + result.profile2.totalStars + ' stars',
                    '👥 ' + result.profile2.followers + ' followers',
                    '📦 ' + result.profile2.public_repos + ' repos',
                  ].map(function(stat) {
                    return (
                      <span key={stat} style={{
                        background: 'var(--surface2)', border: '1px solid var(--border)',
                        borderRadius: 8, padding: '5px 10px', fontSize: '0.8rem',
                      }}>{stat}</span>
                    )
                  })}
                </div>
              </div>
              {result.stats2 && (
                <>
                  <CommitHeatmap data={result.stats2.commitActivity} compact={true} />
                  <LanguageChart data={result.stats2.languages} compact={true} />
                </>
              )}
            </div>

          </div>

          {/* AI Verdict */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--purple)',
            borderRadius: 16, padding: 28,
            boxShadow: '0 0 40px var(--purple-glow)',
          }}>
            <p style={{ color: 'var(--muted)', marginBottom: 16, fontSize: '0.9rem' }}>
              🤖 AI Battle Verdict
            </p>
            <div style={{ fontSize: '0.95rem', lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>
              {result.verdict}
            </div>
          </div>
        </>
      )}
    </div>
  )
}