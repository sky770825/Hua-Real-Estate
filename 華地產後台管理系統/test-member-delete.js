// 測試會員刪除功能
// 使用 Node.js 內建的 fetch (Node 18+)
// 預設使用本地開發環境，可透過環境變數 BASE_URL 覆蓋
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function testMemberDelete() {
  console.log('🧪 開始測試會員刪除功能...\n');

  try {
    // 1. 檢查會員 #1 是否存在
    console.log('1️⃣ 檢查會員 #1 是否存在...');
    const membersRes = await fetch(`${BASE_URL}/api/members`);
    
    if (!membersRes.ok) {
      const text = await membersRes.text();
      console.log(`❌ API 請求失敗: HTTP ${membersRes.status}`);
      console.log(`   響應內容: ${text.substring(0, 200)}...`);
      return;
    }
    
    const membersData = await membersRes.json();
    // 尋找測試會員（優先使用 #999，如果不存在則使用 #1）
    let testMemberId = 999;
    let member = membersData.members?.find(m => m.id === testMemberId);
    
    if (!member) {
      testMemberId = 1;
      member = membersData.members?.find(m => m.id === testMemberId);
    }
    
    if (!member) {
      console.log('❌ 找不到測試會員（#999 或 #1），無法測試刪除功能');
      console.log('   可用會員列表:', membersData.members?.slice(0, 5).map(m => `#${m.id} ${m.name}`).join(', '));
      return;
    }
    
    console.log(`✅ 找到測試會員 #${testMemberId}:`, member);
    console.log(`   姓名: ${member.name}`);
    console.log(`   專業別: ${member.profession || '(無)'}\n`);

    // 2. 檢查是否有簽到記錄
    console.log(`2️⃣ 檢查會員 #${testMemberId} 的簽到記錄...`);
    const checkinsRes = await fetch(`${BASE_URL}/api/checkins?date=2026-01-08`);
    
    if (!checkinsRes.ok) {
      console.log('⚠️  無法檢查簽到記錄，繼續測試刪除...\n');
    } else {
      const checkinsData = await checkinsRes.json();
      const checkins = checkinsData.checkins || [];
      const memberCheckins = checkins.filter(c => c.member_id === testMemberId);
      
      if (memberCheckins.length > 0) {
        console.log(`⚠️  發現 ${memberCheckins.length} 筆簽到記錄，這些記錄應該會被自動刪除\n`);
      } else {
        console.log('✅ 沒有簽到記錄\n');
      }
    }

    // 3. 嘗試刪除測試會員
    console.log(`3️⃣ 嘗試刪除會員 #${testMemberId}...`);
    const deleteRes = await fetch(`${BASE_URL}/api/members/${testMemberId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const deleteData = await deleteRes.json();
    console.log(`   HTTP 狀態碼: ${deleteRes.status}`);
    console.log(`   響應數據:`, JSON.stringify(deleteData, null, 2));

    if (deleteRes.ok && deleteData.success) {
      console.log('✅ 會員刪除成功！\n');
    } else {
      console.log('❌ 會員刪除失敗！');
      console.log(`   錯誤訊息: ${deleteData.error || '未知錯誤'}\n`);
      return;
    }

    // 4. 驗證會員是否真的被刪除
    console.log(`4️⃣ 驗證會員 #${testMemberId} 是否真的被刪除...`);
    const verifyRes = await fetch(`${BASE_URL}/api/members`);
    const verifyData = await verifyRes.json();
    const memberAfter = verifyData.members?.find(m => m.id === testMemberId);
    
    if (!memberAfter) {
      console.log(`✅ 驗證成功：會員 #${testMemberId} 已從資料庫中刪除\n`);
    } else {
      console.log(`❌ 驗證失敗：會員 #${testMemberId} 仍然存在！`);
      console.log('   會員資料:', memberAfter);
    }

    // 5. 測試結果總結
    console.log('\n📊 測試結果總結:');
    if (!memberAfter) {
      console.log('✅ 所有測試通過！會員刪除功能正常運作。');
    } else {
      console.log('❌ 測試失敗：會員刪除功能有問題。');
    }

  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error.message);
    console.error(error.stack);
  }
}

// 執行測試
testMemberDelete();

