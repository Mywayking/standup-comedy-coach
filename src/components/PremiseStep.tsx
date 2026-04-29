'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useProjectStore } from '@/store/projectStore'
import { useUIStore } from '@/store/uiStore'
import { useCardStore } from '@/store/cardStore'
import { WorkflowProgress } from '@/components/WorkflowProgress'
import { DiagnosisCard } from '@/components/DiagnosisCard'
import { PremiseCard } from '@/components/PremiseCard'
import { LoadingState } from '@/components/LoadingState'
import { mockDiagnosis, mockPremises } from '@/lib/mockData'
import { generateId } from '@/lib/utils'
import type { WorkflowCard } from '@/types'

interface PremiseStepProps {
  onNext: () => void
}

export function PremiseStep({ onNext }: PremiseStepProps) {
  const router = useRouter()
  const { currentProject, selectPremise, setStep } = useProjectStore()
  const { premiseStatus, setStatus } = useUIStore()
  const { cards, setCards, addCards, getCardsByType } = useCardStore()
  const [isGenerating, setIsGenerating] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  const diagnosis = currentProject?.diagnosis
  const premises = getCardsByType('premise')
  const selectedPremise = premises.find(p => p.selected)
  const canContinue = !!selectedPremise

  // Initialize premises if not loaded
  useEffect(() => {
    if (premises.length === 0 && diagnosis) {
      // Load mock premises
      const cards: WorkflowCard[] = mockPremises.map((p, i) => ({
        ...p,
        id: `premise-${i + 1}`,
        order: 0,
        selected: currentProject?.premiseId === `premise-${i + 1}`
      }))
      setCards(cards)
    }
  }, [diagnosis, premises.length])

  const handleGenerate = async () => {
    if (isGenerating) return
    setIsGenerating(true)
    setStatus('premise', 'loading')
    await new Promise(resolve => setTimeout(resolve, 2000))
    // Already loaded from mock
    setStatus('premise', 'saved')
    setIsGenerating(false)
  }

  const handleSelect = (id: string) => {
    selectPremise(id)
    setStep('angle')
    router.push('/create/angle')
  }

  const handleBack = () => {
    router.push('/create/material')
  }

  return (
    <div>
      <WorkflowProgress currentStep="premise" />

      <div className="header">
        <button onClick={handleBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 8, fontSize: 14, color: '#71717A' }}>
          ← 返回
        </button>
        <div>
          <h1 className="header-title">💡 前提选择</h1>
          <p style={{ fontSize: 14, color: '#71717A', margin: '4px 0 0 0' }}>
            选择你的核心切入点
          </p>
        </div>
      </div>

      {/* Diagnosis summary */}
      {diagnosis && (
        <div style={{ marginBottom: 20 }}>
          <DiagnosisCard diagnosis={diagnosis} collapsed />
        </div>
      )}

      {/* Intro */}
      <div style={{
        padding: '12px 16px', background: '#F5F3FF', borderRadius: 10,
        fontSize: 14, color: '#7C3AED', marginBottom: 20, lineHeight: 1.6
      }}>
        前提是你段子的核心切入点。选择一个最能引发共鸣的前提，然后我们一起找到最好的角度。
      </div>

      {/* Premises */}
      {premises.length > 0 ? (
        <div>
          {premises.map(card => (
            <PremiseCard key={card.id} card={card} />
          ))}
        </div>
      ) : (
        <LoadingState
          step="premise"
          message="正在生成前提..."
          steps={['分析素材结构...', '寻找喜剧切入点...', '生成 3 个前提...']}
        />
      )}

      {/* Selected premise detail */}
      {selectedPremise && (
        <div style={{ marginTop: 20, padding: '16px', background: '#22C55E', color: 'white', borderRadius: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 14, marginBottom: 4 }}>✓ 已选择</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{selectedPremise.title}</div>
          <button
            onClick={() => handleSelect(selectedPremise.id)}
            className="btn btn-primary"
            style={{ marginTop: 16, background: 'white', color: '#22C55E' }}
          >
            继续 → 角度发散
          </button>
        </div>
      )}

      {/* Tip */}
      <div style={{ marginTop: 24, padding: '12px 16px', background: '#F4F4F5', borderRadius: 10, fontSize: 13, color: '#71717A', lineHeight: 1.6 }}>
        💡 <strong>教练提示：</strong>前提决定了段子的方向。选择一个让你最有话说的前提。不用担心选错——后面还可以回来调整。
      </div>
    </div>
  )
}
