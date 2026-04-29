import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: '#FAFAFA',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      <div style={{ fontSize: 80, marginBottom: 16 }}>🔍</div>
      <h1 style={{
        fontSize: 24,
        fontWeight: 700,
        color: '#1a1a1a',
        marginBottom: 8,
        textAlign: 'center',
      }}>
        页面不存在
      </h1>
      <p style={{
        fontSize: 14,
        color: '#71717A',
        marginBottom: 32,
        textAlign: 'center',
        maxWidth: 360,
      }}>
        你访问的页面不存在或已被移除。
      </p>
      <Link
        href="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px 24px',
          borderRadius: 10,
          background: '#7C3AED',
          color: 'white',
          fontSize: 16,
          fontWeight: 600,
          textDecoration: 'none',
          width: '100%',
          maxWidth: 280,
        }}
      >
        ← 返回首页
      </Link>
    </div>
  )
}
