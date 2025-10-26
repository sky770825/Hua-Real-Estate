/**
 * 華地產鑽石分會資源平台 - Google Apps Script
 * 用於處理引薦登記和使用記錄的資料寫入
 */

// 設定工作表ID
const SPREADSHEET_ID = '1rzFA6bqsz_Au1wiMEGj2nxrlG3uOdDMPddBZBT7sqEY';

/**
 * 初始化函數 - 建立必要的工作表
 */
function initializeSheets() {
  try {
    console.log('開始初始化工作表...');
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    console.log('成功開啟工作表:', spreadsheet.getName());
    
    // 建立引薦登記工作表
    console.log('建立引薦登記工作表...');
    createReferralSheet(spreadsheet);
    console.log('引薦登記工作表建立完成');
    
    // 建立使用記錄工作表
    console.log('建立使用記錄工作表...');
    createAccessLogSheet(spreadsheet);
    console.log('使用記錄工作表建立完成');
    
    // 建立會員資料工作表
    console.log('建立會員資料工作表...');
    createMemberSheet(spreadsheet);
    console.log('會員資料工作表建立完成');
    
    console.log('工作表初始化完成');
    return { success: true, message: '工作表初始化完成' };
    
  } catch (error) {
    console.error('初始化工作表時發生錯誤:', error);
    return { success: false, message: '初始化失敗: ' + error.message };
  }
}

/**
 * 建立引薦登記工作表
 */
function createReferralSheet(spreadsheet) {
  let sheet;
  try {
    sheet = spreadsheet.getSheetByName('引薦登記');
    if (!sheet) {
      sheet = spreadsheet.insertSheet('引薦登記');
    }
  } catch (e) {
    console.log('創建引薦登記工作表時發生錯誤:', e);
    sheet = spreadsheet.insertSheet('引薦登記');
  }
  
  // 確保工作表存在
  if (!sheet) {
    throw new Error('無法創建引薦登記工作表');
  }
  
  // 設定標題行
  const headers = [
    '引薦日期',
    '被引薦服務項目',
    '引薦人（會員編號）',
    '被引薦廠商名稱',
    '廠商聯絡電話',
    '廠商LINE ID',
    '廠商服務區域',
    '引薦備註'
  ];
  
  try {
    // 檢查是否已有標題行
    const range = sheet.getRange(1, 1, 1, headers.length);
    const existingHeaders = range.getValues()[0];
    
    if (!existingHeaders[0] || existingHeaders[0] !== headers[0]) {
      range.setValues([headers]);
      range.setFontWeight('bold');
      range.setBackground('#e1f5fe');
    }
    
    // 不再自動調整欄位寬度（保持預設寬度）
  } catch (e) {
    console.log('設定引薦登記工作表格式時發生錯誤:', e);
  }
  
  return sheet;
}

/**
 * 建立使用記錄工作表
 */
function createAccessLogSheet(spreadsheet) {
  let sheet;
  try {
    sheet = spreadsheet.getSheetByName('使用記錄');
    if (!sheet) {
      sheet = spreadsheet.insertSheet('使用記錄');
    }
  } catch (e) {
    console.log('創建使用記錄工作表時發生錯誤:', e);
    sheet = spreadsheet.insertSheet('使用記錄');
  }
  
  // 確保工作表存在
  if (!sheet) {
    throw new Error('無法創建使用記錄工作表');
  }
  
  // 設定標題行（添加成員編號欄位）
  const headers = [
    '使用時間',
    '服務項目',
    '引薦人',
    '成員編號',
    '查看類型',
    '聯絡資訊',
    '瀏覽器資訊'
  ];
  
  try {
    // 檢查是否已有標題行
    const range = sheet.getRange(1, 1, 1, headers.length);
    const existingHeaders = range.getValues()[0];
    
    if (!existingHeaders[0] || existingHeaders[0] !== headers[0]) {
      range.setValues([headers]);
      range.setFontWeight('bold');
      range.setBackground('#fff3e0');
    }
    
    // 不再自動調整欄位寬度（保持預設寬度）
  } catch (e) {
    console.log('設定使用記錄工作表格式時發生錯誤:', e);
  }
  
  return sheet;
}

/**
 * 建立會員資料工作表
 */
function createMemberSheet(spreadsheet) {
  let sheet;
  try {
    sheet = spreadsheet.getSheetByName('會員資料');
    if (!sheet) {
      sheet = spreadsheet.insertSheet('會員資料');
    }
  } catch (e) {
    console.log('創建會員資料工作表時發生錯誤:', e);
    sheet = spreadsheet.insertSheet('會員資料');
  }
  
  // 設定標題行
  const headers = ['會員編號', '姓名', '專業類別'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // 設定標題行格式
  try {
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#667eea');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    headerRange.setFontSize(12);
    headerRange.setHorizontalAlignment('center');
    
    // 凍結標題行
    sheet.setFrozenRows(1);
    
    // 設定欄位寬度
    sheet.setColumnWidth(1, 120); // 會員編號
    sheet.setColumnWidth(2, 200); // 姓名
    sheet.setColumnWidth(3, 200); // 專業類別
    
    // 設定專業類別下拉選單
    const professionalCategories = [
      '建築師', '結構技師', '室內設計師', '景觀設計師', 'BIM 顧問',
      '水電技師', '機電技師', '消防技師', '電梯技師',
      '律師', '地政士（代書）', '不動產估價師', '會計師', '公證人',
      '理財規劃師', '財務顧問', '保險規劃師', '稅務規劃師',
      '物業管理師', '保全', '清潔服務', '搬家服務',
      '住宅仲介', '商辦仲介', '工業廠房仲介', '地政代書',
      '水風命理師', '命理師', '風水師', '開運師',
      '室內泥作', '室外泥作', '鋼構工程', '木作工程', '石材工程',
      '玻璃工程', '磁磚工程', '鋁門窗工程', '塗料工程',
      '水電安裝', '機電設備', '消防設備', '監控系統', '電梯',
      '物業管理', '保全', '清潔服務', '水電維修', '搬家服務',
      '智慧家電', 'BIM 建模', '物業管理系統',
      '其他'
    ];
    
    // 建立驗證規則
    const validationRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(professionalCategories, true)
      .setAllowInvalid(false)
      .setHelpText('請選擇專業類別')
      .build();
    
    // 應用驗證規則到專業類別欄位（從第2行開始，最多1000行）
    sheet.getRange(2, 3, 1000, 1).setDataValidation(validationRule);
    
  } catch (e) {
    console.log('設定會員資料工作表格式時發生錯誤:', e);
  }
  
  return sheet;
}

/**
 * 獲取會員資料
 */
function getMembers() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName('會員資料');
    
    if (!sheet) {
      return {
        success: false,
        message: '找不到「會員資料」工作表，請先建立該工作表',
        data: []
      };
    }
    
    const data = sheet.getDataRange().getValues();
    
    // 跳過標題行
    const members = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0] && row[1]) { // 確保有編號和姓名
        members.push({
          code: String(row[0]).trim(),
          name: String(row[1]).trim(),
          professionalCategory: row[2] ? String(row[2]).trim() : '' // 專業類別
        });
      }
    }
    
    return {
      success: true,
      data: members,
      count: members.length
    };
  } catch (error) {
    console.error('讀取會員資料失敗:', error);
    return {
      success: false,
      message: '讀取會員資料失敗：' + error.toString(),
      data: []
    };
  }
}

/**
 * 添加引薦資料
 */
function addReferral(referralData) {
  try {
    console.log('開始添加引薦資料');
    console.log('引薦資料:', referralData);
    
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    console.log('成功開啟工作表');
    
    let sheet = spreadsheet.getSheetByName('引薦登記');
    
    // 如果工作表不存在，建立它
    if (!sheet) {
      console.log('引薦登記工作表不存在，正在創建...');
      sheet = createReferralSheet(spreadsheet);
      console.log('引薦登記工作表已創建');
    } else {
      console.log('找到引薦登記工作表');
    }
    
    // 準備資料
    const rowData = [
      new Date().toISOString(),
      referralData.serviceItem || '',
      referralData.referrerCode || '',
      referralData.companyName || '',
      referralData.phone || '',
      referralData.lineId || '',
      referralData.area || '',
      referralData.note || ''
    ];
    
    console.log('準備寫入的資料行:', rowData);
    
    // 添加資料到最後一行
    sheet.appendRow(rowData);
    
    console.log('引薦資料已成功添加到工作表');
    return { success: true, message: '引薦資料已成功添加' };
    
  } catch (error) {
    console.error('添加引薦資料失敗:', error);
    console.error('錯誤詳情:', error.toString());
    return { success: false, message: '添加引薦資料失敗: ' + error.message };
  }
}

/**
 * 添加使用記錄
 */
function addAccessLog(accessData) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName('使用記錄');
    
    // 如果工作表不存在，建立它
    if (!sheet) {
      sheet = createAccessLogSheet(spreadsheet);
    }
    
    // 準備資料（添加成員編號欄位）
    const rowData = [
      new Date(accessData.accessTime).toLocaleString('zh-TW'),
      accessData.serviceItem || '',
      accessData.referrerCode || '',
      accessData.memberCode || '',  // 添加成員編號
      accessData.accessType === 'phone' ? '電話' : 'LINE ID',
      accessData.contactValue || '',
      accessData.userAgent || ''
    ];
    
    // 添加資料到最後一行
    sheet.appendRow(rowData);
    
    console.log('使用記錄已成功添加:', accessData);
    return { success: true, message: '使用記錄已成功添加' };
    
  } catch (error) {
    console.error('添加使用記錄失敗:', error);
    return { success: false, message: '添加使用記錄失敗: ' + error.message };
  }
}

/**
 * Web App 主要處理函數
 */
function doPost(e) {
  try {
    console.log('收到 POST 請求');
    console.log('參數:', e.parameter);
    console.log('PostData:', e.postData);
    
    let requestData;
    
    // 檢查是否為表單提交
    if (e.parameter && e.parameter.data) {
      // 表單提交的資料
      console.log('從表單參數解析資料');
      requestData = JSON.parse(e.parameter.data);
    } else if (e.postData && e.postData.contents) {
      // JSON提交的資料
      console.log('從 postData 解析資料');
      requestData = JSON.parse(e.postData.contents);
    } else {
      console.error('無法找到有效資料');
      throw new Error('無效的請求資料');
    }
    
    console.log('解析後的資料:', requestData);
    const action = requestData.action;
    console.log('動作:', action);
    
    let result;
    
    switch (action) {
      case 'addReferral':
        console.log('處理引薦登記');
        result = addReferral(requestData.referralData);
        break;
        
      case 'addAccessLog':
        console.log('處理使用記錄');
        result = addAccessLog(requestData.accessData);
        break;
        
      case 'test':
        result = { success: true, message: 'Apps Script 連接正常' };
        break;
        
      default:
        result = { success: false, message: '未知的操作: ' + action };
    }
    
    console.log('處理結果:', result);
    
    // 返回 JSON 回應（添加 CORS 標頭）
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Web App 處理錯誤:', error);
    console.error('錯誤詳情:', error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: '處理請求時發生錯誤: ' + error.message
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 讀取所有引薦資料
 */
function getReferrals() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName('引薦登記');
    
    if (!sheet) {
      return { success: true, data: [] };
    }
    
    // 讀取所有資料（跳過標題行）
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    // 如果只有標題行，返回空陣列
    if (values.length <= 1) {
      return { success: true, data: [] };
    }
    
    // 轉換為 JSON 格式
    const referrals = [];
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      referrals.push({
        serviceItem: row[1] || '',          // 被引薦服務項目
        referrerCode: row[2] || '',         // 引薦人（會員編號）
        companyName: row[3] || '',          // 被引薦廠商名稱
        phone: row[4] || '',                // 廠商聯絡電話
        lineId: row[5] || '',               // 廠商LINE ID
        area: row[6] || '',                 // 廠商服務區域
        note: row[7] || '',                 // 引薦備註
        referralDate: row[0] || ''         // 引薦日期
      });
    }
    
    console.log('成功讀取引薦資料，共', referrals.length, '筆');
    return { success: true, data: referrals };
    
  } catch (error) {
    console.error('讀取引薦資料失敗:', error);
    return { success: false, message: '讀取引薦資料失敗: ' + error.message, data: [] };
  }
}

/**
 * 讀取使用記錄
 */
function getAccessLogs() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName('使用記錄');
    
    if (!sheet) {
      return { success: true, data: [] };
    }
    
    // 讀取所有資料（跳過標題行）
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    // 如果只有標題行，返回空陣列
    if (values.length <= 1) {
      return { success: true, data: [] };
    }
    
    // 轉換為 JSON 格式
    const logs = [];
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const accessType = row[4] || ''; // 查看類型：電話、LINE ID、聯絡資訊
      const contactValue = row[5] || ''; // 聯絡資訊
      
      // 解析聯絡資訊以獲取 phone 和 lineId
      let phone = '';
      let lineId = '';
      if (contactValue) {
        const phoneMatch = contactValue.match(/電話[：:]\s*([^|]+)/);
        const lineIdMatch = contactValue.match(/LINE\s*ID[：:]\s*([^|]+)/);
        if (phoneMatch) phone = phoneMatch[1].trim();
        if (lineIdMatch) lineId = lineIdMatch[1].trim();
        
        // 如果沒有解析到，根據類型判斷
        if (!phone && !lineId) {
          if (accessType === '電話') {
            phone = contactValue.trim();
          } else if (accessType === 'LINE ID') {
            lineId = contactValue.trim();
          }
        }
      }
      
      logs.push({
        accessTime: row[0] || '',          // 使用時間
        serviceItem: row[1] || '',         // 服務項目
        referrerCode: row[2] || '',        // 引薦人
        memberCode: row[3] || '',          // 成員編號
        accessType: accessType === '電話' ? 'phone' : (accessType === 'LINE ID' ? 'lineid' : 'contact'),
        contactValue: contactValue,        // 聯絡資訊
        phone: phone,                      // 電話號碼
        lineId: lineId,                    // LINE ID
        userAgent: row[6] || ''            // 瀏覽器資訊
      });
    }
    
    console.log('成功讀取使用記錄，共', logs.length, '筆');
    return { success: true, data: logs };
    
  } catch (error) {
    console.error('讀取使用記錄失敗:', error);
    return { success: false, message: '讀取使用記錄失敗: ' + error.message, data: [] };
  }
}

/**
 * Web App GET 請求處理（用於測試和讀取資料）
 */
function doGet(e) {
  try {
    const action = e.parameter ? e.parameter.action : null;
    const callback = e.parameter ? e.parameter.callback : null;
    
    let result;
    
    // 如果沒有指定 action，返回測試訊息
    if (!action) {
      result = {
        success: true,
        message: '華地產鑽石分會資源平台 Apps Script 運行正常',
        timestamp: new Date().toISOString()
      };
    } else if (action === 'getReferrals') {
      // 處理讀取引薦資料的請求
      result = getReferrals();
    } else if (action === 'getAccessLogs') {
      // 處理讀取使用記錄的請求
      result = getAccessLogs();
    } else if (action === 'getMembers') {
      // 處理讀取會員資料的請求
      result = getMembers();
    } else {
      // 預設返回測試訊息
      result = {
        success: true,
        message: '華地產鑽石分會資源平台 Apps Script 運行正常',
        timestamp: new Date().toISOString()
      };
    }
    
    // 如果提供了 callback 參數，使用 JSONP 格式
    if (callback) {
      const jsonp = callback + '(' + JSON.stringify(result) + ');';
      return ContentService
        .createTextOutput(jsonp)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    } else {
      // 否則返回標準 JSON
      return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
      
  } catch (error) {
    const errorResult = {
      success: false,
      message: '處理請求時發生錯誤: ' + error.message
    };
    
    const callback = e.parameter ? e.parameter.callback : null;
    
    if (callback) {
      const jsonp = callback + '(' + JSON.stringify(errorResult) + ');';
      return ContentService
        .createTextOutput(jsonp)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    } else {
      return ContentService
        .createTextOutput(JSON.stringify(errorResult))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
}

/**
 * 處理 OPTIONS 請求（CORS 預檢請求）
 */
function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * 測試函數
 */
function testConnection() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const title = spreadsheet.getName();
    console.log('連接成功，工作表名稱:', title);
    return { success: true, title: title };
  } catch (error) {
    console.error('連接失敗:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 簡化測試函數 - 只測試連接
 */
function testSimpleConnection() {
  try {
    console.log('測試連接...');
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    console.log('✅ 連接成功');
    return '連接成功';
  } catch (error) {
    console.error('❌ 連接失敗:', error);
    return '連接失敗: ' + error.message;
  }
}

/**
 * 測試創建單一工作表
 */
function testCreateSingleSheet() {
  try {
    console.log('測試創建單一工作表...');
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // 只創建引薦登記工作表
    let sheet = spreadsheet.getSheetByName('引薦登記');
    if (!sheet) {
      sheet = spreadsheet.insertSheet('引薦登記');
      console.log('✅ 引薦登記工作表創建成功');
    } else {
      console.log('✅ 引薦登記工作表已存在');
    }
    
    return '測試完成';
  } catch (error) {
    console.error('❌ 測試失敗:', error);
    return '測試失敗: ' + error.message;
  }
}