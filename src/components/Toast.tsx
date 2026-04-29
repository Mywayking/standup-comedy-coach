// Toast notification component
'use client'
import { useState, useEffect } from 'react'
import { useUIStore } from '@/store/uiStore'

export function Toast() {
  const { autoSaving, lastSavedAt, error } = useUIStore()
  const [visible, setVisible] = useState(false)
  const [message, setMessage] = useState('')
  const [type, setType] = useState<'success' | 'error' | 'saving'>('success')

  useEffect(() => {
    if (autoSaving) {
      setMessage('💾 保存中...')
      setType('saving')
      setVisible(true)
    } else if (lastSavedAt) {
      setMessage('✅ 已保存')
      setType('success')
      setVisible(true)
      const timer = setTimeout(() => setVisible(false), 2000)
      return () => clearTimeout(timer)
    } else if (error) {
      setMessage(`❌ ${error.message}`)
      setType('error')
      setVisible(true)
    }
  }, [autoSaving, lastSavedAt, error])

  if (!visible) return null

  return (
    <div className="toast-container">
      <div className={`toast toast-${type}`}>
        <span>{message}</span>
      </div>
    </div>
  )
}
