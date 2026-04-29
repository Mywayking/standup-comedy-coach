'use client'
import { Component, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      return <ErrorFallback error={this.state.error} onRetry={this.handleRetry} />
    }
    return this.props.children
  }
}

function ErrorFallback({ error, onRetry }: { error?: Error; onRetry: () => void }) {
  const router = useRouter()

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
      <div style={{ fontSize: 64, marginBottom: 16 }}>😅</div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', marginBottom: 8, textAlign: 'center' }}>
        出了点小问题
      </h1>
      <p style={{ fontSize: 14, color: '#71717A', marginBottom: 24, textAlign: 'center', maxWidth: 360 }}>
        应用遇到了意外错误，请尝试刷新页面或返回首页重新开始。
      </p>
      {process.env.NODE_ENV === 'development' && error && (
        <pre style={{
          fontSize: 12,
          color: '#EF4444',
          background: '#FEF2F2',
          padding: 12,
          borderRadius: 8,
          marginBottom: 24,
          maxWidth: 400,
          overflow: 'auto',
          textAlign: 'left',
          maxHeight: 120,
          width: '100%',
        }}>
          {error.message}
        </pre>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 280 }}>
        <button
          onClick={onRetry}
          style={{
            width: '100%',
            padding: '12px 24px',
            borderRadius: 10,
            border: 'none',
            background: '#7C3AED',
            color: 'white',
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          🔄 重试
        </button>
        <button
          onClick={() => router.push('/')}
          style={{
            width: '100%',
            padding: '10px 24px',
            borderRadius: 10,
            border: '1px solid #E4E4E7',
            background: 'white',
            color: '#71717A',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          ← 返回首页
        </button>
      </div>
    </div>
  )
}
