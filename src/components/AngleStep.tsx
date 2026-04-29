'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useProjectStore } from '@/store/projectStore'
import { useUIStore } from '@/store/uiStore'
import { useCardStore } from '@/store/cardStore'
import { WorkflowProgress } from '@/components/WorkflowProgress'
import { AngleCard } from '@/components/AngleCard'
import { LoadingState } from '@/components/LoadingState'
import { mockAnglesByPremise } from '@/lib/mockData'
import type { WorkflowCard } from '@/types'

interface AngleStepProps {
  onNext: () => void
}

export function AngleStep({ onNext }: AngleStepProps) {
  const router = useRouter()
  const { currentProject, selectAngle, setStep } = useProjectStore()
  const { angleStatus, setStatus } = useUIStore()
  const { cards, setCards, getCardsByType, getSelectedCard } = useCardStore()
  const [isGenerating, setIsGenerating] = useState(false)

  const premiseId = currentProject?.premiseId
  const premise = getSelectedCard('premise')
  const angles = getCardsByType('angle')
  const selectedAngle = angles.find(a => a.selected)

  // Initialize angles when premise is selected
  useEffect(() => {
    if (premiseId && angles.length === 0) {
      const premiseKey = premiseId // e.g. "premise-1"
      const mockAngles = mockAnglesByPremise[premiseKey] || []

      if (mockAngles.length > 0) {
        const newCards: WorkflowCard[] = mockAngles.map((a, i) => ({
          ...a,
          id: `angle-${premiseId}-${i + 1}`,
          order: 0,
          selected: currentProject?.angleId === `angle-${premiseId}-${i + 1}`
        }))
        setCards([...cards.filter(c => c.stepType !== 'angle'), ...newCards])
      }
    }
  }, [premiseId])

  const handleSelect = (id: string) => {
    selectAngle(id)
    setStep('punchline')
    router.push('/create/punchline')
  }

  const handleBack = () => {
    router.push('/create/premise')
  }

  if (!premiseId) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ color: '#71717A' }}>请先选择一个前提</p>
        <button className="btn btn-secondary" onClick={handleBack} style={{ marginTop: 16 }}>
          返回前提选择
        </button>
      </div>
    )
  }

  return (
    <div>
      <WorkflowProgress currentStep="angle" />

      <div className="header">
        <button onClick={handleBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 8, fontSize: 14, color: '#71717A' }}>
          ← 返回
        </button>
        <div>
          <h1 className="header-title">🎯 角度发散</h1>
          <p style={{ fontSize: 14, color: '#71717A', margin: '4px 0 0 0' }}>
            找到最有趣的具体角度
          </p>
        </div>
      </div>

      {/* Selected premise */}
      {premise && (
        <div style={{
          padding: '12px 16px', background: '#F5F3FF', borderRadius: 10,
          marginBottom: 20, fontSize: 14
        }}>
          <div style={{ fontSize: 12, color: '#7C3AED', fontWeight: 600, marginBottom: 4 }}>当前前提</div>
          <div style={{ fontWeight: 600, color: '#1a1a1a' }}>{premise.title}</div>
        </div>
      )}

      {/* Intro */}
      <div style={{
        padding: '12px 16px', background: '#F5F3FF', borderRadius: 10,
        fontSize: 14, color: '#7C3AED', marginBottom: 20, lineHeight: 1.6
      }}>
        角度是你讲这个前提的具体方式。选择一个你最有感觉的角度，然后我们一起找到最好的包袱。
      </div>

      {/* Angles */}
      {angles.length > 0 ? (
        <div>
          {angles.map(card => (
            <AngleCard key={card.id} card={card} />
          ))}
        </div>
      ) : (
        <LoadingState
          step="angle"
          message="正在生成角度..."
          steps={['分析前提结构...', '寻找喜剧角度...', '生成 3 个角度...']}
        />
      )}

      {/* Selected angle */}
      {selectedAngle && (
        <div style={{ marginTop: 20, padding: '16px', background: '#22C55E', color: 'white', borderRadius: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 14, marginBottom: 4 }}>✓ 已选择</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{selectedAngle.title || '无标题角度'}</div>
          <button
            onClick={() => handleSelect(selectedAngle.id)}
            className="btn btn-primary"
            style={{ marginTop: 16, background: 'white', color: '#22C55E' }}
          >
            继续 → 包袱选择
          </button>
        </div>
      )}

      {/* Tip */}
      <div style={{ marginTop: 24, padding: '12px 16px', background: '#F4F4F5', borderRadius: 10, fontSize: 13, color: '#71717A', lineHeight: 1.6 }}>
        💡 <strong>教练提示：</strong>每个角度都有不同的潜力标签（高、中、低）。高潜力的角度通常有更强的反转或意外感。
      </div>
    </div>
  )
}
