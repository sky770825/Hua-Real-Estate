import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_EMBED_MODEL = process.env.OPENAI_EMBED_MODEL || "text-embedding-3-small";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
if (!OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function embed(text) {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: OPENAI_EMBED_MODEL, input: text }),
  });
  if (!res.ok) throw new Error(await res.text());
  const json = await res.json();
  return json.data[0].embedding;
}

async function main() {
  const q = process.argv.slice(2).join(" ").trim();
  if (!q) throw new Error("Usage: node query.mjs <question>");

  const qv = await embed(q);

  const { data, error } = await supabase.rpc("match_rag_chunks", {
    query_embedding: qv,
    match_count: 8,
    stack_filter: "vite",
    env_strategy_filter: "dual",
    min_similarity: 0.15,
  });
  if (error) throw error;

  console.log("\n=== TOP CHUNKS ===");
  for (const row of data) {
    console.log(`\n[sim=${row.similarity.toFixed(3)}] doc=${row.document_id} chunk=${row.chunk_index}`);
    console.log(row.content);
    console.log("meta:", row.metadata);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
