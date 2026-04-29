'use client'
import { useRouter } from 'next/navigation'
import { useProjectStore } from '@/store/projectStore'
import { useCardStore } from '@/store/cardStore'
import { useUIStore } from '@/store/uiStore'

export default function SettingsPage() {
  const router = useRouter()
  const { clearProject } = useProjectStore()
  const { clearAll } = useCardStore()
  const { resetAll } = useUIStore()

  const handleClearAll = () => {
    if (confirm('确定要清除所有数据吗？这将删除所有项目记录。')) {
      clearProject()
      clearAll()
      resetAll()
      router.push('/')
    }
  }

  return (
    <div className="container-app page-content">
      <div className="header">
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 8, fontSize: 14, color: '#71717A' }}>
          ← 返回
        </button>
        <h1 className="header-title">⚙️ 设置</h1>
      </div>

      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, color: '#71717A', marginBottom: 12 }}>关于</h2>
        <div style={{ background: 'white', border: '1px solid #E4E4E7', borderRadius: 12 }}>
          {[
            { label: '应用名称', value: '手把手教你玩脱口秀' },
            { label: '版本', value: '1.0.0' },
            { label: '描述', value: 'AI 脱口秀创作教练' },
          ].map((item, i) => (
            <div key={i} style={{ padding: '14px 16px', borderBottom: i < 2 ? '1px solid #E4E4E7' : 'none', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 15, color: '#71717A' }}>{item.label}</span>
              <span style={{ fontSize: 15, maxWidth: '60%', textAlign: 'right' }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, color: '#71717A', marginBottom: 12 }}>数据</h2>
        <div style={{ background: 'white', border: '1px solid #E4E4E7', borderRadius: 12 }}>
          <button onClick={handleClearAll} style={{ width: '100%', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 15, color: '#EF4444', display: 'flex', justifyContent: 'space-between' }}>
            <span>清除所有数据</span><span>→</span>
          </button>
        </div>
        <div style={{ fontSize: 12, color: '#A1A1AA', marginTop: 8 }}>清除后无法恢复</div>
      </div>

      <div style={{ textAlign: 'center', padding: '24px 0', color: '#A1A1AA', fontSize: 13 }}>
        <p style={{ marginBottom: 4 }}>Made with ❤️ for comedy</p>
        <p>Powered by AI</p>
      </div>
    </div>
  )
}
