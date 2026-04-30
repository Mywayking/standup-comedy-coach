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

// Fallback punchlines used when angle has no dedicated mock data
const FALLBACK_PUNCHLINES: WorkflowCard[] = [
  {
    id: 'fallback-pl-1', projectId: 'proj-1', stepType: 'punchline',
    title: null,
    content: '我小时候特别讨厌我外公，他偏心这件事，我到现在都没忘。不是因为我记仇，是因为这个故事太好笑了。',
    metadata: { type_tag: '铺垫', placement: '前面', why_this_works: '用"记仇"反转，制造幽默感', coach_tip: '说到"太好笑了"时要自然，不要刻意停顿', next_question: '这个故事后来有反转吗？' },
    selected: false, favorite: false, editable: false, order: 0, createdBy: 'ai', version: 1,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  },
  {
    id: 'fallback-pl-2', projectId: 'proj-1', stepType: 'punchline',
    title: null,
    content: '外公对我表哥特别好，给我就差很多。我就想，外公你是不是在用实际行动告诉我什么叫"差别对待"？',
    metadata: { type_tag: '转折', placement: '中间', why_this_works: '把"差别对待"变成外公的一种"教育"，产生冷幽默', coach_tip: '这里要冷静地说，像是在陈述事实', next_question: '你爸妈知道这件事吗？' },
    selected: false, favorite: false, editable: false, order: 0, createdBy: 'ai', version: 1,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  },
  {
    id: 'fallback-pl-3', projectId: 'proj-1', stepType: 'punchline',
    title: null,
    content: '每次外公给我表哥买好东西，我就只能看着。我就想，这是现实版的"同人不同命"吧。',
    metadata: { type_tag: '包袱', placement: '中间', why_this_works: '用"同人不同命"做总结，把委屈变成顺口溜', coach_tip: '说到"同人不同命"时要有节奏感', next_question: '外公后来有没有补偿过你？' },
    selected: false, favorite: false, editable: false, order: 0, createdBy: 'ai', version: 1,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  },
  {
    id: 'fallback-pl-4', projectId: 'proj-1', stepType: 'punchline',
    title: null,
    content: '外公总说"你是外孙"，我就想，那我叫你外公，你叫我什么？叫"那个谁"？',
    metadata: { type_tag: 'Tag', placement: '后面', why_this_works: '用称呼的逻辑矛盾制造笑点', coach_tip: '最后一句要快，像在追问，不要停顿', next_question: '外公怎么回应你的追问？' },
    selected: false, favorite: false, editable: false, order: 0, createdBy: 'ai', version: 1,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  },
  {
    id: 'fallback-pl-5', projectId: 'proj-1', stepType: 'punchline',
    title: null,
    content: '后来我明白了，外公的偏心其实是一种"传统"。就像过年给红包，外孙永远比孙子少一半。',
    metadata: { type_tag: 'call-back', placement: '后面', why_this_works: '把"偏心"延伸到春节红包，制造群体共鸣', coach_tip: '说到"少一半"时要有一种恍然大悟感', next_question: '你今年过年拿到红包了吗？' },
    selected: false, favorite: false, editable: false, order: 0, createdBy: 'ai', version: 1,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  },
  {
    id: 'fallback-pl-6', projectId: 'proj-1', stepType: 'punchline',
    title: null,
    content: '但说实话，外公对我也不差。只是那种"不差"，像是餐厅里的"免费小菜"——有也行，没有也行。',
    metadata: { type_tag: '转场', placement: '后面', why_this_works: '用餐厅比喻给段子一个柔软结尾，既承认外公的好，又暗示了委屈', coach_tip: '结尾要温和，不要太尖锐', next_question: '现在跟外公关系怎么样了？' },
    selected: false, favorite: false, editable: false, order: 0, createdBy: 'ai', version: 1,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  }
]

export function PunchlineStep({ onNext }: PunchlineStepProps) {
  const router = useRouter()
  const { currentProject, setStep } = useProjectStore()
  const { punchlineStatus, setStatus } = useUIStore()
  const { cards, setCards, getCardsByType, getSelectedPunchlines, getSelectedCard } = useCardStore()
  const [showCoachReview, setShowCoachReview] = useState(false)
  const [coachReview] = useState<CoachReview>(mockCoachReview)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isFailed, setIsFailed] = useState(false)
  const [generationKey, setGenerationKey] = useState(0)

  const angleId = currentProject?.angleId
  const angle = getSelectedCard('angle')
  const punchlines = getCardsByType('punchline')
  const selectedPunchlines = getSelectedPunchlines()
  const canContinue = selectedPunchlines.length >= 1  // 至少选 1 个

  // Initialize punchlines when angle is selected (or retry is triggered)
  useEffect(() => {
    if (!angleId) return

    // Cancel if punchlines for this angle already exist
    const existingPunchlines = cards.filter(c => c.stepType === 'punchline')
    if (existingPunchlines.length > 0) return

    setIsGenerating(true)
    setIsFailed(false)

    // R1 Fix: use getState() to avoid stale closures
    let cancelled = false
    const timer = setTimeout(() => {
      if (cancelled) return
      setIsGenerating(false)
      setIsFailed(true)
    }, 8000)  // 8s timeout

    // Use dedicated mock data if available, otherwise fallback
    const mockPls = mockPunchlinesByAngle[angleId]
    const source = mockPls || FALLBACK_PUNCHLINES

    // Small artificial delay to feel like "generating"
    setTimeout(() => {
      if (cancelled) return
      clearTimeout(timer)
      const currentCards = useCardStore.getState().cards
      const newCards: WorkflowCard[] = source.map((p, i) => ({
        ...p,
        id: `pl-${angleId}-${i + 1}`,
        selected: currentProject?.selectedPunchlineIds?.includes(`pl-${angleId}-${i + 1}`) || false,
        order: currentProject?.selectedPunchlineIds?.indexOf(`pl-${angleId}-${i + 1}`) ?? -1
      })).map(c => ({ ...c, order: c.order >= 0 ? c.order : 0 }))

      setCards([...currentCards.filter(c => c.stepType !== 'punchline'), ...newCards])
      setIsGenerating(false)
      setIsFailed(false)
    }, 300)  // 300ms fake "generation" delay

    return () => { cancelled = true; clearTimeout(timer) }
  }, [angleId, generationKey])

  const handleRetry = () => {
    // Clear existing punchlines and re-generate
    setCards(cards.filter(c => c.stepType !== 'punchline'))
    setIsGenerating(false)
    setIsFailed(false)
    setGenerationKey(k => k + 1)
  }

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
        padding: '10px 16px', background: selectedPunchlines.length >= 1 ? '#DCFCE7' : '#FEF9C3',
        borderRadius: 10, marginBottom: 16, fontSize: 14, display: 'flex',
        justifyContent: 'space-between', alignItems: 'center'
      }}>
        <span style={{ color: selectedPunchlines.length >= 1 ? '#16A34A' : '#CA8A04' }}>
          已选择 {selectedPunchlines.length} 个包袱
        </span>
        <span style={{ color: '#71717A', fontSize: 12 }}>
          {punchlines.length > 0 ? '建议选择 3-6 个' : ''}
        </span>
      </div>

      {/* Punchlines */}
      {punchlines.length > 0 ? (
        <div>
          {punchlines.map((card, i) => (
            <PunchlineCard key={card.id} card={card} index={i} />
          ))}
        </div>
      ) : isGenerating ? (
        <LoadingState
          step="punchline"
          message="正在生成包袱..."
          steps={['分析角度结构...', '寻找笑点...', '生成 6 个包袱...']}
        />
      ) : (
        <LoadingState
          step="punchline"
          isFailed={isFailed}
          onRetry={handleRetry}
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
        <button className="btn btn-primary" onClick={handleNext} disabled={!canContinue || punchlines.length === 0 || isGenerating}>
          生成草稿 →
        </button>
        <button className="btn btn-ghost" onClick={handleBack}>
          ← 返回角度
        </button>
      </div>
    </div>
  )
}
