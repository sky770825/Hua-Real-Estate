/**
 * Cloudflare Workers 示例代碼
 * 用於安全地上傳圖片到 Cloudflare R2
 * 
 * 部署步驟：
 * 1. 在 Cloudflare Dashboard 創建一個 Worker
 * 2. 將此代碼複製到 Worker 編輯器
 * 3. 在 Worker 設置中添加環境變量：
 *    - R2_BUCKET: 您的 R2 存儲桶綁定名稱
 *    - UPLOAD_PASSWORD: 上傳密碼（可選，用於額外安全）
 * 4. 在 Worker 設置中綁定 R2 存儲桶
 * 5. 部署 Worker 並獲取 URL
 * 6. 在 invite.html 中將 R2_CONFIG.apiEndpoint 設置為 Worker URL
 */

export default {
  async fetch(request, env) {
    // 處理 CORS 預檢請求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // 只允許 POST 請求
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      // 獲取表單數據
      const formData = await request.formData();
      const file = formData.get('file');
      const fileName = formData.get('fileName') || `image_${Date.now()}.jpg`;
      const index = formData.get('index') || '1';

      if (!file) {
        return new Response(
          JSON.stringify({ success: false, error: '沒有文件' }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }

      // 驗證文件類型
      if (!file.type.startsWith('image/')) {
        return new Response(
          JSON.stringify({ success: false, error: '只允許上傳圖片' }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }

      // 驗證文件大小（最大 10MB）
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        return new Response(
          JSON.stringify({ success: false, error: '文件大小不能超過 10MB' }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }

      // 上傳到 R2
      // 注意：需要在 Worker 設置中綁定 R2 存儲桶
      const r2Bucket = env.R2_BUCKET; // 從環境變量獲取 R2 綁定
      
      if (!r2Bucket) {
        return new Response(
          JSON.stringify({ success: false, error: 'R2 存儲桶未配置' }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }

      // 將文件轉換為 ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // 上傳到 invite-photo 目錄
      const uploadPath = 'invite-photo';
      const objectKey = `${uploadPath}/${fileName}`;
      
      // 上傳到 R2（使用完整路徑）
      await r2Bucket.put(objectKey, arrayBuffer, {
        httpMetadata: {
          contentType: file.type,
        },
        customMetadata: {
          uploadedAt: new Date().toISOString(),
          originalName: file.name,
          index: index,
        },
      });

      // 構建公開 URL（如果存儲桶配置為公開）
      // 注意：需要根據您的 R2 配置調整 URL
      const publicUrl = `https://82ebeb1d91888e83e8e1b30eeb33d3c3.r2.cloudflarestorage.com/hua-real-estate/${objectKey}`;
      
      // 或者使用自定義域名（如果配置了）
      // const publicUrl = `https://your-custom-domain.com/${objectKey}`;

      return new Response(
        JSON.stringify({
          success: true,
          url: publicUrl,
          fileName: fileName,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    } catch (error) {
      console.error('上傳錯誤:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message || '上傳失敗',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }
  },
};
