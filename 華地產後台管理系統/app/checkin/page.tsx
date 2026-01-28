'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'

interface Member {
  id: number
  name: string
  profession: string
}

interface CheckinRecord {
  member_id: number
  checkin_time: string
  message: string
  status: string
}

export default function CheckinPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [checkins, setCheckins] = useState<Record<number, CheckinRecord>>({})
  const [selectedMember, setSelectedMember] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [meetingStatus, setMeetingStatus] = useState('今日無例會')
  const [today, setToday] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshPaused, setRefreshPaused] = useState(false)

  const submitCheckin = useCallback(async () => {
    if (!selectedMember) {
      alert('請選擇您的名字')
      return
    }

    // 检查是否有会议
    if (meetingStatus === '今日無例會') {
      alert('今日無例會，無法進行簽到')
      return
    }

    // 防止重复提交
    if (submitting) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memberId: selectedMember,
          date: today,
          message: message.trim(),
          status: 'present',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '簽到失敗')
      }

      const data = await response.json()
      if (data.success) {
        // 重新加载数据以确保数据一致性（包含会议状态）
        const checkinsRes = await fetch(`/api/checkins?date=${today}`)
        if (checkinsRes.ok) {
          const checkinsData = await checkinsRes.json()
          const checkinMap: Record<number, CheckinRecord> = {}
          if (checkinsData.checkins) {
            checkinsData.checkins.forEach((checkin: CheckinRecord & { member_id: number }) => {
              checkinMap[checkin.member_id] = checkin
            })
          }
          setCheckins(checkinMap)
          
          // 更新会议状态
          if (checkinsData.meeting && checkinsData.meeting.date) {
            setMeetingStatus(`今日會議：${checkinsData.meeting.date}`)
          } else {
            setMeetingStatus('今日無例會')
          }
        }
        
        setMessage('')
        setSelectedMember(null)
        alert('簽到成功！')
      } else {
        alert('簽到失敗，請重試')
      }
    } catch (error) {
      console.error('Error checking in:', error)
      alert(error instanceof Error ? error.message : '簽到失敗，請重試')
    } finally {
      setSubmitting(false)
    }
  }, [selectedMember, meetingStatus, today, message, submitting])

  // 加载数据的函数
  const loadData = useCallback(async (silent = false) => {
    // 如果刷新被暫停（速率限制），跳過自動刷新
    if (silent && refreshPaused) {
      return
    }

    try {
      if (!silent) {
        setRefreshing(true)
      }
      const todayDate = new Date().toISOString().split('T')[0]
      setToday(todayDate)

      // 获取会员列表
      const membersRes = await fetch('/api/members')
      if (!membersRes.ok) {
        // 檢查是否為速率限制錯誤
        if (membersRes.status === 429) {
          if (!silent) {
            setRefreshPaused(true)
            // 5分鐘後自動恢復
            setTimeout(() => setRefreshPaused(false), 5 * 60 * 1000)
            alert('⚠️ 請求過於頻繁，自動刷新已暫停，5分鐘後自動恢復')
          }
          return
        }
        throw new Error('Failed to fetch members')
      }
      const membersData = await membersRes.json()
      setMembers(membersData.members || [])

      // 获取今天的签到记录（包含会议信息）
      const checkinsRes = await fetch(`/api/checkins?date=${todayDate}`)
      if (!checkinsRes.ok) {
        // 檢查是否為速率限制錯誤
        if (checkinsRes.status === 429) {
          if (!silent) {
            setRefreshPaused(true)
            // 5分鐘後自動恢復
            setTimeout(() => setRefreshPaused(false), 5 * 60 * 1000)
            alert('⚠️ 請求過於頻繁，自動刷新已暫停，5分鐘後自動恢復')
          }
          return
        }
        throw new Error('Failed to fetch checkins')
      }
      const checkinsData = await checkinsRes.json()
      
      // 檢查返回的錯誤訊息
      if (checkinsData.error) {
        const errorMsg = String(checkinsData.error)
        if (errorMsg.includes('Too many requests') || errorMsg.includes('rate limit') || errorMsg.includes('429')) {
          if (!silent) {
            setRefreshPaused(true)
            setTimeout(() => setRefreshPaused(false), 5 * 60 * 1000)
            alert('⚠️ 請求過於頻繁，自動刷新已暫停，5分鐘後自動恢復')
          }
          return
        }
      }
      
      const checkinMap: Record<number, CheckinRecord> = {}
      if (checkinsData.checkins) {
        checkinsData.checkins.forEach((checkin: CheckinRecord & { member_id: number }) => {
          checkinMap[checkin.member_id] = checkin
        })
      }
      setCheckins(checkinMap)
      
      // 检查会议状态 - 确保正确更新
      if (checkinsData.meeting && checkinsData.meeting.date) {
        setMeetingStatus(`今日會議：${checkinsData.meeting.date}`)
      } else {
        setMeetingStatus('今日無例會')
      }

      // 如果成功，重置暫停狀態
      if (refreshPaused) {
        setRefreshPaused(false)
      }
    } catch (err) {
      console.error('Error fetching data:', err)
      const errorMsg = err instanceof Error ? err.message : String(err)
      if (errorMsg.includes('Too many requests') || errorMsg.includes('rate limit') || errorMsg.includes('429')) {
        if (!silent) {
          setRefreshPaused(true)
          setTimeout(() => setRefreshPaused(false), 5 * 60 * 1000)
          alert('⚠️ 請求過於頻繁，自動刷新已暫停，5分鐘後自動恢復')
        }
        return
      }
      if (!silent) {
        alert('載入資料失敗，請重新整理頁面')
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [refreshPaused])

  useEffect(() => {
    // 初始加载数据
    loadData()

    // 每60秒自动刷新数据（避免請求過於頻繁導致伺服器過載）
    // 使用頁面可見性 API，只在頁面可見時刷新
    let interval: NodeJS.Timeout | null = null
    
    const startRefresh = () => {
      if (interval) clearInterval(interval)
      interval = setInterval(() => {
        // 只在頁面可見且未暫停時刷新
        if (!document.hidden && !refreshPaused) {
          loadData(true)
        }
      }, 60000) // 60秒
    }

    // 頁面可見性變化時處理
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // 頁面隱藏時停止刷新
        if (interval) {
          clearInterval(interval)
          interval = null
        }
      } else {
        // 頁面可見時開始刷新
        startRefresh()
      }
    }

    // 開始自動刷新
    startRefresh()
    
    // 監聽頁面可見性變化
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // 键盘快捷键支持：Enter键提交签到
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && selectedMember && !submitting) {
        e.preventDefault()
        submitCheckin()
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    
    return () => {
      if (interval) clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [loadData, selectedMember, submitting, submitCheckin, refreshPaused])

  const getCheckinStatus = useCallback((memberId: number) => {
    const checkin = checkins[memberId]
    if (!checkin) return { status: '缺席', time: '', isPresent: false }
    return {
      status: checkin.status === 'present' ? '已簽到' : '缺席',
      time: checkin.checkin_time ? new Date(checkin.checkin_time).toLocaleString('zh-TW') : '',
      isPresent: checkin.status === 'present',
    }
  }, [checkins])

  // 排序：已签到的在前面 - 使用 useMemo 优化
  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      const aStatus = getCheckinStatus(a.id)
      const bStatus = getCheckinStatus(b.id)
      if (aStatus.isPresent && !bStatus.isPresent) return -1
      if (!aStatus.isPresent && bStatus.isPresent) return 1
      return a.id - b.id
    })
  }, [members, getCheckinStatus])

  // 统计数据 - 使用 useMemo 优化
  const stats = useMemo(() => {
    const presentCount = Object.values(checkins).filter(c => c.status === 'present').length
    return {
      total: members.length,
      present: presentCount,
      absent: members.length - presentCount,
    }
  }, [members.length, checkins])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">載入中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
                ⛧ Good Morning ⛧
              </h1>
              <p className="text-blue-100 text-sm sm:text-base">華地產線上鑽石分會 ⏃ 付出者收穫</p>
            </div>
                    <div className="flex gap-2">
                      <a
                        href="/lottery"
                        className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-all duration-200 font-medium text-sm sm:text-base border border-white/30"
                      >
                        🎰 抽獎轉盤
                      </a>
                      <a
                        href="/admin/login"
                        className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-all duration-200 font-medium text-sm sm:text-base border border-white/30"
                      >
                        🔐 後台管理
                      </a>
                    </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Meeting Status Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">📅</span>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{meetingStatus}</h2>
                <button
                  onClick={() => {
                    setRefreshPaused(false) // 手動刷新時重置暫停狀態
                    loadData()
                  }}
                  disabled={refreshing}
                  className="ml-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  title="手動刷新會議狀態"
                >
                  {refreshing ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-600 border-t-transparent"></div>
                      <span>刷新中...</span>
                    </>
                  ) : refreshPaused ? (
                    <>
                      <span>⏸️</span>
                      <span>已暫停</span>
                    </>
                  ) : (
                    <>
                      <span>🔄</span>
                      <span>刷新</span>
                    </>
                  )}
                </button>
              </div>
              {meetingStatus === '今日無例會' && (
                <>
                  <p className="text-red-500 text-sm sm:text-base mt-2 flex items-center gap-2 font-semibold">
                    <span>💤</span>
                    <span>今天沒有安排例會，無法進行簽到</span>
                  </p>
                  <p className="text-gray-600 text-xs sm:text-sm mt-2">
                    請聯繫管理員確認會議時間安排，或點擊上方「刷新」按鈕檢查是否有新會議
                  </p>
                </>
              )}
            </div>
            {/* Statistics Cards */}
            <div className="grid grid-cols-3 gap-3 w-full sm:w-auto">
              <div className="bg-blue-50 rounded-xl p-3 sm:p-4 text-center border border-blue-100">
                <div className="text-xs sm:text-sm text-blue-600 font-medium mb-1">總數</div>
                <div className="text-xl sm:text-2xl font-bold text-blue-700">{stats.total}</div>
              </div>
              <div className="bg-green-50 rounded-xl p-3 sm:p-4 text-center border border-green-100">
                <div className="text-xs sm:text-sm text-green-600 font-medium mb-1">已簽到</div>
                <div className="text-xl sm:text-2xl font-bold text-green-700">{stats.present}</div>
              </div>
              <div className="bg-red-50 rounded-xl p-3 sm:p-4 text-center border border-red-100">
                <div className="text-xs sm:text-sm text-red-600 font-medium mb-1">缺席</div>
                <div className="text-xl sm:text-2xl font-bold text-red-700">{stats.absent}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Checkin Form - Dropdown Select */}
        {meetingStatus !== '今日無例會' && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-xl p-4 sm:p-6 border-2 border-blue-200">
            <div className="mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                <span className="text-3xl">✍️</span>
                <span>會員簽到</span>
              </h2>
              <p className="text-gray-700 mb-2 text-sm sm:text-base font-medium">請選擇您的名字並完成簽到</p>
              <p className="text-gray-600 mb-2 text-xs sm:text-sm">告訴我們，您的事業需要什麼幫助？</p>
              <p className="text-xs text-blue-600 font-semibold mb-2">💡 提示：按 Ctrl/Cmd + Enter 快速提交</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-4">
                <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-2 flex items-center gap-1">
                  <span className="text-red-500">*</span>
                  <span>選擇您的名字（必填）</span>
                </label>
                <select
                  value={selectedMember || ''}
                  onChange={(e) => setSelectedMember(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base h-[48px] bg-white font-medium shadow-sm hover:border-blue-400"
                  required
                >
                  <option value="">👉 請選擇您的名字</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      #{member.id} {member.name} - {member.profession}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-6">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                  留言（選填）
                </label>
                <textarea
                  value={message}
                  onChange={(e) => {
                    if (e.target.value.length <= 500) {
                      setMessage(e.target.value)
                    }
                  }}
                  maxLength={500}
                  className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none text-sm h-[42px]"
                  placeholder="輸入您的留言...（最多500字）"
                />
                {message.length > 0 && (
                  <div className="text-xs text-gray-500 mt-1 text-right">
                    {message.length} / 500
                  </div>
                )}
              </div>
              <div className="sm:col-span-2">
              <button
                onClick={submitCheckin}
                disabled={!selectedMember || submitting}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all duration-200 font-bold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base h-[48px] flex items-center justify-center gap-2 transform hover:scale-105 active:scale-95"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>簽到中...</span>
                  </>
                ) : (
                  <>
                    <span className="text-lg">✅</span>
                    <span>送出並簽到</span>
                  </>
                )}
              </button>
              </div>
            </div>
          </div>
        )}

        {/* Checkin Table - Responsive */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 overflow-hidden">
          <div className="mb-4">
            {meetingStatus === '今日無例會' ? (
              <>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                  <span>🐾</span>
                  <span>今日無例會｜會員清單僅供查看，無法簽到</span>
                </h2>
                <p className="text-gray-500 text-sm italic mt-2">
                  曾經有一份真摯的選單在我面前，我沒有簽到，等到過了七點才後悔莫及
                </p>
              </>
            ) : (
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
                <span>✅</span>
                <span>簽到</span>
              </h2>
            )}
          </div>
          
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">編號</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">名字</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">專業別 (下方為留言)</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">簽到時間</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">狀態</th>
                </tr>
              </thead>
              <tbody>
                {sortedMembers.map((member) => {
                  const checkinInfo = getCheckinStatus(member.id)
                  return (
                    <tr key={member.id} className={`hover:bg-gray-50 transition-colors ${checkinInfo.isPresent ? 'bg-green-50/20' : ''}`}>
                      <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">{member.id}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">{member.name}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm text-gray-600">
                        {member.profession}
                        {checkins[member.id]?.message && (
                          <div className="text-xs text-gray-500 mt-1">
                            {checkins[member.id].message}
                          </div>
                        )}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-sm text-gray-500">{checkinInfo.time || ''}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm">
                        <span className={checkinInfo.status === '已簽到' ? 'text-green-600' : 'text-red-600'}>
                          {checkinInfo.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Table - Compact */}
          <div className="lg:hidden overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-semibold text-gray-700">編號</th>
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-semibold text-gray-700">名字</th>
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-semibold text-gray-700">專業別 (下方為留言)</th>
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-semibold text-gray-700">簽到時間</th>
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-semibold text-gray-700">狀態</th>
                </tr>
              </thead>
              <tbody>
                {sortedMembers.map((member) => {
                  const checkinInfo = getCheckinStatus(member.id)
                  return (
                    <tr key={member.id} className={`hover:bg-gray-50 transition-colors ${checkinInfo.isPresent ? 'bg-green-50/20' : ''}`}>
                      <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900">{member.id}</td>
                      <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900">{member.name}</td>
                      <td className="border border-gray-300 px-2 py-2 text-xs text-gray-600">
                        {member.profession}
                        {checkins[member.id]?.message && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            {checkins[member.id].message}
                          </div>
                        )}
                      </td>
                      <td className="border border-gray-300 px-2 py-2 text-xs text-gray-500">{checkinInfo.time || ''}</td>
                      <td className="border border-gray-300 px-2 py-2 text-xs">
                        <span className={checkinInfo.status === '已簽到' ? 'text-green-600' : 'text-red-600'}>
                          {checkinInfo.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>


        {/* Footer */}
        <div className="text-center py-6">
          <p className="text-sm text-gray-500">
            本系統由 <strong className="text-gray-700">華地產資訊長 蔡濬瑒</strong> 開發 v4.5.1
          </p>
        </div>
      </div>
    </div>
  )
}
