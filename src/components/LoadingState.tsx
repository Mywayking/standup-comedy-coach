// Loading state component
'use client'
import { WorkflowProgress } from './WorkflowProgress'
import type { WorkflowStep } from '@/types'

interface LoadingStateProps {
  step: WorkflowStep
  message?: string
  steps?: string[]
}

export function LoadingState({ step, message, steps }: LoadingStateProps) {
  const defaultMessages: Record<WorkflowStep, string> = {
    material: '正在分析素材...',
    diagnosis: '正在诊断素材...',
    premise: '正在生成前提...',
    angle: '正在发散角度...',
    punchline: '正在生成包袱...',
    draft: '正在组合草稿...'
  }

  const displayMessage = message || defaultMessages[step]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center' }}>
      <div style={{ width: 60, height: 60, marginBottom: 24 }}>
        <div className="spinner" style={{ width: 60, height: 60, borderWidth: 4, borderColor: '#E4E4E7', borderTopColor: '#7C3AED' }} />
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{displayMessage}</h3>
      <p style={{ fontSize: 14, color: '#71717A', marginBottom: 32 }}>请稍候，AI 正在思考中...</p>
      <div style={{ width: '100%', maxWidth: 300 }}>
        <WorkflowProgress currentStep={step} />
      </div>
      {steps && (
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 300 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#71717A' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#7C3AED' }} />
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
