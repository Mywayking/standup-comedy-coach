// Diagnosis card component
'use client'
import type { Diagnosis } from '@/types'

interface DiagnosisCardProps {
  diagnosis: Diagnosis
  collapsed?: boolean
}

export function DiagnosisCard({ diagnosis, collapsed }: DiagnosisCardProps) {
  if (collapsed) {
    return (
      <div className="card" style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>🔍</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#92400E' }}>AI 诊断结果</span>
          <span style={{ fontSize: 12, color: '#B45309', marginLeft: 'auto' }}>
            喜剧潜力 {diagnosis.comedicPotential}/5 · {diagnosis.estimatedLength}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="card" style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 20 }}>🔍</span>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>AI 诊断结果</h3>
      </div>

      {/* Summary */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#92400E', marginBottom: 6 }}>📌 核心总结</div>
        <p style={{ fontSize: 14, color: '#78350F', lineHeight: 1.6, margin: 0 }}>{diagnosis.summary}</p>
      </div>

      {/* Conflict */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#92400E', marginBottom: 6 }}>⚔️ 核心冲突</div>
        <div style={{ background: 'white', padding: 12, borderRadius: 8, marginBottom: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 4 }}>{diagnosis.conflict.label}</div>
          <p style={{ fontSize: 13, color: '#52525B', lineHeight: 1.5, margin: '8px 0 0 0' }}>{diagnosis.conflict.description}</p>
        </div>
        <p style={{ fontSize: 12, color: '#92400E', lineHeight: 1.5, margin: 0 }}>
          💡 {diagnosis.conflict.why_this_works}
        </p>
      </div>

      {/* Emotion */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#92400E', marginBottom: 6 }}>💭 情绪标签</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <span className="badge" style={{ background: '#FEF3C7', color: '#B45309' }}>
            {diagnosis.emotion.primary}
          </span>
          {diagnosis.emotion.secondary.map(e => (
            <span key={e} className="badge badge-gray">{e}</span>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16 }}>
        <div>
          <div style={{ fontSize: 12, color: '#92400E' }}>喜剧潜力</div>
          <div style={{ display: 'flex', gap: 2, marginTop: 4 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} style={{ color: i < diagnosis.comedicPotential ? '#F59E0B' : '#E4E4E7', fontSize: 14 }}>
                ★
              </span>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: '#92400E' }}>预计时长</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#78350F', marginTop: 4 }}>{diagnosis.estimatedLength}</div>
        </div>
      </div>
    </div>
  )
}
