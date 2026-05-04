export default function ProfileCard({ user }) {
  return (
    <div style={{
      display: 'flex', gap: '24px',
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '16px', padding: '28px',
      marginBottom: '20px', alignItems: 'flex-start'
    }}>
      <img
        src={user.avatar} alt="avatar"
        style={{ width: 88, height: 88, borderRadius: '50%', border: '2px solid var(--border)', flexShrink: 0 }}
      />
      <div>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: 2 }}>
          {user.name || user.username}
        </h2>
        <p style={{ color: 'var(--accent)', fontSize: '0.9rem', marginBottom: 8 }}>
          @{user.username}
        </p>
        {user.bio && <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: 6 }}>{user.bio}</p>}
        {user.location && <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 12 }}>📍 {user.location}</p>}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            `👥 ${user.followers} followers`,
            `➡️ ${user.following} following`,
            `📦 ${user.public_repos} repos`
          ].map(stat => (
            <span key={stat} style={{
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 20, padding: '4px 12px', fontSize: '0.8rem'
            }}>{stat}</span>
          ))}
        </div>
      </div>
    </div>
  )
}