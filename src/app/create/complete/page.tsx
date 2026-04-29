'use client'
import { useRouter } from 'next/navigation'
import { useProjectStore } from '@/store/projectStore'
import { useCardStore } from '@/store/cardStore'
import Link from 'next/link'

export default function CompletePage() {
  const router = useRouter()
  const { currentProject, clearProject } = useProjectStore()
  const { clearAll } = useCardStore()

  const handleNewProject = () => {
    clearProject()
    clearAll()
    router.push('/create/material')
  }

  const handleGoHome = () => {
    router.push('/')
  }

  if (!currentProject) {
    return (
      <div className="container-app page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="empty-state">
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>创作完成</h2>
          <Link href="/">
            <button className="btn btn-primary" style={{ width: 200 }}>
              返回首页
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container-app page-content">
      <div style={{ textAlign: 'center', paddingTop: 48, paddingBottom: 40 }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>🎉</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>创作完成！</h1>
        <p style={{ fontSize: 16, color: '#71717A', lineHeight: 1.6 }}>你的脱口秀段子已经准备好了</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
        <div style={{ flex: 1, padding: 20, background: '#F5F3FF', borderRadius: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#7C3AED' }}>{currentProject.wordCountFinal || 0}</div>
          <div style={{ fontSize: 13, color: '#7C3AED', marginTop: 4 }}>字数</div>
        </div>
        <div style={{ flex: 1, padding: 20, background: '#F5F3FF', borderRadius: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#7C3AED' }}>~{currentProject.durationFinal || 0}s</div>
          <div style={{ fontSize: 13, color: '#7C3AED', marginTop: 4 }}>时长</div>
        </div>
        <div style={{ flex: 1, padding: 20, background: '#F5F3FF', borderRadius: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#7C3AED' }}>{currentProject.selectedPunchlineIds?.length || 0}</div>
          <div style={{ fontSize: 13, color: '#7C3AED', marginTop: 4 }}>包袱数</div>
        </div>
      </div>

      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>📄 你的段子</h2>
        <div className="draft-preview">{currentProject.finalScript || '（无内容）'}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 40 }}>
        <button className="btn btn-primary" onClick={handleNewProject} style={{ height: 56 }}>✍️ 开始新段子</button>
        <button className="btn btn-secondary" onClick={handleGoHome}>返回首页</button>
      </div>
    </div>
  )
}
