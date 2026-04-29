'use client'
import { ErrorBoundary as ReactErrorBoundary } from '@/components/ErrorBoundary'
import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ReactErrorBoundary>
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
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>
          出了点小问题
        </h1>
        <p style={{ fontSize: 14, color: '#71717A', marginBottom: 24 }}>
          当前页面遇到错误，请重试。
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 280 }}>
          <button
            onClick={reset}
            style={{
              width: '100%', padding: '12px 24px', borderRadius: 10, border: 'none',
              background: '#7C3AED', color: 'white', fontSize: 16, fontWeight: 600, cursor: 'pointer',
            }}
          >
            🔄 重试
          </button>
        </div>
      </div>
    </ReactErrorBoundary>
  )
}
