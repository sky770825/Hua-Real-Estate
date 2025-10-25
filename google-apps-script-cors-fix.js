/**
 * Google Apps Script - 修復 CORS 問題
 * 華地產鑽石分會網站
 * 作者: 資訊長 蔡濬瑒
 */

// 在 Google Apps Script 的 doGet 函數中添加以下代碼：

function doGet(e) {
  // 設定 CORS 標頭
  const response = ContentService.createTextOutput();
  response.setMimeType(ContentService.MimeType.JSON);
  
  try {
    // 您的原始邏輯
    const result = {
      success: true,
      data: getAllData(), // 您的資料載入函數
      timestamp: new Date().toISOString(),
      sheetsFound: Object.keys(getAllData()).length
    };
    
    return response.setContent(JSON.stringify(result));
    
  } catch (error) {
    const errorResult = {
      success: false,
      error: error.toString(),
      timestamp: new Date().toISOString()
    };
    
    return response.setContent(JSON.stringify(errorResult));
  }
}

// 或者使用 doPost 函數（如果使用 POST 請求）
function doPost(e) {
  // 設定 CORS 標頭
  const response = ContentService.createTextOutput();
  response.setMimeType(ContentService.MimeType.JSON);
  
  try {
    const action = e.parameter.action;
    let result;
    
    switch(action) {
      case 'getAll':
        result = {
          success: true,
          data: getAllData(),
          timestamp: new Date().toISOString(),
          sheetsFound: Object.keys(getAllData()).length
        };
        break;
      case 'getSheet':
        const sheetKey = e.parameter.sheet;
        result = {
          success: true,
          data: getSheetData(sheetKey),
          timestamp: new Date().toISOString()
        };
        break;
      default:
        result = {
          success: false,
          error: '未知的 action 參數',
          timestamp: new Date().toISOString()
        };
    }
    
    return response.setContent(JSON.stringify(result));
    
  } catch (error) {
    const errorResult = {
      success: false,
      error: error.toString(),
      timestamp: new Date().toISOString()
    };
    
    return response.setContent(JSON.stringify(errorResult));
  }
}

// 您的資料載入函數
function getAllData() {
  const spreadsheetId = '1a0_D3ThrBNNrQyhFP1f9gOpIMjf8K2o8d91jia_jGIU';
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  
  const data = {};
  
  // 讀取所有工作表
  const sheets = spreadsheet.getSheets();
  sheets.forEach(sheet => {
    const sheetName = sheet.getName();
    const values = sheet.getDataRange().getValues();
    
    if (values.length > 1) {
      const headers = values[0];
      const rows = values.slice(1);
      
      data[sheetName] = rows.map(row => {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = row[index];
        });
        return obj;
      });
    }
  });
  
  return data;
}

function getSheetData(sheetKey) {
  const spreadsheetId = '1a0_D3ThrBNNrQyhFP1f9gOpIMjf8K2o8d91jia_jGIU';
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  const sheet = spreadsheet.getSheetByName(sheetKey);
  
  if (!sheet) {
    throw new Error(`找不到工作表: ${sheetKey}`);
  }
  
  const values = sheet.getDataRange().getValues();
  
  if (values.length <= 1) {
    return [];
  }
  
  const headers = values[0];
  const rows = values.slice(1);
  
  return rows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
}
