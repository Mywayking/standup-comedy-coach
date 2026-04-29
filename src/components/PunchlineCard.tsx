// Punchline card component
'use client'
import { useCardStore } from '@/store/cardStore'
import type { WorkflowCard } from '@/types'

interface PunchlineCardProps {
  card: WorkflowCard
  index: number
}

export function PunchlineCard({ card, index }: PunchlineCardProps) {
  const { selectCard, deselectCard, toggleFavorite } = useCardStore()

  const typeTagColor = {
    '铺垫': 'badge-gray',
    '转折': 'badge-purple',
    '包袱': 'badge-green',
    'Tag': 'badge-yellow',
    'call-back': 'badge-purple',
    '转场': 'badge-gray'
  }[card.metadata?.type_tag || '铺垫']

  return (
    <div
      className={`card ${card.selected ? 'card-selected' : ''}`}
      style={{ marginBottom: 10, position: 'relative', cursor: 'pointer' }}
      onClick={() => card.selected ? deselectCard(card.id) : selectCard(card.id)}
    >
      {/* Order number */}
      <div style={{
        position: 'absolute', top: 12, left: 12,
        width: 28, height: 28, borderRadius: '50%',
        background: card.selected ? '#7C3AED' : '#F4F4F5',
        color: card.selected ? 'white' : '#71717A',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700
      }}>
        {index + 1}
      </div>

      {/* Favorite button */}
      <button
        onClick={(e) => { e.stopPropagation(); toggleFavorite(card.id) }}
        style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 4 }}
      >
        {card.favorite ? '⭐' : '☆'}
      </button>

      {/* Content */}
      <div style={{ paddingLeft: 44, paddingRight: 40 }}>
        {card.content && (
          <p style={{ fontSize: 14, lineHeight: 1.7, margin: '0 0 8px 0', color: '#1a1a1a' }}>
            {card.content}
          </p>
        )}

        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
          {card.metadata?.type_tag && (
            <span className={`badge ${typeTagColor}`}>{card.metadata.type_tag}</span>
          )}
          {card.metadata?.placement && (
            <span className="badge badge-gray">{card.metadata.placement}</span>
          )}
        </div>

        {/* Why this works */}
        {card.metadata?.why_this_works && (
          <div style={{ marginTop: 10, padding: '8px 10px', background: '#F5F3FF', borderRadius: 6, fontSize: 12, color: '#7C3AED' }}>
            💡 {card.metadata.why_this_works}
          </div>
        )}

        {/* Coach tip */}
        {card.metadata?.coach_tip && (
          <div style={{ marginTop: 8, padding: '8px 10px', background: '#FFFBEB', borderRadius: 6, fontSize: 12, color: '#92400E' }}>
            🎯 {card.metadata.coach_tip}
          </div>
        )}

        {/* Next question */}
        {card.metadata?.next_question && (
          <div style={{ marginTop: 8, fontSize: 12, color: '#71717A' }}>
            💬 {card.metadata.next_question}
          </div>
        )}
      </div>

      {/* Selection checkbox */}
      <div style={{
        position: 'absolute', bottom: 12, right: 12,
        width: 22, height: 22, borderRadius: 6,
        border: `2px solid ${card.selected ? '#7C3AED' : '#D4D4D8'}`,
        background: card.selected ? '#7C3AED' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s'
      }}>
        {card.selected && <span style={{ color: 'white', fontSize: 12 }}>✓</span>}
      </div>
    </div>
  )
}
