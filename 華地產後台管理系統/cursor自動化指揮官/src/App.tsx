import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 檢查當前 session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 監聽 auth 狀態變化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>載入中...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <h1>AI Commander</h1>
      {user ? (
        <div>
          <p>已登入：{user.email}</p>
          <button onClick={handleSignOut}>登出</button>
        </div>
      ) : (
        <div>
          <p>請登入</p>
          {/* 這裡可以加入你的登入表單或 Supabase Auth UI */}
        </div>
      )}
    </div>
  );
}

export default App;
