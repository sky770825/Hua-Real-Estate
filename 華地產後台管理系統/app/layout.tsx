import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '華地產後台管理系統',
  description: '華地產線上鑽石分會簽到系統',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  )
}

