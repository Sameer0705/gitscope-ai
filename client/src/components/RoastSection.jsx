import { useRef } from 'react'

export default function RoastSection({ onRoast, roast, loading, username, avatar }) {
  const cardRef = useRef(null)

  async function downloadCard() {
    const { default: html2canvas } = await import('html2canvas')
    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: '#0a0c10',
      scale: 2,
    })
    const link = document.createElement('a')
    link.download = username + '-gitscope-roast.png'
    link.href = canvas.toDataURL()
    link.click()
  }

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <button
          onClick={onRoast}
          disabled={loading}
          style={{
            width: '100%', padding: 14,
            background: loading ? '#4b1111' : 'linear-gradient(135deg, #dc2626, #b91c1c)',
            color: 'white', border: 'none', borderRadius: 12,
            fontSize: '1rem', fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? '🔥 Roasting...' : '🔥 Roast Me'}
        </button>
      </div>

      {roast && (
        <div style={{ marginBottom: 28 }}>

          {/* Shareable card */}
          <div
            ref={cardRef}
            style={{
              background: '#111318',
              border: '1px solid #2a2d35',
              borderRadius: 16,
              padding: 28,
              marginBottom: 12,
            }}
          >
            {/* Card header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              {avatar && (
                <img
                  src={avatar}
                  alt=""
                  style={{ width: 52, height: 52, borderRadius: '50%', border: '2px solid #2a2d35' }}
                />
              )}
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#e8eaf0' }}>@{username}</div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 2 }}>
                  🔭 GitScope AI Roast
                </div>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: '1.4rem' }}>🔥</div>
            </div>

            {/* Roast text */}
            <div style={{
              fontSize: '0.9rem',
              lineHeight: 1.85,
              whiteSpace: 'pre-wrap',
              color: '#e8eaf0',
            }}>
              {roast}
            </div>

            {/* Card footer */}
            <div style={{
              marginTop: 20,
              paddingTop: 14,
              borderTop: '1px solid #2a2d35',
              fontSize: '0.75rem',
              color: '#6b7280',
              display: 'flex',
              justifyContent: 'space-between',
            }}>
              <span>gitscope.ai</span>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>

          {/* Download button */}
          <button
            onClick={downloadCard}
            style={{
              width: '100%', padding: 12,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 10, color: 'var(--text)',
              fontSize: '0.9rem', fontWeight: 600,
              cursor: 'pointer', transition: 'border-color 0.2s',
            }}
          >
            📥 Download Roast Card
          </button>
        </div>
      )}
    </>
  )
}