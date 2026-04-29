// Zustand store for workflow cards with localStorage persistence
'use client'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { WorkflowCard } from '@/types'

interface CardStoreState {
  cards: WorkflowCard[]
  setCards: (cards: WorkflowCard[]) => void
  addCards: (cards: WorkflowCard[]) => void
  updateCard: (id: string, updates: Partial<WorkflowCard>) => void
  deleteCard: (id: string) => void
  selectCard: (id: string) => void
  deselectCard: (id: string) => void
  toggleSelect: (id: string) => void
  toggleFavorite: (id: string) => void
  clearAll: () => void
  getCardsByType: (type: string) => WorkflowCard[]
  getSelectedCard: (type: string) => WorkflowCard | undefined
  getSelectedPunchlines: () => WorkflowCard[]
}

export const useCardStore = create<CardStoreState>()(
  persist(
    (set, get) => ({
      cards: [],

      setCards: (cards) => set({ cards }),

      addCards: (newCards) => set((state) => ({ cards: [...state.cards, ...newCards] })),

      updateCard: (id, updates) => set((state) => ({
        cards: state.cards.map(c => c.id === id ? { ...c, ...updates } : c)
      })),

      deleteCard: (id) => set((state) => ({
        cards: state.cards.filter(c => c.id !== id)
      })),

      toggleSelect: (id) => set((state) => ({
        cards: state.cards.map(c => c.id === id ? { ...c, selected: !c.selected } : c)
      })),

      toggleFavorite: (id) => set((state) => ({
        cards: state.cards.map(c => c.id === id ? { ...c, favorite: !c.favorite } : c)
      })),

      clearAll: () => set({ cards: [] }),

      getCardsByType: (type) => get().cards.filter(c => c.stepType === type),

      getSelectedCard: (type) => get().cards.find(c => c.stepType === type && c.selected),

      getSelectedPunchlines: () => {
        const all = get().cards.filter(c => c.stepType === 'punchline' && c.selected)
        return all.sort((a, b) => (a.order || 0) - (b.order || 0))
      },
    }),
    {
      name: 'standup-cards-v1',
      storage: createJSONStorage(() => localStorage as any),
      skipHydration: true,
    }
  )
)
