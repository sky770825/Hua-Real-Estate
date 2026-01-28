import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";

const root = process.cwd();
const ragDir = path.join(root, "rag");

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: "inherit", ...opts });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function sh(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: "utf8", ...opts });
  if (r.status !== 0) return null;
  return (r.stdout || "").trim();
}

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function mustEnv(name) {
  if (!process.env[name]) {
    console.error(`❌ Missing env: ${name}`);
    process.exit(1);
  }
}

function loadDotenv() {
  const envPath = path.join(ragDir, ".env");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i <= 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    v = v.replace(/^"(.*)"$/, "$1");
    if (!process.env[k]) process.env[k] = v;
  }
}

function detectEnv(argv) {
  const idx = argv.indexOf("--env");
  if (idx !== -1 && argv[idx + 1]) return argv[idx + 1];

  // auto map from git branch
  const branch = sh("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd: root });
  if (branch === "main") return "prod";
  return "staging"; // default develop/others
}

function getSupabaseTarget(envName) {
  if (envName === "prod") {
    return {
      projectRef: process.env.SUPABASE_PROJECT_REF_PROD,
      dbPassword: process.env.SUPABASE_DB_PASSWORD_PROD,
    };
  }
  return {
    projectRef: process.env.SUPABASE_PROJECT_REF_STAGING,
    dbPassword: process.env.SUPABASE_DB_PASSWORD_STAGING,
  };
}

function ensureInputs() {
  const docs = "rag/rag_export/rag_documents.jsonl";
  const chunks = "rag/rag_export/rag_chunks.jsonl";
  if (!exists(docs) || !exists(chunks)) {
    console.error("❌ Missing JSONL input files. Put them here:");
    console.error(" - rag/rag_export/rag_documents.jsonl");
    console.error(" - rag/rag_export/rag_chunks.jsonl");
    process.exit(1);
  }
  if (!exists("supabase/migrations/202601120001_rag_schema.sql")) {
    console.error("❌ Missing supabase migrations for RAG schema. Add them under supabase/migrations/");
    process.exit(1);
  }
}

function main() {
  console.log("🧠 Cursor Commander: FULL AUTO (SQL via supabase CLI + ingest + smoke test)\n");

  loadDotenv();

  // Required env (no printing secrets)
  mustEnv("SUPABASE_ACCESS_TOKEN");
  mustEnv("SUPABASE_URL");
  mustEnv("SUPABASE_SERVICE_ROLE_KEY");
  mustEnv("OPENAI_API_KEY");
  if (!process.env.OPENAI_EMBED_MODEL) process.env.OPENAI_EMBED_MODEL = "text-embedding-3-small";

  mustEnv("SUPABASE_PROJECT_REF_STAGING");
  mustEnv("SUPABASE_DB_PASSWORD_STAGING");
  mustEnv("SUPABASE_PROJECT_REF_PROD");
  mustEnv("SUPABASE_DB_PASSWORD_PROD");

  ensureInputs();

  const envName = detectEnv(process.argv);
  const target = getSupabaseTarget(envName);

  if (!target.projectRef || !target.dbPassword) {
    console.error(`❌ Missing project ref / db password for env=${envName}`);
    process.exit(1);
  }

  console.log(`==> Target env: ${envName} (project_ref=${target.projectRef})`);

  // 1) Install deps for rag pipeline
  console.log("\n==> Installing RAG deps");
  run("npm", ["i"], { cwd: ragDir });

  // 2) Apply SQL migrations with Supabase CLI (FULL AUTO)
  console.log("\n==> Applying DB migrations (supabase db push)");
  // Use token non-interactively
  const cliEnv = {
    ...process.env,
    SUPABASE_DB_PASSWORD: target.dbPassword,
  };

  // init only if not yet
  if (!exists("supabase/config.toml")) {
    console.log("==> supabase init");
    run("supabase", ["init"], { cwd: root, env: cliEnv });
  }

  console.log("==> supabase link");
  run("supabase", ["link", "--project-ref", target.projectRef], { cwd: root, env: cliEnv });

  console.log("==> supabase db push");
  run("supabase", ["db", "push"], { cwd: root, env: cliEnv });

  // 3) Ingest (embeddings + upsert)
  console.log("\n==> Ingesting JSONL → embedding(1536) → upsert");
  run("node", ["ingest.mjs", "rag_export/rag_documents.jsonl", "rag_export/rag_chunks.jsonl"], { cwd: ragDir });

  // 4) Smoke test query
  console.log("\n==> Smoke test query");
  run("node", ["query.mjs", "Vite 專案為什麼不能用 NEXT_PUBLIC_SUPABASE_URL？"], { cwd: ragDir });

  console.log("\n✅ DONE: DB schema + RPC applied, embeddings upserted, query passed.");
  console.log("Next: 把 match_rag_chunks 串到你的 GPT/Agent runtime 即可。");
}

main();
