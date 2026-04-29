import { StepRenderer } from './StepRenderer'
import { WORKFLOW_STEPS } from '@/types'

export function generateStaticParams() {
  return WORKFLOW_STEPS.filter(s => s !== 'diagnosis').map((step) => ({
    step,
  }))
}

interface PageProps {
  params: Promise<{ step: string }>
}

export default async function CreatePage({ params }: PageProps) {
  const { step } = await params
  return <StepRenderer step={step} />
}
