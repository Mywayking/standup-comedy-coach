'use client'
import { useState, useEffect, ReactNode } from 'react'
import { useProjectStore } from '@/store/projectStore'
import { useCardStore } from '@/store/cardStore'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export function ClientBoundary({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [rehydrated, setRehydrated] = useState(false)

  useEffect(() => {
    const rehydrate = async () => {
      try {
        await Promise.all([
          useProjectStore.persist.rehydrate(),
          useCardStore.persist.rehydrate(),
        ])
      } catch (e) {
        // Ignore errors
      }
      setRehydrated(true)
      setMounted(true)
    }
    rehydrate()
  }, [])

  if (!mounted) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#FAFAFA',
        color: '#71717A',
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        fontSize: 16,
        flexDirection: 'column',
        gap: 16,
      }}>
        <div style={{ fontSize: 64 }}>🎤</div>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#3F3F46' }}>手把手教你玩脱口秀</div>
        <div style={{ fontSize: 14 }}>加载中...</div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  )
}
