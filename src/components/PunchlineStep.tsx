'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useProjectStore } from '@/store/projectStore'
import { useUIStore } from '@/store/uiStore'
import { useCardStore } from '@/store/cardStore'
import { WorkflowProgress } from '@/components/WorkflowProgress'
import { PunchlineCard } from '@/components/PunchlineCard'
import { LoadingState } from '@/components/LoadingState'
import { mockPunchlinesByAngle, mockCoachReview } from '@/lib/mockData'
import type { WorkflowCard, CoachReview } from '@/types'

interface PunchlineStepProps {
  onNext: () => void
}

export function PunchlineStep({ onNext }: PunchlineStepProps) {
  const router = useRouter()
  const { currentProject, setStep } = useProjectStore()
  const { punchlineStatus, setStatus } = useUIStore()
  const { cards, setCards, getCardsByType, getSelectedPunchlines, getSelectedCard } = useCardStore()
  const [isGenerating, setIsGenerating] = useState(false)
  const [showCoachReview, setShowCoachReview] = useState(false)
  const [coachReview] = useState<CoachReview>(mockCoachReview)

  const angleId = currentProject?.angleId
  const angle = getSelectedCard('angle')
  const punchlines = getCardsByType('punchline')
  const selectedPunchlines = getSelectedPunchlines()
  const canContinue = selectedPunchlines.length >= 2

  // Initialize punchlines when angle is selected
  useEffect(() => {
    if (angleId && punchlines.length === 0) {
      const mockPls = mockPunchlinesByAngle[angleId]
      if (mockPls) {
        const newCards: WorkflowCard[] = mockPls.map((p, i) => ({
          ...p,
          id: `pl-${angleId}-${i + 1}`,
          selected: currentProject?.selectedPunchlineIds?.includes(`pl-${angleId}-${i + 1}`) || false,
          order: currentProject?.selectedPunchlineIds?.indexOf(`pl-${angleId}-${i + 1}`) ?? -1
        })).map(c => ({ ...c, order: c.order >= 0 ? c.order : 0 }))
        setCards([...cards.filter(c => c.stepType !== 'punchline'), ...newCards])
      }
    }
  }, [angleId])

  const handleNext = () => {
    if (!canContinue) return
    setStep('draft')
    router.push('/create/draft')
  }

  const handleBack = () => {
    router.push('/create/angle')
  }

  const handleToggleReview = () => {
    setShowCoachReview(!showCoachReview)
  }

  if (!angleId) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ color: '#71717A' }}>请先选择一个角度</p>
        <button className="btn btn-secondary" onClick={handleBack} style={{ marginTop: 16 }}>
          返回角度选择
        </button>
      </div>
    )
  }

  return (
    <div>
      <WorkflowProgress currentStep="punchline" />

      <div className="header">
        <button onClick={handleBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 8, fontSize: 14, color: '#71717A' }}>
          ← 返回
        </button>
        <div>
          <h1 className="header-title">🎭 包袱选择</h1>
          <p style={{ fontSize: 14, color: '#71717A', margin: '4px 0 0 0' }}>
            选择你要用的包袱
          </p>
        </div>
      </div>

      {/* Selected angle */}
      {angle && (
        <div style={{
          padding: '12px 16px', background: '#F5F3FF', borderRadius: 10,
          marginBottom: 16, fontSize: 14
        }}>
          <div style={{ fontSize: 12, color: '#7C3AED', fontWeight: 600, marginBottom: 4 }}>当前角度</div>
          <div style={{ fontWeight: 600, color: '#1a1a1a' }}>{angle.title || '无标题角度'}</div>
        </div>
      )}

      {/* Selection count */}
      <div style={{
        padding: '10px 16px', background: selectedPunchlines.length >= 2 ? '#DCFCE7' : '#FEF9C3',
        borderRadius: 10, marginBottom: 16, fontSize: 14, display: 'flex',
        justifyContent: 'space-between', alignItems: 'center'
      }}>
        <span style={{ color: selectedPunchlines.length >= 2 ? '#16A34A' : '#CA8A04' }}>
          已选择 {selectedPunchlines.length} 个包袱
        </span>
        <span style={{ color: '#71717A', fontSize: 12 }}>
          建议选择 3-6 个
        </span>
      </div>

      {/* Punchlines */}
      {punchlines.length > 0 ? (
        <div>
          {punchlines.map((card, i) => (
            <PunchlineCard key={card.id} card={card} index={i} />
          ))}
        </div>
      ) : (
        <LoadingState
          step="punchline"
          message="正在生成包袱..."
          steps={['分析角度结构...', '寻找笑点...', '生成 6 个包袱...']}
        />
      )}

      {/* Selected preview */}
      {selectedPunchlines.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>📋 已选包袱预览</div>
          <div className="draft-preview" style={{ fontSize: 13 }}>
            {selectedPunchlines.map((pl, i) => (
              <div key={pl.id} style={{ marginBottom: i < selectedPunchlines.length - 1 ? 12 : 0, paddingBottom: i < selectedPunchlines.length - 1 ? 12 : 0, borderBottom: i < selectedPunchlines.length - 1 ? '1px solid #E4E4E7' : 'none' }}>
                <span style={{ fontWeight: 600, color: '#7C3AED' }}>{i + 1}.</span> {pl.content}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coach review toggle */}
      <button
        onClick={handleToggleReview}
        className="btn btn-secondary"
        style={{ marginTop: 16 }}
      >
        {showCoachReview ? '🔒 收起教练点评' : '🎓 查看教练点评'}
      </button>

      {/* Coach review */}
      {showCoachReview && (
        <div style={{ marginTop: 16, padding: 16, background: '#FFFBEB', borderRadius: 12, border: '1px solid #FDE68A' }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: '#92400E' }}>🎓 AI 教练点评</div>
          <p style={{ fontSize: 14, color: '#78350F', lineHeight: 1.7, marginBottom: 16 }}>{coachReview.assessment}</p>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#92400E', marginBottom: 6 }}>✨ 亮点</div>
            {coachReview.strengths.map((s, i) => (
              <div key={i} style={{ fontSize: 13, color: '#78350F', marginBottom: 4, display: 'flex', gap: 6 }}>
                <span>•</span> {s}
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#92400E', marginBottom: 6 }}>💡 建议</div>
            {coachReview.suggestions.map((s, i) => (
              <div key={i} style={{ fontSize: 13, color: '#78350F', marginBottom: 4, display: 'flex', gap: 6 }}>
                <span>→</span> {s}
              </div>
            ))}
          </div>

          <div style={{ fontSize: 13, color: '#92400E', fontWeight: 600 }}>
            下一步：{coachReview.nextStep}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button className="btn btn-primary" onClick={handleNext} disabled={!canContinue}>
          生成草稿 →
        </button>
        <button className="btn btn-ghost" onClick={handleBack}>
          ← 返回角度
        </button>
      </div>
    </div>
  )
}
