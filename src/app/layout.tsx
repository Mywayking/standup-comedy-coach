import type { Metadata } from 'next'
import './globals.css'
import { ClientBoundary } from '@/components/ClientBoundary'

export const metadata: Metadata = {
  title: '手把手教你玩脱口秀',
  description: 'AI 脱口秀创作教练 — 让你的生活素材，变成上台的段子',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body suppressHydrationWarning>
        <ClientBoundary>{children}</ClientBoundary>
      </body>
    </html>
  )
}
