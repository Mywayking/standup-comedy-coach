// Zustand store for UI state — client only
'use client'
import { create } from 'zustand'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  message: string
  type: ToastType
  visible: boolean
}

interface ConfirmDialog {
  visible: boolean
  title: string
  message: string
  onConfirm: () => void
}

interface UIState {
  toast: Toast
  confirmDialog: ConfirmDialog
  autoSaving: boolean
  lastSavedAt: string | null
  diagnosisStatus: string
  premiseStatus: string
  angleStatus: string
  punchlineStatus: string
  draftStatus: string
  showToast: (message: string, type?: ToastType) => void
  hideToast: () => void
  showConfirm: (title: string, message: string, onConfirm: () => void) => void
  hideConfirm: () => void
  setStatus: (step: string, status: string) => void
  setAutoSaving: (value: boolean) => void
  setLastSavedAt: (time: string) => void
  resetAll: () => void
  rehydrate: (state: Partial<UIState>) => void
}

export const useUIStore = create<UIState>()((set, get) => ({
  toast: { message: '', type: 'info', visible: false },
  confirmDialog: { visible: false, title: '', message: '', onConfirm: () => {} },
  autoSaving: false,
  lastSavedAt: null,
  diagnosisStatus: 'idle',
  premiseStatus: 'idle',
  angleStatus: 'idle',
  punchlineStatus: 'idle',
  draftStatus: 'idle',

  showToast: (message, type = 'info') => {
    set({ toast: { message, type, visible: true } })
    setTimeout(() => {
      set({ toast: { message: '', type: 'info', visible: false } })
    }, 3000)
  },

  hideToast: () => set({ toast: { message: '', type: 'info', visible: false } }),

  showConfirm: (title, message, onConfirm) => {
    set({ confirmDialog: { visible: true, title, message, onConfirm } })
  },

  hideConfirm: () => {
    set({ confirmDialog: { visible: false, title: '', message: '', onConfirm: () => {} } })
  },

  setStatus: (step, status) => {
    const key = `${step}Status` as keyof UIState
    set({ [key]: status } as any)
  },

  setAutoSaving: (value) => set({ autoSaving: value }),
  setLastSavedAt: (time) => set({ lastSavedAt: time }),

  resetAll: () => set({
    toast: { message: '', type: 'info', visible: false },
    confirmDialog: { visible: false, title: '', message: '', onConfirm: () => {} },
    autoSaving: false,
    lastSavedAt: null,
    diagnosisStatus: 'idle',
    premiseStatus: 'idle',
    angleStatus: 'idle',
    punchlineStatus: 'idle',
    draftStatus: 'idle',
  }),

  rehydrate: (state) => set(state),
}))
