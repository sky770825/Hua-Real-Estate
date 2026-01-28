// 測試會員新增和刪除功能
// 預設使用本地開發環境，可透過環境變數 BASE_URL 覆蓋
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function testMemberCRUD() {
  console.log('🧪 開始測試會員 CRUD 功能...\n');

  const testMemberId = 9999;
  const testMember = {
    id: testMemberId,
    name: '測試會員',
    profession: '測試專業'
  };

  try {
    // 1. 測試新增會員
    console.log('1️⃣ 測試新增會員...');
    const createRes = await fetch(`${BASE_URL}/api/members/create?_t=${Date.now()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testMember),
    });

    const createData = await createRes.json();
    console.log(`   HTTP 狀態碼: ${createRes.status}`);
    console.log(`   響應:`, JSON.stringify(createData, null, 2));

    if (createRes.ok && createData.success) {
      console.log('✅ 新增會員成功！\n');
    } else {
      console.log('❌ 新增會員失敗！');
      console.log(`   錯誤: ${createData.error || '未知錯誤'}\n`);
      return;
    }

    // 等待一下讓資料庫同步
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 2. 驗證會員是否存在
    console.log('2️⃣ 驗證會員是否存在...');
    const verifyRes = await fetch(`${BASE_URL}/api/members?_t=${Date.now()}`, {
      cache: 'no-store'
    });
    const verifyData = await verifyRes.json();
    const found = verifyData.members?.find(m => m.id === testMemberId);
    
    if (found) {
      console.log(`✅ 會員存在: #${found.id} ${found.name}\n`);
    } else {
      console.log('⚠️ 會員未在列表中出現（可能是快取問題）\n');
    }

    // 3. 測試刪除會員
    console.log('3️⃣ 測試刪除會員...');
    const deleteRes = await fetch(`${BASE_URL}/api/members/${testMemberId}?_t=${Date.now()}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    const deleteData = await deleteRes.json();
    console.log(`   HTTP 狀態碼: ${deleteRes.status}`);
    console.log(`   響應:`, JSON.stringify(deleteData, null, 2));

    if (deleteRes.ok && deleteData.success) {
      console.log('✅ 刪除會員成功！\n');
    } else {
      console.log('❌ 刪除會員失敗！');
      console.log(`   錯誤: ${deleteData.error || '未知錯誤'}\n`);
      return;
    }

    // 4. 驗證會員是否已刪除
    console.log('4️⃣ 驗證會員是否已刪除...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    const finalRes = await fetch(`${BASE_URL}/api/members?_t=${Date.now()}`, {
      cache: 'no-store'
    });
    const finalData = await finalRes.json();
    const stillExists = finalData.members?.find(m => m.id === testMemberId);
    
    if (!stillExists) {
      console.log('✅ 會員已成功刪除\n');
    } else {
      console.log('⚠️ 會員仍在列表中（可能是快取問題）\n');
    }

    // 5. 測試結果總結
    console.log('📊 測試結果總結:');
    if (createRes.ok && deleteRes.ok && !stillExists) {
      console.log('✅ 所有測試通過！會員新增和刪除功能正常運作。');
    } else {
      console.log('⚠️ 部分測試未通過，請檢查上述輸出。');
    }

  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error.message);
    console.error(error.stack);
  }
}

// 執行測試
testMemberCRUD();

