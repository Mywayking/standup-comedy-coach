'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useProjectStore } from '@/store/projectStore'
import { useUIStore } from '@/store/uiStore'
import { useCardStore } from '@/store/cardStore'
import { WorkflowProgress } from '@/components/WorkflowProgress'
import { DiagnosisCard } from '@/components/DiagnosisCard'
import { LoadingState } from '@/components/LoadingState'
import { mockDiagnosis } from '@/lib/mockData'
import { generateId } from '@/lib/utils'
import type { Diagnosis } from '@/types'

interface MaterialStepProps {
  onNext: () => void
}

export function MaterialStep({ onNext }: MaterialStepProps) {
  const router = useRouter()
  const { currentProject, updateMaterial, setDiagnosis, setStep, setProject } = useProjectStore()
  const { diagnosisStatus, setStatus } = useUIStore()
  const { setCards, addCards } = useCardStore()
  const [materialContent, setMaterialContent] = useState(
    currentProject?.material?.content || ''
  )
  const [diagnosis, setDiagnosisLocal] = useState<Diagnosis | null>(
    currentProject?.diagnosis || null
  )
  const [isGenerating, setIsGenerating] = useState(false)
  const [showDiagnosis, setShowDiagnosis] = useState(false)

  const canGenerate = materialContent.trim().length >= 10
  const canContinue = !!diagnosis

  const handleGenerate = async () => {
    if (!canGenerate || isGenerating) return

    setIsGenerating(true)
    setStatus('diagnosis', 'loading')

    // Simulate AI call
    await new Promise(resolve => setTimeout(resolve, 2500))

    // Create project if it doesn't exist yet
    if (!currentProject) {
      const newProject = {
        id: generateId('proj'),
        title: null,
        status: 'in_progress' as const,
        material: { content: materialContent.trim() },
        diagnosis: null as Diagnosis | null,
        premiseId: null,
        angleId: null,
        selectedPunchlineIds: [],
        finalScript: null,
        wordCountFinal: null,
        durationFinal: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setProject(newProject)
    } else {
      updateMaterial({ content: materialContent.trim() })
    }

    // Use mock diagnosis
    const result = mockDiagnosis
    setDiagnosisLocal(result)
    setDiagnosis(result)
    setShowDiagnosis(true)
    setStatus('diagnosis', 'saved')
    setIsGenerating(false)
  }

  const handleNext = () => {
    if (!canContinue) return
    setStep('premise')
    router.push('/create/premise')
  }

  return (
    <div>
      <WorkflowProgress currentStep="material" />

      <div className="header">
        <div>
          <h1 className="header-title">📝 素材输入</h1>
          <p style={{ fontSize: 14, color: '#71717A', margin: '4px 0 0 0' }}>
            讲讲你的生活故事
          </p>
        </div>
      </div>

      {/* Material input */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
          你的脱口秀素材
        </label>
        <textarea
          className="textarea-material"
          value={materialContent}
          onChange={(e) => {
            setMaterialContent(e.target.value)
            setShowDiagnosis(false)
            setDiagnosisLocal(null)
          }}
          placeholder="例如：我小时候特别讨厌我外公，他偏心特别厉害，给我表哥买自行车，不给我买。他说因为我是外孙，是外面的孙子。"
          style={{ minHeight: 160 }}
        />
        <div style={{ fontSize: 12, color: '#A1A1AA', marginTop: 6, textAlign: 'right' }}>
          {materialContent.length} 字
        </div>
      </div>

      {/* Generate diagnosis */}
      {isGenerating ? (
        <LoadingState step="diagnosis" />
      ) : showDiagnosis && diagnosis ? (
        <div style={{ marginBottom: 16 }}>
          <DiagnosisCard diagnosis={diagnosis} />
        </div>
      ) : null}

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {!showDiagnosis && (
          <button
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={!canGenerate || isGenerating}
          >
            {isGenerating ? (
              <>
                <div className="spinner" />
                分析中...
              </>
            ) : (
              <>🔍 AI 诊断素材</>
            )}
          </button>
        )}

        {showDiagnosis && (
          <button className="btn btn-primary" onClick={handleNext} disabled={!canContinue}>
            继续 → 前提选择
          </button>
        )}

        <button className="btn btn-ghost" onClick={() => router.push('/')}>
          ← 返回首页
        </button>
      </div>
    </div>
  )
}
