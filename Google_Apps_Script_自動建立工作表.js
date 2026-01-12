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
  
  // 設定標題行（添加成員編號、姓名和廠商名稱欄位）
  const headers = [
    '使用時間',
    '服務項目',
    '引薦人',
    '成員編號',
    '成員姓名',
    '廠商名稱',
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
  
  // 設定標題行（添加E欄：Email）
  const headers = ['會員編號', '姓名', '密碼', '專業類別', 'Email'];
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
    sheet.setColumnWidth(3, 80);  // 密碼
    sheet.setColumnWidth(4, 200); // 專業類別
    sheet.setColumnWidth(5, 250); // Email
    
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
    sheet.getRange(2, 4, 1000, 1).setDataValidation(validationRule);
    
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
          password: row[2] ? String(row[2]).trim() : '', // 密碼（C欄）
          professionalCategory: row[3] ? String(row[3]).trim() : '', // 專業類別（D欄）
          email: row[4] ? String(row[4]).trim() : '' // Email（E欄）
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
 * 獲取會員Email
 */
function getMemberEmail(memberCode) {
  try {
    console.log('🔍 查找會員Email，會員編號:', memberCode);
    
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName('會員資料');
    
    if (!sheet) {
      console.log('❌ 找不到會員資料工作表');
      return null;
    }
    
    const data = sheet.getDataRange().getValues();
    console.log('📊 會員資料總行數:', data.length);
    
    // 清理會員編號（移除空格和非數字字符，但保留原始格式用於比對）
    const cleanMemberCode = String(memberCode).trim();
    
    // 從第2行開始查找（跳過標題行）
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowCode = String(row[0]).trim();
      
      // 嘗試多種比對方式
      if (rowCode === cleanMemberCode || 
          rowCode === cleanMemberCode.padStart(3, '0') ||
          rowCode === String(parseInt(cleanMemberCode, 10))) {
        const email = row[4] ? String(row[4]).trim() : '';
        console.log('✅ 找到會員，Email:', email || '未設定');
        return email || null;
      }
    }
    
    console.log('⚠️ 找不到會員編號:', memberCode);
    return null;
  } catch (error) {
    console.error('❌ 獲取會員Email失敗:', error);
    return null;
  }
}

/**
 * 獲取會員姓名
 */
function getMemberName(memberCode) {
  try {
    console.log('🔍 查找會員姓名，會員編號:', memberCode);
    
    if (!memberCode) {
      return null;
    }
    
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName('會員資料');
    
    if (!sheet) {
      console.log('❌ 找不到會員資料工作表');
      return null;
    }
    
    const data = sheet.getDataRange().getValues();
    console.log('📊 會員資料總行數:', data.length);
    
    // 清理會員編號（移除空格和非數字字符）
    const cleanMemberCode = String(memberCode).trim().replace(/[^0-9]/g, '');
    
    // 從第2行開始查找（跳過標題行）
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowCode = String(row[0]).trim().replace(/[^0-9]/g, '');
      
      // 嘗試多種比對方式
      if (rowCode === cleanMemberCode || 
          rowCode === cleanMemberCode.padStart(3, '0') ||
          rowCode === String(parseInt(cleanMemberCode, 10))) {
        const name = row[1] ? String(row[1]).trim() : null;
        console.log('✅ 找到會員，姓名:', name || '未設定');
        return name;
      }
    }
    
    console.log('⚠️ 找不到會員編號:', memberCode);
    return null;
  } catch (error) {
    console.error('❌ 獲取會員姓名失敗:', error);
    return null;
  }
}

/**
 * 根據服務項目和引薦人編號查詢引薦資料
 * @param {string} serviceItem - 服務項目
 * @param {string} referrerCode - 引薦人編號
 * @param {string} phone - 電話號碼
 * @param {string} lineId - LINE ID（可選）
 * @param {string} area - 服務區域（可選）
 * @param {string} note - 引薦備註（可選）
 */
function getReferralInfo(serviceItem, referrerCode, phone, lineId, area, note) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName('引薦登記');
    
    if (!sheet) {
      return null;
    }
    
    const data = sheet.getDataRange().getValues();
    
    // 標準化電話號碼格式（移除空格、連字號等，只保留數字）
    const normalizePhone = function(phoneStr) {
      if (!phoneStr) return '';
      // 移除所有非數字字符
      let cleaned = phoneStr.replace(/[^\d]/g, '');
      // 如果電話號碼以 0 開頭且長度不足 10 碼，保持原樣
      // 如果電話號碼以 +886 開頭，轉換為 0 開頭
      if (cleaned.startsWith('886')) {
        cleaned = '0' + cleaned.substring(3);
      }
      return cleaned;
    };
    
    const normalizedPhone = phone ? normalizePhone(phone) : '';
    console.log('查詢引薦資料 - 原始電話:', phone, '標準化後:', normalizedPhone);
    console.log('查詢引薦資料 - LINE ID:', lineId || '未提供');
    console.log('查詢引薦資料 - 服務區域:', area || '未提供');
    console.log('查詢引薦資料 - 引薦備註:', note || '未提供');
    
    // 優先查找精確匹配的記錄（服務項目 + 引薦人編號 + 電話號碼 + 其他欄位完全匹配）
    let exactMatch = null;
    let bestMatch = null; // 最佳匹配（匹配分數最高）
    let bestMatchScore = 0;
    // 備用匹配（只有服務項目 + 引薦人編號匹配，但電話號碼不匹配）
    let fallbackMatch = null;
    
    // 標準化引薦人編號（提取純數字部分）
    const normalizeReferrerCode = function(code) {
      if (!code) return '';
      // 提取所有數字部分
      const numericPart = String(code).replace(/[^0-9]/g, '');
      return numericPart;
    };
    
    const normalizedReferrerCode = normalizeReferrerCode(referrerCode);
    console.log('查詢引薦資料 - 原始引薦人編號:', referrerCode, '標準化後:', normalizedReferrerCode);
    
    // 從第2行開始查找（跳過標題行）
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowServiceItem = String(row[1] || '').trim();
      const rowReferrerCode = String(row[2] || '').trim();
      const rowPhone = String(row[4] || '').trim();
      
      // 標準化資料庫中的引薦人編號
      const normalizedRowReferrerCode = normalizeReferrerCode(rowReferrerCode);
      
      // 比對服務項目和引薦人編號（使用標準化後的編號）
      const matchServiceItem = rowServiceItem === serviceItem;
      const matchReferrerCode = normalizedRowReferrerCode === normalizedReferrerCode || rowReferrerCode === referrerCode;
      
      if (!matchServiceItem || !matchReferrerCode) {
        continue; // 如果服務項目或引薦人編號不匹配，跳過
      }
      
      // 讀取其他欄位
      const rowLineId = String(row[5] || '').trim();
      const rowArea = String(row[6] || '').trim();
      const rowNote = String(row[7] || '').trim();
      
      // 如果有提供電話號碼，進行精確匹配
      if (normalizedPhone) {
        const normalizedRowPhone = normalizePhone(rowPhone);
        console.log(`  比對第 ${i + 1} 行: 資料庫電話 "${normalizedRowPhone}" vs 查詢電話 "${normalizedPhone}"`);
        
        // 精確匹配電話號碼
        if (normalizedRowPhone === normalizedPhone) {
          // 計算匹配分數（電話匹配 = 10分，其他欄位每個匹配 = 5分）
          let matchScore = 10; // 電話號碼匹配
          
          // 匹配 LINE ID
          if (lineId && rowLineId && lineId.trim().toLowerCase() === rowLineId.trim().toLowerCase()) {
            matchScore += 5;
            console.log(`    ✅ LINE ID 匹配: "${lineId}"`);
          }
          
          // 匹配服務區域
          if (area && rowArea && area.trim() === rowArea.trim()) {
            matchScore += 5;
            console.log(`    ✅ 服務區域匹配: "${area}"`);
          }
          
          // 匹配引薦備註（部分匹配也可）
          if (note && rowNote) {
            const noteMatch = rowNote.toLowerCase().includes(note.toLowerCase()) || 
                             note.toLowerCase().includes(rowNote.toLowerCase());
            if (noteMatch) {
              matchScore += 5;
              console.log(`    ✅ 引薦備註匹配: "${note}"`);
            }
          }
          
          console.log(`    匹配分數: ${matchScore}`);
          
          // 記錄最佳匹配
          if (matchScore > bestMatchScore) {
            bestMatchScore = matchScore;
            bestMatch = {
              companyName: String(row[3] || '').trim(),
              phone: rowPhone,
              lineId: rowLineId,
              area: rowArea,
              note: rowNote,
              referralDate: String(row[0] || '').trim(),
              matchScore: matchScore
            };
          }
          
          // 如果所有提供的欄位都匹配，視為完全匹配
          let allMatch = true;
          if (lineId && (!rowLineId || lineId.trim().toLowerCase() !== rowLineId.trim().toLowerCase())) {
            allMatch = false;
          }
          if (area && (!rowArea || area.trim() !== rowArea.trim())) {
            allMatch = false;
          }
          
          if (allMatch) {
            exactMatch = {
              companyName: String(row[3] || '').trim(),
              phone: rowPhone,
              lineId: rowLineId,
              area: rowArea,
              note: rowNote,
              referralDate: String(row[0] || '').trim()
            };
            console.log('✅ 找到完全匹配（所有欄位都匹配）:', exactMatch);
            console.log('  廠商名稱:', exactMatch.companyName);
            // 找到完全匹配，立即返回
            return exactMatch;
          }
        }
      } else {
        // 如果沒有提供電話號碼，記錄第一個匹配的記錄作為備用匹配
        if (!fallbackMatch) {
          fallbackMatch = {
            companyName: String(row[3] || '').trim(),
            phone: rowPhone,
            lineId: String(row[5] || '').trim(),
            area: String(row[6] || '').trim(),
            note: String(row[7] || '').trim(),
            referralDate: String(row[0] || '').trim()   // 引薦日期
          };
          console.log('📋 找到備用匹配（服務項目 + 引薦人編號，無電話號碼）:', fallbackMatch);
        }
      }
    }
    
    // 如果有提供電話號碼但沒有找到完全匹配，返回最佳匹配
    if (normalizedPhone && !exactMatch) {
      if (bestMatch) {
        console.log(`⚠️ 使用最佳匹配（匹配分數: ${bestMatchScore}）:`);
        console.log('  廠商名稱:', bestMatch.companyName);
        // 移除 matchScore 後返回
        delete bestMatch.matchScore;
        return bestMatch;
      } else {
        console.log('⚠️ 已提供電話號碼但未找到匹配記錄');
        console.log('查詢條件:', { serviceItem, referrerCode, phone: normalizedPhone, lineId, area, note });
        return null;
      }
    }
    
    // 如果沒有精確匹配且沒有提供電話號碼，返回備用匹配
    if (fallbackMatch) {
      console.log('⚠️ 使用備用匹配（未提供電話號碼）');
      return fallbackMatch;
    }
    
    console.log('❌ 未找到匹配的引薦資料');
    console.log('查詢條件:', { serviceItem, referrerCode, phone: normalizedPhone });
    
    return null;
  } catch (error) {
    console.error('查詢引薦資料失敗:', error);
    return null;
  }
}

/**
 * 發送引薦通知郵件
 * @param {string} referrerCode - 引薦人編號
 * @param {string} userMemberCode - 使用人會員編號
 * @param {string} userMemberName - 使用人姓名
 * @param {string} serviceItem - 服務項目
 * @param {string} phone - 電話號碼
 * @param {string} lineId - LINE ID（可選）
 * @param {string} area - 服務區域（可選）
 * @param {string} note - 引薦備註（可選）
 */
function sendReferralNotificationEmail(referrerCode, userMemberCode, userMemberName, serviceItem, phone, lineId, area, note) {
  try {
    console.log('📧 開始處理郵件通知...');
    console.log('參數:', { referrerCode, userMemberCode, userMemberName, serviceItem, phone, lineId, area, note });
    
    // 獲取引薦人的Email
    const referrerEmail = getMemberEmail(referrerCode);
    console.log('引薦人Email:', referrerEmail || '未找到');
    
    if (!referrerEmail) {
      console.log('⚠️ 引薦人沒有設定Email，跳過郵件發送。引薦人編號:', referrerCode);
      return { success: false, message: '引薦人未設定Email' };
    }
    
    // 獲取引薦人姓名
    const referrerName = getMemberName(referrerCode) || referrerCode;
    console.log('引薦人姓名:', referrerName);
    
    // 查詢引薦資料（廠商名稱、電話等）- 使用電話號碼精確匹配
    console.log('📋 查詢引薦資料 - 參數:');
    console.log('  - 服務項目:', serviceItem);
    console.log('  - 引薦人編號:', referrerCode);
    console.log('  - 電話號碼:', phone || '未提供');
    
    // 注意：目前 getReferralInfo 需要從 accessData 中獲取更多資訊
    // 但 sendReferralNotificationEmail 只接收 phone 參數
    // 暫時先使用 phone 進行匹配，後續可以擴展參數
    const referralInfo = getReferralInfo(serviceItem, referrerCode, phone || '', lineId || '', area || '', note || '');
    console.log('📋 查詢結果:', referralInfo ? '找到' : '未找到');
    if (referralInfo) {
      console.log('  - 廠商名稱:', referralInfo.companyName);
      console.log('  - 電話:', referralInfo.phone);
      console.log('  - LINE ID:', referralInfo.lineId);
      console.log('  - 服務區域:', referralInfo.area);
    }
    
    // 準備郵件內容
    const subject = `【華地產鑽石分會】有人使用了您的引薦服務`;
    
    // 格式化引薦日期
    let formattedDate = '未提供';
    if (referralInfo && referralInfo.referralDate) {
      try {
        const date = new Date(referralInfo.referralDate);
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          formattedDate = `${year}年${month}月${day}日`;
        } else {
          formattedDate = referralInfo.referralDate;
        }
      } catch (e) {
        formattedDate = referralInfo.referralDate || '未提供';
      }
    }
    
    // 構建引薦資訊部分（確保所有欄位都顯示）
    let referralDetails = '';
    if (referralInfo) {
      referralDetails = `
【引薦服務完整資訊】

═══════════════════════════════════
📋 服務項目：${serviceItem}
🏢 廠商名稱：${referralInfo.companyName || '未提供'}
📞 聯絡電話：${referralInfo.phone || '未提供'}
💬 LINE ID：${referralInfo.lineId || '未提供'}
📍 服務區域：${referralInfo.area || '未提供'}
📝 備註說明：${referralInfo.note || '無'}
📅 引薦日期：${formattedDate}
═══════════════════════════════════`;
    } else {
      referralDetails = `
【引薦服務項目】
⚠️ 僅查詢到服務項目：${serviceItem}
⚠️ 未找到完整的引薦登記資料（可能是因為電話號碼不匹配或資料不存在）
      
建議：請確認引薦登記工作表中是否有對應的資料。`;
    }
    
    const emailBody = `
親愛的 ${referrerName} 會員，您好！

有人使用了您的引薦服務，詳細資訊如下：

【使用人資訊】
會員編號：${userMemberCode}
姓名：${userMemberName}
${referralDetails}

【重要提醒】
請記得至 BNI Connect 系統 KEY 引薦對象給使用人（會員編號：${userMemberCode} ${userMemberName}）

感謝您的服務！

---
華地產鑽石分會資源平台
本郵件由系統自動發送，請勿直接回覆。
    `.trim();
    
    console.log('📝 郵件內容準備完成');
    console.log('收件人:', referrerEmail);
    console.log('主旨:', subject);
    
    // 發送郵件
    MailApp.sendEmail({
      to: referrerEmail,
      subject: subject,
      body: emailBody
    });
    
    console.log('✅ 郵件已成功發送給:', referrerEmail);
    return { success: true, message: '郵件已成功發送', email: referrerEmail };
    
  } catch (error) {
    console.error('❌ 發送郵件失敗:', error);
    console.error('錯誤詳情:', error.toString());
    return { success: false, message: '發送郵件失敗: ' + error.message };
  }
}

/**
 * 發送引薦資料郵件給客戶
 */
function sendReferralInfoToCustomer(customerEmail, customerName, customerCode, referralData) {
  try {
    console.log('📧 開始處理發送引薦資料郵件給客戶...');
    console.log('參數:', { customerEmail, customerName, customerCode, referralData });
    
    // 驗證客戶 Email
    if (!customerEmail || customerEmail.trim() === '') {
      console.log('⚠️ 客戶沒有設定 Email，跳過郵件發送');
      return { success: false, message: '客戶未設定 Email' };
    }
    
    // 驗證引薦資料
    if (!referralData) {
      console.log('⚠️ 引薦資料為空，無法發送郵件');
      return { success: false, message: '引薦資料為空' };
    }
    
    // 準備郵件內容
    const subject = `【華地產鑽石分會】引薦服務資訊 - ${referralData.serviceItem || '服務項目'}`;
    
    // 格式化引薦日期
    let formattedDate = '未提供';
    if (referralData.referralDate) {
      try {
        const date = new Date(referralData.referralDate);
        if (!isNaN(date.getTime())) {
          // 格式化為台灣日期格式：YYYY年MM月DD日
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          formattedDate = `${year}年${month}月${day}日`;
        } else {
          formattedDate = referralData.referralDate; // 如果無法解析，使用原始值
        }
      } catch (e) {
        formattedDate = referralData.referralDate; // 如果格式化失敗，使用原始值
      }
    }
    
    // 構建引薦資訊內容（確保所有欄位都顯示）
    let referralDetails = '';
    referralDetails += `【引薦服務完整資訊】

═══════════════════════════════════
📋 服務項目：${referralData.serviceItem || '未提供'}
👤 引薦人編號：${referralData.referrerCode || '未提供'}
🏢 廠商名稱：${referralData.companyName || '未提供'}
📞 聯絡電話：${referralData.phone || '未提供'}
💬 LINE ID：${referralData.lineId || '未提供'}
📍 服務區域：${referralData.area || '未提供'}
📝 備註說明：${referralData.note || '無'}
📅 引薦日期：${formattedDate}
═══════════════════════════════════`;
    
    const emailBody = `
親愛的 ${customerName || '會員'}（會員編號：${customerCode || '未知'}），您好！

您剛才查詢的引薦服務詳細資訊如下：

${referralDetails}

【重要提醒】
請記得至 BNI Connect 系統 KEY 引薦對象給引薦人（會員編號：${referralData.referrerCode || '未知'}），感謝引薦人的服務！

如有任何問題，請聯繫系統管理員。

感謝您的使用！

---
華地產鑽石分會資源平台
本郵件由系統自動發送，請勿直接回覆。
    `.trim();
    
    console.log('📝 郵件內容準備完成');
    console.log('收件人:', customerEmail);
    console.log('主旨:', subject);
    
    // 發送郵件
    MailApp.sendEmail({
      to: customerEmail,
      subject: subject,
      body: emailBody
    });
    
    console.log('✅ 郵件已成功發送給客戶:', customerEmail);
    return { success: true, message: '郵件已成功發送', email: customerEmail };
    
  } catch (error) {
    console.error('❌ 發送郵件失敗:', error);
    console.error('錯誤詳情:', error.toString());
    return { success: false, message: '發送郵件失敗: ' + error.message };
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
    // 判斷查看類型顯示文字
    let accessTypeText = '聯絡資訊';
    if (accessData.accessType === 'phone') {
      accessTypeText = '電話';
    } else if (accessData.accessType === 'lineid') {
      accessTypeText = 'LINE ID';
    } else if (accessData.accessType === 'contact') {
      accessTypeText = '聯絡資訊';
    }
    
    // 獲取成員姓名（優先使用前端傳入的，如果沒有則根據成員編號查詢）
    const memberCode = accessData.memberCode || '';
    let memberName = accessData.memberName || '';
    if (!memberName && memberCode) {
      memberName = getMemberName(memberCode) || '';
    }
    
    // 獲取廠商名稱（優先使用前端傳入的，如果沒有則根據服務項目、引薦人編號和電話號碼查詢）
    let companyName = accessData.companyName || '';
    
    if (!companyName) {
      // 從 contactValue 中解析電話號碼
      let phoneFromContact = '';
      if (accessData.contactValue) {
        const phoneMatch = accessData.contactValue.match(/電話[：:]\s*([^|]+)/);
        if (phoneMatch) {
          phoneFromContact = phoneMatch[1].trim();
        }
      }
      
      const referralInfo = getReferralInfo(accessData.serviceItem, accessData.referrerCode, phoneFromContact);
      companyName = referralInfo ? (referralInfo.companyName || '') : '';
    }
    
    const rowData = [
      new Date(accessData.accessTime).toLocaleString('zh-TW'),
      accessData.serviceItem || '',
      accessData.referrerCode || '',
      memberCode,                    // 成員編號
      memberName,                    // 成員姓名
      companyName,                   // 廠商名稱（新增）
      accessTypeText,
      accessData.contactValue || '',
      accessData.userAgent || ''
    ];
    
    // 添加資料到最後一行
    sheet.appendRow(rowData);
    
    console.log('使用記錄已成功添加:', accessData);
    console.log('📊 記錄詳情:');
    console.log('  - 成員編號:', memberCode);
    console.log('  - 成員姓名:', memberName || '未找到');
    console.log('  - 廠商名稱:', companyName || '未找到');
    console.log('  - 聯絡資訊:', accessData.contactValue || '無');
    
    // 如果有引薦人編號和使用人編號，發送郵件通知
    if (accessData.referrerCode && accessData.memberCode && accessData.serviceItem) {
      console.log('📧 準備發送郵件通知...');
      console.log('引薦人編號:', accessData.referrerCode);
      console.log('使用人編號:', accessData.memberCode);
      console.log('服務項目:', accessData.serviceItem);
      
      // 優先使用直接傳遞的 phone 欄位，如果沒有則從 contactValue 中解析
      let phoneFromContact = '';
      if (accessData.phone) {
        phoneFromContact = accessData.phone.trim();
      } else if (accessData.contactValue) {
        const phoneMatch = accessData.contactValue.match(/電話[：:]\s*([^|]+)/);
        if (phoneMatch) {
          phoneFromContact = phoneMatch[1].trim();
        }
      }
      
      // 解析 LINE ID
      let lineIdFromContact = '';
      if (accessData.lineId) {
        lineIdFromContact = accessData.lineId.trim();
      } else if (accessData.contactValue) {
        const lineIdMatch = accessData.contactValue.match(/LINE\s*ID[：:]\s*([^|]+)/);
        if (lineIdMatch) {
          lineIdFromContact = lineIdMatch[1].trim();
        }
      }
      
      // 獲取服務區域和引薦備註（用於多條件比對）
      const areaFromData = accessData.area || '';
      const noteFromData = accessData.note || '';
      
      // 使用已查詢的 memberName，避免重複查詢
      const userMemberName = memberName || accessData.memberCode;
      console.log('📧 郵件發送參數:');
      console.log('  - 引薦人編號:', accessData.referrerCode);
      console.log('  - 使用人編號:', accessData.memberCode);
      console.log('  - 使用人姓名:', userMemberName);
      console.log('  - 服務項目:', accessData.serviceItem);
      console.log('  - 聯絡電話:', phoneFromContact || '未提供');
      console.log('  - LINE ID:', lineIdFromContact || '未提供');
      console.log('  - 服務區域:', areaFromData || '未提供');
      console.log('  - 引薦備註:', noteFromData || '未提供');
      console.log('  - 直接傳遞的 phone 欄位:', accessData.phone || '無');
      console.log('  - contactValue:', accessData.contactValue || '無');
      
      const emailResult = sendReferralNotificationEmail(
        accessData.referrerCode,
        accessData.memberCode,
        userMemberName,
        accessData.serviceItem,
        phoneFromContact,
        lineIdFromContact,
        areaFromData,
        noteFromData
      );
      
      if (emailResult.success) {
        console.log('✅ 郵件通知已成功發送');
      } else {
        console.warn('⚠️ 郵件通知發送失敗:', emailResult.message);
      }
    } else {
      console.log('⚠️ 跳過郵件通知 - 缺少必要資訊:');
      console.log('  - referrerCode:', accessData.referrerCode || '無');
      console.log('  - memberCode:', accessData.memberCode || '無');
      console.log('  - serviceItem:', accessData.serviceItem || '無');
    }
    
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
        
      case 'sendReferralInfoToCustomer':
        console.log('處理發送引薦資料郵件給客戶');
        result = sendReferralInfoToCustomer(
          requestData.customerEmail,
          requestData.customerName,
          requestData.customerCode,
          requestData.referralData
        );
        break;
        
      case 'test':
        result = { success: true, message: 'Apps Script 連接正常' };
        break;
        
      default:
        result = { success: false, message: '未知的操作: ' + action };
    }
    
    console.log('處理結果:', result);
    
    // 返回 JSON 回應
    // 注意：Google Apps Script 不支持 setHeaders() 設置自定義 HTTP 標頭
    // CORS 需要在部署 Web App 時正確設置：
    // 1. 執行身份：選擇「我」
    // 2. 具有訪問權限的用戶：選擇「任何人」或「任何人（包括匿名用戶）」
    const output = ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
    
    return output;
      
  } catch (error) {
    console.error('Web App 處理錯誤:', error);
    console.error('錯誤詳情:', error.toString());
    const errorOutput = ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: '處理請求時發生錯誤: ' + error.message
      }))
      .setMimeType(ContentService.MimeType.JSON);
    
    return errorOutput;
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
      const accessType = row[6] || ''; // 查看類型：電話、LINE ID、聯絡資訊（欄位索引調整）
      const contactValue = row[7] || ''; // 聯絡資訊（欄位索引調整）
      
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
      
      // 從工作表讀取成員編號、姓名和廠商名稱
      const memberCode = row[3] || '';
      const memberName = row[4] || '';
      const companyName = row[5] || '';
      
      logs.push({
        accessTime: row[0] || '',          // 使用時間
        serviceItem: row[1] || '',         // 服務項目
        referrerCode: row[2] || '',        // 引薦人
        memberCode: memberCode,            // 成員編號
        memberName: memberName,            // 成員姓名
        companyName: companyName,          // 廠商名稱（新增）
        accessType: accessType === '電話' ? 'phone' : (accessType === 'LINE ID' ? 'lineid' : 'contact'),
        contactValue: contactValue,        // 聯絡資訊
        phone: phone,                      // 電話號碼
        lineId: lineId,                    // LINE ID
        userAgent: row[8] || ''            // 瀏覽器資訊（欄位索引調整）
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
  const output = ContentService
    .createTextOutput('');
  
  // 注意：Google Apps Script 不支持直接設置 HTTP 標頭
  // 需要在部署 Web App 時設置 CORS 選項
  // 這個函數返回空響應，讓瀏覽器知道允許請求
  return output;
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

/**
 * 測試郵件發送功能（實際案例：2號使用016號的引薦）
 * 使用方法：在 Apps Script 編輯器中執行此函數
 */
function testEmailSending() {
  try {
    console.log('🧪 開始測試郵件發送功能...');
    console.log('📋 測試案例：會員 2號 使用了 引薦人 016號 的廠商服務');
    console.log('📧 應該發信給 016號，通知他 2號 使用了他的引薦資料');
    console.log('');
    
    // 實際測試案例
    const referrerCode = '016';        // 引薦人編號：016號
    const userMemberCode = '2';        // 使用人編號：2號
    const serviceItem = '測試服務項目'; // 服務項目
    
    console.log('測試參數:');
    console.log('  - 引薦人編號（收件人）:', referrerCode);
    console.log('  - 使用人編號:', userMemberCode);
    console.log('  - 服務項目:', serviceItem);
    console.log('');
    
    // 檢查引薦人（016號）的 Email
    console.log('🔍 檢查引薦人（016號）的 Email...');
    const referrerEmail = getMemberEmail(referrerCode);
    console.log('引薦人 Email:', referrerEmail || '未找到');
    
    if (!referrerEmail) {
      console.log('❌ 測試失敗：引薦人（016號）沒有設定 Email');
      console.log('💡 請確認「會員資料」工作表中，016號的 E欄是否有填寫 Email');
      return { success: false, message: '引薦人未設定 Email' };
    }
    
    // 獲取使用人（2號）的姓名
    console.log('🔍 獲取使用人（2號）的姓名...');
    const userMemberName = getMemberName(userMemberCode) || userMemberCode;
    console.log('使用人姓名:', userMemberName);
    console.log('');
    
    // 發送測試郵件
    console.log('📧 準備發送郵件給引薦人（016號）...');
    const result = sendReferralNotificationEmail(
      referrerCode,      // 發給 016號
      userMemberCode,    // 使用人是 2號
      userMemberName,    // 2號的姓名
      serviceItem,       // 服務項目
      ''                 // 電話號碼（測試時可為空）
    );
    
    console.log('');
    console.log('測試結果:', result);
    
    if (result.success) {
      console.log('✅ 郵件已成功發送給:', result.email);
      console.log('📬 請檢查 016號 的 Email 收件匣（包含垃圾郵件資料夾）');
    } else {
      console.log('❌ 郵件發送失敗:', result.message);
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ 測試郵件發送失敗:', error);
    return { success: false, message: '測試失敗: ' + error.message };
  }
}

/**
 * 檢查特定會員的 Email
 * 使用方法：checkMemberEmail('001')
 */
function checkMemberEmail(memberCode) {
  try {
    console.log('🔍 檢查會員 Email，編號:', memberCode);
    const email = getMemberEmail(memberCode);
    const name = getMemberName(memberCode);
    
    console.log('會員編號:', memberCode);
    console.log('會員姓名:', name || '未找到');
    console.log('Email:', email || '未設定');
    
    return {
      memberCode: memberCode,
      name: name,
      email: email
    };
  } catch (error) {
    console.error('❌ 檢查失敗:', error);
    return { error: error.message };
  }
}