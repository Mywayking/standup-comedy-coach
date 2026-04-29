// Workflow progress bar component
'use client'
import { useProjectStore } from '@/store/projectStore'
import { PROGRESS_STEPS, STEP_LABELS } from '@/types'

export function WorkflowProgress({ currentStep }: { currentStep: string }) {
  const stepIndex = PROGRESS_STEPS.indexOf(currentStep as any)
  const progress = stepIndex >= 0 ? ((stepIndex + 1) / PROGRESS_STEPS.length) * 100 : 0

  return (
    <div style={{ marginBottom: 24 }}>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between', marginTop: 8,
        fontSize: 12, color: '#71717A'
      }}>
        <span>{currentStep && STEP_LABELS[currentStep as keyof typeof STEP_LABELS] || ''}</span>
        <span>{stepIndex + 1}/{PROGRESS_STEPS.length}</span>
      </div>
    </div>
  )
}
