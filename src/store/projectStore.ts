// Zustand store for project state with localStorage persistence
'use client'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface Project {
  id: string
  title: string | null
  status: 'in_progress' | 'completed'
  material: { content: string } | null
  diagnosis: object | null
  premiseId: string | null
  angleId: string | null
  selectedPunchlineIds: string[]
  finalScript: string | null
  wordCountFinal: number | null
  durationFinal: number | null
  createdAt: string
  updatedAt: string
}

interface ProjectState {
  currentProject: Project | null
  currentStep: string
  draftMaterial: { content: string } | null
  setProject: (project: Project) => void
  setStep: (step: string) => void
  setDraftMaterial: (material: { content: string } | null) => void
  updateMaterial: (material: { content: string }) => void
  setDiagnosis: (diagnosis: object) => void
  selectPremise: (id: string | null) => void
  selectAngle: (id: string | null) => void
  selectPunchline: (id: string) => void
  deselectPunchline: (id: string) => void
  reorderPunchline: (fromIndex: number, toIndex: number) => void
  setFinalScript: (script: string, wordCount: number) => void
  markCompleted: () => void
  clearProject: () => void
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      currentProject: null,
      currentStep: 'material',
      draftMaterial: null,

      setProject: (project) => set({ currentProject: project }),
      setStep: (step) => set({ currentStep: step }),
      setDraftMaterial: (material) => set({ draftMaterial: material }),

      updateMaterial: (material) => {
        const project = get().currentProject
        if (project) {
          set({ currentProject: { ...project, material, updatedAt: new Date().toISOString() } })
        } else {
          set({ draftMaterial: material })
        }
      },

      setDiagnosis: (diagnosis) => {
        const project = get().currentProject
        if (project) {
          set({ currentProject: { ...project, diagnosis, updatedAt: new Date().toISOString() } })
        }
      },

      selectPremise: (id) => {
        const project = get().currentProject
        if (project) {
          set({
            currentProject: {
              ...project,
              premiseId: id,
              angleId: null,
              selectedPunchlineIds: [],
              finalScript: null,
              wordCountFinal: null,
              durationFinal: null,
              updatedAt: new Date().toISOString()
            }
          })
        }
      },

      selectAngle: (id) => {
        const project = get().currentProject
        if (project) {
          set({
            currentProject: {
              ...project,
              angleId: id,
              selectedPunchlineIds: [],
              finalScript: null,
              wordCountFinal: null,
              durationFinal: null,
              updatedAt: new Date().toISOString()
            }
          })
        }
      },

      selectPunchline: (id) => {
        const project = get().currentProject
        if (project) {
          const current = project.selectedPunchlineIds || []
          if (!current.includes(id)) {
            set({
              currentProject: {
                ...project,
                selectedPunchlineIds: [...current, id],
                finalScript: null,
                wordCountFinal: null,
                durationFinal: null,
                updatedAt: new Date().toISOString()
              }
            })
          }
        }
      },

      deselectPunchline: (id) => {
        const project = get().currentProject
        if (project) {
          set({
            currentProject: {
              ...project,
              selectedPunchlineIds: (project.selectedPunchlineIds || []).filter(i => i !== id),
              finalScript: null,
              wordCountFinal: null,
              durationFinal: null,
              updatedAt: new Date().toISOString()
            }
          })
        }
      },

      reorderPunchline: (fromIndex, toIndex) => {
        const project = get().currentProject
        if (project) {
          const list = [...(project.selectedPunchlineIds || [])]
          const [item] = list.splice(fromIndex, 1)
          list.splice(toIndex, 0, item)
          set({
            currentProject: {
              ...project,
              selectedPunchlineIds: list,
              finalScript: null,
              wordCountFinal: null,
              durationFinal: null,
              updatedAt: new Date().toISOString()
            }
          })
        }
      },

      setFinalScript: (script, wordCount) => {
        const project = get().currentProject
        if (project) {
          const duration = Math.round(wordCount / 5)
          set({
            currentProject: {
              ...project,
              finalScript: script,
              wordCountFinal: wordCount,
              durationFinal: duration,
              updatedAt: new Date().toISOString()
            }
          })
        }
      },

      markCompleted: () => {
        const project = get().currentProject
        if (project) {
          set({
            currentProject: {
              ...project,
              status: 'completed',
              updatedAt: new Date().toISOString()
            }
          })
        }
      },

      clearProject: () => set({ currentProject: null, currentStep: 'material', draftMaterial: null }),
    }),
    {
      name: 'standup-project-v1',
      storage: createJSONStorage(() => localStorage as any),
      skipHydration: true,
    }
  )
)
