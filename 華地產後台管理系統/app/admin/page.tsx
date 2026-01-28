'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const router = useRouter()

  useEffect(() => {
    // 检查是否已登录
    const loggedIn = localStorage.getItem('adminLoggedIn')
    if (loggedIn === 'true') {
      router.push('/admin/attendance_management')
    } else {
      router.push('/admin/login')
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600">載入中...</p>
      </div>
    </div>
  )
}

