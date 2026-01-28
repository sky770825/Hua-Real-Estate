import { google } from 'googleapis'

// Google Sheets API 配置
// 需要設置環境變數：
// GOOGLE_SHEETS_CLIENT_EMAIL: 服務帳號的 email
// GOOGLE_SHEETS_PRIVATE_KEY: 服務帳號的私鑰（需要將 \n 替換為實際換行）
// GOOGLE_SHEETS_SPREADSHEET_ID: Google Sheets 的 ID

let auth: any = null

async function getAuth() {
  if (auth) return auth

  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n')
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID

  if (!clientEmail || !privateKey || !spreadsheetId) {
    console.warn('Google Sheets 環境變數未設置，同步功能將被禁用')
    return null
  }

  try {
    auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })
    return auth
  } catch (error) {
    console.error('Google Sheets 認證失敗:', error)
    return null
  }
}

export async function syncMembersToSheets(members: Array<{ id: number; name: string; profession: string | null }>) {
  try {
    const authClient = await getAuth()
    if (!authClient) {
      console.warn('Google Sheets 認證失敗，跳過同步')
      return { success: false, error: 'Google Sheets 認證失敗' }
    }

    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID
    if (!spreadsheetId) {
      return { success: false, error: 'Google Sheets ID 未設置' }
    }

    const sheets = google.sheets({ version: 'v4', auth: authClient })

    // 準備資料：標題行 + 資料行
    // 格式：介紹人 | 名字 | 專業別 | VIP
    const values = [
      ['介紹人', '名字', '專業別', 'VIP'], // 標題行（符合 Google Sheets 格式）
      ...members.map(m => [
        '', // 介紹人（目前資料庫沒有此欄位，留空）
        m.name, // 名字
        m.profession || '', // 專業別
        '', // VIP（目前資料庫沒有此欄位，留空）
      ]),
    ]

    // 獲取試算表資訊，找到第一個工作表
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId,
    })
    
    const sheetId = spreadsheet.data.sheets?.[0]?.properties?.sheetId || 0
    const sheetName = spreadsheet.data.sheets?.[0]?.properties?.title || 'Sheet1'
    
    // 清空現有資料並寫入新資料（A:D 對應：介紹人、名字、專業別、VIP）
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `${sheetName}!A:D`,
    })

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      requestBody: {
        values,
      },
    })

    // 設定標題行格式（粗體）
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: sheetId,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: 4, // 四欄：介紹人、名字、專業別、VIP
              },
              cell: {
                userEnteredFormat: {
                  textFormat: {
                    bold: true,
                  },
                  backgroundColor: {
                    red: 0.9,
                    green: 0.9,
                    blue: 0.9,
                  },
                },
              },
              fields: 'userEnteredFormat.textFormat.bold,userEnteredFormat.backgroundColor',
            },
          },
        ],
      },
    })

    console.log(`成功同步 ${members.length} 筆會員資料到 Google Sheets`)
    return { success: true, count: members.length }
  } catch (error) {
    console.error('同步到 Google Sheets 失敗:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤',
    }
  }
}

export async function testGoogleSheetsConnection() {
  try {
    const authClient = await getAuth()
    if (!authClient) {
      return { success: false, error: '認證失敗' }
    }

    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID
    if (!spreadsheetId) {
      return { success: false, error: 'Google Sheets ID 未設置' }
    }

    const sheets = google.sheets({ version: 'v4', auth: authClient })
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
    })

    return {
      success: true,
      title: response.data.properties?.title,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤',
    }
  }
}

