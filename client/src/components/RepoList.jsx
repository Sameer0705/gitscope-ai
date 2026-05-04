export default function RepoList({ repos }) {
  if (!repos.length) return null

  return (
    <div style={{ marginBottom: 28 }}>
      <h3 style={{ marginBottom: 16, fontSize: '1.1rem', fontWeight: 600 }}>Top Repositories</h3>
      {repos.slice(0, 10).map(repo => (
        <div key={repo.name} style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '18px 20px', marginBottom: 10,
          transition: 'all 0.2s'
        }}>
          <a href={repo.url} target="_blank" rel="noreferrer"
            style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
            {repo.name}
          </a>
          <p style={{ color: 'var(--muted)', fontSize: '0.87rem', marginTop: 5 }}>
            {repo.description || 'No description'}
          </p>
          <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: '0.8rem', color: 'var(--muted)' }}>
            <span>⭐ {repo.stars}</span>
            <span>🍴 {repo.forks}</span>
            {repo.language && <span>🔵 {repo.language}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}