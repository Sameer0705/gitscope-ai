import { useState } from 'react'
import SearchBar from './components/SearchBar'
import ProfileCard from './components/ProfileCard'
import RoastSection from './components/RoastSection'
import RepoList from './components/RepoList'
import UnifiedBattle from './components/UnifiedBattle'
import Leaderboard from './components/Leaderboard'
import { CommitHeatmap, LanguageChart } from './components/Charts'

export default function App() {
  const [user, setUser]           = useState(null)
  const [repos, setRepos]         = useState([])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [roast, setRoast]         = useState('')
  const [roastLoading, setRoastLoading] = useState(false)
  const [stats, setStats]         = useState(null)

  async function handleSearch(username) {
  setLoading(true)
  setError('')
  setUser(null)
  setRepos([])
  setRoast('')
  setStats(null)

  try {
    const [userRes, reposRes] = await Promise.all([
      fetch('/api/user/' + username),
      fetch('/api/repos/' + username),
    ])

    if (!userRes.ok) throw new Error('User not found')

    const userData  = await userRes.json()
    const reposData = await reposRes.json()

    setUser(userData)
    setRepos(reposData)

    // Stats fetches separately — never kills main search if it fails
    fetch('/api/stats/' + username)
      .then(function(r) { return r.json() })
      .then(function(data) { setStats(data) })
      .catch(function() { setStats(null) })

  } catch (err) {
    setError('User not found. Check the username and try again.')
  } finally {
    setLoading(false)
  }
}

  async function handleRoast() {
    if (!user) return
    setRoastLoading(true)
    setRoast('')

    try {
      const res  = await fetch('/api/roast/' + user.username)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setRoast(data.roast)
    } catch {
      setRoast('Failed to generate roast. Try again.')
    } finally {
      setRoastLoading(false)
    }
  }

  return (
    <div className="container">

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{
          fontSize: '2.8rem', fontWeight: 800,
          background: 'linear-gradient(135deg, #3b82f6, #a855f7)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: '10px',
        }}>
          🔭 GitScope AI
        </div>
        <p style={{ color: 'var(--muted)' }}>
          Analyze any GitHub profile — report card, roast, and dev battles
        </p>
      </div>

      <SearchBar onSearch={handleSearch} loading={loading} />

      {error && <div className="error-box">{error}</div>}

      {user && (
        <>
          <ProfileCard user={user} />

          {/* Heatmap sits between profile and roast */}

          <RoastSection
            onRoast={handleRoast}
            roast={roast}
            loading={roastLoading}
            username={user.username}
            avatar={user.avatar}
          />

          {/* Language pie sits below roast */}
          {stats && stats.languages.length > 0 && (
            <LanguageChart data={stats.languages} />
          )}

          <RepoList repos={repos} />

          {stats && (
            <CommitHeatmap data={stats.commitActivity} />
          )}
        </>
      )}

      <UnifiedBattle />
      <Leaderboard />
    </div>
  )
}