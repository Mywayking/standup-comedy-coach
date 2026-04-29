// Confirm dialog component
'use client'
import { useUIStore } from '@/store/uiStore'

export function ConfirmDialog() {
  const { cancelConfirmVisible, hideCancelConfirm } = useUIStore()

  if (!cancelConfirmVisible) return null

  return (
    <div className="modal-overlay" onClick={hideCancelConfirm}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
          确认取消？
        </h3>
        <p style={{ fontSize: 15, color: '#71717A', marginBottom: 24, lineHeight: 1.6 }}>
          当前生成会中断，是否确认返回？
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            className="btn btn-secondary"
            onClick={hideCancelConfirm}
            style={{ flex: 1 }}
          >
            继续生成
          </button>
          <button
            className="btn btn-danger"
            onClick={() => {
              hideCancelConfirm()
              window.history.back()
            }}
            style={{ flex: 1 }}
          >
            确认返回
          </button>
        </div>
      </div>
    </div>
  )
}
