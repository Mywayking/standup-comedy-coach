'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useProjectStore } from '@/store/projectStore'
import { Toast } from '@/components/Toast'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { MaterialStep } from '@/components/MaterialStep'
import { PremiseStep } from '@/components/PremiseStep'
import { AngleStep } from '@/components/AngleStep'
import { PunchlineStep } from '@/components/PunchlineStep'
import { DraftStep } from '@/components/DraftStep'
import { WORKFLOW_STEPS } from '@/types'

interface StepRendererProps {
  step: string
}

export function StepRenderer({ step }: StepRendererProps) {
  const router = useRouter()
  const { currentProject } = useProjectStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="container-app page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
      </div>
    )
  }

  if (!WORKFLOW_STEPS.includes(step as any) || step === 'diagnosis') {
    return (
      <div className="container-app page-content" style={{ paddingTop: 40 }}>
        <div className="empty-state">
          <div style={{ fontSize: 48, marginBottom: 16 }}>🤔</div>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>页面不存在</h2>
          <p style={{ color: '#71717A', marginBottom: 24 }}>请从正确的流程开始</p>
          <button className="btn btn-primary" onClick={() => router.push('/')} style={{ width: 200 }}>
            返回首页
          </button>
        </div>
      </div>
    )
  }

  if (!currentProject?.material && step !== 'material') {
    return (
      <div className="container-app page-content" style={{ paddingTop: 40 }}>
        <div className="empty-state">
          <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>请先输入素材</h2>
          <button className="btn btn-primary" onClick={() => router.push('/create/material')} style={{ width: 200 }}>
            开始创作
          </button>
        </div>
      </div>
    )
  }

  const renderStep = () => {
    switch (step) {
      case 'material':
        return <MaterialStep onNext={() => router.push('/create/premise')} />
      case 'premise':
        return <PremiseStep onNext={() => router.push('/create/angle')} />
      case 'angle':
        return <AngleStep onNext={() => router.push('/create/punchline')} />
      case 'punchline':
        return <PunchlineStep onNext={() => router.push('/create/draft')} />
      case 'draft':
        return <DraftStep />
      default:
        return null
    }
  }

  return (
    <>
      {renderStep()}
      <Toast />
      <ConfirmDialog />
    </>
  )
}
