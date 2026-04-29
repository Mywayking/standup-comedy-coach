// Failed state component
'use client'
import { useUIStore } from '@/store/uiStore'

interface FailedStateProps {
  onRetry: () => void
  title?: string
}

export function FailedState({ onRetry, title }: FailedStateProps) {
  const { error } = useUIStore()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>😵</div>
      <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
        {title || '生成失败了'}
      </h3>
      <p style={{ fontSize: 14, color: '#71717A', marginBottom: 24, lineHeight: 1.6, maxWidth: 300 }}>
        {error?.message || '网络有点慢，请重试'}
      </p>
      <button className="btn btn-primary" onClick={onRetry} style={{ width: 200 }}>
        🔄 重试
      </button>
    </div>
  )
}
