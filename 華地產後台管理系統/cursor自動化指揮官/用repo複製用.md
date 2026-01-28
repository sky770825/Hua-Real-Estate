# Project Architecture Specification (DO NOT IGNORE)

This repository is part of a **multi-project shared-backend architecture**.
All code changes MUST comply with the rules below.

---

## 1. Global Architecture Overview

This project uses the following stack:

- **Frontend**: Vite
- **Frontend Hosting**: Cloudflare Pages
- **API / Backend Orchestration**: Cloudflare Workers
- **Database / Auth / Storage**: Single Supabase Project (shared by all apps)

⚠️ IMPORTANT:
- This is NOT a standalone app.
- This app is ONE OF MANY projects sharing the SAME backend.

---

## 2. Supabase Rules (Critical)

### 2.1 Single Supabase Project
- All apps share **ONE Supabase Project** (company-level backend).
- DO NOT create or connect to a new Supabase project.
- App isolation is handled by:
  - `app_id`
  - database `schema`
  - Row Level Security (RLS)

### 2.2 Frontend Key Usage
- Frontend may ONLY use:
  - `SUPABASE_ANON_KEY`
- Frontend MUST NOT:
  - use `service_role` key
  - bypass RLS
  - perform admin operations directly

### 2.3 Data Model Convention
Every table follows these rules:
- Has column `app_id`
- Has column `owner_id`
- RLS is enabled and enforced
- User can ONLY access data where:
  - user is a member of the app
  - owner_id = current user (unless explicitly shared)

---

## 3. App Identification (Required)

Each frontend app has a fixed identifier:

- Environment variable: `VITE_APP_ID`
- Example values:
  - `ai_commander`
  - `crm`
  - `linebot`
  - `realestate`

This value:
- MUST be constant per repo
- MUST be sent with API requests (header: `x-app-id`)

---

## 4. Authentication & Auto Onboarding (MANDATORY)

### 4.1 Authentication
- Authentication is handled by Supabase Auth.
- Session access_token is used for API authentication.

### 4.2 Auto Onboarding Flow (REQUIRED)
After successful login, frontend MUST:

1. Retrieve Supabase session
2. Call backend onboarding API:
   - `POST {VITE_API_BASE}/api/onboard`
3. Include headers:
   - `Authorization: Bearer <supabase_access_token>`
   - `x-app-id: {VITE_APP_ID}`

### 4.3 Onboarding Behavior
- Backend will:
  - Verify JWT via Supabase Auth
  - Insert user into `core.app_memberships`
  - Create default workspace if required
- Onboarding must be:
  - idempotent
  - called only once per user per app
  - cached on frontend (e.g. localStorage)

---

## 5. Cloudflare Workers (API Layer)

### 5.1 Purpose
All sensitive operations MUST go through Cloudflare Workers:
- onboarding
- admin logic
- third-party APIs (OpenAI, LINE, etc.)
- service_role access

### 5.2 Security Rules
- `SUPABASE_SERVICE_ROLE_KEY` lives ONLY in Worker secrets
- Frontend never accesses admin APIs directly
- Workers validate Supabase access_token for user-level endpoints

---

## 6. Required Frontend Environment Variables

The following variables MUST exist:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_BASE=
VITE_APP_ID=
```

Both Preview and Production environments must define all of them.

---

## 7. Code Expectations (For AI / Contributors)

When modifying this repository, you MUST:

* Respect the shared-backend architecture
* Implement missing Supabase client setup if absent
* Implement or fix auto-onboarding logic if absent
* Ensure onboarding is NOT repeatedly triggered
* NEVER introduce service_role keys into frontend code
* NEVER create a new Supabase project connection

If existing code violates these rules, refactor it to comply.

---

## 8. Mental Model (Do Not Break This)

Think of this system as:

* Frontend = Trigger (UI only)
* Cloudflare Worker = Orchestrator / Function node
* Supabase = Shared Data Store (with strict RLS)

This is intentionally similar to n8n-style orchestration.

---

## 9. Final Rule

If there is ever a conflict between convenience and architecture:
**Architecture always wins.**
