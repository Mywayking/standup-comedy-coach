'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useProjectStore } from '@/store/projectStore'
import { useUIStore } from '@/store/uiStore'
import { useCardStore } from '@/store/cardStore'
import { WorkflowProgress } from '@/components/WorkflowProgress'
import { LoadingState } from '@/components/LoadingState'
import { mockFinalScript, mockCoachReview } from '@/lib/mockData'
import { estimateDuration } from '@/lib/utils'

export function DraftStep() {
  const router = useRouter()
  const { currentProject, setFinalScript, markCompleted } = useProjectStore()
  const { draftStatus, setStatus, setAutoSaving, setLastSavedAt } = useUIStore()
  const { getSelectedPunchlines } = useCardStore()
  const [isGenerating, setIsGenerating] = useState(false)
  const [script, setScript] = useState(currentProject?.finalScript || '')
  const [wordCount, setWordCount] = useState(currentProject?.wordCountFinal || 0)
  const [duration, setDuration] = useState(currentProject?.durationFinal || 0)
  const [isEditing, setIsEditing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const selectedPunchlines = getSelectedPunchlines()

  useEffect(() => {
    if (!currentProject?.finalScript && selectedPunchlines.length > 0 && !isGenerating) {
      handleGenerateDraft()
    } else if (currentProject?.finalScript) {
      setScript(currentProject.finalScript)
      setWordCount(currentProject.wordCountFinal || 0)
      setDuration(currentProject.durationFinal || 0)
    }
  }, [currentProject?.finalScript, selectedPunchlines])

  const handleGenerateDraft = async () => {
    if (isGenerating) return
    setIsGenerating(true)
    setStatus('draft', 'loading')
    setAutoSaving(true)

    await new Promise(resolve => setTimeout(resolve, 3000))

    const generated = mockFinalScript
    setScript(generated)
    const wc = generated.length
    const dur = estimateDuration(generated)
    setWordCount(wc)
    setDuration(dur)
    setFinalScript(generated, wc)
    setStatus('draft', 'saved')
    setAutoSaving(false)
    setLastSavedAt(new Date().toISOString())
    setIsGenerating(false)
  }

  const handleEdit = () => {
    setIsEditing(true)
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  const handleSaveEdit = () => {
    const wc = script.length
    const dur = estimateDuration(script)
    setWordCount(wc)
    setDuration(dur)
    setFinalScript(script, wc)
    setIsEditing(false)
    setLastSavedAt(new Date().toISOString())
  }

  const handleComplete = () => {
    markCompleted()
    router.push('/create/complete')
  }

  const handleBack = () => {
    router.push('/create/punchline')
  }

  if (isGenerating) {
    return (
      <div>
        <WorkflowProgress currentStep="draft" />
        <LoadingState
          step="draft"
          message="正在组合草稿..."
          steps={['分析已选包袱...', '规划结构...', '生成完整段子...', '优化衔接...']}
        />
      </div>
    )
  }

  return (
    <div>
      <WorkflowProgress currentStep="draft" />

      <div className="header">
        <button onClick={handleBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 8, fontSize: 14, color: '#71717A' }}>
          ← 返回
        </button>
        <div>
          <h1 className="header-title">📄 草稿生成</h1>
          <p style={{ fontSize: 14, color: '#71717A', margin: '4px 0 0 0' }}>
            你的脱口秀稿子
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        <div style={{ flex: 1, padding: '12px 16px', background: '#F4F4F5', borderRadius: 10, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#7C3AED' }}>{wordCount}</div>
          <div style={{ fontSize: 12, color: '#71717A' }}>字数</div>
        </div>
        <div style={{ flex: 1, padding: '12px 16px', background: '#F4F4F5', borderRadius: 10, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#7C3AED' }}>~{duration}s</div>
          <div style={{ fontSize: 12, color: '#71717A' }}>预计时长</div>
        </div>
        <div style={{ flex: 1, padding: '12px 16px', background: '#F4F4F5', borderRadius: 10, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#7C3AED' }}>{selectedPunchlines.length}</div>
          <div style={{ fontSize: 12, color: '#71717A' }}>使用包袱</div>
        </div>
      </div>

      {/* Script */}
      {isEditing ? (
        <div style={{ marginBottom: 16 }}>
          <textarea
            ref={textareaRef}
            className="textarea-material draft-preview"
            value={script}
            onChange={(e) => setScript(e.target.value)}
            style={{ minHeight: 400, fontFamily: 'Georgia, serif', fontSize: 15 }}
          />
          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <button className="btn btn-primary" onClick={handleSaveEdit} style={{ flex: 1 }}>
              保存修改
            </button>
            <button className="btn btn-secondary" onClick={() => {
              setScript(currentProject?.finalScript || '')
              setIsEditing(false)
            }} style={{ flex: 1 }}>
              取消
            </button>
          </div>
        </div>
      ) : (
        <div className="draft-preview" style={{ fontFamily: 'Georgia, serif', fontSize: 15 }}>
          {script}
        </div>
      )}

      {/* Edit button */}
      {!isEditing && (
        <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" onClick={handleEdit} style={{ flex: 1 }}>
            ✏️ 编辑稿子
          </button>
          <button className="btn btn-secondary" onClick={handleGenerateDraft} style={{ flex: 1 }}>
            🔄 重新生成
          </button>
        </div>
      )}

      {/* Coach review snippet */}
      <div style={{ marginTop: 20, padding: 16, background: '#FFFBEB', borderRadius: 12, border: '1px solid #FDE68A' }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: '#92400E' }}>🎓 AI 教练点评</div>
        <p style={{ fontSize: 14, color: '#78350F', lineHeight: 1.7, marginBottom: 12 }}>{mockCoachReview.assessment}</p>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#92400E', marginBottom: 6 }}>✨ 亮点</div>
          {mockCoachReview.strengths.slice(0, 2).map((s, i) => (
            <div key={i} style={{ fontSize: 13, color: '#78350F', marginBottom: 4 }}>• {s}</div>
          ))}
        </div>

        <div style={{ fontSize: 13, color: '#92400E', fontWeight: 600 }}>
          下一步：{mockCoachReview.nextStep}
        </div>
      </div>

      {/* Copy & Complete */}
      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button className="btn btn-primary" onClick={() => {
          navigator.clipboard.writeText(script)
          alert('已复制到剪贴板！')
        }}>
          📋 复制稿子
        </button>
        <button className="btn btn-secondary" onClick={handleComplete}>
          ✓ 完成创作
        </button>
        <button className="btn btn-ghost" onClick={handleBack}>
          ← 返回修改
        </button>
      </div>
    </div>
  )
}
