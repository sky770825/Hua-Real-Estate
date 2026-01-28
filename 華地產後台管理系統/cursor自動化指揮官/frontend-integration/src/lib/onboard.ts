import { supabase } from "./supabase";

type OnboardResult =
  | { ok: true; app_id: string; user_id: string; workspace_id?: string | null }
  | { ok: false; error: string; details?: unknown };

const API_BASE = import.meta.env.VITE_API_BASE as string;
const APP_ID = (import.meta.env.VITE_APP_ID as string) || "ai_commander";

function onboardKey(userId: string, appId: string) {
  return `onboarded:${appId}:${userId}`;
}

export async function ensureOnboarded(): Promise<OnboardResult> {
  try {
    const { data } = await supabase.auth.getSession();
    const session = data.session;

    if (!session) return { ok: false, error: "No session" };

    const userId = session.user.id;
    const key = onboardKey(userId, APP_ID);

    // 已經 onboard 過就跳過
    if (localStorage.getItem(key) === "1") {
      return { ok: true, app_id: APP_ID, user_id: userId, workspace_id: null };
    }

    if (!API_BASE) return { ok: false, error: "Missing VITE_API_BASE" };

    const res = await fetch(`${API_BASE}/api/onboard`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        "x-app-id": APP_ID,
      },
      body: JSON.stringify({ role: "member" }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `Onboard failed (${res.status})`, details: text };
    }

    const payload = (await res.json()) as any;
    if (!payload?.ok) {
      return { ok: false, error: "Onboard response not ok", details: payload };
    }

    // 記住成功，避免每次刷新都打一次
    localStorage.setItem(key, "1");

    return {
      ok: true,
      app_id: payload.app_id,
      user_id: payload.user_id,
      workspace_id: payload.workspace_id ?? null,
    };
  } catch (e: any) {
    return { ok: false, error: "Onboard exception", details: String(e?.message || e) };
  }
}

/**
 * 登出或切換帳號時，清掉 onboard cache（可選）
 */
export function clearOnboardCacheForUser(userId: string) {
  const key = onboardKey(userId, APP_ID);
  localStorage.removeItem(key);
}
