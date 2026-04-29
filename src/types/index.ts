// Core type definitions for standup-comedy-coach

export type StepType = 'premise' | 'angle' | 'punchline'
export type CreatedBy = 'ai' | 'user'
export type WorkflowStep = 'material' | 'diagnosis' | 'premise' | 'angle' | 'punchline' | 'draft'
export type ProjectStatus = 'in_progress' | 'completed'
export type TargetDuration = '30s' | '1min' | '2min' | '3min'
export type UIStatus = 'idle' | 'loading' | 'failed' | 'saved' | 'saving'

export const WORKFLOW_STEPS: WorkflowStep[] = ['material', 'diagnosis', 'premise', 'angle', 'punchline', 'draft']
export const PROGRESS_STEPS: WorkflowStep[] = ['material', 'premise', 'angle', 'punchline', 'draft']

export const STEP_LABELS: Record<WorkflowStep, string> = {
  material: '素材输入',
  diagnosis: '诊断结果',
  premise: '前提选择',
  angle: '角度选择',
  punchline: '包袱选择',
  draft: '草稿生成',
}

export interface Material {
  content: string
}

export interface Conflict {
  label: string
  description: string
  why_this_works: string
}

export interface Emotion {
  primary: string
  secondary: string[]
}

export interface Diagnosis {
  summary: string
  conflict: Conflict
  emotion: Emotion
  comedicPotential: number
  estimatedLength: string
}

export interface CardMetadata {
  why_it_works?: string
  coach_tip?: string
  next_question?: string
  tags?: string[]
  description?: string
  potential_label?: 'high' | 'medium' | 'low'
  type_tag?: string
  placement?: string
  why_this_works?: string
}

export interface WorkflowCard {
  id: string
  projectId: string
  stepType: StepType
  title: string | null
  content: string | null
  metadata: CardMetadata | null
  selected: boolean
  favorite: boolean
  editable: boolean
  order: number
  createdBy: CreatedBy
  version: number
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: string
  title: string | null
  status: ProjectStatus
  material: Material | null
  diagnosis: Diagnosis | null
  premiseId: string | null
  angleId: string | null
  selectedPunchlineIds: string[]
  finalScript: string | null
  wordCountFinal: number | null
  durationFinal: number | null
  createdAt: string
  updatedAt: string
}

export interface CoachReview {
  assessment: string
  strengths: string[]
  suggestions: string[]
  nextStep: string
}
