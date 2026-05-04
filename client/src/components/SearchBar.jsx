import { useState } from 'react'

export default function SearchBar({ onSearch, loading }) {
  const [value, setValue] = useState('')

  function handleSearch() {
    if (value.trim()) onSearch(value.trim())
  }

  return (
    <div style={{
      display: 'flex',
      gap: '10px',
      marginBottom: '28px',
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '14px',
      padding: '8px'
    }}>
      <input
        style={{
          flex: 1, padding: '10px 14px', border: 'none',
          background: 'transparent', color: 'var(--text)',
          fontSize: '1rem', outline: 'none'
        }}
        placeholder="Enter a GitHub username..."
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSearch()}
      />
      <button
        onClick={handleSearch}
        disabled={loading}
        style={{
          padding: '10px 22px',
          background: loading ? '#1e3a5f' : '#3b82f6',
          color: 'white', border: 'none', borderRadius: '8px',
          fontSize: '0.95rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Loading...' : 'Analyze'}
      </button>
    </div>
  )
}