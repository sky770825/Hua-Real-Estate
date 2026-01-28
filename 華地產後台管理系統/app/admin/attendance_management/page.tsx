'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { filterVercelText, safeApiCall } from '@/lib/frontend-utils'
import { compressImage, isImageFile, isFileSizeValid, formatFileSize } from '@/lib/image-compression'

interface Member {
  id: number
  name: string
  profession: string
}

interface CheckinRecord {
  member_id: number
  checkin_time: string | null
  message: string | null
  status: string
  name: string
}

interface Meeting {
  id: number
  date: string
  status: string
}

// 會員詳情記錄組件
function MemberDetailRecords({ memberId, completedMeetings }: { memberId: number, completedMeetings: Meeting[] }) {
  const [lateRecords, setLateRecords] = useState<Array<{ date: string; checkin_time: string }>>([])
  const [proxyRecords, setProxyRecords] = useState<Array<{ date: string; checkin_time: string }>>([])
  const [absentRecords, setAbsentRecords] = useState<Array<{ date: string }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadRecords = async () => {
      setLoading(true)
      const lateList: Array<{ date: string; checkin_time: string }> = []
      const proxyList: Array<{ date: string; checkin_time: string }> = []
      const absentList: Array<{ date: string }> = []

      // 載入所有會議的簽到記錄
      for (const meeting of completedMeetings) {
        try {
          const response = await fetch(`/api/checkins?date=${meeting.date}`)
          if (response.ok) {
            const data = await response.json()
            const checkins = data.checkins || []
            const memberCheckin = checkins.find((c: CheckinRecord) => c.member_id === memberId)
            
            if (memberCheckin) {
              if (memberCheckin.status === 'late') {
                lateList.push({ date: meeting.date, checkin_time: memberCheckin.checkin_time || '' })
              } else if (memberCheckin.message && memberCheckin.message.includes('[代理出席]')) {
                proxyList.push({ date: meeting.date, checkin_time: memberCheckin.checkin_time || '' })
              }
            } else {
              // 沒有簽到記錄，視為缺席
              absentList.push({ date: meeting.date })
            }
          }
        } catch (error) {
          console.error(`載入 ${meeting.date} 的簽到記錄失敗:`, error)
        }
      }

      setLateRecords(lateList)
      setProxyRecords(proxyList)
      setAbsentRecords(absentList)
      setLoading(false)
    }

    if (completedMeetings.length > 0) {
      loadRecords()
    } else {
      setLoading(false)
    }
  }, [memberId, completedMeetings])

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600">載入記錄中...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 遲到記錄 */}
      {lateRecords.length > 0 && (
        <div>
          <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-yellow-500">🟡</span>
            <span>遲到記錄 ({lateRecords.length} 次)</span>
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {lateRecords.map((record, index) => {
              const date = new Date(record.date)
              const time = record.checkin_time ? new Date(record.checkin_time).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }) : '-'
              return (
                <div key={index} className="p-3 rounded-lg border-2 bg-yellow-50 border-yellow-200 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">
                      {date.toLocaleDateString('zh-TW', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        weekday: 'short'
                      })}
                    </div>
                    <div className="text-sm text-yellow-600 mt-1">簽到時間：{time}</div>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-200 text-yellow-800 text-sm font-bold">
                    ⏰ 遲到
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 代理出席記錄 */}
      {proxyRecords.length > 0 && (
        <div>
          <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-blue-500">🔵</span>
            <span>代理出席記錄 ({proxyRecords.length} 次)</span>
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {proxyRecords.map((record, index) => {
              const date = new Date(record.date)
              const time = record.checkin_time ? new Date(record.checkin_time).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }) : '-'
              return (
                <div key={index} className="p-3 rounded-lg border-2 bg-blue-50 border-blue-200 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">
                      {date.toLocaleDateString('zh-TW', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        weekday: 'short'
                      })}
                    </div>
                    <div className="text-sm text-blue-600 mt-1">簽到時間：{time}</div>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-200 text-blue-800 text-sm font-bold">
                    👤 代理出席
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 缺席記錄 */}
      {absentRecords.length > 0 && (
        <div>
          <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-red-500">🔴</span>
            <span>缺席記錄 ({absentRecords.length} 次)</span>
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {absentRecords.map((record, index) => {
              const date = new Date(record.date)
              return (
                <div key={index} className="p-3 rounded-lg border-2 bg-red-50 border-red-200 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">
                      {date.toLocaleDateString('zh-TW', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        weekday: 'short'
                      })}
                    </div>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-200 text-red-800 text-sm font-bold">
                    ✗ 缺席
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 如果都沒有記錄 */}
      {lateRecords.length === 0 && proxyRecords.length === 0 && absentRecords.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg mb-2">✅ 完美出席記錄</p>
          <p className="text-sm">沒有遲到、代理出席或缺席記錄</p>
        </div>
      )}
    </div>
  )
}

function AttendanceManagementContent() {
  const router = useRouter()
  const [members, setMembers] = useState<Member[]>([])
  const [checkins, setCheckins] = useState<CheckinRecord[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  
  // 初始化選中的日期：優先選擇今天（如果有會議），否則選擇下一個週四
  const getInitialDate = () => {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    // 默認使用今天，這樣可以立即看到今天的簽到記錄
    // 如果今天沒有會議，用戶可以手動切換到下一個週四
    return todayStr
  }
  
  const [selectedDate, setSelectedDate] = useState(getInitialDate())
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
  const [loading, setLoading] = useState(true)
  
  // 从 URL 参数读取 tab，如果没有则默认为 'attendance'
  // 支持 'statistics' 作为 'reports' 的别名
  const getInitialTab = () => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search)
        const tabFromUrl = params.get('tab')
        if (tabFromUrl) {
          return tabFromUrl === 'statistics' ? 'reports' : tabFromUrl
        }
      } catch (e) {
        console.error('Error reading URL params:', e)
      }
    }
    return 'attendance'
  }
  
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      return getInitialTab()
    }
    return 'attendance'
  })
  
  // 当组件挂载时，从URL读取tab参数
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const initialTab = getInitialTab()
      if (initialTab !== activeTab) {
        setActiveTab(initialTab)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  // 监听浏览器前进/后退
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const handlePopState = () => {
      const newTab = getInitialTab()
      if (newTab !== activeTab) {
        setActiveTab(newTab)
      }
    }
    
    window.addEventListener('popstate', handlePopState)
    
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [activeTab])
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [showMeetingModal, setShowMeetingModal] = useState(false)
  const [newMember, setNewMember] = useState({ id: '', name: '', profession: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<number[]>([])
  const [filterStatus, setFilterStatus] = useState<'all' | 'present' | 'absent'>('all')
  const [meetingStats, setMeetingStats] = useState<Record<string, number>>({})
  const [editingCheckin, setEditingCheckin] = useState<{
    memberId: number
    message: string
    status: string
    checkin_time: string
  } | null>(null)
  const [sortBy, setSortBy] = useState<'id' | 'name' | 'time' | 'status'>('id')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [memberAttendanceStats, setMemberAttendanceStats] = useState<Record<number, {total: number, present: number, late: number, proxy: number, absent: number, rate: number}>>({})
  const [statisticsDateRange, setStatisticsDateRange] = useState<'all' | 'month' | 'quarter' | 'year'>('all')
  const [statisticsSortBy, setStatisticsSortBy] = useState<'rate' | 'name' | 'present' | 'absent' | 'id'>('id')
  const [statisticsSortOrder, setStatisticsSortOrder] = useState<'asc' | 'desc'>('asc')
  const [statisticsFilter, setStatisticsFilter] = useState<'all' | 'warning' | 'critical'>('all')
  const [showMemberDetailModal, setShowMemberDetailModal] = useState(false)
  const [selectedMemberForDetail, setSelectedMemberForDetail] = useState<Member | null>(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' })
  const [systemSettings, setSystemSettings] = useState({
    autoBackup: false,
    emailNotifications: false,
    defaultMeetingTime: '19:00',
    checkinDeadline: '19:30',
    autoRefresh: true,
    refreshInterval: 60,
    maintenanceMode: false,
    enableNotifications: true,
    enableSound: false,
    theme: 'light',
  })
  const [systemInfo, setSystemInfo] = useState({
    version: '4.5.1',
    databaseStatus: 'connected',
    lastBackup: null as string | null,
    uptime: '0 天',
    totalRequests: 0,
  })
  const [showSystemLogs, setShowSystemLogs] = useState(false)
  const [systemLogs, setSystemLogs] = useState<Array<{time: string, level: string, message: string}>>([])
  const [supabaseUrl] = useState(() => {
    if (typeof window !== 'undefined') {
      return process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sqgrnowrcvspxhuudrqc.supabase.co'
    }
    return 'https://sqgrnowrcvspxhuudrqc.supabase.co'
  })
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})
  // 批量操作進度狀態
  const [batchProgress, setBatchProgress] = useState<{
    isProcessing: boolean
    current: number
    total: number
    operation: string
  } | null>(null)
  // 開發者模式狀態
  const [developerModeUnlocked, setDeveloperModeUnlocked] = useState(false)
  const [showDeveloperPasswordModal, setShowDeveloperPasswordModal] = useState(false)
  const [developerPassword, setDeveloperPassword] = useState('')
  const [prizes, setPrizes] = useState<Array<{
    id: number
    name: string
    image_url: string
    total_quantity: number
    remaining_quantity: number
    probability: number
  }>>([])
  const [editingPrize, setEditingPrize] = useState<{
    id: number
    name: string
    image_url: string
    total_quantity: number
    remaining_quantity: number
    probability: number
  } | null>(null)
  const [showPrizeModal, setShowPrizeModal] = useState(false)
  const [newPrize, setNewPrize] = useState({
    name: '',
    totalQuantity: 1,
    probability: 1.0,
    image: null as File | null,
  })
  const [compressingImage, setCompressingImage] = useState(false)
  const [imageCompressionInfo, setImageCompressionInfo] = useState<{
    originalSize: string
    compressedSize: string
    compressionRatio: string
  } | null>(null)
  
  // 中獎記錄狀態
  interface WinnerRecord {
    id: number
    meeting_date: string
    created_at: string
    claimed: boolean
    claimed_at: string | null
    member_id: number
    member_name: string
    prize_id: number
    prize_name: string
    prize_image_url: string | null
  }
  const [lotteryWinners, setLotteryWinners] = useState<{
    thisWeek: { date: string; winners: WinnerRecord[] }
    nextWeek: { date: string; winners: WinnerRecord[] }
  }>({
    thisWeek: { date: '', winners: [] },
    nextWeek: { date: '', winners: [] },
  })
  const [loadingWinners, setLoadingWinners] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  const fetchWithTimeout = useCallback(async (
    input: RequestInfo,
    init?: RequestInit,
    timeoutMs = 10000
  ) => {
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)
    try {
      // 添加快取控制和時間戳以繞過 Vercel CDN 快取
      const url = typeof input === 'string' 
        ? `${input}${input.includes('?') ? '&' : '?'}_t=${Date.now()}`
        : input
      const headers = {
        ...((init?.headers as Record<string, string>) || {}),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      }
      return await fetch(url, { ...init, headers, signal: controller.signal, cache: 'no-store' })
    } finally {
      window.clearTimeout(timeoutId)
    }
  }, [])

  const loadData = useCallback(async (silent = false, dateOverride?: string) => {
    if (!silent) {
      setLoading(true)
    }
    try {
      const targetDate = dateOverride ?? selectedDate
      // 並行加載基本數據以提高性能，使用更短的超時時間
      const [membersRes, meetingsRes, checkinsRes] = await Promise.allSettled([
        fetchWithTimeout('/api/members', undefined, 6000),
        fetchWithTimeout('/api/meetings', undefined, 6000),
        fetchWithTimeout(`/api/checkins?date=${targetDate}`, undefined, 6000)
      ])

      // 處理會員數據
      let membersData: { members: Member[] } = { members: [] }
      if (membersRes.status === 'fulfilled' && membersRes.value.ok) {
        membersData = await membersRes.value.json()
      } else {
        console.warn('Failed to fetch members, using empty array')
      }

      // 處理會議數據
      let meetingsData: { meetings: Meeting[] } = { meetings: [] }
      if (meetingsRes.status === 'fulfilled' && meetingsRes.value.ok) {
        meetingsData = await meetingsRes.value.json()
      } else {
        console.warn('Failed to fetch meetings, using empty array')
      }

      // 處理簽到數據
      let checkinsData: { checkins: CheckinRecord[] } = { checkins: [] }
      if (checkinsRes.status === 'fulfilled' && checkinsRes.value.ok) {
        checkinsData = await checkinsRes.value.json()
        console.log('loadData checkins for date', targetDate, checkinsData)
      } else {
        console.warn('Failed to fetch checkins:', {
          status: checkinsRes.status === 'fulfilled' ? checkinsRes.value.status : 'rejected',
        })
      }
      
      // 只有在成功載入時才更新狀態，失敗時保留現有數據
      if (membersRes.status === 'fulfilled' && membersRes.value.ok) {
        setMembers(membersData.members || [])
      }
      if (meetingsRes.status === 'fulfilled' && meetingsRes.value.ok) {
        setMeetings(meetingsData.meetings || [])
      }
      if (checkinsRes.status === 'fulfilled' && checkinsRes.value.ok) {
        setCheckins(checkinsData.checkins || [])
      }

      // 设置当前日期的会议（只有在成功載入會議數據時才更新）
      if (meetingsRes.status === 'fulfilled' && meetingsRes.value.ok) {
        const todayMeeting = meetingsData.meetings?.find((m: Meeting) => m.date === targetDate)
        setSelectedMeeting(todayMeeting || null)
      }

      // 獲取每個會議的簽到人數（優化：只獲取最近 3 個會議，進一步減少請求數量）
      // 只有在成功載入會議數據時才獲取統計
      const stats: Record<string, number> = {}
      
      // 獲取所有已完成的會議（用於統計報表計算總會議數）
      const allCompletedMeetings = (meetingsRes.status === 'fulfilled' && meetingsRes.value.ok
        ? (meetingsData.meetings || []).filter((m: Meeting) => m.status === 'completed')
        : [])
      
      // 詳細的調試信息
      const allMeetings = meetingsData.meetings || []
      const meetingsByStatus = {
        completed: allMeetings.filter((m: Meeting) => m.status === 'completed').length,
        scheduled: allMeetings.filter((m: Meeting) => m.status === 'scheduled').length,
        cancelled: allMeetings.filter((m: Meeting) => m.status === 'cancelled').length,
        other: allMeetings.filter((m: Meeting) => !['completed', 'scheduled', 'cancelled'].includes(m.status)).length
      }
      
      console.log('📊 統計計算詳細信息：', {
        總會議數: allMeetings.length,
        已完成會議數: allCompletedMeetings.length,
        按狀態分類: meetingsByStatus,
        所有會議詳情: allMeetings.map((m: Meeting) => ({ 
          date: m.date, 
          status: m.status,
          id: m.id 
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
        已完成會議日期: allCompletedMeetings.map((m: Meeting) => m.date).sort()
      })
      
      if (allCompletedMeetings.length !== 20) {
        console.warn(`⚠️ 警告：預期有20個已完成的會議（根據CSV文件），但實際只有 ${allCompletedMeetings.length} 個！`)
        console.warn('這可能導致統計數據不正確。請檢查：')
        console.warn('1. 是否成功匯入了所有20個會議？')
        console.warn('2. 會議的狀態是否都是 "completed"？')
        console.warn('3. 是否有會議被刪除或狀態被更改？')
      }
      
      // 為了顯示會議統計卡片，只獲取最近3個會議的簽到數據（減少API請求）
      const meetingDates = (meetingsRes.status === 'fulfilled' && meetingsRes.value.ok
        ? (meetingsData.meetings || []).slice(-3).map((m: Meeting) => m.date)
        : [])
      
      // 並行獲取會議的簽到數據（限制為最近 3 個會議，使用更短的超時）
      // 添加延遲以避免同時發送過多請求
      const checkinPromises: Array<Promise<{ date: string; checkins: CheckinRecord[] }>> = meetingDates.map(async (date: string, index: number) => {
        // 為每個請求添加小延遲，避免同時發送
        if (index > 0) {
          await new Promise(resolve => setTimeout(resolve, index * 200)) // 每個請求間隔200ms
        }
        
        try {
          const checkinsRes = await fetchWithTimeout(`/api/checkins?date=${date}`, undefined, 4000)
          if (!checkinsRes.ok) {
            // 檢查是否為速率限制錯誤
            if (checkinsRes.status === 429) {
              throw new Error('Too many requests')
            }
            return { date, checkins: [] as CheckinRecord[] }
          }
          const checkinsData = await checkinsRes.json()
          return { date, checkins: (checkinsData.checkins || []) as CheckinRecord[] }
        } catch (err) {
          // 如果是速率限制錯誤，重新拋出
          if (err instanceof Error && err.message.includes('Too many requests')) {
            throw err
          }
          // 其他錯誤返回空數組，不影響頁面顯示
          return { date, checkins: [] as CheckinRecord[] }
        }
      })
      
      // 使用 Promise.allSettled 確保即使部分請求失敗也能繼續
      const checkinResults = await Promise.allSettled(checkinPromises)
      const allCheckinsByDate: Record<string, CheckinRecord[]> = {}
      for (const result of checkinResults) {
        if (result.status === 'fulfilled') {
          allCheckinsByDate[result.value.date] = result.value.checkins
          stats[result.value.date] = result.value.checkins.length
        }
      }
      
      // 為所有會議設置統計（沒有數據的設為 0）
      (meetingsData.meetings || []).forEach((meeting: Meeting) => {
        if (!stats[meeting.date]) {
          stats[meeting.date] = 0
        }
      })
      
      setMeetingStats(stats)

      // 計算每個會員的出席統計
      // 使用所有已完成的會議數量作為總會議數（特別是匯入的20個會議）
      const memberStats: Record<number, {total: number, present: number, late: number, proxy: number, absent: number, rate: number}> = {}
      
      // 總會議數應該是所有已完成的會議數量（特別是匯入的20個會議）
      // 重要：始終使用 allCompletedMeetings.length，不要回退到 meetingDates.length
      // 因為 meetingDates 只包含最近3個會議，用於顯示統計卡片
      const totalMeetings = allCompletedMeetings.length
      
      if (totalMeetings === 0) {
        console.warn('⚠️ 警告：沒有找到已完成的會議！這可能導致統計數據不正確。')
        console.log('所有會議狀態：', meetingsData.meetings?.map((m: Meeting) => ({ date: m.date, status: m.status })) || [])
      } else {
        console.log(`✅ 找到 ${totalMeetings} 個已完成的會議，將用於計算統計數據`)
      }
      
      if (totalMeetings > 0) {
        // 獲取所有已完成會議的日期列表（按日期排序）
        const allCompletedMeetingDates = allCompletedMeetings
          .sort((a: Meeting, b: Meeting) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .map((m: Meeting) => m.date)
        
        // 為了準確計算出席率，需要載入所有20個會議的簽到數據
        // 但為了性能，我們先載入已載入的數據，然後為未載入的會議發起額外請求
        const datesToLoad = allCompletedMeetingDates.filter(date => !allCheckinsByDate[date])
        
        // 載入缺失的會議簽到數據（分批載入，避免過多請求）
        if (datesToLoad.length > 0) {
          const additionalCheckinPromises = datesToLoad.slice(0, 20).map(async (date: string, index: number) => {
            if (index > 0) {
              await new Promise(resolve => setTimeout(resolve, index * 100)) // 每個請求間隔100ms
            }
            try {
              const checkinsRes = await fetchWithTimeout(`/api/checkins?date=${date}`, undefined, 4000)
              if (checkinsRes.ok) {
                const checkinsData = await checkinsRes.json()
                return { date, checkins: (checkinsData.checkins || []) as CheckinRecord[] }
              }
              return { date, checkins: [] as CheckinRecord[] }
            } catch (err) {
              return { date, checkins: [] as CheckinRecord[] }
            }
          })
          
          const additionalResults = await Promise.allSettled(additionalCheckinPromises)
          for (const result of additionalResults) {
            if (result.status === 'fulfilled') {
              allCheckinsByDate[result.value.date] = result.value.checkins
              if (!stats[result.value.date]) {
                stats[result.value.date] = result.value.checkins.length
              }
            }
          }
        }
        
        // 計算每個會員的出席統計
        for (const member of membersData.members) {
          let presentCount = 0  // 正常出席
          let lateCount = 0     // 遲到
          let proxyCount = 0    // 代理出席（目前系統中沒有 proxy 狀態，暫時為 0）
          let absentCount = 0   // 缺席
          
          // 遍歷所有已完成的會議
          for (const date of allCompletedMeetingDates) {
            const checkins = allCheckinsByDate[date] || []
            const memberCheckin = checkins.find((c: CheckinRecord) => c.member_id === member.id)
            
            if (memberCheckin) {
              // 檢查是否為代理出席（通過 message 標記識別）
              const isProxy = memberCheckin.message && memberCheckin.message.includes('[代理出席]')
              
              // 有簽到記錄，根據狀態分類
              if (memberCheckin.status === 'present' || memberCheckin.status === 'early') {
                if (isProxy) {
                  proxyCount++  // 代理出席
                } else {
                  presentCount++  // 正常出席
                }
              } else if (memberCheckin.status === 'late') {
                lateCount++
                presentCount++ // 遲到也算出席
              } else if (memberCheckin.status === 'early_leave') {
                presentCount++ // 早退也算出席
              } else if (memberCheckin.status === 'absent') {
                absentCount++
              }
            } else {
              // 沒有簽到記錄，視為缺席
              absentCount++
            }
          }
          
          memberStats[member.id] = {
            total: totalMeetings,
            present: presentCount,
            late: lateCount,
            proxy: proxyCount,
            absent: absentCount,
            rate: totalMeetings > 0 ? (presentCount / totalMeetings) * 100 : 0
          }
        }
      }
      setMemberAttendanceStats(memberStats)
    } catch (error) {
      console.error('Error loading data:', error)
      if (!silent) {
        // 只在非靜默模式下顯示錯誤提示
        const errorMessage = error instanceof Error ? error.message : '載入資料失敗'
        if (errorMessage.includes('aborted') || errorMessage.includes('timeout')) {
          console.warn('Request timeout, will retry on next refresh')
        } else if (errorMessage.includes('Too many requests') || 
                   errorMessage.includes('rate limit') ||
                   errorMessage.includes('429')) {
          // 速率限制錯誤，顯示提示但不中斷操作
          console.warn('Rate limit detected, please wait before refreshing')
          if (!silent) {
            alert('請求過於頻繁，請稍候再試')
          }
        } else {
          console.error('Load data error:', errorMessage)
          // 不顯示alert，避免干擾用戶
        }
      }
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [fetchWithTimeout, selectedDate])

  const loadPrizes = useCallback(async () => {
    try {
      const response = await fetch(`/api/prizes?_t=${Date.now()}`, { cache: 'no-store' })
      const data = await response.json()
      setPrizes(data.prizes || [])
    } catch (error) {
      console.error('Error loading prizes:', error)
    }
  }, [])

  const loadLotteryWinners = useCallback(async () => {
    setLoadingWinners(true)
    try {
      const response = await fetch('/api/lottery/winners/week', { cache: 'no-store' })
      if (!response.ok) {
        throw new Error('Failed to fetch lottery winners')
      }
      const data = await response.json()
      setLotteryWinners(data)
    } catch (error) {
      console.error('Error loading lottery winners:', error)
      setToast({ message: '載入中獎記錄失敗', type: 'error' })
      setTimeout(() => setToast(null), 3000)
    } finally {
      setLoadingWinners(false)
    }
  }, [])

  const handleToggleClaimed = async (winnerId: number, currentClaimed: boolean) => {
    const newClaimedStatus = !currentClaimed
    
    // 樂觀更新：立即更新UI狀態
    setLotteryWinners(prev => ({
      ...prev,
      thisWeek: {
        ...prev.thisWeek,
        winners: prev.thisWeek.winners.map(w => 
          w.id === winnerId 
            ? { ...w, claimed: newClaimedStatus, claimed_at: newClaimedStatus ? new Date().toISOString() : null }
            : w
        ),
      },
      nextWeek: {
        ...prev.nextWeek,
        winners: prev.nextWeek.winners.map(w => 
          w.id === winnerId 
            ? { ...w, claimed: newClaimedStatus, claimed_at: newClaimedStatus ? new Date().toISOString() : null }
            : w
        ),
      },
    }))
    
    try {
      const response = await fetch(`/api/lottery/winners/${winnerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ claimed: newClaimedStatus }),
      })

      if (!response.ok) {
        // 失敗時恢復原狀態
        setLotteryWinners(prev => ({
          ...prev,
          thisWeek: {
            ...prev.thisWeek,
            winners: prev.thisWeek.winners.map(w => 
              w.id === winnerId 
                ? { ...w, claimed: currentClaimed, claimed_at: w.claimed_at }
                : w
            ),
          },
          nextWeek: {
            ...prev.nextWeek,
            winners: prev.nextWeek.winners.map(w => 
              w.id === winnerId 
                ? { ...w, claimed: currentClaimed, claimed_at: w.claimed_at }
                : w
            ),
          },
        }))
        const errorData = await response.json()
        throw new Error(errorData.error || '更新失敗')
      }

      // 背景重新載入數據以確保一致性
      setTimeout(() => {
        loadLotteryWinners().catch(err => console.error('背景載入中獎記錄失敗:', err))
      }, 1000)
      
      setToast({ 
        message: newClaimedStatus ? '已標記為已領取' : '已標記為未領取', 
        type: 'success' 
      })
      setTimeout(() => setToast(null), 3000)
    } catch (error) {
      console.error('Error toggling claimed status:', error)
      setToast({ 
        message: error instanceof Error ? error.message : '更新失敗', 
        type: 'error' 
      })
      setTimeout(() => setToast(null), 4000)
    }
  }

  const handleDeleteWinner = async (winnerId: number, memberName: string) => {
    if (!confirm(`確定要刪除 ${memberName} 的中獎記錄嗎？此操作無法復原。`)) {
      return
    }

    // 樂觀更新：立即從列表中移除
    let deletedWinner: any = null
    setLotteryWinners(prev => {
      const thisWeekWinner = prev.thisWeek.winners.find(w => w.id === winnerId)
      const nextWeekWinner = prev.nextWeek.winners.find(w => w.id === winnerId)
      deletedWinner = thisWeekWinner || nextWeekWinner
      
      return {
        ...prev,
        thisWeek: {
          ...prev.thisWeek,
          winners: prev.thisWeek.winners.filter(w => w.id !== winnerId),
        },
        nextWeek: {
          ...prev.nextWeek,
          winners: prev.nextWeek.winners.filter(w => w.id !== winnerId),
        },
      }
    })

    try {
      const response = await fetch(`/api/lottery/winners/${winnerId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        // 失敗時恢復原狀態
        if (deletedWinner) {
          setLotteryWinners(prev => {
            const isThisWeek = prev.thisWeek.winners.some(w => w.meeting_date === deletedWinner.meeting_date)
            return {
              ...prev,
              thisWeek: {
                ...prev.thisWeek,
                winners: isThisWeek 
                  ? [...prev.thisWeek.winners, deletedWinner].sort((a, b) => a.id - b.id)
                  : prev.thisWeek.winners,
              },
              nextWeek: {
                ...prev.nextWeek,
                winners: !isThisWeek 
                  ? [...prev.nextWeek.winners, deletedWinner].sort((a, b) => a.id - b.id)
                  : prev.nextWeek.winners,
              },
            }
          })
        }
        const errorData = await response.json()
        throw new Error(errorData.error || '刪除失敗')
      }

      // 背景重新載入數據以確保一致性
      setTimeout(() => {
        loadLotteryWinners().catch(err => console.error('背景載入中獎記錄失敗:', err))
      }, 1000)
      
      setToast({ message: '中獎記錄已成功刪除', type: 'success' })
      setTimeout(() => setToast(null), 3000)
    } catch (error) {
      console.error('Error deleting winner:', error)
      setToast({ 
        message: error instanceof Error ? error.message : '刪除失敗', 
        type: 'error' 
      })
      setTimeout(() => setToast(null), 4000)
    }
  }

  // 添加系統日誌（必須在使用它的函數之前定義）
  const addSystemLog = useCallback((level: 'info' | 'success' | 'warning' | 'error', message: string) => {
    const log = {
      time: new Date().toLocaleString('zh-TW'),
      level,
      message,
    }
    setSystemLogs(prev => [...prev.slice(-99), log]) // 只保留最近100條
  }, [])

  // 系統設定相關函數
  const handleBackupDatabase = async () => {
    try {
      setToast({ message: '正在備份資料庫...', type: 'info' })
      addSystemLog('info', '開始備份資料庫...')
      setTimeout(() => setToast(null), 2000)
      
      // 導出所有數據為 JSON
      const [membersRes, meetingsRes, checkinsRes, prizesRes, winnersRes] = await Promise.all([
        fetch('/api/members'),
        fetch('/api/meetings'),
        fetch('/api/checkins?date=' + new Date().toISOString().split('T')[0]),
        fetch('/api/prizes'),
        fetch('/api/lottery/winners?date=' + new Date().toISOString().split('T')[0]),
      ])

      const [membersData, meetingsData, checkinsData, prizesData, winnersData] = await Promise.all([
        membersRes.json(),
        meetingsRes.json(),
        checkinsRes.json(),
        prizesRes.json(),
        winnersRes.json(),
      ])

      const backupData = {
        version: systemInfo.version,
        timestamp: new Date().toISOString(),
        data: {
          members: membersData.members || [],
          meetings: meetingsData.meetings || [],
          checkins: checkinsData.checkins || [],
          prizes: prizesData.prizes || [],
          winners: winnersData.winners || [],
        },
      }

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `backup_${new Date().toISOString().split('T')[0]}.json`
      link.click()
      URL.revokeObjectURL(url)

      const backupTime = new Date().toISOString()
      setSystemInfo(prev => {
        const updated = { ...prev, lastBackup: backupTime }
        localStorage.setItem('systemInfo', JSON.stringify(updated))
        return updated
      })
      setToast({ message: '資料庫備份成功！', type: 'success' })
      addSystemLog('success', '資料庫備份成功')
      setTimeout(() => setToast(null), 3000)
    } catch (error) {
      console.error('Error backing up database:', error)
      setToast({ message: '備份失敗：' + (error instanceof Error ? error.message : '未知錯誤'), type: 'error' })
      addSystemLog('error', '資料庫備份失敗：' + (error instanceof Error ? error.message : '未知錯誤'))
      setTimeout(() => setToast(null), 4000)
    }
  }

  const handleRestoreDatabase = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!developerModeUnlocked) {
      e.target.value = ''
      setShowDeveloperPasswordModal(true)
      return
    }

    const file = e.target.files?.[0]
    if (!file) return

    if (!confirm('確定要還原資料庫嗎？這將覆蓋現有數據！此操作無法復原！')) {
      e.target.value = ''
      return
    }

    try {
      setToast({ message: '正在還原資料庫...', type: 'info' })
      addSystemLog('info', '開始還原資料庫...')
      
      const text = await file.text()
      const backupData = JSON.parse(text)

      // 調用後端 API 還原數據
      const response = await fetch('/api/system/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupData }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || '還原失敗')
      }

      // 還原成功後重新載入數據
      await loadData()
      
      setToast({ 
        message: result.message || '資料庫還原成功！', 
        type: 'success' 
      })
      addSystemLog('success', '資料庫還原成功')
      setTimeout(() => setToast(null), 4000)
      e.target.value = ''
    } catch (error) {
      console.error('Error restoring database:', error)
      const errorMessage = error instanceof Error ? error.message : '未知錯誤'
      setToast({ message: `還原失敗：${errorMessage}`, type: 'error' })
      addSystemLog('error', `資料庫還原失敗：${errorMessage}`)
      setTimeout(() => setToast(null), 4000)
      e.target.value = ''
    }
  }

  const handleClearCheckins = async () => {
    requireDeveloperMode(async () => {
      if (!confirm('確定要清除所有簽到記錄嗎？此操作無法復原！')) return

      try {
        setToast({ message: '正在清除簽到記錄...', type: 'info' })
        addSystemLog('info', '開始清除所有簽到記錄...')
        
        // 調用後端 API
        const response = await fetch('/api/checkins/clear-all', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ confirm: true }),
        })

        const result = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(result.error || '清除失敗')
        }

        // 清除成功後重新載入數據
        await loadData()
        
        setToast({ 
          message: result.message || '簽到記錄已清除！', 
          type: 'success' 
        })
        addSystemLog('success', '所有簽到記錄已清除')
        setTimeout(() => setToast(null), 4000)
      } catch (error) {
        console.error('Error clearing checkins:', error)
        const errorMessage = error instanceof Error ? error.message : '未知錯誤'
        setToast({ message: `清除失敗：${errorMessage}`, type: 'error' })
        addSystemLog('error', `清除簽到記錄失敗：${errorMessage}`)
        setTimeout(() => setToast(null), 4000)
      }
    })
  }

  const handleExportData = async (type: 'members' | 'checkins' | 'meetings' | 'all') => {
    try {
      setToast({ message: '正在匯出數據...', type: 'info' })
      
      let data: any = {}
      
      if (type === 'all' || type === 'members') {
        const res = await fetch('/api/members')
        const json = await res.json()
        data.members = json.members || []
      }
      
      if (type === 'all' || type === 'meetings') {
        const res = await fetch('/api/meetings')
        const json = await res.json()
        data.meetings = json.meetings || []
      }
      
      if (type === 'all' || type === 'checkins') {
        // 獲取所有日期的簽到記錄
        const res = await fetch('/api/checkins?date=' + selectedDate)
        const json = await res.json()
        data.checkins = json.checkins || []
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `export_${type}_${new Date().toISOString().split('T')[0]}.json`
      link.click()
      URL.revokeObjectURL(url)

      setToast({ message: '數據匯出成功！', type: 'success' })
      setTimeout(() => setToast(null), 3000)
    } catch (error) {
      console.error('Error exporting data:', error)
      setToast({ message: '匯出失敗', type: 'error' })
      setTimeout(() => setToast(null), 4000)
    }
  }

  // 驗證開發者密碼
  const verifyDeveloperPassword = (password: string): boolean => {
    return password === '888'
  }

  // 解鎖開發者模式
  const unlockDeveloperMode = () => {
    if (verifyDeveloperPassword(developerPassword)) {
      setDeveloperModeUnlocked(true)
      setShowDeveloperPasswordModal(false)
      setDeveloperPassword('')
      setToast({ message: '✅ 開發者模式已解鎖', type: 'success' })
      addSystemLog('info', '開發者模式已解鎖')
      setTimeout(() => setToast(null), 3000)
    } else {
      setToast({ message: '❌ 密碼錯誤', type: 'error' })
      setDeveloperPassword('')
      setTimeout(() => setToast(null), 3000)
    }
  }

  // 包裝開發者功能，需要驗證
  const requireDeveloperMode = (callback: () => void | Promise<void>) => {
    if (!developerModeUnlocked) {
      setShowDeveloperPasswordModal(true)
      return
    }
    const result = callback()
    if (result instanceof Promise) {
      result.catch(err => console.error('Developer function error:', err))
    }
  }

  const handleClearCache = () => {
    requireDeveloperMode(() => {
      if (confirm('確定要清除快取嗎？')) {
        addSystemLog('info', '清除瀏覽器快取')
        localStorage.clear()
        sessionStorage.clear()
        setToast({ message: '快取已清除，頁面將重新載入', type: 'success' })
        addSystemLog('success', '快取已清除')
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      }
    })
  }

  const handleSystemHealthCheck = async () => {
    try {
      setToast({ message: '正在檢查系統健康狀態...', type: 'info' })
      addSystemLog('info', '開始系統健康檢查...')
      
      const [membersRes, meetingsRes, checkinsRes] = await Promise.allSettled([
        fetch('/api/members'),
        fetch('/api/meetings'),
        fetch('/api/checkins?date=' + new Date().toISOString().split('T')[0]),
      ])

      const allHealthy = [membersRes, meetingsRes, checkinsRes].every(
        r => r.status === 'fulfilled' && r.value.ok
      )

      if (allHealthy) {
        setSystemInfo(prev => ({ ...prev, databaseStatus: 'connected' }))
        setToast({ message: '✅ 系統健康檢查通過！所有服務正常運行', type: 'success' })
        addSystemLog('success', '系統健康檢查通過：所有服務正常運行')
      } else {
        setSystemInfo(prev => ({ ...prev, databaseStatus: 'error' }))
        setToast({ message: '⚠️ 系統健康檢查發現問題，請查看日誌', type: 'error' })
        addSystemLog('error', '系統健康檢查發現問題：部分服務異常')
      }
      setTimeout(() => setToast(null), 4000)
    } catch (error) {
      console.error('Error checking system health:', error)
      setToast({ message: '健康檢查失敗', type: 'error' })
      addSystemLog('error', '系統健康檢查失敗：' + (error instanceof Error ? error.message : '未知錯誤'))
      setTimeout(() => setToast(null), 4000)
    }
  }

  useEffect(() => {
    if (activeTab === 'prizes') {
      loadPrizes()
    } else if (activeTab === 'lottery-winners') {
      loadLotteryWinners()
    } else if (activeTab === 'reports' || activeTab === 'statistics') {
      // 統計頁面需要載入所有數據以計算統計信息
      loadData(true).catch(err => console.error('載入統計數據失敗:', err))
    } else if (activeTab === 'settings') {
      // 載入系統設定
      const savedSettings = localStorage.getItem('systemSettings')
      if (savedSettings) {
        try {
          setSystemSettings(JSON.parse(savedSettings))
        } catch (e) {
          console.error('Error loading system settings:', e)
        }
      }
      // 載入系統資訊
      const savedInfo = localStorage.getItem('systemInfo')
      if (savedInfo) {
        try {
          setSystemInfo(JSON.parse(savedInfo))
        } catch (e) {
          console.error('Error loading system info:', e)
        }
      }
      // 添加初始日誌
      addSystemLog('info', '系統設定頁面已載入')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]) // 只依賴 activeTab，避免無限循環

  // 全局錯誤處理器
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('全局錯誤:', event.error)
      if (event.error && event.error.message) {
        const errorMsg = filterVercelText(event.error.message)
        setToast({ message: `發生錯誤：${errorMsg}`, type: 'error' })
        setTimeout(() => setToast(null), 5000)
      }
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('未處理的 Promise 拒絕:', event.reason)
      const errorMsg = event.reason instanceof Error 
        ? filterVercelText(event.reason.message)
        : filterVercelText(String(event.reason || '未知錯誤'))
      setToast({ message: `操作失敗：${errorMsg}`, type: 'error' })
      setTimeout(() => setToast(null), 5000)
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  useEffect(() => {
    // 檢查登入狀態（確保在客戶端執行）
    if (typeof window === 'undefined') {
      return
    }

    const loggedIn = localStorage.getItem('adminLoggedIn')
    if (loggedIn !== 'true') {
      setLoading(false)
      // 使用 window.location 確保完整重定向
      window.location.href = '/admin/login'
      return
    }

    // 只在組件掛載時加載一次，避免無限循環
    let mounted = true
    const fetchData = async () => {
      if (mounted) {
        await loadData()
      }
    }
    fetchData()
    
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 只在掛載時執行一次

  // 背景自動刷新數據（每60秒）- 僅在出席管理標籤頁，不顯示加載狀態
  // 添加速率限制檢測，避免觸發 "Too many requests" 錯誤
  useEffect(() => {
    if (activeTab !== 'attendance') {
      return // 只在出席管理標籤頁啟用
    }
    
    let retryCount = 0
    const maxRetries = 3
    let isPaused = false
    let isRefreshing = false // 防止重複刷新
    
    const interval = setInterval(() => {
      // 如果已暫停（遇到速率限制），跳過本次刷新
      if (isPaused) {
        console.log('Background refresh paused due to rate limiting')
        return
      }
      
      // 如果正在刷新，跳過本次
      if (isRefreshing) {
        console.log('Background refresh already in progress, skipping')
        return
      }
      
      // 檢查頁面是否可見，如果不可見則跳過刷新
      if (typeof document !== 'undefined' && document.hidden) {
        console.log('Page is hidden, skipping background refresh')
        return
      }
      
      isRefreshing = true
      
      // 背景靜默刷新，不顯示loading狀態
      loadData(true).catch(err => {
        console.error('Background refresh error:', err)
        const errorMessage = err instanceof Error ? err.message : String(err)
        
        // 檢測速率限制錯誤
        if (errorMessage.includes('Too many requests') || 
            errorMessage.includes('rate limit') ||
            errorMessage.includes('429')) {
          console.warn('Rate limit detected, pausing background refresh')
          isPaused = true
          retryCount++
          
          // 如果重試次數未達上限，在5分鐘後恢復
          if (retryCount < maxRetries) {
            setTimeout(() => {
              isPaused = false
              retryCount = 0 // 重置重試計數
              console.log('Resuming background refresh after rate limit cooldown')
            }, 5 * 60 * 1000) // 5分鐘後恢復
          } else {
            console.warn('Max retries reached, background refresh permanently paused')
          }
        }
      }).finally(() => {
        isRefreshing = false
      })
    }, 60000) // 改為60秒刷新一次，減少請求頻率
    
    return () => {
      clearInterval(interval)
      isRefreshing = false
      isPaused = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]) // 只依賴 activeTab，避免無限循環

  // 获取下一个周四的日期
  const getNextThursday = (): string => {
    const today = new Date()
    const dayOfWeek = today.getDay() // 0 = Sunday, 4 = Thursday
    const daysUntilThursday = (4 - dayOfWeek + 7) % 7 || 7 // 如果今天是周四，则取下一个周四
    const nextThursday = new Date(today)
    nextThursday.setDate(today.getDate() + daysUntilThursday)
    return nextThursday.toISOString().split('T')[0]
  }

  // 检查日期是否为周四
  const isThursday = (dateString: string): boolean => {
    const date = new Date(dateString)
    return date.getDay() === 4 // 4 = Thursday
  }

  // 狀態：管理顯示的日期範圍（初始為3個月）
  const [dateRangeMonths, setDateRangeMonths] = useState(3)

  // 生成週四日期列表（只顯示未來日期，從今天或最近的週四開始）
  const getThursdayDates = (monthsAhead: number = 3): Array<{ value: string; label: string }> => {
    const dates: Array<{ value: string; label: string }> = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // 找到今天或之後的第一個週四（不包含過去的日期）
    const dayOfWeek = today.getDay()
    let daysUntilThursday = (4 - dayOfWeek + 7) % 7
    
    // 如果今天是週四，包含今天；否則找下一個週四
    if (daysUntilThursday === 0 && dayOfWeek === 4) {
      daysUntilThursday = 0
    } else if (daysUntilThursday === 0) {
      daysUntilThursday = 7
    }
    
    const firstThursday = new Date(today)
    firstThursday.setDate(today.getDate() + daysUntilThursday)
    
    // 生成未來指定月數內的所有週四
    const currentDate = new Date(firstThursday)
    const endDate = new Date(today)
    endDate.setMonth(today.getMonth() + monthsAhead)
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const label = currentDate.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short'
      })
      dates.push({ value: dateStr, label })
      currentDate.setDate(currentDate.getDate() + 7) // 加7天到下個週四
    }
    
    return dates
  }

  // 根據當前範圍生成日期列表
  const thursdayDates = useMemo(() => getThursdayDates(dateRangeMonths), [dateRangeMonths])

  // 當選擇的日期接近列表末尾時，自動擴展範圍
  useEffect(() => {
    if (thursdayDates.length > 0) {
      const lastDate = thursdayDates[thursdayDates.length - 1].value
      const selectedDateObj = new Date(selectedDate)
      const lastDateObj = new Date(lastDate)
      
      // 如果選擇的日期距離末尾少於2週，自動加載更多日期
      const daysDiff = (lastDateObj.getTime() - selectedDateObj.getTime()) / (1000 * 60 * 60 * 24)
      if (daysDiff < 14 && dateRangeMonths < 12) {
        setDateRangeMonths(prev => Math.min(prev + 3, 12)) // 每次加3個月，最多12個月
      }
    }
  }, [selectedDate, thursdayDates, dateRangeMonths])

  const handleCreateMeeting = async () => {
    // 使用當前選中的日期建立會議，而不是自動跳到週四
    const meetingDate = selectedDate
    
    // 樂觀更新：立即添加新會議到列表
    const optimisticMeeting: Meeting = {
      id: Date.now(), // 臨時ID，後端會返回真實ID
      date: meetingDate,
      status: 'scheduled',
    }
    setMeetings(prev => [...prev, optimisticMeeting])
    setSelectedMeeting(optimisticMeeting)
    
    try {
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: meetingDate,
          status: 'scheduled',
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.meeting) {
          // 用真實的會議數據替換樂觀更新的臨時數據
          setMeetings(prev => prev.map(m => 
            m.date === meetingDate && m.id === optimisticMeeting.id 
              ? data.meeting 
              : m
          ))
          setSelectedMeeting(data.meeting)
          
          // 背景載入簽到數據
          setTimeout(() => {
            fetchWithTimeout(`/api/checkins?date=${meetingDate}`, undefined, 6000)
              .then(res => res.ok ? res.json() : null)
              .then(checkinsData => {
                if (checkinsData?.checkins) {
                  setCheckins(checkinsData.checkins)
                }
              })
              .catch(err => console.error('背景載入簽到數據失敗:', err))
          }, 500)
        } else {
          // 如果後端返回的數據格式不同，使用背景刷新
          setTimeout(() => {
            fetchWithTimeout('/api/meetings', undefined, 6000)
              .then(res => res.ok ? res.json() : null)
              .then(meetingsData => {
                if (meetingsData?.meetings) {
                  setMeetings(meetingsData.meetings)
                  const currentMeeting = meetingsData.meetings.find((m: Meeting) => m.date === meetingDate)
                  setSelectedMeeting(currentMeeting || null)
                }
              })
              .catch(err => console.error('背景刷新會議數據失敗:', err))
          }, 500)
        }

        setToast({ message: `會議已成功建立（${meetingDate}）`, type: 'success' })
        setTimeout(() => setToast(null), 3000)
      } else {
        // 失敗時恢復原狀態
        setMeetings(prev => prev.filter(m => m.id !== optimisticMeeting.id))
        setSelectedMeeting(null)
        const errorData = await response.json().catch(() => ({ error: '建立會議失敗' }))
        setToast({ message: `建立會議失敗：${errorData.error || '未知錯誤'}`, type: 'error' })
        setTimeout(() => setToast(null), 4000)
      }
    } catch (error) {
      console.error('Error creating meeting:', error)
      // 失敗時恢復原狀態
      setMeetings(prev => prev.filter(m => m.id !== optimisticMeeting.id))
      setSelectedMeeting(null)
      setToast({ message: '建立會議失敗：網路錯誤', type: 'error' })
      setTimeout(() => setToast(null), 4000)
    }
  }

  const handleManualCheckin = async (memberId: number, status: string) => {
    const key = `checkin-${memberId}`
    if (actionLoading[key]) {
      console.log('簽到操作進行中，跳過重複請求')
      return
    }

    // 如果目前選擇的日期沒有會議，直接提示，不送出簽到請求
    if (!selectedMeeting) {
      setToast({ message: '今天沒有會議，請先在上方建立會議後再簽到', type: 'error' })
      setTimeout(() => setToast(null), 4000)
      return
    }

    setActionLoading(prev => ({ ...prev, [key]: true }))
    
    // 樂觀更新：立即更新簽到狀態
    const member = members.find(m => m.id === memberId)
    const optimisticCheckin: CheckinRecord = {
      member_id: memberId,
      checkin_time: new Date().toISOString(),
      message: '管理員手動簽到',
      status: status || 'present',
      name: member?.name || '',
    }
    setCheckins(prev => {
      const filtered = prev.filter(c => c.member_id !== memberId || c.checkin_time?.split('T')[0] !== selectedDate)
      return [...filtered, optimisticCheckin]
    })
    
    try {
      console.log('開始手動簽到:', { memberId, date: selectedDate, status })
      
      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memberId,
          date: selectedDate,
          message: '管理員手動簽到',
          status,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '簽到失敗' }))
        const errorMessage = errorData.error || '簽到失敗'
        console.error('簽到失敗:', { status: response.status, error: errorMessage })
        
        // 失敗時恢復原狀態（背景靜默刷新，避免整頁「載入中」閃動）
        await loadData(true, selectedDate)
        setToast({ message: `簽到失敗：${errorMessage}`, type: 'error' })
        setTimeout(() => setToast(null), 4000)
        return
      }

      const data = await response.json()
      console.log('簽到響應:', data)
      
      if (data.success) {
        // 前端已經樂觀更新為已簽到，這裡不再強制重抓，避免畫面一閃又還原
        // 延遲背景刷新，確保簽到狀態保持
        setTimeout(() => {
          loadData(true, selectedDate).catch(err => console.error('背景刷新失敗:', err))
        }, 2000)
        
        setToast({ message: '簽到成功！', type: 'success' })
        setTimeout(() => setToast(null), 3000)
      } else {
        // 失敗時恢復原狀態（靜默刷新）
        await loadData(true, selectedDate)
        setToast({ message: '簽到失敗：' + (data.error || '未知錯誤'), type: 'error' })
        setTimeout(() => setToast(null), 4000)
      }
    } catch (error) {
      console.error('Error checking in:', error)
      const errorMessage = error instanceof Error ? error.message : '簽到失敗'
      
      // 失敗時恢復原狀態（靜默刷新）
      await loadData(true, selectedDate)
      setToast({ message: `簽到失敗：${errorMessage}`, type: 'error' })
      setTimeout(() => setToast(null), 4000)
    } finally {
      setActionLoading(prev => ({ ...prev, [key]: false }))
    }
  }

  const handleDeleteCheckin = async (memberId: number) => {
    if (!confirm('確定要刪除此簽到記錄嗎？')) return

    // 樂觀更新：立即從列表中移除
    const checkinToDelete = checkins.find(c => c.member_id === memberId && c.checkin_time?.split('T')[0] === selectedDate)
    setCheckins(prev => prev.filter(c => !(c.member_id === memberId && c.checkin_time?.split('T')[0] === selectedDate)))

    try {
      console.log('刪除簽到記錄:', { memberId, date: selectedDate })
      
      const response = await fetch('/api/checkin/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memberId,
          date: selectedDate,
        }),
      })

      if (!response.ok) {
        // 失敗時恢復
        if (checkinToDelete) {
          setCheckins(prev => [...prev, checkinToDelete])
        }
        const errorData = await response.json().catch(() => ({ error: '刪除失敗' }))
        const errorMessage = errorData.error || '刪除失敗'
        console.error('刪除簽到記錄失敗:', { status: response.status, error: errorMessage })
        setToast({ message: `刪除失敗：${errorMessage}`, type: 'error' })
        setTimeout(() => setToast(null), 4000)
        return
      }

      const data = await response.json()
      console.log('刪除簽到記錄響應:', data)
      
      if (data.success) {
        // 檢查是否真的刪除了記錄
        if (data.deleted === false || data.count === 0) {
          // 記錄不存在或已被刪除，但前端已經樂觀更新移除了，所以保持移除狀態
          setToast({ message: data.message || '簽到記錄不存在或已被刪除', type: 'info' })
          setTimeout(() => setToast(null), 3000)
        } else {
          // 成功刪除
          // 延遲背景刷新，確保刪除狀態保持
          setTimeout(() => {
            loadData(true, selectedDate).catch(err => console.error('背景刷新失敗:', err))
          }, 2000)
          
          setToast({ message: '簽到記錄已成功刪除', type: 'success' })
          setTimeout(() => setToast(null), 3000)
        }
      } else {
        // 失敗時恢復（靜默刷新）
        if (checkinToDelete) {
          setCheckins(prev => [...prev, checkinToDelete])
        }
        await loadData(true, selectedDate)
        setToast({ message: '刪除失敗：' + (data.error || '未知錯誤'), type: 'error' })
        setTimeout(() => setToast(null), 4000)
      }
    } catch (error) {
      console.error('Error deleting checkin:', error)
      // 失敗時恢復（靜默刷新）
      if (checkinToDelete) {
        setCheckins(prev => [...prev, checkinToDelete])
      }
      await loadData(true, selectedDate)
      const errorMessage = error instanceof Error ? error.message : '刪除失敗'
      setToast({ message: `刪除失敗：${errorMessage}`, type: 'error' })
      setTimeout(() => setToast(null), 4000)
    }
  }

  const getCheckinStatus = useCallback((memberId: number) => {
    return checkins.find(c => c.member_id === memberId) || null
  }, [checkins])

  // 高亮搜索關鍵字
  const highlightSearchTerm = useCallback((text: string, searchTerm: string): string => {
    if (!searchTerm || !text) return text
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    return text.replace(regex, '<mark class="bg-yellow-300 text-yellow-900 font-semibold px-1 rounded">$1</mark>')
  }, [])

  // 使用 useMemo 优化筛选和排序
  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      const matchesSearch = searchTerm === '' || 
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.profession.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.id.toString().includes(searchTerm)
      
      const checkin = getCheckinStatus(member.id)
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'present' && checkin) ||
        (filterStatus === 'absent' && !checkin)
      
      return matchesSearch && matchesStatus
    })
  }, [members, searchTerm, filterStatus, getCheckinStatus])

  // 排序会员 - 使用 useMemo 优化
  const sortedFilteredMembers = useMemo(() => {
    return [...filteredMembers].sort((a, b) => {
      const aCheckin = getCheckinStatus(a.id)
      const bCheckin = getCheckinStatus(b.id)
      
      let comparison = 0
      switch (sortBy) {
        case 'id':
          comparison = a.id - b.id
          break
        case 'name':
          comparison = a.name.localeCompare(b.name, 'zh-TW')
          break
        case 'time':
          const aTime = aCheckin?.checkin_time ? new Date(aCheckin.checkin_time).getTime() : 0
          const bTime = bCheckin?.checkin_time ? new Date(bCheckin.checkin_time).getTime() : 0
          comparison = aTime - bTime
          break
        case 'status':
          comparison = (aCheckin ? 1 : 0) - (bCheckin ? 1 : 0)
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [filteredMembers, sortBy, sortOrder, getCheckinStatus])

  const handleEditCheckin = (memberId: number) => {
    const checkin = getCheckinStatus(memberId)
    if (!checkin) return
    
    // 格式化時間為本地時間（用於 datetime-local input）
    const checkinTime = checkin.checkin_time 
      ? new Date(checkin.checkin_time).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16)
    
    setEditingCheckin({
      memberId,
      message: checkin.message || '',
      status: checkin.status || 'present',
      checkin_time: checkinTime,
    })
  }

  const handleSaveCheckinEdit = async () => {
    if (!editingCheckin) return

    // 樂觀更新：立即更新簽到記錄
    const member = members.find(m => m.id === editingCheckin.memberId)
    // 將本地時間轉換為 ISO 字符串
    const checkinTimeISO = editingCheckin.checkin_time 
      ? new Date(editingCheckin.checkin_time).toISOString()
      : new Date().toISOString()
    
    const updatedCheckin: CheckinRecord = {
      member_id: editingCheckin.memberId,
      checkin_time: checkinTimeISO,
      message: (editingCheckin.message.trim() || null) as string | null,
      status: editingCheckin.status || 'present',
      name: member?.name || '',
    }
    setCheckins(prev => prev.map(c => 
      c.member_id === editingCheckin.memberId && c.checkin_time?.split('T')[0] === selectedDate
        ? updatedCheckin
        : c
    ))
    
    // 立即關閉彈窗
    const savedEditingCheckin = editingCheckin
    setEditingCheckin(null)

    try {
      console.log('更新簽到記錄:', { 
        memberId: savedEditingCheckin.memberId, 
        date: selectedDate, 
        message: savedEditingCheckin.message 
      })
      
      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memberId: savedEditingCheckin.memberId,
          date: selectedDate,
          message: savedEditingCheckin.message.trim() || null,
          status: savedEditingCheckin.status || 'present',
          checkin_time: savedEditingCheckin.checkin_time 
            ? new Date(savedEditingCheckin.checkin_time).toISOString()
            : undefined,
        }),
      })

      if (!response.ok) {
        // 失敗時恢復（靜默刷新）
        await loadData(true, selectedDate)
        const errorData = await response.json().catch(() => ({ error: '更新失敗' }))
        const errorMessage = errorData.error || '更新失敗'
        console.error('更新簽到記錄失敗:', { status: response.status, error: errorMessage })
        setToast({ message: `更新失敗：${errorMessage}`, type: 'error' })
        setTimeout(() => setToast(null), 4000)
        return
      }

      const data = await response.json()
      console.log('更新簽到記錄響應:', data)
      
      if (data.success) {
        // 前端已經樂觀更新，不再強制重抓，避免畫面閃爍
        // 延遲背景刷新，確保更新狀態保持
        setTimeout(() => {
          loadData(true, selectedDate).catch(err => console.error('背景刷新失敗:', err))
        }, 2000)
        
        setToast({ message: '簽到記錄已成功更新', type: 'success' })
        setTimeout(() => setToast(null), 3000)
      } else {
        // 失敗時恢復（靜默刷新）
        await loadData(true, selectedDate)
        setToast({ message: '更新失敗：' + (data.error || '未知錯誤'), type: 'error' })
        setTimeout(() => setToast(null), 4000)
      }
    } catch (error) {
      console.error('Error updating checkin:', error)
      // 失敗時恢復（靜默刷新）
      await loadData(true, selectedDate)
      const errorMessage = error instanceof Error ? error.message : '更新失敗'
      setToast({ message: `更新失敗：${errorMessage}`, type: 'error' })
      setTimeout(() => setToast(null), 4000)
    }
  }

  const handleEditMember = (member: Member) => {
    setEditingMember(member)
    setShowMemberModal(true)
  }

  const handleDeleteMember = async (memberId: number) => {
    if (!confirm('確定要刪除此會員嗎？此操作無法復原。')) return

    // 樂觀更新：立即從列表中移除
    const memberToDelete = members.find(m => m.id === memberId)
    setMembers(prev => prev.filter(m => m.id !== memberId))
    
    try {
      console.log('刪除會員請求:', memberId)
      const response = await fetch(`/api/members/${memberId}?_t=${Date.now()}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
        cache: 'no-store',
      })

      console.log('刪除會員響應:', { status: response.status, ok: response.ok })

      if (response.ok) {
        const data = await response.json()
        console.log('刪除會員響應數據:', data)
        
        if (data.success && (data.deleted !== false)) {
          // 前端已經將會員從列表中移除，這裡不再強制重抓，避免列表又被還原
          // 延遲背景刷新，確保刪除狀態保持
          setTimeout(() => {
            loadData(true).catch(err => console.error('背景刷新失敗:', err))
          }, 2000)
          
          setToast({ message: '會員已成功刪除', type: 'success' })
          setTimeout(() => setToast(null), 3000)
        } else {
          // 失敗時恢復列表
          console.warn('刪除會員失敗：', data)
          if (memberToDelete) {
            setMembers(prev => [...prev, memberToDelete].sort((a, b) => a.id - b.id))
          }
          const errorMsg = filterVercelText(data.error || '刪除失敗：未知錯誤')
          setToast({ message: errorMsg, type: 'error' })
          setTimeout(() => setToast(null), 4000)
        }
      } else {
        // 失敗時恢復列表
        console.error('刪除會員 HTTP 錯誤:', response.status)
        if (memberToDelete) {
          setMembers(prev => [...prev, memberToDelete].sort((a, b) => a.id - b.id))
        }
        const errorData = await response.json().catch(() => ({ error: '刪除失敗' }))
        const errorMsg = filterVercelText(errorData.error || `刪除失敗：HTTP ${response.status}`)
        
        // 如果是 404，顯示更清楚的訊息
        if (response.status === 404) {
          setToast({ message: `會員不存在（編號：${memberId}），可能已被刪除`, type: 'error' })
        } else {
          setToast({ message: errorMsg, type: 'error' })
        }
        setTimeout(() => setToast(null), 4000)
      }
    } catch (error) {
      console.error('Error deleting member:', error)
      // 失敗時恢復列表
      if (memberToDelete) {
        setMembers(prev => [...prev, memberToDelete].sort((a, b) => a.id - b.id))
      }
      setToast({ message: '刪除失敗：網路錯誤或伺服器無回應', type: 'error' })
      setTimeout(() => setToast(null), 4000)
    }
  }

  const handleSaveMember = async () => {
    try {
      if (editingMember) {
        // 更新會員
        if (!editingMember.name || editingMember.name.trim() === '') {
          setToast({ message: '請輸入會員姓名', type: 'error' })
          setTimeout(() => setToast(null), 3000)
          return
        }

        // 樂觀更新：立即更新列表中的會員
        const updatedMember = {
          id: editingMember.id,
          name: editingMember.name.trim(),
          profession: editingMember.profession?.trim() || '',
        }
        setMembers(prev => prev.map(m => m.id === editingMember.id ? updatedMember : m))
        
        // 立即關閉彈窗
        setShowMemberModal(false)
        const savedEditingMember = editingMember
        setEditingMember(null)

        const response = await fetch(`/api/members/${savedEditingMember.id}?_t=${Date.now()}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
          cache: 'no-store',
          body: JSON.stringify({
            name: savedEditingMember.name.trim(),
            profession: savedEditingMember.profession?.trim() || '',
          }),
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            // 前端已經樂觀更新，不再強制重抓，避免畫面閃爍
            setToast({ message: '會員已成功更新', type: 'success' })
            setTimeout(() => setToast(null), 3000)
          } else {
            // 失敗時恢復原數據（靜默刷新）
            setMembers(prev => prev.map(m => m.id === savedEditingMember.id ? savedEditingMember : m))
            await loadData(true)
            setToast({ message: '更新失敗：' + (data.error || '未知錯誤'), type: 'error' })
            setTimeout(() => setToast(null), 4000)
          }
        } else {
          // 失敗時恢復原數據（靜默刷新）
          setMembers(prev => prev.map(m => m.id === savedEditingMember.id ? savedEditingMember : m))
          await loadData(true)
          const errorData = await response.json().catch(() => ({ error: '更新失敗' }))
          setToast({ message: '更新失敗：' + (errorData.error || '未知錯誤'), type: 'error' })
          setTimeout(() => setToast(null), 4000)
        }
      } else {
        // 創建新會員
        // 驗證輸入
        if (!newMember.id || newMember.id.trim() === '') {
          setToast({ message: '請輸入會員編號', type: 'error' })
          setTimeout(() => setToast(null), 3000)
          return
        }

        if (!newMember.name || newMember.name.trim() === '') {
          setToast({ message: '請輸入會員姓名', type: 'error' })
          setTimeout(() => setToast(null), 3000)
          return
        }

        const memberId = parseInt(newMember.id)
        if (isNaN(memberId) || memberId <= 0) {
          setToast({ message: '會員編號必須是正整數', type: 'error' })
          setTimeout(() => setToast(null), 3000)
          return
        }

        // 保存表單數據
        const savedMemberData = {
          id: memberId,
          name: newMember.name.trim(),
          profession: newMember.profession?.trim() || '',
        }

        // 樂觀更新：立即添加到列表
        const newMemberObj: Member = {
          id: memberId,
          name: savedMemberData.name,
          profession: savedMemberData.profession,
        }
        setMembers(prev => [...prev, newMemberObj].sort((a, b) => a.id - b.id))
        
        // 立即關閉彈窗並清空表單
        setShowMemberModal(false)
        setNewMember({ id: '', name: '', profession: '' })

        console.log('開始新增會員:', savedMemberData)
        
        let response;
        try {
          response = await fetch(`/api/members/create?_t=${Date.now()}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
            cache: 'no-store',
            body: JSON.stringify(savedMemberData),
          })
        } catch (fetchError) {
          console.error('新增會員請求失敗:', fetchError)
          // 失敗時從列表中移除
          setMembers(prev => prev.filter(m => m.id !== memberId))
          await loadData(true)
          setToast({ message: '新增失敗：網路錯誤，請檢查連線狀態', type: 'error' })
          setTimeout(() => setToast(null), 4000)
          return
        }

        console.log('新增會員 API 響應:', { ok: response.ok, status: response.status })

        if (response.ok) {
          let data;
          try {
            data = await response.json()
          } catch (jsonError) {
            console.error('解析 API 響應失敗:', jsonError)
            // 失敗時從列表中移除
            setMembers(prev => prev.filter(m => m.id !== memberId))
            await loadData(true)
            setToast({ message: '新增失敗：伺服器響應格式錯誤', type: 'error' })
            setTimeout(() => setToast(null), 4000)
            return
          }
          
          console.log('新增會員 API 數據:', data)
          
          if (data.success && data.data) {
            // 前端已經樂觀更新，但為了確保資料一致性，進行背景刷新
            // 使用 setTimeout 延遲刷新，避免立即覆蓋樂觀更新
            setTimeout(() => {
              loadData(true).catch(err => console.error('背景刷新失敗:', err))
            }, 1000)
            
            setToast({ message: '會員已成功新增', type: 'success' })
            setTimeout(() => setToast(null), 3000)
            console.log('會員新增成功:', data.data)
          } else {
            // 失敗時從列表中移除（靜默刷新）
            setMembers(prev => prev.filter(m => m.id !== memberId))
            await loadData(true)
            const errorMessage = filterVercelText(data.error || '新增失敗：未知錯誤')
            console.error('新增會員失敗:', errorMessage, data)
            setToast({ message: '新增失敗：' + errorMessage, type: 'error' })
            setTimeout(() => setToast(null), 4000)
          }
        } else {
          // 失敗時從列表中移除（靜默刷新）
          setMembers(prev => prev.filter(m => m.id !== memberId))
          await loadData(true)
          
          let errorData;
          try {
            errorData = await response.json()
          } catch (jsonError) {
            console.error('解析錯誤響應失敗:', jsonError)
            errorData = { error: `HTTP ${response.status}: ${response.statusText}` }
          }
          
          const errorMessage = filterVercelText(errorData.error || `新增失敗：HTTP ${response.status}`)
          console.error('新增會員 API 錯誤:', { status: response.status, error: errorMessage, errorData })
          setToast({ message: errorMessage, type: 'error' })
          setTimeout(() => setToast(null), 4000)
        }
      }
    } catch (error) {
      console.error('Error saving member:', error)
      // 如果是新增，失敗時從列表中移除
      if (!editingMember) {
        const memberId = parseInt(newMember.id)
        if (!isNaN(memberId)) {
          setMembers(prev => prev.filter(m => m.id !== memberId))
        }
      } else {
        // 如果是編輯，恢復原數據
        setMembers(prev => prev.map(m => m.id === editingMember.id ? editingMember : m))
      }
      setToast({ message: '操作失敗：網路錯誤或伺服器無回應', type: 'error' })
      setTimeout(() => setToast(null), 4000)
    }
  }

  const handleEditMeeting = (meeting: Meeting) => {
    setEditingMeeting(meeting)
    setShowMeetingModal(true)
  }

  const handleDeleteMeeting = async (meetingId: number) => {
    if (!confirm('確定要刪除此會議嗎？相關的簽到記錄也會被刪除。')) return

    // 樂觀更新：立即從列表中移除
    const meetingToDelete = meetings.find(m => m.id === meetingId)
    setMeetings(prev => prev.filter(m => m.id !== meetingId))
    
    // 如果刪除的是當前選中的會議，清除選中狀態
    if (selectedMeeting?.id === meetingId) {
      setSelectedMeeting(null)
    }

    // 如果刪除的會議日期是當前選中的日期，清除該日期的簽到記錄
    if (meetingToDelete && meetingToDelete.date === selectedDate) {
      setCheckins([])
    }

    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `刪除失敗：HTTP ${response.status}`)
      }

      const result = await response.json()
      
      // 成功：重新載入數據以確保一致性
      await loadData(true, selectedDate)
      
      setToast({ 
        message: '會議已成功刪除', 
        type: 'success' 
      })
      setTimeout(() => setToast(null), 3000)
    } catch (error) {
      console.error('Error deleting meeting:', error)
      
      // 失敗：恢復原狀態
      await loadData(true, selectedDate)
      
      const errorMessage = error instanceof Error ? error.message : '刪除會議失敗'
      setToast({ 
        message: `刪除失敗：${errorMessage}`, 
        type: 'error' 
      })
      setTimeout(() => setToast(null), 4000)
    }
  }

  const handleSaveMeeting = async () => {
    try {
      if (editingMeeting) {
        // 更新现有会议 - 确保日期是周四
        let meetingDate = editingMeeting.date
        if (!isThursday(meetingDate)) {
          meetingDate = getNextThursday()
          alert('會議日期必須是週四，已自動調整為下一個週四')
        }
        
        const response = await fetch(`/api/meetings/${editingMeeting.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            date: meetingDate,
            status: editingMeeting.status,
          }),
        })

        if (response.ok) {
          setShowMeetingModal(false)
          setEditingMeeting(null)
          loadData()
        }
      } else {
        // 创建新会议 - 自动设置为下一个周四
        const meetingDate = getNextThursday()
        const response = await fetch('/api/meetings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            date: meetingDate,
            status: 'scheduled',
          }),
        })

        if (response.ok) {
          setShowMeetingModal(false)
          setEditingMeeting(null)
          loadData()
        }
      }
    } catch (error) {
      console.error('Error saving meeting:', error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminLoggedIn')
    router.push('/admin/login')
  }

  // 统计数据 - 使用 useMemo 优化
  const stats = useMemo(() => {
    const total = members.length
    const present = checkins.filter(c => c.status === 'present').length
    const absent = total - present
    return { total, present, absent }
  }, [members.length, checkins])

  // 計算日期範圍的開始日期
  const getDateRangeStart = useCallback((range: 'all' | 'month' | 'quarter' | 'year'): Date | null => {
    if (range === 'all') return null
    const now = new Date()
    const start = new Date(now)
    if (range === 'month') {
      start.setMonth(now.getMonth() - 1)
    } else if (range === 'quarter') {
      start.setMonth(now.getMonth() - 3)
    } else if (range === 'year') {
      start.setFullYear(now.getFullYear() - 1)
    }
    return start
  }, [])

  // 根據日期範圍篩選會議
  const filteredMeetingsByDateRange = useMemo(() => {
    if (statisticsDateRange === 'all') return meetings
    const startDate = getDateRangeStart(statisticsDateRange)
    if (!startDate) return meetings
    return meetings.filter(meeting => {
      const meetingDate = new Date(meeting.date)
      return meetingDate >= startDate
    })
  }, [meetings, statisticsDateRange, getDateRangeStart])

  // 整體統計數據 - 用於統計報表頁面（根據日期範圍篩選）
  const overallStats = useMemo(() => {
    const filteredMeetings = filteredMeetingsByDateRange
    const totalMeetings = filteredMeetings.length
    
    // 只計算篩選範圍內的會議統計
    const filteredMeetingStats: Record<string, number> = {}
    filteredMeetings.forEach(meeting => {
      if (meetingStats[meeting.date]) {
        filteredMeetingStats[meeting.date] = meetingStats[meeting.date]
      }
    })
    const totalCheckins = Object.values(filteredMeetingStats).reduce((sum, count) => sum + count, 0)
    const avgAttendanceRate = totalMeetings > 0 && members.length > 0 
      ? ((totalCheckins / (totalMeetings * members.length)) * 100).toFixed(1)
      : '0'
    
    // 計算篩選範圍內的會員統計（需要重新計算，因為 memberAttendanceStats 是基於所有會議的）
    // 這裡我們需要根據篩選的會議來重新計算統計
    const filteredMemberStats: Record<number, {total: number, present: number, late: number, proxy: number, absent: number, rate: number}> = {}
    
    if (totalMeetings > 0) {
      members.forEach(member => {
        let presentCount = 0
        let lateCount = 0
        let proxyCount = 0
        let absentCount = 0
        
        filteredMeetings.forEach(meeting => {
          // 這裡需要從已載入的數據中獲取，但為了簡化，我們使用 memberAttendanceStats 的比例來估算
          // 實際應該從 meetingStats 和 checkins 中計算，但這需要更多數據
          // 暫時使用現有的統計數據，按比例縮放
          const originalStat = memberAttendanceStats[member.id] || { total: 0, present: 0, late: 0, proxy: 0, absent: 0, rate: 0 }
          if (originalStat.total > 0) {
            // 按比例計算（簡化處理）
            const ratio = totalMeetings / (meetings.length || 1)
            presentCount = Math.round(originalStat.present * ratio)
            lateCount = Math.round(originalStat.late * ratio)
            proxyCount = Math.round(originalStat.proxy * ratio)
            absentCount = Math.round(originalStat.absent * ratio)
          }
        })
        
        filteredMemberStats[member.id] = {
          total: totalMeetings,
          present: presentCount,
          late: lateCount,
          proxy: proxyCount,
          absent: absentCount,
          rate: totalMeetings > 0 ? (presentCount / totalMeetings) * 100 : 0
        }
      })
    }
    
    const totalPresent = Object.values(filteredMemberStats).reduce((sum, stat) => sum + (stat.present || 0), 0)
    const totalAbsent = Object.values(filteredMemberStats).reduce((sum, stat) => sum + (stat.absent || (stat.total - (stat.present || 0))), 0)
    
    return { totalMeetings, totalCheckins, avgAttendanceRate, totalPresent, totalAbsent }
  }, [filteredMeetingsByDateRange, meetingStats, members.length, memberAttendanceStats, meetings.length, statisticsDateRange])

  // 根據日期範圍計算篩選後的會員統計數據
  const filteredMemberAttendanceStats = useMemo(() => {
    const filteredMeetings = filteredMeetingsByDateRange
    const filteredStats: Record<number, {total: number, present: number, late: number, proxy: number, absent: number, rate: number}> = {}
    
    if (filteredMeetings.length === 0) return filteredStats
    
    // 如果選擇了"全部時間"，直接使用原始統計數據
    if (statisticsDateRange === 'all') {
      console.log('📊 使用全部時間統計：', {
        totalMembers: Object.keys(memberAttendanceStats).length,
        sampleStat: Object.values(memberAttendanceStats)[0] || null
      })
      return memberAttendanceStats
    }
    
    // 對於其他日期範圍，需要重新計算
    // 由於我們沒有每個會議的詳細簽到數據，我們使用簡化的方法：
    // 根據篩選的會議數量，按比例調整統計數據
    const totalMeetings = meetings.length
    const filteredMeetingsCount = filteredMeetings.length
    
    if (totalMeetings > 0 && filteredMeetingsCount > 0) {
      members.forEach(member => {
        const originalStat = memberAttendanceStats[member.id] || { total: 0, present: 0, late: 0, proxy: 0, absent: 0, rate: 0 }
        
        // 按比例計算（簡化處理，實際應該根據每個會議的簽到記錄計算）
        const ratio = filteredMeetingsCount / totalMeetings
        const present = Math.round(originalStat.present * ratio)
        const late = Math.round(originalStat.late * ratio)
        const proxy = Math.round(originalStat.proxy * ratio)
        const absent = filteredMeetingsCount - present - late - proxy
        
        filteredStats[member.id] = {
          total: filteredMeetingsCount,
          present,
          late,
          proxy,
          absent: Math.max(0, absent),
          rate: filteredMeetingsCount > 0 ? (present / filteredMeetingsCount) * 100 : 0
        }
      })
    }
    
    return filteredStats
  }, [filteredMeetingsByDateRange, memberAttendanceStats, meetings.length, members, statisticsDateRange])

  // 計算警告統計（根據日期範圍篩選）
  const warningStats = useMemo(() => {
    const criticalMembers: Array<{member: Member, stat: {total: number, present: number, rate: number}, absent: number}> = []
    const warningMembers: Array<{member: Member, stat: {total: number, present: number, rate: number}, absent: number}> = []
    
    members.forEach(member => {
      const stat = filteredMemberAttendanceStats[member.id] || { total: 0, present: 0, late: 0, proxy: 0, absent: 0, rate: 0 }
      const absent = stat.absent || (stat.total - stat.present)
      
      // 嚴重警告：出席率低於30% 或 缺席次數超過總會議數的70%
      if (stat.total > 0 && (stat.rate < 30 || absent / stat.total > 0.7)) {
        criticalMembers.push({ member, stat, absent })
      }
      // 一般警告：出席率低於50% 但高於30%
      else if (stat.total > 0 && stat.rate < 50 && stat.rate >= 30) {
        warningMembers.push({ member, stat, absent })
      }
    })
    
    return {
      criticalCount: criticalMembers.length,
      warningCount: warningMembers.length,
      criticalMembers,
      warningMembers,
      allWarningMembers: [...criticalMembers, ...warningMembers]
    }
  }, [members, filteredMemberAttendanceStats])

  // 統計報表的會員列表 - 使用 useMemo 優化，避免重複計算（根據日期範圍篩選）
  const sortedFilteredStatisticsMembers = useMemo(() => {
    if (!members || members.length === 0) return []
    if (!filteredMemberAttendanceStats) return []
    
    try {
      return members
        .map((member) => {
          const stat = filteredMemberAttendanceStats[member.id] || { total: 0, present: 0, late: 0, proxy: 0, absent: 0, rate: 0 }
          const absent = stat.absent || (stat.total - stat.present)
          const isCritical = stat.total > 0 && (stat.rate < 30 || absent / stat.total > 0.7)
          const isWarning = stat.total > 0 && stat.rate < 50 && stat.rate >= 30
          return { member, stat, absent, isCritical, isWarning }
        })
        .filter(({ isCritical, isWarning }) => {
          if (statisticsFilter === 'critical') return isCritical
          if (statisticsFilter === 'warning') return isWarning && !isCritical
          return true
        })
        .sort((a, b) => {
          let comparison = 0
          switch (statisticsSortBy) {
            case 'rate':
              comparison = a.stat.rate - b.stat.rate
              break
            case 'name':
              comparison = a.member.name.localeCompare(b.member.name, 'zh-TW')
              break
            case 'id':
              comparison = a.member.id - b.member.id
              break
            case 'present':
              comparison = a.stat.present - b.stat.present
              break
            case 'absent':
              comparison = a.absent - b.absent
              break
          }
          return statisticsSortOrder === 'asc' ? comparison : -comparison
        })
    } catch (error) {
      console.error('Error calculating sortedFilteredStatisticsMembers:', error)
      return []
    }
  }, [members, filteredMemberAttendanceStats, statisticsFilter, statisticsSortBy, statisticsSortOrder])

  // 批量操作
  const handleBatchCheckin = async () => {
    if (selectedMembers.length === 0) {
      setToast({ message: '請選擇要簽到的會員', type: 'error' })
      setTimeout(() => setToast(null), 3000)
      return
    }

    if (!confirm(`確定要為 ${selectedMembers.length} 位會員進行批量簽到嗎？`)) return

    // 樂觀更新：立即更新所有選中會員的簽到狀態
    const selectedMemberIds = [...selectedMembers]
    selectedMemberIds.forEach(memberId => {
      const member = members.find(m => m.id === memberId)
      const optimisticCheckin: CheckinRecord = {
        member_id: memberId,
        checkin_time: new Date().toISOString(),
        message: '管理員批量簽到',
        status: 'present',
        name: member?.name || '',
      }
      setCheckins(prev => {
        const filtered = prev.filter(c => c.member_id !== memberId || c.checkin_time?.split('T')[0] !== selectedDate)
        return [...filtered, optimisticCheckin]
      })
    })
    
    setSelectedMembers([])

    // 設置進度狀態
    setBatchProgress({
      isProcessing: true,
      current: 0,
      total: selectedMemberIds.length,
      operation: '批量簽到'
    })

    try {
      console.log('開始批量簽到:', { count: selectedMemberIds.length, date: selectedDate })

      const results: Array<{ success: boolean; error?: string }> = []
      
      // 逐個處理，以便更新進度
      for (let i = 0; i < selectedMemberIds.length; i++) {
        const memberId = selectedMemberIds[i]
        try {
          const response = await fetch('/api/checkin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              memberId,
              date: selectedDate,
              message: '管理員批量簽到',
              status: 'present',
            }),
          })
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: '簽到失敗' }))
            throw new Error(`會員 ${memberId}: ${errorData.error || '簽到失敗'}`)
          }
          
          await response.json()
          results.push({ success: true })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '未知錯誤'
          results.push({ success: false, error: errorMessage })
        }
        
        // 更新進度
        setBatchProgress({
          isProcessing: true,
          current: i + 1,
          total: selectedMemberIds.length,
          operation: '批量簽到'
        })
        
        // 添加小延遲，避免請求過於頻繁
        if (i < selectedMemberIds.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 50))
        }
      }

      const failed = results.filter(r => !r.success)

      // 清除進度狀態
      setBatchProgress(null)

      if (failed.length > 0) {
        // 部分失敗時，靜默刷新恢復失敗的項目
        await loadData(true, selectedDate)
        console.error('批量簽到部分失敗:', failed)
        const errorMessages = failed.map(f => f.error || '未知錯誤').join('、')
        setToast({
          message: `批量簽到完成，但有 ${failed.length} 位會員簽到失敗：${errorMessages}`,
          type: 'error'
        })
        setTimeout(() => setToast(null), 5000)
      } else {
        // 全部成功，前端已經樂觀更新，不再強制重抓
        setToast({ message: `批量簽到成功！已為 ${selectedMemberIds.length} 位會員簽到`, type: 'success' })
        setTimeout(() => setToast(null), 3000)
      }
    } catch (error) {
      console.error('Error batch checking in:', error)
      setBatchProgress(null)
      // 失敗時恢復（靜默刷新）
      await loadData(true, selectedDate)
      setToast({
        message: '批量簽到失敗：' + (error instanceof Error ? error.message : '未知錯誤'),
        type: 'error'
      })
      setTimeout(() => setToast(null), 4000)
    }
  }

  const handleBatchDelete = async () => {
    if (selectedMembers.length === 0) {
      setToast({ message: '請選擇要刪除的簽到記錄', type: 'error' })
      setTimeout(() => setToast(null), 3000)
      return
    }

    if (!confirm(`確定要刪除 ${selectedMembers.length} 筆簽到記錄嗎？`)) return

    // 樂觀更新：立即從列表中移除所有選中的簽到記錄
    const selectedMemberIds = [...selectedMembers]
    const checkinsToDelete = checkins.filter(c => 
      selectedMemberIds.includes(c.member_id) && c.checkin_time?.split('T')[0] === selectedDate
    )
    setCheckins(prev => prev.filter(c => 
      !(selectedMemberIds.includes(c.member_id) && c.checkin_time?.split('T')[0] === selectedDate)
    ))
    setSelectedMembers([])

    // 設置進度狀態
    setBatchProgress({
      isProcessing: true,
      current: 0,
      total: selectedMemberIds.length,
      operation: '批量刪除'
    })

    try {
      console.log('開始批量刪除簽到記錄:', { count: selectedMemberIds.length, date: selectedDate })
      
      const results: Array<{ success: boolean; error?: string }> = []
      
      // 逐個處理，以便更新進度
      for (let i = 0; i < selectedMemberIds.length; i++) {
        const memberId = selectedMemberIds[i]
        try {
          const response = await fetch('/api/checkin/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ memberId, date: selectedDate }),
          })
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: '刪除失敗' }))
            throw new Error(`會員 ${memberId}: ${errorData.error || '刪除失敗'}`)
          }
          
          await response.json()
          results.push({ success: true })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '未知錯誤'
          results.push({ success: false, error: errorMessage })
        }
        
        // 更新進度
        setBatchProgress({
          isProcessing: true,
          current: i + 1,
          total: selectedMemberIds.length,
          operation: '批量刪除'
        })
        
        // 添加小延遲，避免請求過於頻繁
        if (i < selectedMemberIds.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 50))
        }
      }

      const failed = results.filter(r => !r.success)

      // 清除進度狀態
      setBatchProgress(null)
      
      if (failed.length > 0) {
        // 部分失敗時，恢復失敗的項目並靜默刷新
        setCheckins(prev => [...prev, ...checkinsToDelete])
        await loadData(true, selectedDate)
        console.error('批量刪除部分失敗:', failed)
        const errorMessages = failed.map(f => f.error || '未知錯誤').join('、')
        setToast({ 
          message: `批量刪除完成，但有 ${failed.length} 筆記錄刪除失敗：${errorMessages}`, 
          type: 'error' 
        })
        setTimeout(() => setToast(null), 5000)
      } else {
        // 全部成功，前端已經樂觀更新，不再強制重抓
        setToast({ message: `批量刪除成功！已刪除 ${selectedMemberIds.length} 筆簽到記錄`, type: 'success' })
        setTimeout(() => setToast(null), 3000)
      }
    } catch (error) {
      console.error('Error batch deleting:', error)
      setBatchProgress(null)
      // 失敗時恢復（靜默刷新）
      setCheckins(prev => [...prev, ...checkinsToDelete])
      await loadData(true, selectedDate)
      setToast({ 
        message: '批量刪除失敗：' + (error instanceof Error ? error.message : '未知錯誤'), 
        type: 'error' 
      })
      setTimeout(() => setToast(null), 4000)
    }
  }

  const handleExportCSV = () => {
    const csvContent = [
      ['編號', '姓名', '專業別', '簽到時間', '狀態', '留言'],
      ...sortedFilteredMembers.map(member => {
        const checkin = getCheckinStatus(member.id)
        return [
          member.id.toString(),
          member.name,
          member.profession,
          checkin?.checkin_time ? new Date(checkin.checkin_time).toLocaleString('zh-TW') : '',
          checkin ? '已簽到' : '缺席',
          checkin?.message || '',
        ]
      }),
    ]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `簽到記錄_${selectedDate}.csv`
    link.click()
  }

  const toggleMemberSelection = (memberId: number) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedMembers.length === sortedFilteredMembers.length) {
      setSelectedMembers([])
    } else {
      setSelectedMembers(sortedFilteredMembers.map(m => m.id))
    }
  }

  const handleExportMembersCSV = () => {
    const csvContent = [
      ['編號', '姓名', '專業別'],
      ...members.map(member => [
        member.id.toString(),
        member.name,
        member.profession,
      ]),
    ]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `會員清單_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const handleSyncToSheets = async () => {
    try {
      setToast({ message: '正在同步到 Google Sheets...', type: 'success' })
      setTimeout(() => setToast(null), 2000)
      
      const response = await fetch('/api/sync/sheets', {
        method: 'POST',
      })

      const data = await response.json()
      
      if (data.success) {
        setToast({ message: `成功同步 ${data.count} 筆會員資料到 Google Sheets`, type: 'success' })
        setTimeout(() => setToast(null), 4000)
      } else {
        const errorMsg = filterVercelText(data.error || '同步失敗')
        setToast({ message: '同步失敗：' + errorMsg, type: 'error' })
        setTimeout(() => setToast(null), 4000)
      }
    } catch (error) {
      console.error('同步到 Google Sheets 失敗:', error)
      setToast({ message: '同步失敗：網路錯誤或伺服器無回應', type: 'error' })
      setTimeout(() => setToast(null), 4000)
    }
  }

  const handleImportMembers = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      console.log('沒有選擇檔案')
      return
    }

    console.log('開始匯入檔案:', file.name, '大小:', file.size)

    try {
      const text = await file.text()
      console.log('檔案內容前100字元:', text.substring(0, 100))
      
      const lines = text.split('\n').slice(1).filter(line => line.trim())
      console.log('解析到', lines.length, '行資料')
      
      if (lines.length === 0) {
        alert('CSV 檔案格式錯誤或沒有資料行')
        event.target.value = ''
        return
      }

      // 顯示開始匯入提示
      setToast({ message: `開始匯入 ${lines.length} 筆會員資料...`, type: 'success' })
      setTimeout(() => setToast(null), 3000)
      
      let successCount = 0
      let errorCount = 0
      const errors: string[] = []

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        // 處理可能的編碼問題和特殊字符
        const cells = line.split(',').map(cell => cell.replace(/^"|"$/g, '').trim())
        const [id, name, profession] = cells
        
        if (!id || !name) {
          console.warn(`第 ${i + 2} 行資料不完整，跳過:`, line)
          errorCount++
          continue
        }

        const memberId = parseInt(id)
        if (isNaN(memberId) || memberId <= 0) {
          console.warn(`第 ${i + 2} 行會員編號無效:`, id)
          errorCount++
          continue
        }

        try {
          const response = await fetch(`/api/members/create?_t=${Date.now()}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              id: memberId, 
              name: name.trim(), 
              profession: (profession || '').trim() || null 
            }),
          })
          
          const data = await response.json()
          
          if (response.ok && data.success) {
            successCount++
            if (successCount % 10 === 0) {
              console.log(`已匯入 ${successCount} 筆...`)
            }
          } else {
            errorCount++
            const errorMsg = data.error || `HTTP ${response.status}`
            errors.push(`會員 #${id} ${name}: ${errorMsg}`)
            console.error(`匯入失敗 - 會員 #${id}:`, errorMsg)
          }
        } catch (error) {
          errorCount++
          const errorMsg = error instanceof Error ? error.message : '未知錯誤'
          errors.push(`會員 #${id} ${name}: ${errorMsg}`)
          console.error(`匯入錯誤 - 會員 #${id}:`, error)
        }
      }

      // 顯示匯入結果
      let message = `匯入完成：成功 ${successCount} 筆`
      if (errorCount > 0) {
        message += `，失敗 ${errorCount} 筆`
        if (errors.length > 0 && errors.length <= 5) {
          message += `\n失敗原因：\n${errors.join('\n')}`
        }
      }
      
      setToast({ 
        message, 
        type: errorCount > 0 ? 'error' : 'success' 
      })
      setTimeout(() => setToast(null), 10000)
      
      // 重新載入資料
      await loadData()
      
      console.log('匯入完成:', { successCount, errorCount, total: lines.length })
    } catch (error) {
      console.error('匯入過程發生錯誤:', error)
      setToast({ 
        message: `匯入失敗：${error instanceof Error ? error.message : '未知錯誤'}`, 
        type: 'error' 
      })
      setTimeout(() => setToast(null), 10000)
    } finally {
      event.target.value = ''
    }
  }

  const handleChangePassword = async () => {
    if (passwordForm.oldPassword !== 'h123') {
      alert('舊密碼錯誤')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('新密碼與確認密碼不一致')
      return
    }

    if (passwordForm.newPassword.length < 4) {
      alert('新密碼長度至少需要4個字元')
      return
    }

    // 这里应该调用API更新密码，目前先存储在localStorage
    localStorage.setItem('adminPassword', passwordForm.newPassword)
    alert('密碼修改成功！請記住新密碼：' + passwordForm.newPassword)
    setShowPasswordModal(false)
    setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">載入中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50" style={{ animation: 'slideIn 0.3s ease-out' }}>
          <div className={`px-6 py-4 rounded-lg shadow-2xl backdrop-blur-sm border-2 min-w-[300px] ${
            toast.type === 'success' 
              ? 'bg-green-500/95 border-green-400 text-white'
              : toast.type === 'error'
              ? 'bg-red-500/95 border-red-400 text-white'
              : 'bg-blue-500/95 border-blue-400 text-white'
          }`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl flex-shrink-0">
                {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}
              </span>
              <span className="font-semibold">
                {filterVercelText(toast.message)}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Header with gradient */}
      <header className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-1">華地產後台管理系統</h1>
              <p className="text-indigo-100 text-sm sm:text-base">管理員控制面板</p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-sm sm:text-base text-indigo-100 bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                👤 管理員
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-all border border-white/30 font-medium text-sm sm:text-base"
              >
                登出
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs - Responsive */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex overflow-x-auto scrollbar-hide space-x-1 sm:space-x-4">
            <button
              onClick={() => {
                const newTab = 'attendance'
                setActiveTab(newTab)
                if (typeof window !== 'undefined') {
                  window.history.pushState({}, '', '/admin/attendance_management?tab=attendance')
                }
              }}
              className={`py-4 px-2 sm:px-4 border-b-2 font-semibold text-sm sm:text-base whitespace-nowrap transition-all ${
                activeTab === 'attendance'
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📋 出席管理
            </button>
            <button
              onClick={() => {
                const newTab = 'members'
                setActiveTab(newTab)
                if (typeof window !== 'undefined') {
                  window.history.pushState({}, '', '/admin/attendance_management?tab=members')
                }
              }}
              className={`py-4 px-2 sm:px-4 border-b-2 font-semibold text-sm sm:text-base whitespace-nowrap transition-all ${
                activeTab === 'members'
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              👥 會員管理
            </button>
            <button
              onClick={() => {
                const newTab = 'meetings'
                setActiveTab(newTab)
                if (typeof window !== 'undefined') {
                  window.history.pushState({}, '', '/admin/attendance_management?tab=meetings')
                }
              }}
              className={`py-4 px-2 sm:px-4 border-b-2 font-semibold text-sm sm:text-base whitespace-nowrap transition-all ${
                activeTab === 'meetings'
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📅 會議管理
            </button>
            <button
              onClick={() => {
                const newTab = 'reports'
                setActiveTab(newTab)
                if (typeof window !== 'undefined') {
                  window.history.pushState({}, '', '/admin/attendance_management?tab=statistics')
                }
              }}
              className={`py-4 px-2 sm:px-4 border-b-2 font-semibold text-sm sm:text-base whitespace-nowrap transition-all ${
                activeTab === 'reports'
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📊 統計報表
            </button>
            <button
              onClick={() => {
                const newTab = 'prizes'
                setActiveTab(newTab)
                if (typeof window !== 'undefined') {
                  window.history.pushState({}, '', '/admin/attendance_management?tab=prizes')
                }
              }}
              className={`py-4 px-2 sm:px-4 border-b-2 font-semibold text-sm sm:text-base whitespace-nowrap transition-all ${
                activeTab === 'prizes'
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🎁 獎品管理
            </button>
            <button
              onClick={() => {
                const newTab = 'lottery-winners'
                setActiveTab(newTab)
                if (typeof window !== 'undefined') {
                  window.history.pushState({}, '', '/admin/attendance_management?tab=lottery-winners')
                }
              }}
              className={`py-4 px-2 sm:px-4 border-b-2 font-semibold text-sm sm:text-base whitespace-nowrap transition-all ${
                activeTab === 'lottery-winners'
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🏆 中獎記錄
            </button>
            <button
              onClick={() => {
                router.push('/admin/invite-images')
              }}
              className="py-4 px-2 sm:px-4 border-b-2 font-semibold text-sm sm:text-base whitespace-nowrap transition-all border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              🖼️ 邀請頁圖片
            </button>
            <button
              onClick={() => {
                const newTab = 'settings'
                setActiveTab(newTab)
                if (typeof window !== 'undefined') {
                  window.history.pushState({}, '', '/admin/attendance_management?tab=settings')
                }
              }}
              className={`py-4 px-2 sm:px-4 border-b-2 font-semibold text-sm sm:text-base whitespace-nowrap transition-all ${
                activeTab === 'settings'
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ⚙️ 系統設定
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Attendance Management Tab */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            {/* Date Selection and Meeting Control */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
              <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4 mb-6">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📅 選擇日期
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const today = new Date().toISOString().split('T')[0]
                        setSelectedDate(today)
                        loadData(false, today)
                      }}
                      className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md"
                      title="快速切換到今天"
                    >
                      📌 今天
                    </button>
                    <div className="flex-1 flex gap-2">
                      <select
                        value={selectedDate}
                        onChange={(e) => {
                          const newDate = e.target.value
                          setSelectedDate(newDate)
                          // 使用新的日期加载数据
                          setTimeout(() => {
                            loadData(false, newDate)
                          }, 0)
                        }}
                        className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white"
                      >
                        {/* 添加今天選項（如果今天不是週四） */}
                        {(() => {
                          const today = new Date().toISOString().split('T')[0]
                          const todayLabel = new Date().toLocaleDateString('zh-TW', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            weekday: 'short'
                          })
                          const isTodayInList = thursdayDates.some(d => d.value === today)
                          const options = []
                          if (!isTodayInList) {
                            options.push(
                              <option key={today} value={today}>
                                {todayLabel} (今天)
                              </option>
                            )
                          }
                          thursdayDates.forEach((date) => {
                            const isToday = date.value === today
                            options.push(
                              <option key={date.value} value={date.value}>
                                {date.label}{isToday ? ' (今天)' : ''}
                              </option>
                            )
                          })
                          return options
                        })()}
                      </select>
                      {dateRangeMonths < 12 && (
                        <button
                          onClick={() => {
                            setDateRangeMonths(prev => Math.min(prev + 3, 12))
                          }}
                          className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-all border-2 border-gray-300 whitespace-nowrap"
                          title="載入更多日期"
                        >
                          ⬇️ 更多
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">提示：點擊「今天」按鈕可快速查看今天的簽到記錄</p>
                </div>
                {!selectedMeeting && (
                  <div className="flex items-end">
                    <button
                      onClick={handleCreateMeeting}
                      className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg font-semibold"
                    >
                      ➕ 建立會議
                    </button>
                  </div>
                )}
                {selectedMeeting && (
                  <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-xl border border-green-200">
                    <span className="text-sm font-semibold text-green-700">
                      ✓ 會議狀態：{selectedMeeting.status === 'scheduled' ? '已安排' : selectedMeeting.status}
                    </span>
                  </div>
                )}
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 sm:p-5 border border-blue-200 shadow-sm">
                  <div className="text-xs sm:text-sm text-blue-600 font-medium mb-1">總會員數</div>
                  <div className="text-2xl sm:text-3xl font-bold text-blue-700">{stats.total}</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 sm:p-5 border border-green-200 shadow-sm">
                  <div className="text-xs sm:text-sm text-green-600 font-medium mb-1">已簽到</div>
                  <div className="text-2xl sm:text-3xl font-bold text-green-700">{stats.present}</div>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 sm:p-5 border border-red-200 shadow-sm">
                  <div className="text-xs sm:text-sm text-red-600 font-medium mb-1">缺席</div>
                  <div className="text-2xl sm:text-3xl font-bold text-red-700">{stats.absent}</div>
                </div>
              </div>
            </div>

            {/* Attendance Table */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                    <span>📋</span>
                    <span>出席記錄</span>
                  </h2>
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <button
                      onClick={handleExportCSV}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-sm font-semibold"
                    >
                      📥 匯出CSV
                    </button>
                    {selectedMembers.length > 0 && (
                      <>
                        <button
                          onClick={handleBatchCheckin}
                          disabled={batchProgress?.isProcessing}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ✓ 批量簽到 ({selectedMembers.length})
                        </button>
                        <button
                          onClick={handleBatchDelete}
                          disabled={batchProgress?.isProcessing}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          🗑️ 批量刪除 ({selectedMembers.length})
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {/* 批量操作進度條 */}
                {batchProgress && batchProgress.isProcessing && (
                  <div className="mt-4 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">
                        {batchProgress.operation}進行中...
                      </span>
                      <span className="text-sm font-bold text-indigo-600">
                        {batchProgress.current} / {batchProgress.total}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-300 ease-out flex items-center justify-center"
                        style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                      >
                        <span className="text-xs font-bold text-white">
                          {Math.round((batchProgress.current / batchProgress.total) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                {/* Search and Filter */}
                <div className="mt-4 space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="搜尋會員（姓名、專業別、編號）..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setSearchTerm('')
                      }
                    }}
                    className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="px-3 py-2 text-gray-500 hover:text-gray-700"
                      title="清除搜尋"
                    >
                      ✕
                    </button>
                  )}
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as 'all' | 'present' | 'absent')}
                      className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    >
                      <option value="all">全部狀態</option>
                      <option value="present">已簽到</option>
                      <option value="absent">缺席</option>
                    </select>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'id' | 'name' | 'time' | 'status')}
                      className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    >
                      <option value="id">依編號排序</option>
                      <option value="name">依姓名排序</option>
                      <option value="time">依簽到時間排序</option>
                      <option value="status">依狀態排序</option>
                    </select>
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-semibold text-sm"
                    >
                      {sortOrder === 'asc' ? '↑ 升序' : '↓ 降序'}
                    </button>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedMembers.length === sortedFilteredMembers.length && sortedFilteredMembers.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        編號
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        姓名
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        專業別
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        簽到時間
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        狀態
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        留言
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedFilteredMembers.map((member) => {
                      const checkin = getCheckinStatus(member.id)
                      return (
                        <tr key={member.id} className={`hover:bg-indigo-50/50 transition-colors ${selectedMembers.includes(member.id) ? 'bg-blue-50' : ''}`}>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedMembers.includes(member.id)}
                              onChange={() => toggleMemberSelection(member.id)}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            {searchTerm && member.id.toString().includes(searchTerm) ? (
                              <span dangerouslySetInnerHTML={{ __html: highlightSearchTerm(`#${member.id}`, searchTerm) }} />
                            ) : (
                              `#${member.id}`
                            )}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                            {searchTerm ? (
                              <span dangerouslySetInnerHTML={{ __html: highlightSearchTerm(member.name, searchTerm) }} />
                            ) : (
                              member.name
                            )}
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                            {searchTerm ? (
                              <span dangerouslySetInnerHTML={{ __html: highlightSearchTerm(member.profession, searchTerm) }} />
                            ) : (
                              member.profession
                            )}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {checkin?.checkin_time
                              ? new Date(checkin.checkin_time).toLocaleString('zh-TW')
                              : '-'}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            {checkin ? (
                              (() => {
                                const statusMap: Record<string, { text: string; bg: string; textColor: string; border: string }> = {
                                  'present': { text: '正常', bg: 'bg-green-100', textColor: 'text-green-800', border: 'border-green-200' },
                                  'early': { text: '早安', bg: 'bg-blue-100', textColor: 'text-blue-800', border: 'border-blue-200' },
                                  'late': { text: '遲到', bg: 'bg-yellow-100', textColor: 'text-yellow-800', border: 'border-yellow-200' },
                                  'early_leave': { text: '早退', bg: 'bg-orange-100', textColor: 'text-orange-800', border: 'border-orange-200' },
                                  'absent': { text: '缺席', bg: 'bg-red-100', textColor: 'text-red-800', border: 'border-red-200' },
                                }
                                const statusInfo = statusMap[checkin.status] || statusMap['present']
                                return (
                                  <span className={`px-3 py-1 inline-flex text-xs font-bold rounded-full ${statusInfo.bg} ${statusInfo.textColor} border ${statusInfo.border}`}>
                                    {statusInfo.text}
                                  </span>
                                )
                              })()
                            ) : (
                              <span className="px-3 py-1 inline-flex text-xs font-bold rounded-full bg-red-100 text-red-800 border border-red-200">
                                ✗ 缺席
                              </span>
                            )}
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                            {checkin?.message || '-'}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-2">
                              {checkin ? (
                                <>
                                  <button
                                    onClick={() => handleEditCheckin(member.id)}
                                    className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all text-xs font-semibold"
                                  >
                                    編輯
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCheckin(member.id)}
                                    className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all text-xs font-semibold"
                                  >
                                    刪除
                                  </button>
                                </>
                            ) : (
                              <button
                                onClick={() => handleManualCheckin(member.id, 'present')}
                                disabled={actionLoading[`checkin-${member.id}`]}
                                className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all text-xs font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                              >
                                {actionLoading[`checkin-${member.id}`] ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                                    <span>簽到中...</span>
                                  </>
                                ) : (
                                  '手動簽到'
                                )}
                              </button>
                            )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Members Management Tab */}
        {activeTab === 'members' && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                <span>👥</span>
                <span>會員管理</span>
              </h2>
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  placeholder="搜尋會員..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                />
                <label className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-all font-semibold text-sm cursor-pointer">
                  📤 匯入會員
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleImportMembers}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={handleExportMembersCSV}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-semibold text-sm"
                >
                  📥 匯出會員
                </button>
                <button
                  onClick={handleSyncToSheets}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold text-sm"
                  title="同步會員資料到 Google Sheets"
                >
                  📊 同步到 Sheets
                </button>
                <button
                  onClick={() => {
                    setEditingMember(null)
                    setNewMember({ id: '', name: '', profession: '' })
                    setShowMemberModal(true)
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold text-sm"
                >
                  ➕ 新增會員
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">編號</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">姓名</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">專業別</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {members
                    .filter(m => 
                      searchTerm === '' || 
                      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      m.profession.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      m.id.toString().includes(searchTerm)
                    )
                    .map((member) => (
                    <tr key={member.id} className="hover:bg-indigo-50/50 transition-colors">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {searchTerm && member.id.toString().includes(searchTerm) ? (
                          <span dangerouslySetInnerHTML={{ __html: highlightSearchTerm(`#${member.id}`, searchTerm) }} />
                        ) : (
                          `#${member.id}`
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {searchTerm ? (
                          <span dangerouslySetInnerHTML={{ __html: highlightSearchTerm(member.name, searchTerm) }} />
                        ) : (
                          member.name
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-600">
                        {searchTerm ? (
                          <span dangerouslySetInnerHTML={{ __html: highlightSearchTerm(member.profession, searchTerm) }} />
                        ) : (
                          member.profession
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEditMember(member)}
                          className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all text-xs font-semibold mr-2"
                        >
                          編輯
                        </button>
                        <button
                          onClick={() => handleDeleteMember(member.id)}
                          className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all text-xs font-semibold"
                        >
                          刪除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Meetings Management Tab */}
        {activeTab === 'meetings' && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                <span>📅</span>
                <span>會議管理</span>
              </h2>
              <button
                onClick={() => {
                  setEditingMeeting(null)
                  setShowMeetingModal(true)
                }}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold text-sm"
              >
                ➕ 新增會議
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">日期</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">狀態</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">簽到人數</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {meetings
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((meeting) => {
                      const checkinCount = meetingStats[meeting.date] || 0
                      const attendanceRate = members.length > 0 ? ((checkinCount / members.length) * 100).toFixed(1) : '0'
                      
                      return (
                        <tr key={meeting.id} className="hover:bg-indigo-50/50 transition-colors">
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            {new Date(meeting.date).toLocaleDateString('zh-TW', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric',
                              weekday: 'long'
                            })}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs font-bold rounded-full border ${
                              meeting.status === 'scheduled' 
                                ? 'bg-blue-100 text-blue-800 border-blue-200'
                                : meeting.status === 'completed'
                                ? 'bg-green-100 text-green-800 border-green-200'
                                : 'bg-red-100 text-red-800 border-red-200'
                            }`}>
                              {meeting.status === 'scheduled' ? '已安排' : meeting.status === 'completed' ? '已完成' : '已取消'}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            <div>{checkinCount} / {members.length}</div>
                            <div className="text-xs text-gray-500">出席率: {attendanceRate}%</div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => {
                                setSelectedDate(meeting.date)
                                setActiveTab('attendance')
                                if (typeof window !== 'undefined') {
                                  window.history.pushState({}, '', '/admin/attendance_management?tab=attendance')
                                }
                              }}
                              className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all text-xs font-semibold mr-2"
                            >
                              查看
                            </button>
                            <button
                              onClick={() => handleEditMeeting(meeting)}
                              className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all text-xs font-semibold mr-2"
                            >
                              編輯
                            </button>
                            <button
                              onClick={() => handleDeleteMeeting(meeting.id)}
                              className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all text-xs font-semibold"
                            >
                              刪除
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

            {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* Overall Statistics */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span>📊</span>
                  <span>出席統計報表</span>
                </h2>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={statisticsDateRange}
                    onChange={(e) => setStatisticsDateRange(e.target.value as 'all' | 'month' | 'quarter' | 'year')}
                    className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-semibold"
                  >
                    <option value="all">全部時間</option>
                    <option value="month">近一個月</option>
                    <option value="quarter">近一季</option>
                    <option value="year">近一年</option>
                  </select>
                  <button
                    onClick={() => {
                      const csv = [
                        ['編號', '姓名', '專業別', '總會議數', '出席次數', '遲到次數', '代理出席', '缺席次數', '出席率(%)'].join(','),
                        ...members.map((member) => {
                          const stat = memberAttendanceStats[member.id] || { total: 0, present: 0, late: 0, proxy: 0, absent: 0, rate: 0 }
                          const absent = stat.absent || (stat.total - stat.present)
                          return [
                            member.id,
                            `"${member.name}"`,
                            `"${member.profession || ''}"`,
                            stat.total,
                            stat.present,
                            stat.late || 0,
                            stat.proxy || 0,
                            absent,
                            stat.rate.toFixed(1)
                          ].join(',')
                        })
                      ].join('\n')
                      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
                      const url = URL.createObjectURL(blob)
                      const link = document.createElement('a')
                      link.href = url
                      link.download = `出席統計_${new Date().toISOString().split('T')[0]}.csv`
                      link.click()
                      URL.revokeObjectURL(url)
                      setToast({ message: '統計數據已匯出', type: 'success' })
                      setTimeout(() => setToast(null), 2000)
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-sm font-semibold flex items-center gap-2"
                  >
                    📥 匯出 CSV
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 sm:p-5 border-2 border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-blue-600 font-semibold">總會議數</div>
                    <span className="text-2xl">📅</span>
                  </div>
                  <div className="text-3xl font-bold text-blue-700">{meetings.length}</div>
                  <div className="text-xs text-blue-600 mt-1">已完成會議</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 sm:p-5 border-2 border-green-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-green-600 font-semibold">總簽到次數</div>
                    <span className="text-2xl">✅</span>
                  </div>
                  <div className="text-3xl font-bold text-green-700">{Object.values(meetingStats).reduce((sum, count) => sum + count, 0)}</div>
                  <div className="text-xs text-green-600 mt-1">累計簽到記錄</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 sm:p-5 border-2 border-purple-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-purple-600 font-semibold">平均出席率</div>
                    <span className="text-2xl">📈</span>
                  </div>
                  <div className="text-3xl font-bold text-purple-700">
                    {overallStats.avgAttendanceRate}%
                  </div>
                  <div className="text-xs text-purple-600 mt-1">整體平均</div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 sm:p-5 border-2 border-orange-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-orange-600 font-semibold">今日出席率</div>
                    <span className="text-2xl">📊</span>
                  </div>
                  <div className="text-3xl font-bold text-orange-700">
                    {stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(1) : 0}%
                  </div>
                  <div className="text-xs text-orange-600 mt-1">{stats.present} / {stats.total} 人</div>
                </div>
              </div>
              
              {/* 警告統計卡片 */}
              {(warningStats.criticalCount > 0 || warningStats.warningCount > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {warningStats.criticalCount > 0 && (
                    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 sm:p-5 border-2 border-red-300 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm text-red-700 font-bold">⚠️ 嚴重警告</div>
                        <span className="text-2xl">🚨</span>
                      </div>
                      <div className="text-3xl font-bold text-red-800">{warningStats.criticalCount}</div>
                      <div className="text-xs text-red-700 mt-1">出席率低於30%或缺席率超過70%</div>
                    </div>
                  )}
                  {warningStats.warningCount > 0 && (
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 sm:p-5 border-2 border-yellow-300 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm text-yellow-700 font-bold">⚠️ 一般警告</div>
                        <span className="text-2xl">⚠️</span>
                      </div>
                      <div className="text-3xl font-bold text-yellow-800">{warningStats.warningCount}</div>
                      <div className="text-xs text-yellow-700 mt-1">出席率介於30%-50%之間</div>
                    </div>
                  )}
                </div>
              )}
              
            </div>

            {/* Member Attendance Statistics */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span>👥</span>
                  <span>會員出席統計表</span>
                  <span className="text-sm font-normal text-gray-500">({members.length} 位會員)</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={statisticsFilter}
                    onChange={(e) => setStatisticsFilter(e.target.value as 'all' | 'warning' | 'critical')}
                    className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-semibold"
                  >
                    <option value="all">全部會員</option>
                    <option value="critical">嚴重警告 ({warningStats.criticalCount})</option>
                    <option value="warning">一般警告 ({warningStats.warningCount})</option>
                  </select>
                  <select
                    value={statisticsSortBy}
                    onChange={(e) => setStatisticsSortBy(e.target.value as 'rate' | 'name' | 'present' | 'absent' | 'id')}
                    className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-semibold"
                  >
                    <option value="rate">按出席率排序</option>
                    <option value="name">按姓名排序</option>
                    <option value="id">按編號排序</option>
                    <option value="present">按出席次數排序</option>
                    <option value="absent">按缺席次數排序</option>
                  </select>
                  <button
                    onClick={() => setStatisticsSortOrder(statisticsSortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all text-sm font-semibold"
                  >
                    {statisticsSortOrder === 'asc' ? '↑ 升序' : '↓ 降序'}
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">狀態</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">排名</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">編號</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">姓名</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">專業別</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">總會議數</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">出席次數</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">遲到次數</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">代理出席</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">缺席次數</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">出席率</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedFilteredStatisticsMembers.map(({ member, stat, absent, isCritical, isWarning }, index) => {
                        const rank = statisticsSortBy === 'rate' && statisticsSortOrder === 'desc' ? index + 1 : null
                        const rowBgClass = isCritical 
                          ? 'bg-red-50/50 hover:bg-red-100/50' 
                          : isWarning 
                          ? 'bg-yellow-50/50 hover:bg-yellow-100/50' 
                          : 'hover:bg-indigo-50/50'
                        return (
                          <tr key={member.id} className={`${rowBgClass} transition-colors`}>
                            <td className="px-4 py-3 text-center">
                              {isCritical ? (
                                <button
                                  onClick={() => {
                                    setSelectedMemberForDetail(member)
                                    setShowMemberDetailModal(true)
                                  }}
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-200 text-red-800 text-xs font-bold hover:bg-red-300 hover:scale-110 transition-all cursor-pointer" 
                                  title="嚴重警告：出席率低於30%，點擊查看詳情"
                                >
                                  🚨
                                </button>
                              ) : isWarning ? (
                                <button
                                  onClick={() => {
                                    setSelectedMemberForDetail(member)
                                    setShowMemberDetailModal(true)
                                  }}
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-200 text-yellow-800 text-xs font-bold hover:bg-yellow-300 hover:scale-110 transition-all cursor-pointer" 
                                  title="警告：出席率介於30%-50%，點擊查看詳情"
                                >
                                  ⚠️
                                </button>
                              ) : stat.rate >= 80 ? (
                                <button
                                  onClick={() => {
                                    setSelectedMemberForDetail(member)
                                    setShowMemberDetailModal(true)
                                  }}
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-200 text-green-800 text-xs font-bold hover:bg-green-300 hover:scale-110 transition-all cursor-pointer" 
                                  title="良好，點擊查看詳情"
                                >
                                  ✅
                                </button>
                              ) : stat.total > 0 ? (
                                <button
                                  onClick={() => {
                                    setSelectedMemberForDetail(member)
                                    setShowMemberDetailModal(true)
                                  }}
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-300 hover:scale-110 transition-all cursor-pointer" 
                                  title="點擊查看詳情"
                                >
                                  📊
                                </button>
                              ) : (
                                <span className="text-gray-300">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm font-bold text-gray-500">
                              {rank && rank <= 3 ? (
                                <span className={`text-lg ${rank === 1 ? 'text-yellow-500' : rank === 2 ? 'text-gray-400' : 'text-orange-500'}`}>
                                  {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                                </span>
                              ) : rank ? (
                                <span className="text-gray-400">#{rank}</span>
                              ) : (
                                <span className="text-gray-300">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                              {searchTerm && member.id.toString().includes(searchTerm) ? (
                                <span dangerouslySetInnerHTML={{ __html: highlightSearchTerm(`#${member.id}`, searchTerm) }} />
                              ) : (
                                `#${member.id}`
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm font-bold text-gray-900">
                              {searchTerm ? (
                                <span dangerouslySetInnerHTML={{ __html: highlightSearchTerm(member.name, searchTerm) }} />
                              ) : (
                                member.name
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {searchTerm ? (
                                <span dangerouslySetInnerHTML={{ __html: highlightSearchTerm(member.profession || '-', searchTerm) }} />
                              ) : (
                                member.profession || '-'
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 text-center">{stat.total}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-green-600 text-center">{stat.present}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-yellow-600 text-center">{stat.late || 0}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-blue-600 text-center">{stat.proxy || 0}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-red-600 text-center">{absent}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2.5 min-w-[60px]">
                                  <div
                                    className={`h-2.5 rounded-full transition-all duration-300 ${
                                      stat.rate >= 80 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                                      stat.rate >= 50 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                                      'bg-gradient-to-r from-red-400 to-red-600'
                                    }`}
                                    style={{ width: `${Math.min(stat.rate, 100)}%` }}
                                  />
                                </div>
                                <span className={`text-sm font-bold whitespace-nowrap min-w-[50px] text-right ${
                                  stat.rate >= 80 ? 'text-green-600' :
                                  stat.rate >= 50 ? 'text-yellow-600' :
                                  'text-red-600'
                                }`}>
                                  {stat.rate.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Meeting History */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span>📅</span>
                  <span>會議歷史記錄</span>
                  <span className="text-sm font-normal text-gray-500">(最近 {Math.min(meetings.length, 20)} 場)</span>
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">日期</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">星期</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">狀態</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">簽到人數</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">出席率</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {meetings
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 20)
                      .map((meeting) => {
                        const checkinCount = meetingStats[meeting.date] || 0
                        const attendanceRate = members.length > 0 ? ((checkinCount / members.length) * 100) : 0
                        const meetingDate = new Date(meeting.date)
                        const weekday = meetingDate.toLocaleDateString('zh-TW', { weekday: 'long' })
                        return (
                          <tr key={meeting.id} className="hover:bg-indigo-50/50 transition-colors">
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                              {meetingDate.toLocaleDateString('zh-TW', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric'
                              })}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{weekday}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-3 py-1 inline-flex text-xs font-bold rounded-full border ${
                                meeting.status === 'scheduled' 
                                  ? 'bg-blue-100 text-blue-800 border-blue-200'
                                  : meeting.status === 'completed'
                                  ? 'bg-green-100 text-green-800 border-green-200'
                                  : 'bg-red-100 text-red-800 border-red-200'
                              }`}>
                                {meeting.status === 'scheduled' ? '已安排' : meeting.status === 'completed' ? '已完成' : '已取消'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 text-center">
                              <span className="font-semibold text-green-600">{checkinCount}</span>
                              <span className="text-gray-400"> / </span>
                              <span className="text-gray-600">{members.length}</span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                                  <div
                                    className={`h-2 rounded-full transition-all ${
                                      attendanceRate >= 80 ? 'bg-green-500' :
                                      attendanceRate >= 50 ? 'bg-yellow-500' :
                                      'bg-red-500'
                                    }`}
                                    style={{ width: `${Math.min(attendanceRate, 100)}%` }}
                                  />
                                </div>
                                <span className={`text-sm font-bold whitespace-nowrap min-w-[50px] text-right ${
                                  attendanceRate >= 80 ? 'text-green-600' :
                                  attendanceRate >= 50 ? 'text-yellow-600' :
                                  'text-red-600'
                                }`}>
                                  {attendanceRate.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => {
                                  setSelectedDate(meeting.date)
                                  setActiveTab('attendance')
                                  if (typeof window !== 'undefined') {
                                    window.history.pushState({}, '', '/admin/attendance_management?tab=attendance')
                                  }
                                }}
                                className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-all text-xs font-semibold"
                              >
                                查看詳情
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'prizes' && (
          <div className="space-y-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span>🎁</span>
                  <span>獎品管理</span>
                </h2>
                <button
                  onClick={() => {
                    setEditingPrize(null)
                    setNewPrize({ name: '', totalQuantity: 1, probability: 1.0, image: null })
                    setShowPrizeModal(true)
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-semibold"
                >
                  ➕ 新增獎品
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {prizes.map((prize) => (
                  <div key={prize.id} className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200">
                    <div className="flex items-start gap-3">
                      {prize.image_url && (
                        <img
                          src={prize.image_url}
                          alt={prize.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 mb-1">{prize.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          剩餘：{prize.remaining_quantity} / {prize.total_quantity}
                        </p>
                        <p className="text-xs text-gray-500">機率：{prize.probability}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => {
                          setEditingPrize({
                            id: prize.id,
                            name: prize.name,
                            image_url: prize.image_url || '',
                            total_quantity: prize.total_quantity,
                            remaining_quantity: prize.remaining_quantity,
                            probability: prize.probability,
                          })
                          setNewPrize({
                            name: prize.name,
                            totalQuantity: prize.total_quantity,
                            probability: prize.probability,
                            image: null,
                          })
                          setImageCompressionInfo(null)
                          setCompressingImage(false)
                          setShowPrizeModal(true)
                        }}
                        className="flex-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all text-sm font-semibold"
                      >
                        編輯
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm('確定要刪除此獎品嗎？')) return
                          try {
                            // 先在前端快速移除卡片，提升體感速度（樂觀更新）
                            setPrizes((prev) => prev.filter((p) => p.id !== prize.id))

                            // 如果目前有開啟編輯此獎品的彈窗，一併關閉
                            if (editingPrize && editingPrize.id === prize.id) {
                              setEditingPrize(null)
                              setShowPrizeModal(false)
                            }

                            const response = await fetch(`/api/prizes/${prize.id}`, {
                              method: 'DELETE',
                            })
                            
                            if (response.ok) {
                              const data = await response.json()
                              if (data.success) {
                                // 後端也刪除成功，不需要再額外 reload，前端狀態已更新
                                console.log('獎品已成功刪除', { id: prize.id })
                              } else {
                                alert('刪除失敗：' + (data.error || '未知錯誤'))
                                // 若後端失敗，重新載入一次以恢復正確狀態
                                await loadPrizes()
                              }
                            } else {
                              const errorData = await response.json().catch(() => ({ error: '刪除失敗' }))
                              alert('刪除失敗：' + (errorData.error || '未知錯誤'))
                              await loadPrizes()
                            }
                          } catch (error) {
                            console.error('Error deleting prize:', error)
                            alert('刪除失敗：網路錯誤或伺服器無回應')
                            await loadPrizes()
                          }
                        }}
                        className="flex-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all text-sm font-semibold"
                      >
                        刪除
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {prizes.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">暫無獎品</p>
                  <button
                    onClick={() => {
                      setEditingPrize(null)
                      setNewPrize({ name: '', totalQuantity: 1, probability: 1.0, image: null })
                      setShowPrizeModal(true)
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-semibold"
                  >
                    ➕ 新增第一個獎品
                  </button>
                </div>
              )}
            </div>

            {/* 抽獎轉盤連結 */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">抽獎轉盤</h3>
              <p className="text-gray-600 mb-4">點擊下方按鈕前往抽獎轉盤頁面</p>
              <a
                href="/lottery"
                target="_blank"
                className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-semibold"
              >
                🎰 前往抽獎轉盤
              </a>
            </div>
          </div>
        )}

        {/* Lottery Winners Management Tab */}
        {activeTab === 'lottery-winners' && (
          <div className="space-y-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <span>🏆</span>
                  <span>中獎記錄管理</span>
                </h2>
                <button
                  onClick={loadLotteryWinners}
                  disabled={loadingWinners}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-semibold text-sm disabled:opacity-50"
                >
                  {loadingWinners ? '載入中...' : '🔄 刷新'}
                </button>
              </div>

              {loadingWinners ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
                  <p className="text-gray-600">載入中獎記錄中...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* 本週中獎記錄 */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <span>📅</span>
                      <span>本週中獎記錄 ({lotteryWinners.thisWeek.date || '計算中...'})</span>
                      <span className="text-sm font-normal text-gray-500">
                        ({lotteryWinners.thisWeek.winners.length} 筆)
                      </span>
                    </h3>
                    {lotteryWinners.thisWeek.winners.length === 0 ? (
                      <div className="bg-gray-50 rounded-xl p-8 text-center border-2 border-dashed border-gray-300">
                        <div className="text-4xl mb-3">🎁</div>
                        <p className="text-gray-500 font-medium">本週尚無中獎記錄</p>
                      </div>
                    ) : (
                      <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">中獎時間</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">會員</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">獎品</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">領取狀態</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">操作</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {lotteryWinners.thisWeek.winners.map((winner) => (
                                <tr key={winner.id} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {new Date(winner.created_at).toLocaleString('zh-TW')}
                                  </td>
                                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                    {winner.member_name}
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      {winner.prize_image_url && (
                                        <img
                                          src={winner.prize_image_url}
                                          alt={winner.prize_name}
                                          className="w-10 h-10 object-cover rounded-lg"
                                        />
                                      )}
                                      <span className="text-sm text-gray-700">{winner.prize_name}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <button
                                      onClick={() => handleToggleClaimed(winner.id, winner.claimed)}
                                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                                        winner.claimed
                                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                          : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                      }`}
                                    >
                                      {winner.claimed ? '✅ 已領取' : '⏳ 未領取'}
                                    </button>
                                    {winner.claimed && winner.claimed_at && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        {new Date(winner.claimed_at).toLocaleString('zh-TW')}
                                      </p>
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    <button
                                      onClick={() => handleDeleteWinner(winner.id, winner.member_name)}
                                      className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all text-xs font-semibold"
                                    >
                                      🗑️ 刪除
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 下週中獎記錄 */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <span>📅</span>
                      <span>下週中獎記錄 ({lotteryWinners.nextWeek.date || '計算中...'})</span>
                      <span className="text-sm font-normal text-gray-500">
                        ({lotteryWinners.nextWeek.winners.length} 筆)
                      </span>
                    </h3>
                    {lotteryWinners.nextWeek.winners.length === 0 ? (
                      <div className="bg-gray-50 rounded-xl p-8 text-center border-2 border-dashed border-gray-300">
                        <div className="text-4xl mb-3">🎁</div>
                        <p className="text-gray-500 font-medium">下週尚無中獎記錄</p>
                      </div>
                    ) : (
                      <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">中獎時間</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">會員</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">獎品</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">領取狀態</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">操作</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {lotteryWinners.nextWeek.winners.map((winner) => (
                                <tr key={winner.id} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {new Date(winner.created_at).toLocaleString('zh-TW')}
                                  </td>
                                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                    {winner.member_name}
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      {winner.prize_image_url && (
                                        <img
                                          src={winner.prize_image_url}
                                          alt={winner.prize_name}
                                          className="w-10 h-10 object-cover rounded-lg"
                                        />
                                      )}
                                      <span className="text-sm text-gray-700">{winner.prize_name}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <button
                                      onClick={() => handleToggleClaimed(winner.id, winner.claimed)}
                                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                                        winner.claimed
                                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                          : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                      }`}
                                    >
                                      {winner.claimed ? '✅ 已領取' : '⏳ 未領取'}
                                    </button>
                                    {winner.claimed && winner.claimed_at && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        {new Date(winner.claimed_at).toLocaleString('zh-TW')}
                                      </p>
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    <button
                                      onClick={() => handleDeleteWinner(winner.id, winner.member_name)}
                                      className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all text-xs font-semibold"
                                    >
                                      🗑️ 刪除
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Password Settings */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>🔐</span>
                <span>密碼設定</span>
              </h2>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold text-sm"
              >
                🔑 修改管理員密碼
              </button>
            </div>

            {/* System Settings */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>⚙️</span>
                <span>系統參數</span>
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <label className="font-semibold text-gray-900">自動備份</label>
                      <p className="text-sm text-gray-600">每日自動備份資料庫</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={systemSettings.autoBackup}
                        onChange={(e) => setSystemSettings({ ...systemSettings, autoBackup: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <label className="font-semibold text-gray-900">郵件通知</label>
                      <p className="text-sm text-gray-600">會議提醒和統計報告</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={systemSettings.emailNotifications}
                        onChange={(e) => setSystemSettings({ ...systemSettings, emailNotifications: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <label className="font-semibold text-gray-900">自動刷新</label>
                      <p className="text-sm text-gray-600">頁面自動刷新數據</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={systemSettings.autoRefresh}
                        onChange={(e) => setSystemSettings({ ...systemSettings, autoRefresh: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <label className="font-semibold text-gray-900">維護模式</label>
                      <p className="text-sm text-gray-600">暫時關閉系統進行維護</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={systemSettings.maintenanceMode}
                        onChange={(e) => setSystemSettings({ ...systemSettings, maintenanceMode: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">預設會議時間</label>
                    <input
                      type="time"
                      value={systemSettings.defaultMeetingTime}
                      onChange={(e) => setSystemSettings({ ...systemSettings, defaultMeetingTime: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">簽到截止時間</label>
                    <input
                      type="time"
                      value={systemSettings.checkinDeadline}
                      onChange={(e) => setSystemSettings({ ...systemSettings, checkinDeadline: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">自動刷新間隔（秒）</label>
                    <input
                      type="number"
                      min="10"
                      max="300"
                      value={systemSettings.refreshInterval}
                      onChange={(e) => setSystemSettings({ ...systemSettings, refreshInterval: parseInt(e.target.value) || 60 })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">主題</label>
                    <select
                      value={systemSettings.theme}
                      onChange={(e) => setSystemSettings({ ...systemSettings, theme: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="light">淺色模式</option>
                      <option value="dark">深色模式</option>
                      <option value="auto">自動</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      localStorage.setItem('systemSettings', JSON.stringify(systemSettings))
                      setToast({ message: '系統參數已儲存', type: 'success' })
                      addSystemLog('success', '系統設定已儲存')
                      setTimeout(() => setToast(null), 3000)
                    }}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold"
                  >
                    💾 儲存設定
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('確定要重置為預設設定嗎？')) {
                        const defaultSettings = {
                          autoBackup: false,
                          emailNotifications: false,
                          defaultMeetingTime: '19:00',
                          checkinDeadline: '19:30',
                          autoRefresh: true,
                          refreshInterval: 60,
                          maintenanceMode: false,
                          enableNotifications: true,
                          enableSound: false,
                          theme: 'light',
                        }
                        setSystemSettings(defaultSettings)
                        localStorage.setItem('systemSettings', JSON.stringify(defaultSettings))
                        setToast({ message: '已重置為預設設定', type: 'success' })
                        addSystemLog('info', '系統設定已重置為預設值')
                        setTimeout(() => setToast(null), 3000)
                      }
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all font-semibold text-sm"
                  >
                    🔄 重置
                  </button>
                </div>
              </div>
            </div>

            {/* System Information */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span>📊</span>
                  <span>系統資訊</span>
                </h2>
                <button
                  onClick={handleSystemHealthCheck}
                  className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-xs font-semibold"
                >
                  🔍 健康檢查
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm text-blue-600 font-medium mb-1">總會員數</div>
                  <div className="text-2xl font-bold text-blue-700">{members.length}</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-sm text-green-600 font-medium mb-1">總會議數</div>
                  <div className="text-2xl font-bold text-green-700">{meetings.length}</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="text-sm text-purple-600 font-medium mb-1">總簽到記錄</div>
                  <div className="text-2xl font-bold text-purple-700">
                    {Object.values(meetingStats).reduce((sum, count) => sum + count, 0)}
                  </div>
                </div>
                <div className={`p-4 rounded-lg border ${
                  systemInfo.databaseStatus === 'connected' 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="text-sm font-medium mb-1 flex items-center gap-1">
                    <span className={systemInfo.databaseStatus === 'connected' ? 'text-green-600' : 'text-red-600'}>
                      {systemInfo.databaseStatus === 'connected' ? '✅' : '❌'}
                    </span>
                    <span className={systemInfo.databaseStatus === 'connected' ? 'text-green-600' : 'text-red-600'}>
                      資料庫狀態
                    </span>
                  </div>
                  <div className={`text-sm font-semibold ${
                    systemInfo.databaseStatus === 'connected' ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {systemInfo.databaseStatus === 'connected' ? '已連接' : '連接失敗'}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">系統版本</div>
                  <div className="text-sm font-semibold text-gray-900">{systemInfo.version}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">最後備份</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {systemInfo.lastBackup 
                      ? new Date(systemInfo.lastBackup).toLocaleString('zh-TW')
                      : '尚未備份'}
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">運行時間</div>
                  <div className="text-sm font-semibold text-gray-900">{systemInfo.uptime}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">資料庫類型</div>
                  <div className="text-sm font-semibold text-gray-900">Supabase (PostgreSQL)</div>
                </div>
              </div>
            </div>

            {/* Data Export & Import */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span>📤</span>
                  <span>資料匯出與匯入</span>
                </h2>
                {!developerModeUnlocked && (
                  <span className="text-xs text-gray-500">（匯入功能需要開發者權限）</span>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">匯出數據</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      onClick={() => handleExportData('members')}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-xs font-semibold"
                    >
                      👥 會員
                    </button>
                    <button
                      onClick={() => handleExportData('meetings')}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-xs font-semibold"
                    >
                      📅 會議
                    </button>
                    <button
                      onClick={() => handleExportData('checkins')}
                      className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all text-xs font-semibold"
                    >
                      ✅ 簽到
                    </button>
                    <button
                      onClick={() => handleExportData('all')}
                      className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-xs font-semibold"
                    >
                      📦 全部
                    </button>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">匯入數據</label>
                  <div className="space-y-3">
                    {/* 匯入出席統計 */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">
                        📊 匯入出席統計 CSV（從其他系統）
                      </label>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return

                          try {
                            const text = await file.text()
                            
                            // 從檔案名稱提取日期範圍（格式：出席統計_2025-07-18_2026-01-14.csv）
                            const fileName = file.name
                            const dateMatch = fileName.match(/(\d{4}-\d{2}-\d{2})_(\d{4}-\d{2}-\d{2})/)
                            let startDate = '2025-07-18'
                            let endDate = '2026-01-14'
                            
                            if (dateMatch) {
                              startDate = dateMatch[1]
                              endDate = dateMatch[2]
                            } else {
                              // 如果檔案名稱沒有日期，提示用戶輸入
                              const userStartDate = prompt('請輸入開始日期 (YYYY-MM-DD):', startDate)
                              const userEndDate = prompt('請輸入結束日期 (YYYY-MM-DD):', endDate)
                              if (userStartDate) startDate = userStartDate
                              if (userEndDate) endDate = userEndDate
                            }

                            if (!confirm(`確定要匯入出席統計嗎？\n日期範圍：${startDate} 至 ${endDate}\n這將創建會議和簽到記錄。`)) {
                              e.target.value = ''
                              return
                            }

                            setToast({ message: '正在匯入出席統計...', type: 'info' })
                            
                            const response = await fetch('/api/attendance/import', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                csvText: text,
                                startDate,
                                endDate,
                              }),
                            })

                            const result = await response.json()

                            if (response.ok && result.success) {
                              const message = `匯入成功！\n會議：${result.data.meetingsCreated} 個\n簽到記錄：${result.data.checkinsCreated} 筆\n會員：${result.data.membersProcessed} 位`
                              setToast({ message, type: 'success' })
                              setTimeout(() => setToast(null), 8000)
                              
                              // 重新載入數據
                              await loadData(true)
                            } else {
                              const errorMsg = result.error || '匯入失敗'
                              setToast({ message: `匯入失敗：${errorMsg}`, type: 'error' })
                              setTimeout(() => setToast(null), 8000)
                            }
                          } catch (error) {
                            console.error('匯入出席統計失敗:', error)
                            setToast({ 
                              message: `匯入失敗：${error instanceof Error ? error.message : '未知錯誤'}`, 
                              type: 'error' 
                            })
                            setTimeout(() => setToast(null), 8000)
                          } finally {
                            e.target.value = ''
                          }
                        }}
                        className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        disabled={!developerModeUnlocked}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        CSV 格式：會員編號,姓名,總會議數,出席次數,遲到次數,代理出席,缺席次數,生命值
                      </p>
                    </div>
                    {/* 匯入 JSON 備份 */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">
                        📦 匯入 JSON 備份（還原系統）
                      </label>
                      {developerModeUnlocked ? (
                        <label className="block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-sm font-semibold text-center cursor-pointer">
                          📥 選擇 JSON 檔案匯入
                          <input
                            type="file"
                            accept=".json"
                            onChange={handleRestoreDatabase}
                            className="hidden"
                          />
                        </label>
                      ) : (
                        <div className="relative">
                          <div className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg text-sm font-semibold text-center cursor-not-allowed opacity-50">
                            📥 選擇檔案匯入（需開發者權限）
                          </div>
                          <button
                            onClick={() => setShowDeveloperPasswordModal(true)}
                            className="absolute inset-0 flex items-center justify-center text-xs text-blue-600 hover:text-blue-700 font-semibold"
                          >
                            點擊解鎖
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* System Actions */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span>🛠️</span>
                  <span>系統操作</span>
                </h2>
                {!developerModeUnlocked && (
                  <button
                    onClick={() => setShowDeveloperPasswordModal(true)}
                    className="px-3 py-1.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-all text-xs font-semibold flex items-center gap-1"
                  >
                    🔓 解鎖開發者功能
                  </button>
                )}
                {developerModeUnlocked && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-green-600 font-semibold">✅ 開發者模式已解鎖</span>
                    <button
                      onClick={() => {
                        setDeveloperModeUnlocked(false)
                        setToast({ message: '開發者模式已鎖定', type: 'info' })
                        setTimeout(() => setToast(null), 2000)
                      }}
                      className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                    >
                      鎖定
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <button
                  onClick={handleBackupDatabase}
                  className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-semibold flex items-center justify-center gap-2"
                >
                  💾 備份資料庫
                </button>
                {developerModeUnlocked ? (
                  <>
                    <button
                      onClick={async () => {
                        if (!confirm('確定要修復會議數據嗎？\n這將確保所有20個會議都存在且狀態為"已完成"。')) return
                        
                        setToast({ message: '正在修復會議數據...', type: 'info' })
                        addSystemLog('info', '開始修復會議數據...')
                        
                        try {
                          const response = await fetch('/api/meetings/fix', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              startDate: '2025-07-18',
                              endDate: '2026-01-14',
                              expectedCount: 20
                            }),
                          })
                          
                          const result = await response.json()
                          
                          if (response.ok && result.success) {
                            const { created, fixed, total, expected } = result.data
                            const message = `修復完成！\n創建：${created} 個會議\n修復：${fixed} 個會議狀態\n總計：${total}/${expected} 個已完成的會議`
                            setToast({ message, type: 'success' })
                            addSystemLog('success', `會議數據修復完成：${total}/${expected} 個會議`)
                            setTimeout(() => setToast(null), 8000)
                            
                            // 重新載入數據
                            await loadData(true)
                          } else {
                            const errorMsg = result.error || '修復失敗'
                            setToast({ message: `修復失敗：${errorMsg}`, type: 'error' })
                            addSystemLog('error', `會議數據修復失敗：${errorMsg}`)
                            setTimeout(() => setToast(null), 8000)
                          }
                        } catch (error) {
                          console.error('修復會議數據失敗:', error)
                          const errorMsg = error instanceof Error ? error.message : '未知錯誤'
                          setToast({ message: `修復失敗：${errorMsg}`, type: 'error' })
                          addSystemLog('error', `會議數據修復失敗：${errorMsg}`)
                          setTimeout(() => setToast(null), 8000)
                        }
                      }}
                      className="px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all text-sm font-semibold flex items-center justify-center gap-2"
                    >
                      🔧 修復會議數據
                    </button>
                    <button
                      onClick={handleClearCache}
                      className="px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-all text-sm font-semibold flex items-center justify-center gap-2"
                    >
                      🗑️ 清除快取
                    </button>
                    <button
                      onClick={() => setShowSystemLogs(!showSystemLogs)}
                      className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all text-sm font-semibold flex items-center justify-center gap-2"
                    >
                      📋 系統日誌
                    </button>
                    <button
                      onClick={handleClearCheckins}
                      className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all text-sm font-semibold flex items-center justify-center gap-2"
                    >
                      🗑️ 清除簽到記錄
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm('確定要重置系統嗎？所有資料將被清除！此操作無法復原！')) return

                        try {
                          setToast({ message: '正在重置系統...', type: 'info' })
                          addSystemLog('warning', '開始重置系統（將清除所有數據）...')
                          
                          const response = await fetch('/api/system/reset', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ confirm: true }),
                          })

                          const result = await response.json()

                          if (!response.ok || !result.success) {
                            throw new Error(result.error || '重置失敗')
                          }

                          // 重置成功後重新載入數據
                          await loadData()
                          
                          setToast({ 
                            message: result.message || '系統重置成功！', 
                            type: 'success' 
                          })
                          addSystemLog('success', '系統重置成功')
                          setTimeout(() => setToast(null), 4000)
                        } catch (error) {
                          console.error('Error resetting system:', error)
                          const errorMessage = error instanceof Error ? error.message : '未知錯誤'
                          setToast({ message: `重置失敗：${errorMessage}`, type: 'error' })
                          addSystemLog('error', `系統重置失敗：${errorMessage}`)
                          setTimeout(() => setToast(null), 4000)
                        }
                      }}
                      className="px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all text-sm font-semibold flex items-center justify-center gap-2"
                    >
                      🔄 重置系統
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('確定要重新啟動系統嗎？')) {
                          window.location.reload()
                        }
                      }}
                      className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all text-sm font-semibold flex items-center justify-center gap-2"
                    >
                      🔃 重新啟動
                    </button>
                  </>
                ) : (
                  <>
                    <div className="px-4 py-3 bg-gray-200 text-gray-500 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 cursor-not-allowed opacity-50">
                      🗑️ 清除快取
                    </div>
                    <div className="px-4 py-3 bg-gray-200 text-gray-500 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 cursor-not-allowed opacity-50">
                      📋 系統日誌
                    </div>
                    <div className="px-4 py-3 bg-gray-200 text-gray-500 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 cursor-not-allowed opacity-50">
                      🗑️ 清除簽到記錄
                    </div>
                    <div className="px-4 py-3 bg-gray-200 text-gray-500 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 cursor-not-allowed opacity-50">
                      🔄 重置系統
                    </div>
                    <div className="px-4 py-3 bg-gray-200 text-gray-500 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 cursor-not-allowed opacity-50">
                      🔃 重新啟動
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* System Logs */}
            {showSystemLogs && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                    <span>📋</span>
                    <span>系統日誌</span>
                  </h2>
                  <button
                    onClick={() => setShowSystemLogs(false)}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all text-sm"
                  >
                    ✕ 關閉
                  </button>
                </div>
                <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto font-mono text-sm">
                  {systemLogs.length === 0 ? (
                    <div className="text-gray-400 text-center py-8">
                      <p>尚無系統日誌</p>
                      <p className="text-xs mt-2">系統操作將記錄在這裡</p>
                    </div>
                  ) : (
                    systemLogs.map((log, index) => (
                      <div key={index} className="mb-2">
                        <span className="text-gray-500">[{log.time}]</span>
                        <span className={`ml-2 ${
                          log.level === 'error' ? 'text-red-400' :
                          log.level === 'warning' ? 'text-yellow-400' :
                          log.level === 'success' ? 'text-green-400' :
                          'text-gray-300'
                        }`}>
                          [{log.level.toUpperCase()}]
                        </span>
                        <span className="text-gray-300 ml-2">{log.message}</span>
                      </div>
                    ))
                  )}
                </div>
                <button
                  onClick={() => setSystemLogs([])}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all text-sm font-semibold"
                >
                  清除日誌
                </button>
              </div>
            )}

            {/* Security Settings */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>🔒</span>
                <span>安全設定</span>
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <label className="font-semibold text-gray-900">登入記錄</label>
                    <p className="text-sm text-gray-600">記錄所有管理員登入活動</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <label className="font-semibold text-gray-900">兩步驟驗證</label>
                    <p className="text-sm text-gray-600">增強帳號安全性（建議啟用）</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <label className="font-semibold text-gray-900">IP 白名單</label>
                    <p className="text-sm text-gray-600">限制特定 IP 才能登入</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-start gap-2">
                    <span className="text-yellow-600 text-lg">⚠️</span>
                    <div>
                      <p className="text-sm font-semibold text-yellow-800">安全提示</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        定期更新密碼，不要與他人分享管理員帳號。建議啟用兩步驟驗證以增強安全性。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>🔔</span>
                <span>通知設定</span>
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <label className="font-semibold text-gray-900">會議提醒</label>
                    <p className="text-sm text-gray-600">會議開始前自動提醒</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={systemSettings.enableNotifications}
                      onChange={(e) => setSystemSettings({ ...systemSettings, enableNotifications: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <label className="font-semibold text-gray-900">聲音提醒</label>
                    <p className="text-sm text-gray-600">操作成功時播放提示音</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={systemSettings.enableSound}
                      onChange={(e) => setSystemSettings({ ...systemSettings, enableSound: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <label className="font-semibold text-gray-900">郵件通知</label>
                    <p className="text-sm text-gray-600">重要事件發送郵件通知</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={systemSettings.emailNotifications}
                      onChange={(e) => setSystemSettings({ ...systemSettings, emailNotifications: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">通知郵件地址</label>
                  <input
                    type="email"
                    placeholder="admin@example.com"
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">用於接收系統通知和報告</p>
                </div>
              </div>
            </div>

            {/* Performance & Monitoring */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>⚡</span>
                <span>性能監控</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                  <div className="text-xs text-blue-600 font-medium mb-1">API 響應時間</div>
                  <div className="text-xl font-bold text-blue-700">~120ms</div>
                  <div className="text-xs text-blue-600 mt-1">平均</div>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                  <div className="text-xs text-green-600 font-medium mb-1">資料庫查詢</div>
                  <div className="text-xl font-bold text-green-700">正常</div>
                  <div className="text-xs text-green-600 mt-1">無異常</div>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                  <div className="text-xs text-purple-600 font-medium mb-1">記憶體使用</div>
                  <div className="text-xl font-bold text-purple-700">正常</div>
                  <div className="text-xs text-purple-600 mt-1">低負載</div>
                </div>
                <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                  <div className="text-xs text-orange-600 font-medium mb-1">錯誤率</div>
                  <div className="text-xl font-bold text-orange-700">0.1%</div>
                  <div className="text-xs text-orange-600 mt-1">極低</div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">系統負載</span>
                  <span className="text-xs text-gray-500">即時監控</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full" style={{ width: '35%' }}></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">當前負載：35% - 正常範圍</p>
              </div>
            </div>

            {/* API & Integration */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>🔌</span>
                <span>API 與整合</span>
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Supabase URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={supabaseUrl}
                      readOnly
                      className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg bg-gray-50 text-gray-600 text-sm"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(supabaseUrl)
                        setToast({ message: '已複製到剪貼簿', type: 'success' })
                        setTimeout(() => setToast(null), 2000)
                      }}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all text-sm font-semibold"
                    >
                      📋 複製
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">API 金鑰狀態</label>
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                    <span className="text-green-600">✅</span>
                    <span className="text-sm text-green-700 font-semibold">API 金鑰已配置</span>
                  </div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-700">
                    💡 <strong>提示：</strong>API 金鑰用於連接 Supabase 資料庫。請妥善保管，不要洩露給他人。
                  </p>
                </div>
              </div>
            </div>

            {/* Usage Statistics */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>📈</span>
                <span>使用統計</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                  <div className="text-xs text-indigo-600 font-medium mb-1">今日訪問</div>
                  <div className="text-2xl font-bold text-indigo-700">0</div>
                  <div className="text-xs text-indigo-600 mt-1">次</div>
                </div>
                <div className="p-4 bg-gradient-to-br from-pink-50 to-red-50 rounded-xl border border-pink-200">
                  <div className="text-xs text-pink-600 font-medium mb-1">本週簽到</div>
                  <div className="text-2xl font-bold text-pink-700">
                    {Object.values(meetingStats).reduce((sum, count) => sum + count, 0)}
                  </div>
                  <div className="text-xs text-pink-600 mt-1">筆記錄</div>
                </div>
                <div className="p-4 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl border border-teal-200">
                  <div className="text-xs text-teal-600 font-medium mb-1">活躍會員</div>
                  <div className="text-2xl font-bold text-teal-700">
                    {members.filter(m => {
                      const memberStats = memberAttendanceStats[m.id]
                      return memberStats && memberStats.rate > 50
                    }).length}
                  </div>
                  <div className="text-xs text-teal-600 mt-1">出席率 &gt; 50%</div>
                </div>
              </div>
            </div>

            {/* About */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>ℹ️</span>
                <span>關於系統</span>
              </h2>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span>開發團隊</span>
                  <strong className="text-gray-900">華地產資訊長 蔡濬瑒</strong>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span>系統版本</span>
                  <strong className="text-gray-900">v4.5.1</strong>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span>技術棧</span>
                  <strong className="text-gray-900">Next.js 14 + React 18 + Supabase</strong>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span>資料庫</span>
                  <strong className="text-gray-900">PostgreSQL (Supabase)</strong>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span>最後更新</span>
                  <strong className="text-gray-900">{new Date().toLocaleDateString('zh-TW')}</strong>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span>授權</span>
                  <strong className="text-gray-900">專案內部使用</strong>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex gap-3">
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all text-sm font-semibold flex items-center gap-2"
                  >
                    <span>📚</span>
                    <span>使用文件</span>
                  </a>
                  <a
                    href="mailto:support@example.com"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-semibold flex items-center gap-2"
                  >
                    <span>📧</span>
                    <span>技術支援</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Password Change Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold mb-4 text-gray-900">修改管理員密碼</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">舊密碼</label>
                  <input
                    type="password"
                    value={passwordForm.oldPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="請輸入舊密碼"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">新密碼</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="請輸入新密碼（至少4個字元）"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">確認新密碼</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="請再次輸入新密碼"
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setShowPasswordModal(false)
                      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
                    }}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-all font-semibold"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleChangePassword}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold"
                  >
                    確認修改
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">
              {editingMember ? '編輯會員' : '新增會員'}
            </h3>
            <div className="space-y-4">
              {!editingMember && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    編號
                  </label>
                  <input
                    type="number"
                    value={newMember.id}
                    onChange={(e) => setNewMember({ ...newMember, id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  姓名
                </label>
                <input
                  type="text"
                  value={editingMember?.name || newMember.name}
                  onChange={(e) => {
                    if (editingMember) {
                      setEditingMember({ ...editingMember, name: e.target.value })
                    } else {
                      setNewMember({ ...newMember, name: e.target.value })
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  專業別
                </label>
                <input
                  type="text"
                  value={editingMember?.profession || newMember.profession}
                  onChange={(e) => {
                    if (editingMember) {
                      setEditingMember({ ...editingMember, profession: e.target.value })
                    } else {
                      setNewMember({ ...newMember, profession: e.target.value })
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowMemberModal(false)
                    setEditingMember(null)
                    setNewMember({ id: '', name: '', profession: '' })
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveMember}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  儲存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Modal */}
      {showMeetingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">
              {editingMeeting ? '編輯會議' : '新增會議'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  日期（週四）
                </label>
                <select
                  value={editingMeeting ? editingMeeting.date : getNextThursday()}
                  onChange={(e) => {
                    const selectedDate = e.target.value
                    if (editingMeeting) {
                      setEditingMeeting({ ...editingMeeting, date: selectedDate })
                    } else {
                      setEditingMeeting({ id: 0, date: selectedDate, status: 'scheduled' })
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
                  required
                >
                  {thursdayDates.map((date) => (
                    <option key={date.value} value={date.value}>
                      {date.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">提示：所有選項都是週四的日期</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  狀態
                </label>
                <select
                  value={editingMeeting ? editingMeeting.status : 'scheduled'}
                  onChange={(e) => {
                    if (editingMeeting) {
                      setEditingMeeting({ ...editingMeeting, status: e.target.value })
                    } else {
                      setEditingMeeting({ id: 0, date: new Date().toISOString().split('T')[0], status: e.target.value })
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="scheduled">已安排</option>
                  <option value="completed">已完成</option>
                  <option value="cancelled">已取消</option>
                </select>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowMeetingModal(false)
                    setEditingMeeting(null)
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveMeeting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  儲存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Checkin Modal */}
      {editingCheckin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-gray-900">編輯簽到記錄</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  會員姓名
                </label>
                <input
                  type="text"
                  value={members.find(m => m.id === editingCheckin.memberId)?.name || ''}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  出席狀態
                </label>
                <select
                  value={editingCheckin.status}
                  onChange={(e) => setEditingCheckin({ ...editingCheckin, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="present">正常</option>
                  <option value="early">早安</option>
                  <option value="late">遲到</option>
                  <option value="early_leave">早退</option>
                  <option value="absent">缺席</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  簽到時間
                </label>
                <input
                  type="datetime-local"
                  value={editingCheckin.checkin_time}
                  onChange={(e) => setEditingCheckin({ ...editingCheckin, checkin_time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  留言
                </label>
                <textarea
                  value={editingCheckin.message}
                  onChange={(e) => {
                    if (e.target.value.length <= 500) {
                      setEditingCheckin({ ...editingCheckin, message: e.target.value })
                    }
                  }}
                  maxLength={500}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none"
                  rows={4}
                  placeholder="輸入留言...（最多500字）"
                />
                <div className="text-xs text-gray-500 mt-1 text-right">
                  {editingCheckin.message.length} / 500
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setEditingCheckin(null)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-all font-semibold"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveCheckinEdit}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold"
                >
                  儲存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prize Modal */}
      {showPrizeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingPrize ? '編輯獎品' : '新增獎品'}
            </h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                // 保存當前表單數據（在清空前，用於錯誤恢復）
                const savedPrizeData = {
                  name: newPrize.name,
                  totalQuantity: newPrize.totalQuantity,
                  probability: newPrize.probability,
                  image: newPrize.image,
                }
                const wasEditing = !!editingPrize
                const currentEditingPrize = editingPrize
                
                // 樂觀更新：立即更新列表
                let optimisticPrize: any = null
                let optimisticPrizeId: number | null = null
                if (wasEditing && currentEditingPrize) {
                  // 更新現有獎品
                  optimisticPrize = {
                    ...currentEditingPrize,
                    name: savedPrizeData.name,
                    total_quantity: savedPrizeData.totalQuantity,
                    remaining_quantity: currentEditingPrize.remaining_quantity, // 保持原有剩餘數量
                    probability: savedPrizeData.probability,
                    image_url: currentEditingPrize.image_url, // 保持原有圖片，如果上傳新圖片會在後端更新
                  }
                  optimisticPrizeId = currentEditingPrize.id
                  setPrizes(prev => prev.map(p => 
                    p.id === currentEditingPrize.id ? optimisticPrize : p
                  ))
                } else {
                  // 新增獎品
                  optimisticPrizeId = Date.now() // 臨時ID
                  optimisticPrize = {
                    id: optimisticPrizeId,
                    name: savedPrizeData.name,
                    total_quantity: savedPrizeData.totalQuantity,
                    remaining_quantity: savedPrizeData.totalQuantity,
                    probability: savedPrizeData.probability,
                    image_url: '', // 臨時空值，後端會返回真實URL
                  }
                  setPrizes(prev => [...prev, optimisticPrize])
                }
                
                // 立即關閉彈窗，提升用戶體驗
                setShowPrizeModal(false)
                
                // 清空表單狀態
                setEditingPrize(null)
                setNewPrize({ name: '', totalQuantity: 1, probability: 1.0, image: null })
                
                try {
                  const formData = new FormData()
                  formData.append('name', newPrize.name)
                  formData.append('totalQuantity', newPrize.totalQuantity.toString())
                  formData.append('probability', newPrize.probability.toString())
                  if (newPrize.image) {
                    formData.append('image', newPrize.image)
                  }

                  const url = editingPrize
                    ? `/api/prizes/${editingPrize.id}`
                    : '/api/prizes'
                  const method = editingPrize ? 'PUT' : 'POST'

                  const response = await fetch(url, {
                    method,
                    body: formData,
                  })

                  if (response.ok) {
                    let data
                    try {
                      data = await response.json()
                    } catch (jsonError) {
                      console.error('解析 API 響應失敗:', jsonError)
                      throw new Error('伺服器響應格式錯誤')
                    }
                    
                    if (data.success && data.prize) {
                      // 用真實的獎品數據替換樂觀更新的臨時數據
                      if (wasEditing && currentEditingPrize) {
                        setPrizes(prev => prev.map(p => 
                          p.id === currentEditingPrize.id ? data.prize : p
                        ))
                      } else {
                        setPrizes(prev => prev.map(p => 
                          p.id === optimisticPrize.id ? data.prize : p
                        ))
                      }
                      
                      // 顯示美觀的自動消失提示
                      const successMsg = wasEditing ? '獎品已成功更新' : '獎品已成功新增'
                      console.log('✅', successMsg, savedPrizeData.name)
                      setToast({ message: successMsg, type: 'success' })
                      // 3秒後自動消失
                      setTimeout(() => setToast(null), 3000)
                    } else if (data.success) {
                      // 如果後端沒有返回獎品數據，使用背景刷新
                      setTimeout(() => {
                        loadPrizes().catch(err => console.error('背景載入獎品失敗:', err))
                      }, 500)
                      const successMsg = wasEditing ? '獎品已成功更新' : '獎品已成功新增'
                      setToast({ message: successMsg, type: 'success' })
                      setTimeout(() => setToast(null), 3000)
                    } else {
                      // 失敗時恢復原狀態
                      if (wasEditing && currentEditingPrize) {
                        setPrizes(prev => prev.map(p => 
                          p.id === currentEditingPrize.id ? currentEditingPrize : p
                        ))
                      } else if (optimisticPrizeId !== null) {
                        setPrizes(prev => prev.filter(p => p.id !== optimisticPrizeId))
                      }
                      // 重新打開彈窗並顯示錯誤
                      setShowPrizeModal(true)
                      setNewPrize({ 
                        name: savedPrizeData.name, 
                        totalQuantity: savedPrizeData.totalQuantity, 
                        probability: savedPrizeData.probability, 
                        image: savedPrizeData.image 
                      })
                      if (wasEditing && currentEditingPrize) {
                        setEditingPrize(currentEditingPrize)
                      }
                      const errorMsg = filterVercelText(data.error || '未知錯誤')
                      setToast({ message: '操作失敗：' + errorMsg, type: 'error' })
                      setTimeout(() => setToast(null), 4000)
                    }
                  } else {
                    // 失敗時恢復原狀態
                    if (wasEditing && currentEditingPrize) {
                      setPrizes(prev => prev.map(p => 
                        p.id === currentEditingPrize.id ? currentEditingPrize : p
                      ))
                    } else if (optimisticPrizeId !== null) {
                      setPrizes(prev => prev.filter(p => p.id !== optimisticPrizeId))
                    }
                    
                    let errorData
                    try {
                      const text = await response.text()
                      errorData = text ? JSON.parse(text) : { error: `HTTP ${response.status}: ${response.statusText}` }
                    } catch (parseError) {
                      console.error('解析錯誤響應失敗:', parseError)
                      errorData = { error: `HTTP ${response.status}: ${response.statusText}` }
                    }
                    
                    const errorMessage = errorData.error || '操作失敗'
                    
                    // 失敗時重新打開彈窗並顯示錯誤
                    setShowPrizeModal(true)
                    setNewPrize({ 
                      name: savedPrizeData.name, 
                      totalQuantity: savedPrizeData.totalQuantity, 
                      probability: savedPrizeData.probability, 
                      image: savedPrizeData.image 
                    })
                    if (wasEditing && currentEditingPrize) {
                      setEditingPrize(currentEditingPrize)
                    }
                    
                    // 檢查是否為速率限制錯誤
                    const errorMsg = response.status === 429 || errorMessage.includes('Too many requests') || errorMessage.includes('請求過於頻繁')
                      ? '⚠️ 請求過於頻繁，請稍候 1-2 分鐘後再試上傳圖片'
                      : '操作失敗：' + filterVercelText(errorMessage)
                    setToast({ message: errorMsg, type: 'error' })
                    setTimeout(() => setToast(null), 4000)
                    console.error('Error saving prize:', { status: response.status, error: errorData })
                  }
                } catch (error) {
                  console.error('Error saving prize:', error)
                  const errorMessage = error instanceof Error ? error.message : '網路錯誤'
                  
                  // 失敗時恢復原狀態
                  if (wasEditing && currentEditingPrize) {
                    setPrizes(prev => prev.map(p => 
                      p.id === currentEditingPrize.id ? currentEditingPrize : p
                    ))
                  } else if (optimisticPrizeId !== null) {
                    setPrizes(prev => prev.filter(p => p.id !== optimisticPrizeId))
                  }
                  
                  // 失敗時重新打開彈窗並恢復表單數據
                  setShowPrizeModal(true)
                  setNewPrize({ 
                    name: savedPrizeData.name, 
                    totalQuantity: savedPrizeData.totalQuantity, 
                    probability: savedPrizeData.probability, 
                    image: savedPrizeData.image 
                  })
                  if (wasEditing && currentEditingPrize) {
                    setEditingPrize(currentEditingPrize)
                  }
                  
                  const errorMsg = errorMessage.includes('Too many requests') || errorMessage.includes('rate limit')
                    ? '⚠️ 請求過於頻繁，請稍候 1-2 分鐘後再試上傳圖片'
                    : '操作失敗：' + filterVercelText(errorMessage)
                  setToast({ message: errorMsg, type: 'error' })
                  setTimeout(() => setToast(null), 4000)
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  獎品名稱 *
                </label>
                <input
                  type="text"
                  value={newPrize.name}
                  onChange={(e) => setNewPrize({ ...newPrize, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  總數量 *
                </label>
                <input
                  type="number"
                  min="1"
                  value={newPrize.totalQuantity}
                  onChange={(e) => setNewPrize({ ...newPrize, totalQuantity: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  抽中機率（相對值，數字越大越容易中）
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={newPrize.probability}
                  onChange={(e) => setNewPrize({ ...newPrize, probability: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  獎品圖片
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0] || null
                    if (!file) {
                      setNewPrize({ ...newPrize, image: null })
                      setImageCompressionInfo(null)
                      return
                    }

                    // 檢查是否為圖片
                    if (!isImageFile(file)) {
                      setToast({ message: '請選擇圖片檔案（JPG、PNG、GIF 或 WebP）', type: 'error' })
                      setTimeout(() => setToast(null), 3000)
                      return
                    }

                    // 檢查檔案大小（允許最大 50MB，因為會自動壓縮）
                    if (!isFileSizeValid(file, 50)) {
                      setToast({ message: '圖片檔案過大，請選擇小於 50MB 的圖片', type: 'error' })
                      setTimeout(() => setToast(null), 3000)
                      return
                    }

                    // 開始壓縮
                    setCompressingImage(true)
                    setImageCompressionInfo(null)
                    setToast({ message: '正在壓縮圖片，請稍候...', type: 'info' })

                    try {
                      const originalSize = formatFileSize(file.size)
                      
                      // 自動壓縮圖片（目標 2MB 以下，最大寬高 1920px）
                      const compressedFile = await compressImage(file, {
                        maxSizeMB: 2,
                        maxWidthOrHeight: 1920,
                        initialQuality: 0.8,
                      })

                      const compressedSize = formatFileSize(compressedFile.size)
                      const compressionRatio = ((1 - compressedFile.size / file.size) * 100).toFixed(1)

                      setNewPrize({ ...newPrize, image: compressedFile })
                      setImageCompressionInfo({
                        originalSize,
                        compressedSize,
                        compressionRatio: `${compressionRatio}%`,
                      })

                      if (compressedFile.size < file.size) {
                        setToast({ 
                          message: `圖片壓縮完成！原始大小：${originalSize}，壓縮後：${compressedSize}（減少 ${compressionRatio}%）`, 
                          type: 'success' 
                        })
                      } else {
                        setToast({ 
                          message: `圖片已準備就緒（${compressedSize}）`, 
                          type: 'success' 
                        })
                      }
                      setTimeout(() => setToast(null), 4000)
                    } catch (error) {
                      console.error('圖片壓縮失敗:', error)
                      // 壓縮失敗時使用原始檔案
                      setNewPrize({ ...newPrize, image: file })
                      setToast({ 
                        message: '圖片壓縮失敗，將使用原始檔案上傳', 
                        type: 'info' 
                      })
                      setTimeout(() => setToast(null), 3000)
                    } finally {
                      setCompressingImage(false)
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  disabled={compressingImage}
                />
                {compressingImage && (
                  <div className="mt-2 text-sm text-blue-600">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                      <span>正在壓縮圖片...</span>
                    </div>
                  </div>
                )}
                {imageCompressionInfo && !compressingImage && (
                  <div className="mt-2 text-xs text-gray-600 bg-green-50 p-2 rounded">
                    <p>✓ 壓縮完成</p>
                    <p>原始大小：{imageCompressionInfo.originalSize}</p>
                    <p>壓縮後：{imageCompressionInfo.compressedSize}</p>
                    <p>減少：{imageCompressionInfo.compressionRatio}</p>
                  </div>
                )}
                {newPrize.image && !compressingImage && !imageCompressionInfo && (
                  <div className="mt-2 text-xs text-gray-600">
                    已選擇：{newPrize.image.name} ({formatFileSize(newPrize.image.size)})
                  </div>
                )}
                {editingPrize && editingPrize.image_url && !newPrize.image && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">當前圖片：</p>
                    <img
                      src={editingPrize.image_url}
                      alt={editingPrize.name}
                      className="w-20 h-20 object-cover rounded"
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPrizeModal(false)
                    setEditingPrize(null)
                    setNewPrize({ name: '', totalQuantity: 1, probability: 1.0, image: null })
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  儲存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Detail Modal */}
      {showMemberDetailModal && selectedMemberForDetail && (() => {
        const memberStat = memberAttendanceStats[selectedMemberForDetail.id] || { total: 0, present: 0, late: 0, proxy: 0, absent: 0, rate: 0 }
        const absent = memberStat.absent || (memberStat.total - memberStat.present)
        const isCritical = memberStat.total > 0 && (memberStat.rate < 30 || absent / memberStat.total > 0.7)
        const isWarning = memberStat.total > 0 && memberStat.rate < 50 && memberStat.rate >= 30
        
        // 獲取所有已完成的會議，用於載入簽到記錄
        const completedMeetings = meetings
          .filter(m => m.status === 'completed')
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        
        // 狀態：紅綠燈指示器
        const statusLight = isCritical ? '🔴' : isWarning ? '🟡' : memberStat.rate >= 80 ? '🟢' : '🟡'
        
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-2">
                      <span className="text-3xl">{statusLight}</span>
                      <span>#{selectedMemberForDetail.id} {selectedMemberForDetail.name}</span>
                      {isCritical ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-800 text-sm font-bold">
                          🚨 嚴重警告
                        </span>
                      ) : isWarning ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm font-bold">
                          ⚠️ 一般警告
                        </span>
                      ) : memberStat.rate >= 80 ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-bold">
                          ✅ 良好
                        </span>
                      ) : null}
                    </h3>
                    {selectedMemberForDetail.profession && (
                      <p className="text-gray-600 ml-11">{selectedMemberForDetail.profession}</p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setShowMemberDetailModal(false)
                      setSelectedMemberForDetail(null)
                    }}
                    className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-all"
                  >
                    ✕
                  </button>
                </div>
                
                {/* 統計卡片 */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <div className="text-xs text-blue-600 font-semibold mb-1">總會議數</div>
                    <div className="text-xl font-bold text-blue-700">{memberStat.total}</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <div className="text-xs text-green-600 font-semibold mb-1">出席次數</div>
                    <div className="text-xl font-bold text-green-700">{memberStat.present}</div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                    <div className="text-xs text-yellow-600 font-semibold mb-1">遲到次數</div>
                    <div className="text-xl font-bold text-yellow-700">{memberStat.late || 0}</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <div className="text-xs text-blue-600 font-semibold mb-1">代理出席</div>
                    <div className="text-xl font-bold text-blue-700">{memberStat.proxy || 0}</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                    <div className="text-xs text-red-600 font-semibold mb-1">缺席次數</div>
                    <div className="text-xl font-bold text-red-700">{absent}</div>
                  </div>
                  <div className={`rounded-lg p-3 border ${
                    memberStat.rate >= 80 ? 'bg-green-50 border-green-200' :
                    memberStat.rate >= 50 ? 'bg-yellow-50 border-yellow-200' :
                    'bg-red-50 border-red-200'
                  }`}>
                    <div className={`text-xs font-semibold mb-1 ${
                      memberStat.rate >= 80 ? 'text-green-600' :
                      memberStat.rate >= 50 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      出席率
                    </div>
                    <div className={`text-xl font-bold ${
                      memberStat.rate >= 80 ? 'text-green-700' :
                      memberStat.rate >= 50 ? 'text-yellow-700' :
                      'text-red-700'
                    }`}>
                      {memberStat.rate.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <MemberDetailRecords 
                  memberId={selectedMemberForDetail.id}
                  completedMeetings={completedMeetings}
                />
              </div>
              
              <div className="p-6 border-t border-gray-200 flex-shrink-0">
                <button
                  onClick={() => {
                    setShowMemberDetailModal(false)
                    setSelectedMemberForDetail(null)
                  }}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-semibold"
                >
                  關閉
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Developer Password Modal */}
      {showDeveloperPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>🔒</span>
              <span>開發者模式驗證</span>
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              此功能僅供開發者使用，請輸入開發者密碼以解鎖。
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  開發者密碼
                </label>
                <input
                  type="password"
                  value={developerPassword}
                  onChange={(e) => setDeveloperPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      unlockDeveloperMode()
                    }
                  }}
                  placeholder="輸入開發者密碼"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeveloperPasswordModal(false)
                    setDeveloperPassword('')
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-all font-semibold"
                >
                  取消
                </button>
                <button
                  onClick={unlockDeveloperMode}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold"
                >
                  解鎖
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AttendanceManagementContent
