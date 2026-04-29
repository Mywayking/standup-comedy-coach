// Angle card component
'use client'
import { useCardStore } from '@/store/cardStore'
import type { WorkflowCard } from '@/types'

interface AngleCardProps {
  card: WorkflowCard
}

export function AngleCard({ card }: AngleCardProps) {
  const { selectCard, toggleFavorite } = useCardStore()

  const potentialLabelClass = {
    high: 'potential-high',
    medium: 'potential-medium',
    low: 'potential-low'
  }[card.metadata?.potential_label || 'medium']

  return (
    <div
      className={`card ${card.selected ? 'card-selected' : ''}`}
      onClick={() => selectCard(card.id, 'angle')}
      style={{ cursor: 'pointer', marginBottom: 12, position: 'relative' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          {card.title && (
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{card.title}</div>
          )}
          {card.content && (
            <p style={{ fontSize: 14, color: '#52525B', lineHeight: 1.6, margin: 0 }}>
              {card.content}
            </p>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); toggleFavorite(card.id) }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: 4, lineHeight: 1 }}
        >
          {card.favorite ? '⭐' : '☆'}
        </button>
      </div>

      {/* Potential label */}
      {card.metadata?.potential_label && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
          <span className={`badge ${potentialLabelClass}`}>
            {card.metadata.potential_label === 'high' ? '⭐ 高潜力' : card.metadata.potential_label === 'medium' ? '👍 中等潜力' : '👌 普通'}
          </span>
          {card.metadata.type_tag && (
            <span className="badge badge-gray">{card.metadata.type_tag}</span>
          )}
        </div>
      )}

      {/* Why it works */}
      {card.metadata?.why_it_works && (
        <div style={{ marginTop: 12, padding: '10px 12px', background: '#F5F3FF', borderRadius: 8, fontSize: 13, color: '#7C3AED' }}>
          💡 {card.metadata.why_it_works}
        </div>
      )}

      {/* Coach tip */}
      {card.metadata?.coach_tip && (
        <div className="coach-tip-panel" style={{ marginTop: 12 }}>
          <div className="tip-title">🎯 表演提示</div>
          <p style={{ margin: 0, color: '#92400E', fontSize: 13 }}>{card.metadata.coach_tip}</p>
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
