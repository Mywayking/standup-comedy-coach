import Link from 'next/link'
import { useProjectStore } from '@/store/projectStore'

export default function HomePage() {
  const { currentProject, clearProject } = useProjectStore()

  return (
    <div className="container-app page-content">
      {/* Hero */}
      <div style={{ paddingTop: 48, paddingBottom: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎤</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.5px' }}>
          手把手教你玩脱口秀
        </h1>
        <p style={{ fontSize: 16, color: '#71717A', lineHeight: 1.6 }}>
          把你的生活素材，变成上台的段子
        </p>
      </div>

      {/* Main actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Link href="/create/material" style={{ textDecoration: 'none' }}>
          <button className="btn btn-primary" style={{ height: 56, fontSize: 17 }}>
            ✍️ 开始创作
          </button>
        </Link>

        {currentProject && currentProject.status === 'in_progress' && (
          <Link href={`/create/${currentProject.material ? 'material' : 'material'}`} style={{ textDecoration: 'none' }}>
            <button className="btn btn-secondary" style={{ height: 56, fontSize: 17 }}>
              📝 继续创作：{currentProject.title || '未命名项目'}
            </button>
          </Link>
        )}

        <Link href="/projects" style={{ textDecoration: 'none' }}>
          <button className="btn btn-secondary" style={{ height: 56, fontSize: 17 }}>
            📁 我的段子
          </button>
        </Link>

        <Link href="/settings" style={{ textDecoration: 'none' }}>
          <button className="btn btn-ghost" style={{ height: 44, fontSize: 15 }}>
            ⚙️ 设置
          </button>
        </Link>
      </div>

      {/* How it works */}
      <div style={{ marginTop: 48, paddingBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: '#71717A' }}>
          创作流程
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { emoji: '📝', title: '素材输入', desc: '讲讲你的生活故事' },
            { emoji: '🔍', title: 'AI 诊断', desc: '找到冲突和笑点' },
            { emoji: '💡', title: '前提选择', desc: '找到核心切入点' },
            { emoji: '🎯', title: '角度发散', desc: '找到具体角度' },
            { emoji: '🎭', title: '包袱选择', desc: '组合你的段子' },
            { emoji: '📄', title: '草稿生成', desc: '形成 1 分钟稿子' },
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: '#F4F4F5', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: 18
              }}>
                {step.emoji}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{step.title}</div>
                <div style={{ fontSize: 13, color: '#71717A' }}>{step.desc}</div>
              </div>
              {i < 5 && (
                <div style={{ marginLeft: 'auto', color: '#D4D4D8', fontSize: 20 }}>→</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Clear project (for demo) */}
      {currentProject && (
        <div style={{ marginTop: 24, paddingBottom: 100 }}>
          <button
            className="btn btn-ghost"
            style={{ color: '#EF4444', fontSize: 13 }}
            onClick={() => {
              if (confirm('确定要清空当前项目吗？')) {
                clearProject()
              }
            }}
          >
            🗑️ 清空当前项目（演示用）
          </button>
        </div>
      )}
    </div>
  )
}
