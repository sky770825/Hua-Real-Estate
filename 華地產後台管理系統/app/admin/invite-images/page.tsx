'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { compressImage, isImageFile, isFileSizeValid, formatFileSize } from '@/lib/image-compression'
import { safeApiCall } from '@/lib/frontend-utils'

interface InviteImage {
  id: number
  event_date: string
  event_title: string
  image1_url: string
  image2_url: string
  created_at: string
}

export default function InviteImagesManagement() {
  const router = useRouter()
  const [images, setImages] = useState<InviteImage[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  // 上傳表單狀態
  const [eventDate, setEventDate] = useState('')
  const [eventTitle, setEventTitle] = useState('')
  const [image1File, setImage1File] = useState<File | null>(null)
  const [image2File, setImage2File] = useState<File | null>(null)
  const [image1Preview, setImage1Preview] = useState<string | null>(null)
  const [image2Preview, setImage2Preview] = useState<string | null>(null)
  const [compressingImage1, setCompressingImage1] = useState(false)
  const [compressingImage2, setCompressingImage2] = useState(false)
  const [imageCompressionInfo1, setImageCompressionInfo1] = useState<{
    originalSize: string
    compressedSize: string
    reduction: string
  } | null>(null)
  const [imageCompressionInfo2, setImageCompressionInfo2] = useState<{
    originalSize: string
    compressedSize: string
    reduction: string
  } | null>(null)
  
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null)

  // 格式化日期為 MM/DD 格式
  const formatDateMMDD = (date: Date): string => {
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${month}/${day}`
  }

  // 檢查登入狀態
  useEffect(() => {
    const loggedIn = localStorage.getItem('adminLoggedIn')
    if (loggedIn !== 'true') {
      router.push('/admin/login')
    }
  }, [router])

  const loadImages = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true)
      }
      const fetchResponse = await fetch('/api/invite-images')
      
      if (!fetchResponse.ok) {
        const errorData = await fetchResponse.json().catch(() => ({}))
        const errorMessage = errorData.error || errorData.message || `HTTP ${fetchResponse.status}: 載入圖片列表失敗`
        console.error('載入圖片列表失敗:', { status: fetchResponse.status, error: errorData })
        setToast({ message: errorMessage, type: 'error' })
        setTimeout(() => setToast(null), 4000)
        return
      }

      const data = await fetchResponse.json()

      // API 返回格式：{ success: true, images: [...] } 或 { success: false, error: "..." }
      if (data.success && Array.isArray(data.images)) {
        // 只在數據真正改變時才更新，避免不必要的重新渲染
        setImages(prev => {
          const prevIds = new Set(prev.map(img => img.id))
          const newIds = new Set(data.images.map((img: InviteImage) => img.id))
          const idsEqual = prevIds.size === newIds.size &&
            Array.from(prevIds).every(id => newIds.has(id))
          
          // 如果 ID 相同，檢查內容是否有變化
          if (idsEqual) {
            const contentChanged = prev.some((prevImg, idx) => {
              const newImg = data.images[idx] as InviteImage
              return prevImg.image1_url !== newImg.image1_url || 
                     prevImg.image2_url !== newImg.image2_url ||
                     prevImg.event_title !== newImg.event_title ||
                     prevImg.event_date !== newImg.event_date
            })
            if (!contentChanged) {
              return prev // 數據沒有變化，返回舊數據避免重新渲染
            }
          }
          
          return data.images
        })
      } else {
        console.error('API 返回格式錯誤:', data)
        setImages([])
        if (!data.success) {
          const errorMessage = data.error || data.message || '載入圖片列表失敗：API 返回格式錯誤'
          setToast({ message: errorMessage, type: 'error' })
          setTimeout(() => setToast(null), 4000)
        }
      }
    } catch (error) {
      console.error('Error loading images:', error)
      setToast({ message: '載入圖片列表失敗：' + (error instanceof Error ? error.message : '未知錯誤'), type: 'error' })
      setTimeout(() => setToast(null), 3000)
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [])

  // 載入圖片列表
  useEffect(() => {
    loadImages()
  }, [loadImages])

  // 生成所有週四的日期列表（只顯示今天及未來的週四）
  const thursdayDates = useMemo(() => {
    const dates: Array<{ value: string; label: string; daysUntil?: number }> = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // 找到今天或之後的第一個週四
    const dayOfWeek = today.getDay()
    let daysUntilThursday = (4 - dayOfWeek + 7) % 7
    if (daysUntilThursday === 0 && today.getDay() === 4) {
      // 如果今天是週四，包含今天
      daysUntilThursday = 0
    } else if (daysUntilThursday === 0) {
      // 如果今天是週四但已經過了，找下週四
      daysUntilThursday = 7
    }
    
    const firstThursday = new Date(today)
    firstThursday.setDate(today.getDate() + daysUntilThursday)
    
    // 生成未來24個月的所有週四（確保涵蓋2026年及之後，約104個週四）
    const currentDate = new Date(firstThursday)
    const endDate = new Date(today)
    endDate.setMonth(today.getMonth() + 24) // 擴展到未來24個月，確保有足夠的日期選擇
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const dateStrFormatted = formatDateMMDD(currentDate)
      
      // 計算距離今天的天數
      const daysUntil = Math.ceil((currentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      
      let label = `${dateStrFormatted} (${dateStr})`
      if (daysUntil === 0) {
        label += ' - 今天（週四 09:00 後切換）'
      } else if (daysUntil === 7) {
        label += ' - 下週四'
      } else if (daysUntil < 7) {
        label += ` - ${daysUntil} 天後`
      } else {
        const weeks = Math.floor(daysUntil / 7)
        label += ` - ${weeks} 週後`
      }
      
      dates.push({ value: dateStr, label, daysUntil })
      currentDate.setDate(currentDate.getDate() + 7) // 加7天到下個週四
    }
    
    return dates
  }, [])

  // 計算下一個週四的日期（初始化）
  useEffect(() => {
    if (!eventDate && thursdayDates.length > 0) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      // 找到下一個週四（今天或之後的第一個週四）
      const nextThursday = thursdayDates.find(d => {
        const date = new Date(d.value)
        date.setHours(0, 0, 0, 0)
        return date >= today
      })
      
      if (nextThursday) {
        setEventDate(nextThursday.value)
        const dateStr = formatDateMMDD(new Date(nextThursday.value))
        setEventTitle(`${dateStr}華地產早會雙專講同台`)
      } else {
        // 如果沒有找到，使用最後一個週四
        const lastThursday = thursdayDates[thursdayDates.length - 1]
        setEventDate(lastThursday.value)
        const dateStr = formatDateMMDD(new Date(lastThursday.value))
        setEventTitle(`${dateStr}華地產早會雙專講同台`)
      }
    }
  }, [eventDate, thursdayDates])

  // 處理圖片上傳的通用函數
  const handleImageChange = async (
    file: File | null,
    setFile: (file: File | null) => void,
    setPreview: (preview: string | null) => void,
    setCompressionInfo: (info: { originalSize: string; compressedSize: string; reduction: string } | null) => void,
    setCompressing: (compressing: boolean) => void,
    imageNumber: 1 | 2
  ) => {
    if (!file) {
      setFile(null)
      setPreview(null)
      setCompressionInfo(null)
      return
    }

    if (!isImageFile(file)) {
      setToast({ message: '請選擇圖片檔案（JPG、PNG、GIF 或 WebP）', type: 'error' })
      setTimeout(() => setToast(null), 3000)
      return
    }

    if (!isFileSizeValid(file, 50)) {
      setToast({ message: '圖片檔案過大，請選擇小於 50MB 的圖片', type: 'error' })
      setTimeout(() => setToast(null), 3000)
      return
    }

    setCompressing(true)
    setCompressionInfo(null)

    try {
      const originalSize = formatFileSize(file.size)
      const compressedFile = await compressImage(file)
      const compressedSize = formatFileSize(compressedFile.size)
      const reduction = ((1 - compressedFile.size / file.size) * 100).toFixed(1)

      setFile(compressedFile)
      setCompressionInfo({
        originalSize,
        compressedSize,
        reduction: `${reduction}%`
      })

      // 顯示預覽
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(compressedFile)
    } catch (error) {
      console.error(`圖片${imageNumber}壓縮失敗:`, error)
      setFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } finally {
      setCompressing(false)
    }
  }

  const handleImage1Change = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    await handleImageChange(
      file,
      setImage1File,
      setImage1Preview,
      setImageCompressionInfo1,
      setCompressingImage1,
      1
    )
  }

  const handleImage2Change = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    await handleImageChange(
      file,
      setImage2File,
      setImage2Preview,
      setImageCompressionInfo2,
      setCompressingImage2,
      2
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!image1File || !image2File) {
      setToast({ message: '請上傳兩張圖片', type: 'error' })
      setTimeout(() => setToast(null), 3000)
      return
    }

    if (!eventDate) {
      setToast({ message: '請選擇活動日期', type: 'error' })
      setTimeout(() => setToast(null), 3000)
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('eventDate', eventDate)
      formData.append('eventTitle', eventTitle || `${eventDate}華地產早會雙專講同台`)
      formData.append('image1', image1File)
      formData.append('image2', image2File)

      const fetchResponse = await fetch('/api/invite-images', {
        method: 'POST',
        body: formData
      })
      const response = await safeApiCall(fetchResponse)

      if (response.success) {
        setToast({ message: '圖片上傳成功！', type: 'success' })
        setTimeout(() => setToast(null), 3000)
        setShowUploadModal(false)
        resetForm()
        // 重新載入圖片列表
        loadImages()
      } else {
        const errorMsg = response.error || '上傳失敗'
        setToast({ message: errorMsg, type: 'error' })
        setTimeout(() => setToast(null), 5000)
      }
    } catch (error) {
      console.error('Error uploading images:', error)
      setToast({ message: '上傳失敗，請重試', type: 'error' })
      setTimeout(() => setToast(null), 3000)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: number) => {
    // 使用更友好的確認對話框
    const confirmed = window.confirm('確定要刪除這組圖片嗎？\n\n此操作將同時刪除數據庫記錄和存儲中的圖片文件，且無法復原。')
    if (!confirmed) {
      return
    }

    try {
      const fetchResponse = await fetch(`/api/invite-images/${id}`, {
        method: 'DELETE'
      })

      if (!fetchResponse.ok) {
        const errorData = await fetchResponse.json().catch(() => ({}))
        setToast({ message: errorData.error || '刪除失敗', type: 'error' })
        setTimeout(() => setToast(null), 3000)
        return
      }

      const data = await fetchResponse.json()

      if (data.success) {
        setToast({ message: data.message || '刪除成功！', type: 'success' })
        setTimeout(() => setToast(null), 3000)
        // 立即從列表中移除（樂觀更新）
        setImages(prev => prev.filter(img => img.id !== id))
        // 靜默重新載入以確保數據同步（不觸發 loading 狀態，避免閃爍）
        setTimeout(() => loadImages(true), 300)
      } else {
        const errorMsg = data.error || '刪除失敗'
        setToast({ message: errorMsg, type: 'error' })
        setTimeout(() => setToast(null), 5000)
      }
    } catch (error) {
      console.error('Error deleting image:', error)
      setToast({ message: '刪除失敗，請重試：' + (error instanceof Error ? error.message : '未知錯誤'), type: 'error' })
      setTimeout(() => setToast(null), 3000)
    }
  }


  const resetForm = () => {
    setEventDate('')
    setEventTitle('')
    setImage1File(null)
    setImage2File(null)
    setImage1Preview(null)
    setImage2Preview(null)
    setImageCompressionInfo1(null)
    setImageCompressionInfo2(null)
    
    // 重置下一個週四
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const nextThursday = thursdayDates.find(d => {
      const date = new Date(d.value)
      date.setHours(0, 0, 0, 0)
      return date >= today
    })
    
    if (nextThursday) {
      setEventDate(nextThursday.value)
      const dateStr = formatDateMMDD(new Date(nextThursday.value))
      setEventTitle(`${dateStr}華地產早會雙專講同台`)
    } else if (thursdayDates.length > 0) {
      const lastThursday = thursdayDates[thursdayDates.length - 1]
      setEventDate(lastThursday.value)
      const dateStr = formatDateMMDD(new Date(lastThursday.value))
      setEventTitle(`${dateStr}華地產早會雙專講同台`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-indigo-600 border-t-transparent mx-auto mb-3 sm:mb-4"></div>
          <p className="text-sm sm:text-base text-gray-600">載入中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">邀請頁圖片管理</h1>
              <p className="text-sm sm:text-base text-gray-600">管理 invite.html 頁面顯示的活動圖片</p>
            </div>
            <div className="flex gap-3 sm:gap-4 w-full sm:w-auto">
              <button
                onClick={() => router.push('/admin/attendance_management')}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm sm:text-base bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                aria-label="返回後台管理"
              >
                返回後台
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm sm:text-base bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                aria-label="上傳新圖片"
              >
                + 上傳圖片
              </button>
            </div>
          </div>
        </div>

        {/* Toast 通知 */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-lg max-w-sm ${
            toast.type === 'success' ? 'bg-green-500' :
            toast.type === 'error' ? 'bg-red-500' :
            'bg-blue-500'
          } text-white text-sm sm:text-base`}>
            {toast.message}
          </div>
        )}

        {/* 圖片列表 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {images.map((image) => {
            const eventDate = new Date(image.event_date)
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            eventDate.setHours(0, 0, 0, 0)
            
            let statusBadge = null
            if (eventDate < today) {
              statusBadge = <span className="inline-block px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded">已過期</span>
            } else if (eventDate.getTime() === today.getTime()) {
              statusBadge = <span className="inline-block px-2 py-1 text-xs bg-green-200 text-green-700 rounded font-semibold">✓ 當前顯示</span>
            } else {
              const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
              statusBadge = <span className="inline-block px-2 py-1 text-xs bg-blue-200 text-blue-700 rounded">將於 {daysUntil} 天後生效</span>
            }
            
            return (
            <div key={image.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-2 mb-2">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex-1">{image.event_title}</h3>
                  {statusBadge}
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">活動日期：{image.event_date}</p>
                
                <div className="grid grid-cols-2 gap-2 mb-3 sm:mb-4">
                  <div 
                    className="relative cursor-pointer hover:opacity-80 transition-opacity group"
                    onClick={() => {
                      setPreviewImage({
                        url: image.image1_url,
                        title: `${image.event_title} - 1號專講者`
                      })
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setPreviewImage({
                          url: image.image1_url,
                          title: `${image.event_title} - 1號專講者`
                        })
                      }
                    }}
                  >
                    <img
                      key={`${image.id}-img1`}
                      src={image.image1_url}
                      alt="1號專講者"
                      className="w-full h-24 sm:h-32 object-cover rounded"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        if (target.src !== '/placeholder.png') {
                          target.src = '/placeholder.png'
                        }
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded">
                      <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">點擊預覽</span>
                    </div>
                  </div>
                  <div 
                    className="relative cursor-pointer hover:opacity-80 transition-opacity group"
                    onClick={() => {
                      setPreviewImage({
                        url: image.image2_url,
                        title: `${image.event_title} - 2號專講者`
                      })
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setPreviewImage({
                          url: image.image2_url,
                          title: `${image.event_title} - 2號專講者`
                        })
                      }
                    }}
                  >
                    <img
                      key={`${image.id}-img2`}
                      src={image.image2_url}
                      alt="2號專講者"
                      className="w-full h-24 sm:h-32 object-cover rounded"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        if (target.src !== '/placeholder.png') {
                          target.src = '/placeholder.png'
                        }
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded">
                      <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">點擊預覽</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => handleDelete(image.id)}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={`刪除 ${image.event_title}`}
                >
                  刪除
                </button>
              </div>
            </div>
          )})}
        </div>

        {images.length === 0 && (
          <div className="bg-white rounded-lg shadow-lg p-8 sm:p-12 text-center">
            <p className="text-gray-600 text-base sm:text-lg">目前沒有圖片，請點擊「上傳圖片」開始上傳</p>
          </div>
        )}

        {/* 上傳彈窗 */}
        {showUploadModal && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="upload-title"
          >
            <div className="bg-white rounded-lg shadow-xl max-w-2xl sm:max-w-3xl w-full max-h-[95vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <h2 id="upload-title" className="text-xl sm:text-2xl font-bold text-gray-800">上傳邀請頁圖片</h2>
                  <button
                    onClick={() => {
                      setShowUploadModal(false)
                      resetForm()
                    }}
                    className="text-gray-500 hover:text-gray-700 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
                    aria-label="關閉上傳彈窗"
                  >
                    ×
                  </button>
                </div>
                
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4 sm:space-y-6">
                    {/* 活動日期 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        活動日期 * <span className="text-xs text-gray-500">(系統會在該日期自動顯示此圖片)</span>
                      </label>
                      <select
                        value={eventDate}
                        onChange={(e) => {
                          const selectedDate = e.target.value
                          setEventDate(selectedDate)
                          const dateStr = formatDateMMDD(new Date(selectedDate))
                          setEventTitle(`${dateStr}華地產早會雙專講同台`)
                        }}
                        required
                        className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        {thursdayDates.map((date) => (
                          <option key={date.value} value={date.value}>
                            {date.label}
                          </option>
                        ))}
                      </select>
                      <div className="mt-2 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs text-blue-800 font-semibold mb-1">📅 切換時間說明：</p>
                        <ul className="text-xs text-blue-700 space-y-0.5 sm:space-y-1 ml-3 sm:ml-4 list-disc">
                          <li>系統會在<strong>每週四早上 09:00</strong>自動切換到下一個主題</li>
                          <li>例如：1/15（週四）09:00 後，會自動顯示 1/22（下週四）的圖片</li>
                          <li>可以提前上傳未來的活動圖片，系統會在該日期自動切換顯示</li>
                        </ul>
                      </div>
                    </div>

                    {/* 活動標題 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        活動標題
                      </label>
                      <input
                        type="text"
                        value={eventTitle}
                        onChange={(e) => setEventTitle(e.target.value)}
                        placeholder="例如：01/15華地產早會雙專講同台"
                        className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    {/* 圖片上傳區域 - 並排顯示 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* 圖片1 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                          1號專講者 *
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImage1Change}
                          required
                          className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        {compressingImage1 && (
                          <p className="mt-1.5 text-xs sm:text-sm text-blue-600">正在壓縮圖片...</p>
                        )}
                        {imageCompressionInfo1 && (
                          <div className="mt-1.5 text-xs sm:text-sm text-gray-600">
                            <p>原始：{imageCompressionInfo1.originalSize}</p>
                            <p>壓縮後：{imageCompressionInfo1.compressedSize}</p>
                            <p>減少：{imageCompressionInfo1.reduction}</p>
                          </div>
                        )}
                        {image1Preview && (
                          <div className="mt-3">
                            <img
                              src={image1Preview}
                              alt="1號專講者預覽"
                              className="w-full h-32 sm:h-40 object-cover rounded-lg"
                            />
                          </div>
                        )}
                      </div>

                      {/* 圖片2 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                          2號專講者 *
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImage2Change}
                          required
                          className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        {compressingImage2 && (
                          <p className="mt-1.5 text-xs sm:text-sm text-blue-600">正在壓縮圖片...</p>
                        )}
                        {imageCompressionInfo2 && (
                          <div className="mt-1.5 text-xs sm:text-sm text-gray-600">
                            <p>原始：{imageCompressionInfo2.originalSize}</p>
                            <p>壓縮後：{imageCompressionInfo2.compressedSize}</p>
                            <p>減少：{imageCompressionInfo2.reduction}</p>
                          </div>
                        )}
                        {image2Preview && (
                          <div className="mt-3">
                            <img
                              src={image2Preview}
                              alt="2號專講者預覽"
                              className="w-full h-32 sm:h-40 object-cover rounded-lg"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 sm:gap-4 mt-4 sm:mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowUploadModal(false)
                        resetForm()
                      }}
                      className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                      disabled={uploading}
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      disabled={uploading || !image1File || !image2File}
                      className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {uploading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                          上傳中...
                        </span>
                      ) : '上傳'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* 圖片預覽彈窗 */}
        {previewImage && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-2 sm:p-4"
            onClick={() => setPreviewImage(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="preview-title"
          >
            <div 
              className="relative w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 標題和控制欄 */}
              <div className="bg-black bg-opacity-50 text-white p-2 sm:p-3 mb-2 sm:mb-3 rounded-lg flex justify-between items-center w-full">
                <h3 id="preview-title" className="text-xs sm:text-sm font-semibold truncate pr-2">{previewImage.title}</h3>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="px-2 sm:px-3 py-1 bg-red-500 hover:bg-red-600 rounded text-xs sm:text-sm flex-shrink-0 transition-colors"
                  aria-label="關閉預覽"
                >
                  關閉
                </button>
              </div>
              
              {/* 圖片容器（可滾動，響應式設計） */}
              <div 
                className="overflow-auto border-2 border-white border-opacity-30 rounded-lg bg-white bg-opacity-10 p-2 sm:p-3 w-full"
                style={{ 
                  maxHeight: 'calc(100vh - 100px)',
                  maxWidth: '100%'
                }}
                onWheel={(e) => {
                  e.stopPropagation()
                }}
              >
                <img
                  src={previewImage.url}
                  alt={previewImage.title}
                  className="block w-full h-auto mx-auto"
                  style={{ 
                    maxWidth: '100%',
                    maxHeight: '65vh',
                    height: 'auto',
                    objectFit: 'contain'
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    if (target.src !== '/placeholder.png') {
                      target.src = '/placeholder.png'
                    }
                  }}
                />
              </div>
              
              {/* 提示文字 */}
              <p className="text-white text-xs mt-2 opacity-70 text-center px-2 hidden sm:block">
                使用滑鼠滾輪可滾動查看大圖
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
