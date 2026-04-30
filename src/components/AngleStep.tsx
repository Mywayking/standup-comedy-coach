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

// R1 Fix: Fallback angles when premise has no mock data
const FALLBACK_ANGLES: WorkflowCard[] = [
  {
    id: 'fallback-angle-1',
    projectId: '',
    stepType: 'angle',
    title: '从当事人视角切入',
    content: '用第一人称讲述个人经历，引发观众共情和代入感。',
    metadata: {
      why_it_works: '第一人称叙事最容易引发共鸣，观众会想"我也有类似经历"',
      coach_tip: '语气要有真情实感，不要刻意表演，像在跟朋友聊天',
      next_question: '当时你的真实感受是什么？',
      tags: ['共情', '第一人称'],
      potential_label: 'high'
    },
    selected: false,
    favorite: false,
    editable: false,
    order: 0,
    createdBy: 'ai',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'fallback-angle-2',
    projectId: '',
    stepType: 'angle',
    title: '从荒谬逻辑切入',
    content: '把事件背后的逻辑推到极致，发现荒谬之处。',
    metadata: {
      why_it_works: '把日常荒谬用冷静的方式说出来，比直接吐槽更有力量',
      coach_tip: '越荒谬的地方越要冷静地说，制造反差感',
      next_question: '这个逻辑最荒谬的地方是什么？',
      tags: ['逻辑反转', '冷幽默'],
      potential_label: 'high'
    },
    selected: false,
    favorite: false,
    editable: false,
    order: 0,
    createdBy: 'ai',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'fallback-angle-3',
    projectId: '',
    stepType: 'angle',
    title: '从旁观者视角切入',
    content: '跳出来看这件事，用第三人称或者"我朋友"的视角来讲述。',
    metadata: {
      why_it_works: '旁观者视角可以制造一种"我帮你说出来"的感觉，观众更容易接受',
      coach_tip: '可以适当夸张，旁观者的吐槽往往更犀利',
      next_question: '如果你是旁观者，你会怎么说？',
      tags: ['旁观者', '群体共鸣'],
      potential_label: 'medium'
    },
    selected: false,
    favorite: false,
    editable: false,
    order: 0,
    createdBy: 'ai',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

interface AngleStepProps {
  onNext: () => void
}

export function AngleStep({ onNext }: AngleStepProps) {
  const router = useRouter()
  const { currentProject, selectAngle, setStep } = useProjectStore()
  const { angleStatus, setStatus } = useUIStore()
  const { cards, setCards, getCardsByType, getSelectedCard } = useCardStore()
  const [isGenerating, setIsGenerating] = useState(false)
  // R1 Fix: Add isFailed state for timeout/error handling
  const [isFailed, setIsFailed] = useState(false)
  // R1 Fix: generationKey to allow retry
  const [generationKey, setGenerationKey] = useState(0)

  const premiseId = currentProject?.premiseId
  const premise = getSelectedCard('premise')
  const angles = getCardsByType('angle')
  const selectedAngle = angles.find(a => a.selected)

  // R1 Fix: Robust angle generation with fallback + timeout + retry
  useEffect(() => {
    if (!premiseId) return

    // Skip if angles already exist (e.g., after refresh or retry)
    const existingAngles = cards.filter(c => c.stepType === 'angle')
    if (existingAngles.length > 0) return

    setIsGenerating(true)
    setIsFailed(false)

    // R1 Fix: 9-second timeout protection
    let cancelled = false
    const timer = setTimeout(() => {
      if (cancelled) return
      setIsGenerating(false)
      // Show fallback angles immediately on timeout (use current cards via ref)
      const currentCards = useCardStore.getState().cards
      const fallbackCards: WorkflowCard[] = FALLBACK_ANGLES.map((a, i) => ({
        ...a,
        id: `angle-${premiseId}-fallback-${i + 1}`,
        order: 0,
        selected: false,
        projectId: currentProject?.id || ''
      }))
      setCards([...currentCards.filter(c => c.stepType !== 'angle'), ...fallbackCards])
    }, 9000)

    // Small delay to simulate "AI generation"
    setTimeout(() => {
      if (cancelled) return
      clearTimeout(timer)
      const premiseKey = premiseId // e.g. "premise-1"
      const mockAngles = mockAnglesByPremise[premiseKey] || []

      // R1 Fix: If no mock data, use fallback immediately
      const source = mockAngles.length > 0 ? mockAngles : FALLBACK_ANGLES

      const currentCards = useCardStore.getState().cards
      const newCards: WorkflowCard[] = source.map((a, i) => ({
        ...a,
        id: `angle-${premiseId}-${i + 1}`,
        order: 0,
        selected: currentProject?.angleId === `angle-${premiseId}-${i + 1}`,
        projectId: currentProject?.id || ''
      }))

      setCards([...currentCards.filter(c => c.stepType !== 'angle'), ...newCards])
      setIsGenerating(false)
      setIsFailed(false)
    }, 300)

    return () => { cancelled = true; clearTimeout(timer) }
  }, [premiseId, generationKey])

  // R1 Fix: Retry handler
  const handleRetry = () => {
    // Clear existing angles first
    setCards(cards.filter(c => c.stepType !== 'angle'))
    setGenerationKey(k => k + 1)
  }

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

  // R1 Fix: Show loading or fallback/error state
  if (isGenerating && angles.length === 0) {
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
        <LoadingState
          step="angle"
          message="正在生成角度..."
          steps={['分析前提结构...', '寻找喜剧角度...', '生成 3 个角度...']}
        />
      </div>
    )
  }

  // R1 Fix: Show error state if generation failed (no angles after timeout with empty mock)
  if (isFailed && angles.length === 0) {
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
        <LoadingState
          step="angle"
          message="正在生成角度..."
          steps={['分析前提结构...', '寻找喜剧角度...', '生成 3 个角度...']}
          isFailed={true}
          onRetry={handleRetry}
        />
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
