'use client'
import { useRouter } from 'next/navigation'
import { useProjectStore } from '@/store/projectStore'
import Link from 'next/link'

export default function ProjectsPage() {
  const router = useRouter()
  const { currentProject } = useProjectStore()

  return (
    <div className="container-app page-content">
      <div className="header">
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 8, fontSize: 14, color: '#71717A' }}>
          ← 返回
        </button>
        <h1 className="header-title">📁 我的段子</h1>
      </div>

      {currentProject && currentProject.status === 'in_progress' && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#71717A', marginBottom: 8 }}>进行中</div>
          <div style={{ padding: 16, background: '#F5F3FF', borderRadius: 12, border: '1px solid #DDD6FE', cursor: 'pointer' }}
            onClick={() => router.push(currentProject.material ? '/create/material' : '/')}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{currentProject.title || '未命名项目'}</div>
            <div style={{ fontSize: 13, color: '#7C3AED' }}>{currentProject.material?.content?.slice(0, 50)}...</div>
            <div style={{ fontSize: 12, color: '#A78BFA', marginTop: 8 }}>点击继续创作 →</div>
          </div>
        </div>
      )}

      {(!currentProject || currentProject.status === 'completed') && (
        <div className="empty-state">
          <div style={{ fontSize: 48, marginBottom: 16 }}>📂</div>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>暂无段子</h2>
          <p style={{ color: '#71717A', marginBottom: 24 }}>开始创作你的第一个脱口秀段子吧</p>
          <Link href="/create/material">
            <button className="btn btn-primary" style={{ width: 200 }}>✍️ 开始创作</button>
          </Link>
        </div>
      )}

      <div style={{ marginTop: 40, padding: 16, background: '#F4F4F5', borderRadius: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>💡 创作建议</div>
        <p style={{ fontSize: 14, color: '#71717A', lineHeight: 1.7, margin: 0 }}>
          好的脱口秀素材通常来源于真实的生活经历。越是个人化的故事，越容易引发共鸣。
        </p>
      </div>
    </div>
  )
}
