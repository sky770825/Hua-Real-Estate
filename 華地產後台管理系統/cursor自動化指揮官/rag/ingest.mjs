import fs from "fs";
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
  return json.data[0].embedding; // 1536
}

function readJsonl(filePath) {
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/).filter(Boolean);
  return lines.map((l) => JSON.parse(l));
}

async function upsertDocuments(docs) {
  const rows = docs.map((d) => ({
    id: d.id,
    doc_type: d.doc_type,
    title: d.title,
    stack: d.stack,
    env_strategy: d.env_strategy,
    tags: d.tags ?? [],
    content: d.content,
    metadata: d.metadata ?? {},
  }));
  const { error } = await supabase.from("rag_documents").upsert(rows, { onConflict: "id" });
  if (error) throw error;
  console.log(`✅ upserted documents: ${rows.length}`);
}

async function upsertChunksWithEmbeddings(chunks, batchSize = 16) {
  let done = 0;

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);

    const embeddedRows = [];
    for (const c of batch) {
      const v = await embed(c.content);
      embeddedRows.push({
        id: c.id,
        document_id: c.document_id,
        chunk_index: c.chunk_index,
        content: c.content,
        tokens_est: c.tokens_est ?? null,
        embedding: v,
        metadata: c.metadata ?? {},
      });
    }

    const { error } = await supabase.from("rag_chunks").upsert(embeddedRows, { onConflict: "id" });
    if (error) throw error;

    done += embeddedRows.length;
    console.log(`✅ upserted chunks: ${done}/${chunks.length}`);
  }
}

async function main() {
  const docsPath = process.argv[2] || "rag_export/rag_documents.jsonl";
  const chunksPath = process.argv[3] || "rag_export/rag_chunks.jsonl";
  if (!fs.existsSync(docsPath)) throw new Error(`Missing ${docsPath}`);
  if (!fs.existsSync(chunksPath)) throw new Error(`Missing ${chunksPath}`);

  const docs = readJsonl(docsPath);
  const chunks = readJsonl(chunksPath);

  await upsertDocuments(docs);
  await upsertChunksWithEmbeddings(chunks);

  console.log("🎉 Ingestion complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
