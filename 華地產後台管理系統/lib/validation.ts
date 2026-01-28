/**
 * 輸入驗證工具函數
 */

export interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * 驗證會員資料
 */
export function validateMember(data: { id?: any; name?: any; profession?: any }): ValidationResult {
  if (data.id !== undefined) {
    if (typeof data.id !== 'number' || !Number.isInteger(data.id) || data.id <= 0) {
      return { valid: false, error: '會員編號必須是正整數' }
    }
  }
  
  if (data.name !== undefined) {
    const name = String(data.name || '').trim()
    if (name.length === 0) {
      return { valid: false, error: '會員姓名不能為空' }
    }
    if (name.length > 100) {
      return { valid: false, error: '會員姓名不能超過 100 個字元' }
    }
  }
  
  if (data.profession !== undefined && data.profession !== null) {
    const profession = String(data.profession).trim()
    if (profession.length > 200) {
      return { valid: false, error: '專業別不能超過 200 個字元' }
    }
  }
  
  return { valid: true }
}

/**
 * 驗證簽到資料
 */
export function validateCheckin(data: {
  memberId?: any
  date?: any
  message?: any
  status?: any
  checkin_time?: any
}): ValidationResult {
  if (data.memberId !== undefined) {
    if (typeof data.memberId !== 'number' || !Number.isInteger(data.memberId) || data.memberId <= 0) {
      return { valid: false, error: '會員編號無效' }
    }
  }
  
  if (data.date !== undefined) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(data.date))) {
      return { valid: false, error: '日期格式錯誤，應為 YYYY-MM-DD' }
    }
  }
  
  if (data.message !== undefined && data.message !== null) {
    const message = String(data.message)
    if (message.length > 500) {
      return { valid: false, error: '留言不能超過 500 個字元' }
    }
  }
  
  if (data.status !== undefined) {
    const validStatuses = ['present', 'early', 'late', 'early_leave', 'absent']
    if (!validStatuses.includes(String(data.status))) {
      return { valid: false, error: `出席狀態無效，應為：${validStatuses.join('、')}` }
    }
  }
  
  if (data.checkin_time !== undefined && data.checkin_time !== null) {
    const time = new Date(String(data.checkin_time))
    if (isNaN(time.getTime())) {
      return { valid: false, error: '簽到時間格式錯誤' }
    }
  }
  
  return { valid: true }
}

/**
 * 驗證會議資料
 */
export function validateMeeting(data: { date?: any; status?: any }): ValidationResult {
  if (data.date !== undefined) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(data.date))) {
      return { valid: false, error: '日期格式錯誤，應為 YYYY-MM-DD' }
    }
  }
  
  if (data.status !== undefined) {
    const validStatuses = ['scheduled', 'completed', 'cancelled']
    if (!validStatuses.includes(String(data.status))) {
      return { valid: false, error: `會議狀態無效，應為：${validStatuses.join('、')}` }
    }
  }
  
  return { valid: true }
}

/**
 * 驗證獎品資料
 */
export function validatePrize(data: {
  name?: any
  totalQuantity?: any
  remainingQuantity?: any
  probability?: any
}): ValidationResult {
  if (data.name !== undefined) {
    const name = String(data.name || '').trim()
    if (name.length === 0) {
      return { valid: false, error: '獎品名稱不能為空' }
    }
    if (name.length > 100) {
      return { valid: false, error: '獎品名稱不能超過 100 個字元' }
    }
  }
  
  if (data.totalQuantity !== undefined) {
    const qty = parseInt(String(data.totalQuantity))
    if (isNaN(qty) || qty < 0 || !Number.isInteger(qty)) {
      return { valid: false, error: '總數量必須是非負整數' }
    }
  }
  
  if (data.remainingQuantity !== undefined) {
    const qty = parseInt(String(data.remainingQuantity))
    if (isNaN(qty) || qty < 0 || !Number.isInteger(qty)) {
      return { valid: false, error: '剩餘數量必須是非負整數' }
    }
  }
  
  if (data.probability !== undefined) {
    const prob = parseFloat(String(data.probability))
    if (isNaN(prob) || prob < 0 || prob > 100) {
      return { valid: false, error: '中獎機率必須是 0-100 之間的數字' }
    }
  }
  
  return { valid: true }
}

