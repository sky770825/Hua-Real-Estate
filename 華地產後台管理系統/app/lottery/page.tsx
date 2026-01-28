'use client'

import { useEffect, useState, useCallback } from 'react'

interface Prize {
  id: number
  name: string
  image_url: string
  total_quantity: number
  remaining_quantity: number
  probability: number
}

interface CheckinMember {
  member_id: number
  name: string
}

interface Winner {
  id: number
  name: string
  member_id: number
}

interface WinnerRecord {
  id: number
  meeting_date: string
  created_at: string
  member_id: number
  member_name: string
  prize_id: number
  prize_name: string
  prize_image_url: string
}

export default function LotteryPage() {
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [checkinMembers, setCheckinMembers] = useState<CheckinMember[]>([])
  const [checkinCount, setCheckinCount] = useState(0)
  const [eligibleCount, setEligibleCount] = useState(0)
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null)
  const [winner, setWinner] = useState<Winner | null>(null)
  const [winners, setWinners] = useState<WinnerRecord[]>([])
  const [isSpinning, setIsSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [today, setToday] = useState('')
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (loading === false) {
      setLoading(true)
    }
    
    try {
      const todayDate = new Date().toISOString().split('T')[0]
      setToday(todayDate)

      // 并行加载数据以提高性能
      const [prizesRes, checkinsRes, membersRes, winnersRes] = await Promise.all([
        fetch('/api/prizes').catch(err => {
          console.error('Error fetching prizes:', err)
          return { ok: false, json: async () => ({ prizes: [] }) }
        }),
        fetch(`/api/checkins?date=${todayDate}`).catch(err => {
          console.error('Error fetching checkins:', err)
          return { ok: false, json: async () => ({ checkins: [] }) }
        }),
        fetch('/api/members').catch(err => {
          console.error('Error fetching members:', err)
          return { ok: false, json: async () => ({ members: [] }) }
        }),
        fetch(`/api/lottery/winners?date=${todayDate}`).catch(err => {
          console.error('Error fetching winners:', err)
          return { ok: false, json: async () => ({ winners: [] }) }
        }),
      ])

      const [prizesData, checkinsData, memberData, winnersData] = await Promise.all([
        prizesRes.json().catch(() => ({ prizes: [] })),
        checkinsRes.json().catch(() => ({ checkins: [] })),
        membersRes.json().catch(() => ({ members: [] })),
        winnersRes.json().catch(() => ({ winners: [] })),
      ])

      setPrizes(prizesData.prizes || [])
      
      interface MemberInfo {
        id: number
        name: string
      }
      
      const memberMap = new Map<number, MemberInfo>(
        (memberData.members || []).map((m: MemberInfo) => [m.id, m])
      )
      
      const members: CheckinMember[] = []
      if (checkinsData.checkins) {
        checkinsData.checkins.forEach((checkin: { member_id: number; status?: string }) => {
          if (checkin.status && checkin.status !== 'present') return
          const member = memberMap.get(checkin.member_id)
          if (member) {
            members.push({
              member_id: member.id,
              name: member.name,
            })
          }
        })
      }
      setCheckinMembers(members)
      setCheckinCount(members.length)
      const winnerList = winnersData.winners || []
      setWinners(winnerList)
      setEligibleCount(Math.max(0, members.length - winnerList.length))
    } catch (error) {
      console.error('Error loading data:', error)
      // 不显示alert，避免干扰用户体验
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    
    const fetchData = async () => {
      await loadData()
    }
    
    if (mounted) {
      fetchData()
    }
    
    return () => {
      mounted = false
    }
  }, [])

  const handleDraw = async () => {
    if (isSpinning) return
    if (checkinCount === 0) {
      alert('今天沒有簽到的會員，無法抽獎')
      return
    }
    if (eligibleCount === 0) {
      alert('今日可抽獎人數已抽完')
      return
    }
    if (prizes.length === 0) {
      alert('請先到後台添加獎品')
      return
    }

    setIsSpinning(true)
    setSelectedPrize(null)
    setWinner(null)

    try {
      const response = await fetch('/api/lottery/draw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date: today }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '抽獎失敗')
      }

      // 计算目标奖品在转盘上的角度
      const currentPrizeCount = prizes.length
      const currentAnglePerPrize = 360 / Math.max(currentPrizeCount, 1)
      const selectedIndex = prizes.findIndex(p => p.id === data.prize.id)
      const targetAngle = selectedIndex >= 0 
        ? (selectedIndex * currentAnglePerPrize + currentAnglePerPrize / 2)
        : 0

      // 旋转转盘（多转几圈 + 目标角度）
      const spinRotation = 360 * 5 + (360 - (rotation % 360)) + targetAngle
      setRotation(prev => prev + spinRotation)

      // 等待转盘旋转完成
      setTimeout(() => {
        setSelectedPrize(data.prize)
        setWinner(data.winner || null)
        setIsSpinning(false)
        loadData() // 重新加载数据以更新剩余数量
        
        // 显示中奖信息
        if (data.winner) {
          const probability = data.winnerProbability || ((1 / checkinCount * 100).toFixed(2) + '%')
          alert(`🎉 恭喜 ${data.winner.name} 中獎！\n獎品：${data.prize.name}\n中獎機率：${probability}`)
        }
      }, 3000)
    } catch (error) {
      console.error('Error drawing lottery:', error)
      alert(error instanceof Error ? error.message : '抽獎失敗')
      setIsSpinning(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">載入中...</p>
        </div>
      </div>
    )
  }

  const prizeCount = prizes.length
  const anglePerPrize = 360 / Math.max(prizeCount, 1)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white rounded-2xl shadow-xl mb-6 p-6">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-center">
            🎰 幸運轉盤抽獎 🎰
          </h1>
          <p className="text-center text-purple-100 text-sm sm:text-base">
            今日抽獎進度
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-sm sm:text-base">
            <div className="px-3 py-1 rounded-full bg-white/15">
              已簽到 <strong className="text-white">{checkinCount}</strong> 人
            </div>
            <div className="px-3 py-1 rounded-full bg-white/15">
              已中獎 <strong className="text-white">{winners.length}</strong> 人
            </div>
            <div className="px-3 py-1 rounded-full bg-white/15">
              尚可抽 <strong className="text-white">{eligibleCount}</strong> 人
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 转盘区域 */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-3xl shadow-2xl p-8 border-2 border-purple-100 backdrop-blur-sm">
              {/* 装饰性边框 */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-200/20 via-pink-200/20 to-red-200/20 opacity-30 blur-xl"></div>
              
              <div className="relative mx-auto" style={{ width: '100%', maxWidth: '550px', aspectRatio: '1' }}>
                {/* 外圈装饰 */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-200/40 via-pink-200/40 to-red-200/40 blur-2xl -z-10"></div>
                
                {/* 转盘容器 */}
                <div className="relative w-full h-full">
                  {/* 转盘外圈装饰 */}
                  <div className="absolute inset-0 rounded-full border-[12px] border-gradient-to-r from-purple-300 via-pink-300 to-red-300 shadow-inner" 
                       style={{
                         background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.1), rgba(236, 72, 153, 0.1), rgba(239, 68, 68, 0.1))',
                         boxShadow: 'inset 0 0 30px rgba(147, 51, 234, 0.2), 0 0 40px rgba(147, 51, 234, 0.3)'
                       }}></div>
                  
                  {/* 转盘 */}
                  {prizeCount > 0 ? (
                    <>
                      {/* 转盘主体 */}
                      <div
                        className="absolute inset-[6px] rounded-full transition-transform duration-3000 ease-out shadow-2xl pointer-events-none"
                        style={{
                          transform: `rotate(${rotation}deg)`,
                          background: `conic-gradient(
                            ${prizes.map((_, index) => {
                              // 更精致的渐变色方案
                              const colorPairs = [
                                ['#FF6B9D', '#C44569'], // 粉红渐变
                                ['#4ECDC4', '#44A08D'], // 青绿渐变
                                ['#45B7D1', '#96C93D'], // 蓝绿渐变
                                ['#FFA07A', '#FF6B6B'], // 橙红渐变
                                ['#98D8C8', '#6BCB77'], // 薄荷绿渐变
                                ['#F7DC6F', '#F39C12'], // 金黄渐变
                                ['#BB8FCE', '#9B59B6'], // 紫蓝渐变
                                ['#85C1E2', '#3498DB'], // 天蓝渐变
                                ['#F1948A', '#E74C3C'], // 珊瑚红渐变
                                ['#85C1E9', '#5DADE2'], // 浅蓝渐变
                              ]
                              const [color1, color2] = colorPairs[index % colorPairs.length]
                              const startAngle = index * anglePerPrize
                              const endAngle = (index + 1) * anglePerPrize
                              return `${color1} ${startAngle}deg, ${color2} ${endAngle}deg`
                            }).join(', ')}
                          )`,
                          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2), inset 0 0 20px rgba(255, 255, 255, 0.3)',
                        }}
                      >
                        {/* 分隔线 */}
                        {prizes.map((_, index) => {
                          const lineAngle = index * anglePerPrize
                          return (
                            <div
                              key={`line-${index}`}
                              className="absolute top-0 left-1/2 origin-bottom"
                              style={{
                                transform: `translateX(-50%) rotate(${lineAngle}deg)`,
                                width: '2px',
                                height: '50%',
                                background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.2))',
                                boxShadow: '0 0 4px rgba(255, 255, 255, 0.5)',
                              }}
                            />
                          )
                        })}
                        
                        {/* 奖品标签 */}
                        {prizes.map((prize, index) => {
                          const angle = (index * anglePerPrize + anglePerPrize / 2) * (Math.PI / 180)
                          const radius = 38
                          const x = 50 + radius * Math.cos(angle - Math.PI / 2)
                          const y = 50 + radius * Math.sin(angle - Math.PI / 2)

                          return (
                            <div
                              key={prize.id}
                              className="absolute"
                              style={{
                                left: `${x}%`,
                                top: `${y}%`,
                                transform: 'translate(-50%, -50%)',
                              }}
                            >
                              {/* 奖品名称背景 */}
                              <div 
                                className="px-3 py-1.5 rounded-lg backdrop-blur-sm"
                                style={{
                                  background: 'rgba(255, 255, 255, 0.25)',
                                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.5)',
                                  border: '1px solid rgba(255, 255, 255, 0.4)',
                                }}
                              >
                                <p 
                                  className="text-white font-bold text-xs sm:text-sm text-center whitespace-nowrap"
                                  style={{
                                    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.6), 0 0 8px rgba(0, 0, 0, 0.3)',
                                    fontWeight: '700',
                                    letterSpacing: '0.5px',
                                  }}
                                >
                                  {prize.name}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-[6px] rounded-full border-8 border-gray-300 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-inner">
                      <div className="text-center">
                        <div className="text-5xl mb-3">🎁</div>
                        <p className="text-gray-600 font-semibold">請到後台添加獎品</p>
                      </div>
                    </div>
                  )}

                  {/* 中心显示区域 - 中奖奖品 */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                    {/* 中心圆环装饰 */}
                    <div className="absolute w-44 h-44 sm:w-52 sm:h-52 rounded-full bg-gradient-to-br from-purple-200/30 via-pink-200/30 to-red-200/30 blur-xl"></div>
                    
                    <div 
                      className="relative bg-gradient-to-br from-white via-purple-50 to-pink-50 rounded-full border-4 border-purple-400 shadow-2xl flex flex-col items-center justify-center transition-all duration-500"
                      style={{
                        width: '140px',
                        height: '140px',
                        boxShadow: '0 10px 40px rgba(147, 51, 234, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.8), 0 0 30px rgba(236, 72, 153, 0.3)',
                      }}
                    >
                      {selectedPrize ? (
                        <>
                          {selectedPrize.image_url && (
                            <div className="mb-2">
                              <img
                                src={selectedPrize.image_url}
                                alt={selectedPrize.name}
                                className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-full border-4 border-purple-300 shadow-lg"
                              />
                            </div>
                          )}
                          <p className="text-xs sm:text-sm font-bold text-gray-800 text-center px-2 mb-1">
                            {selectedPrize.name}
                          </p>
                          {winner && (
                            <div className="mt-1 px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
                              <p className="text-xs text-white font-semibold text-center">
                                🎉 {winner.name}
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center">
                          <div className="text-4xl sm:text-5xl mb-2 animate-bounce">🎁</div>
                          <p className="text-xs sm:text-sm font-bold text-gray-700 mb-1">點擊抽獎</p>
                          {eligibleCount > 0 && (
                            <div className="mt-1 px-2 py-0.5 bg-purple-100 rounded-full">
                              <p className="text-xs text-purple-700 font-semibold">
                                每人機率：{(1 / eligibleCount * 100).toFixed(1)}%
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 指针 - 更精致的设计 */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 z-30">
                    {/* 指针主体 */}
                    <div className="relative">
                      {/* 指针三角形 */}
                      <div 
                        className="w-0 h-0 border-l-[20px] border-r-[20px] border-t-[40px] border-l-transparent border-r-transparent"
                        style={{
                          borderTopColor: '#FCD34D',
                          filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3)) drop-shadow(0 0 12px rgba(251, 191, 36, 0.6))',
                        }}
                      ></div>
                      {/* 指针高光 */}
                      <div 
                        className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[8px] border-r-[8px] border-t-[16px] border-l-transparent border-r-transparent"
                        style={{
                          borderTopColor: 'rgba(255, 255, 255, 0.6)',
                        }}
                      ></div>
                      {/* 指针底座 */}
                      <div 
                        className="absolute top-[38px] left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 border-2 border-yellow-600 shadow-lg"
                        style={{
                          boxShadow: '0 4px 12px rgba(251, 191, 36, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.6)',
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* 转盘外圈光晕效果 */}
                  <div className="absolute inset-0 rounded-full pointer-events-none" 
                       style={{
                         boxShadow: 'inset 0 0 60px rgba(147, 51, 234, 0.1), 0 0 80px rgba(236, 72, 153, 0.15)',
                       }}></div>
                </div>
              </div>

              {/* 抽奖按钮 */}
              <div className="mt-8 text-center">
                <button
                  onClick={handleDraw}
                  disabled={isSpinning || eligibleCount === 0 || prizeCount === 0}
                  className="relative px-10 py-5 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white rounded-2xl hover:from-purple-700 hover:via-pink-700 hover:to-red-700 transition-all duration-300 font-bold text-lg sm:text-xl shadow-2xl hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 overflow-hidden group"
                  style={{
                    boxShadow: isSpinning 
                      ? '0 0 30px rgba(147, 51, 234, 0.6), 0 10px 30px rgba(236, 72, 153, 0.4)' 
                      : '0 10px 30px rgba(147, 51, 234, 0.4), 0 0 20px rgba(236, 72, 153, 0.3)',
                  }}
                >
                  {/* 按钮光晕效果 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  
                  {isSpinning ? (
                    <span className="relative flex items-center gap-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent"></div>
                      <span>抽獎中...</span>
                    </span>
                  ) : (
                    <span className="relative flex items-center gap-2">
                      <span className="text-2xl">🎲</span>
                      <span>開始抽獎</span>
                    </span>
                  )}
                </button>
                
                {/* 提示信息 */}
                {checkinCount === 0 && (
                  <p className="mt-3 text-sm text-gray-500">請先進行簽到</p>
                )}
                {checkinCount > 0 && eligibleCount === 0 && (
                  <p className="mt-3 text-sm text-gray-500">今日可抽獎人數已抽完</p>
                )}
                {prizeCount === 0 && (
                  <p className="mt-3 text-sm text-gray-500">請到後台添加獎品</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* 奖品列表 */}
            <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-3xl shadow-2xl p-6 border-2 border-purple-100 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-6">
                <div className="text-2xl">🎁</div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  獎品列表
                </h2>
              </div>
              <div className="space-y-3 max-h-[440px] overflow-y-auto custom-scrollbar pr-2">
                {prizes.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-3">📦</div>
                    <p className="text-gray-500 font-medium">暫無獎品</p>
                    <p className="text-sm text-gray-400 mt-1">請到後台添加</p>
                  </div>
                ) : (
                  prizes.map((prize) => (
                    <div
                      key={prize.id}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                        selectedPrize?.id === prize.id
                          ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg ring-2 ring-purple-300'
                          : 'border-gray-200 bg-white/80 hover:border-purple-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {prize.image_url ? (
                          <div className="relative">
                            <img
                              src={prize.image_url}
                              alt={prize.name}
                              className="w-14 h-14 object-cover rounded-xl border-2 border-gray-200 shadow-md"
                            />
                            {selectedPrize?.id === prize.id && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                                <span className="text-xs">✨</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-14 h-14 bg-gradient-to-br from-purple-200 to-pink-200 rounded-xl flex items-center justify-center border-2 border-gray-200">
                            <span className="text-2xl">🎁</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-800 truncate">{prize.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                                style={{ width: `${(prize.remaining_quantity / prize.total_quantity) * 100}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-600 font-semibold whitespace-nowrap">
                              {prize.remaining_quantity}/{prize.total_quantity}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 中奖名单 */}
            <div className="bg-gradient-to-br from-white to-yellow-50/40 rounded-3xl shadow-2xl p-6 border-2 border-yellow-100 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-6">
                <div className="text-2xl">🏆</div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                  今日中獎名單
                </h2>
              </div>
              <div className="space-y-3 max-h-[360px] overflow-y-auto custom-scrollbar pr-2">
                {winners.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="text-4xl mb-3">✨</div>
                    <p className="text-gray-500 font-medium">尚未抽出中獎者</p>
                    <p className="text-sm text-gray-400 mt-1">快開始第一抽</p>
                  </div>
                ) : (
                  winners.map((record) => (
                    <div
                      key={record.id}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                        winner?.member_id === record.member_id
                          ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50 shadow-lg'
                          : 'border-gray-200 bg-white/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {record.prize_image_url ? (
                          <img
                            src={record.prize_image_url}
                            alt={record.prize_name}
                            className="w-12 h-12 object-cover rounded-xl border-2 border-yellow-100 shadow-md"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-yellow-200 to-orange-200 rounded-xl flex items-center justify-center border-2 border-yellow-100">
                            <span className="text-xl">🎁</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-800 truncate">{record.member_name}</p>
                          <p className="text-xs text-gray-500 truncate">獎品：{record.prize_name}</p>
                        </div>
                        {winner?.member_id === record.member_id && (
                          <div className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-700 rounded-full">
                            最新
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-6 mt-6">
          <p className="text-sm text-gray-500">
            本系統由 <strong className="text-gray-700">華地產資訊長 蔡濬瑒</strong> 開發
          </p>
        </div>
      </div>
    </div>
  )
}
