'use client'
import { useState, useEffect, ReactNode } from 'react'
import { useProjectStore } from '@/store/projectStore'
import { useCardStore } from '@/store/cardStore'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export function ClientBoundary({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // 立即 setMounted，不等待任何 rehydrate
    setMounted(true)

    // rehydrate 在后台异步执行，不阻塞渲染
    Promise.allSettled([
      useProjectStore.persist?.rehydrate?.(),
      useCardStore.persist?.rehydrate?.(),
    ]).then((results) => {
      console.log('[hydrate] stores rehydrated', results)
    }).catch((error) => {
      console.warn('[hydrate] rehydrate failed, continue without persisted state', error)
    })
  }, [])

  // 仅在服务端渲染阶段短暂显示 SSR 占位
  // 客户端 useEffect 触发后立即渲染真实内容
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
      </div>
    )
  }

  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  )
}
