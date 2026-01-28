import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { supabase } from "./lib/supabase";
import { ensureOnboarded, clearOnboardCacheForUser } from "./lib/onboard";

async function runOnboardIfLoggedIn() {
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    const r = await ensureOnboarded();
    if (!r.ok) console.warn("ensureOnboarded failed:", r);
  }
}

// 首次載入
runOnboardIfLoggedIn();

// 監聽登入/登出
supabase.auth.onAuthStateChange((_event, session) => {
  if (session) {
    ensureOnboarded().then((r) => {
      if (!r.ok) console.warn("ensureOnboarded failed:", r);
    });
  } else {
    // 登出時清掉 cache（可選）
    const lastUserId = localStorage.getItem("last_user_id");
    if (lastUserId) clearOnboardCacheForUser(lastUserId);
  }

  // 記錄最後 user（可選，便於登出清 cache）
  if (session?.user?.id) localStorage.setItem("last_user_id", session.user.id);
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
