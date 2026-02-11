import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_BUCKET, SUPABASE_FOLDER } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ 請在 .env 設定 SUPABASE_URL 與 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const bucket = SUPABASE_BUCKET || 'hua-real-estate';
const folder = SUPABASE_FOLDER || 'hua-real-estate/invite-photo';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function uploadOne(localPath, remoteName) {
  const absPath = path.resolve(localPath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`找不到檔案：${absPath}`);
  }

  const fileBuffer = fs.readFileSync(absPath);
  const ext = path.extname(absPath).toLowerCase();
  const contentType =
    ext === '.png' ? 'image/png' :
    ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
    'application/octet-stream';

  const storagePath = `${folder}/${remoteName}`;

  console.log(`⬆️ 上傳 ${absPath} → ${storagePath}`);

  const { error } = await supabase
    .storage
    .from(bucket)
    .upload(storagePath, fileBuffer, {
      upsert: true,
      contentType,
    });

  if (error) throw error;

  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${storagePath}`;
  console.log(`✅ 完成：${publicUrl}`);
}

async function main() {
  const [image1Local, image2Local] = process.argv.slice(2);
  if (!image1Local || !image2Local) {
    console.log('用法：npm run upload:invite -- ./圖片1路徑 ./圖片2路徑');
    process.exit(1);
  }

  try {
    await uploadOne(image1Local, 'image1');
    await uploadOne(image2Local, 'image2');
    console.log('🎉 兩張圖片已成功覆蓋 image1 / image2');
  } catch (err) {
    console.error('❌ 上傳失敗：', err.message);
    process.exit(1);
  }
}

main();

