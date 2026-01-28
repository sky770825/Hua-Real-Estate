type Env = {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;

  // 只保護 admin 類接口
  INTERNAL_API_BEARER: string;
};

type Json = Record<string, unknown>;

function json(data: Json, status = 200, extraHeaders: HeadersInit = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
  });
}

function getBearer(req: Request): string | null {
  const auth = req.headers.get("authorization") || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m?.[1] ?? null;
}

function requireInternalBearer(req: Request, env: Env): Response | null {
  const token = getBearer(req);
  if (!token || token !== env.INTERNAL_API_BEARER) {
    return json({ ok: false, error: "Unauthorized" }, 401);
  }
  return null;
}

async function sbServiceFetch(env: Env, path: string, init: RequestInit) {
  const url = `${env.SUPABASE_URL}${path}`;
  const headers = new Headers(init.headers || {});
  headers.set("apikey", env.SUPABASE_SERVICE_ROLE_KEY);
  headers.set("authorization", `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`);
  headers.set("content-type", "application/json");
  return fetch(url, { ...init, headers });
}

/**
 * 用 Supabase Auth API 驗證 access_token，拿到 user_id
 * 這比在 Worker 內自己驗 JWT 更穩（避免算法/輪換/設定差異）
 */
async function getUserFromAccessToken(env: Env, accessToken: string) {
  const r = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    method: "GET",
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      authorization: `Bearer ${accessToken}`,
    },
  });

  if (!r.ok) {
    const t = await r.text();
    return { ok: false as const, status: r.status, details: t };
  }

  const user = (await r.json()) as { id: string; email?: string };
  return { ok: true as const, user };
}

/**
 * POST /api/onboard
 * headers:
 *   Authorization: Bearer <supabase_access_token>
 *   x-app-id: ai_commander (可選；沒帶就用 body.app_id；再沒帶就預設 ai_commander)
 * body(可選):
 *   { app_id?: string, role?: "owner"|"admin"|"member" }
 *
 * 行為：
 * - 驗證 token → 取得 user_id
 * - upsert core.apps（若不存在）
 * - upsert core.app_memberships（user 加入 app）
 * - 若 app_id === ai_commander：確保有 default workspace
 */
async function handleOnboard(req: Request, env: Env): Promise<Response> {
  const accessToken = getBearer(req);
  if (!accessToken) return json({ ok: false, error: "Missing Authorization Bearer token" }, 401);

  const appFromHeader = (req.headers.get("x-app-id") || "").trim();

  const body = (await req.json().catch(() => null)) as null | {
    app_id?: string;
    role?: string;
  };

  const app_id = (appFromHeader || body?.app_id || "ai_commander").trim();
  const role = (body?.role || "member").trim();

  // 1) 驗 token 拿 user
  const u = await getUserFromAccessToken(env, accessToken);
  if (!u.ok) {
    return json({ ok: false, step: "verify_token", status: u.status, details: u.details }, 401);
  }
  const user_id = u.user.id;

  // 2) 確保 app 存在（service_role 可繞過 RLS）
  {
    const r = await sbServiceFetch(env, `/rest/v1/core.apps`, {
      method: "POST",
      body: JSON.stringify([{ app_id, name: app_id, is_active: true }]),
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    });
    if (!r.ok) {
      const t = await r.text();
      return json({ ok: false, step: "upsert_app", status: r.status, details: t }, 500);
    }
  }

  // 3) 加入 membership（避免你每個使用者都要手動加）
  {
    const r = await sbServiceFetch(env, `/rest/v1/core.app_memberships`, {
      method: "POST",
      body: JSON.stringify([{ app_id, user_id, role }]),
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    });
    if (!r.ok) {
      const t = await r.text();
      return json({ ok: false, step: "upsert_membership", status: r.status, details: t }, 500);
    }
  }

  // 4) ai_commander：確保有 default workspace（只做這個 app 的 workspace）
  let workspace_id: string | null = null;

  if (app_id === "ai_commander") {
    // 查是否已存在
    const q = new URLSearchParams({
      select: "id",
      owner_id: `eq.${user_id}`,
      app_id: `eq.ai_commander`,
      limit: "1",
    });
    const check = await sbServiceFetch(env, `/rest/v1/app_ai_commander.workspaces?${q.toString()}`, { method: "GET" });

    if (!check.ok) {
      const t = await check.text();
      return json({ ok: false, step: "check_workspace", status: check.status, details: t }, 500);
    }

    const rows = (await check.json()) as Array<{ id: string }>;
    if (rows.length > 0) {
      workspace_id = rows[0].id;
    } else {
      const create = await sbServiceFetch(env, `/rest/v1/app_ai_commander.workspaces`, {
        method: "POST",
        body: JSON.stringify([{ owner_id: user_id, name: "Default Workspace", app_id: "ai_commander" }]),
        headers: { Prefer: "return=representation" },
      });
      if (!create.ok) {
        const t = await create.text();
        return json({ ok: false, step: "create_workspace", status: create.status, details: t }, 500);
      }
      const created = (await create.json()) as Array<{ id: string }>;
      workspace_id = created[0]?.id ?? null;
    }
  }

  return json({
    ok: true,
    app_id,
    user_id,
    role,
    workspace_id,
  });
}

async function handleAdminSql(req: Request, env: Env): Promise<Response> {
  const guard = requireInternalBearer(req, env);
  if (guard) return guard;

  return json({
    ok: true,
    message:
      "admin 範例 endpoint：建議不要在 Worker 做 raw SQL 執行。請改成具體 admin 功能（grant_membership/backfill...）。",
  });
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    // CORS
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "GET,POST,OPTIONS",
          "access-control-allow-headers": "content-type,authorization,x-app-id",
          "access-control-max-age": "86400",
        },
      });
    }

    const corsHeaders = {
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "content-type,authorization,x-app-id",
    } as const;

    if (url.pathname === "/api/health") {
      return json({ ok: true, name: "junyang-api", ts: new Date().toISOString() }, 200, corsHeaders);
    }

    if (url.pathname === "/api/onboard" && req.method === "POST") {
      const res = await handleOnboard(req, env);
      return new Response(res.body, {
        status: res.status,
        headers: { ...Object.fromEntries(res.headers), ...corsHeaders },
      });
    }

    if (url.pathname === "/api/admin/sql" && req.method === "POST") {
      const res = await handleAdminSql(req, env);
      return new Response(res.body, {
        status: res.status,
        headers: { ...Object.fromEntries(res.headers), ...corsHeaders },
      });
    }

    return json({ ok: false, error: "Not Found" }, 404, corsHeaders);
  },
};
