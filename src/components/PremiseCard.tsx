// Premise card component
'use client'
import { useCardStore } from '@/store/cardStore'
import type { WorkflowCard } from '@/types'

interface PremiseCardProps {
  card: WorkflowCard
}

export function PremiseCard({ card }: PremiseCardProps) {
  const { selectCard, toggleFavorite } = useCardStore()

  return (
    <div
      className={`card ${card.selected ? 'card-selected' : ''}`}
      onClick={() => selectCard(card.id)}
      style={{ cursor: 'pointer', marginBottom: 12, position: 'relative' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>
          {card.title}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); toggleFavorite(card.id) }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: 4, lineHeight: 1 }}
        >
          {card.favorite ? '⭐' : '☆'}
        </button>
      </div>

      {card.content && (
        <p style={{ fontSize: 14, color: '#52525B', lineHeight: 1.6, margin: '0 0 12px 0' }}>
          {card.content}
        </p>
      )}

      {/* Tags */}
      {card.metadata?.tags && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
          {card.metadata.tags.map(tag => (
            <span key={tag} className="badge badge-gray" style={{ fontSize: 11 }}>{tag}</span>
          ))}
        </div>
      )}

      {/* Coach tip */}
      {card.metadata?.coach_tip && (
        <div className="coach-tip-panel">
          <div className="tip-title">🎯 教练提示</div>
          <p style={{ margin: 0, color: '#92400E', fontSize: 13 }}>{card.metadata.coach_tip}</p>
        </div>
      )}

      {/* Next question */}
      {card.metadata?.next_question && (
        <div style={{ marginTop: 12, padding: '10px 12px', background: '#F4F4F5', borderRadius: 8, fontSize: 13, color: '#71717A' }}>
          💬 {card.metadata.next_question}
        </div>
      )}

      {/* Selected indicator */}
      {card.selected && (
        <div style={{ position: 'absolute', top: 12, right: 12, width: 24, height: 24, borderRadius: '50%', background: '#7C3AED', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
          ✓
        </div>
      )}
    </div>
  )
}
