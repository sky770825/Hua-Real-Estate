create extension if not exists vector;

create table if not exists public.rag_documents (
  id uuid primary key,
  doc_type text not null,
  title text not null,
  stack text not null,
  env_strategy text not null,
  tags text[] not null default '{}',
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.rag_chunks (
  id uuid primary key,
  document_id uuid not null references public.rag_documents(id) on delete cascade,
  chunk_index int not null,
  content text not null,
  tokens_est int,
  embedding vector(1536),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(document_id, chunk_index)
);

create index if not exists rag_documents_tags_gin on public.rag_documents using gin(tags);
create index if not exists rag_documents_metadata_gin on public.rag_documents using gin(metadata);
create index if not exists rag_chunks_metadata_gin on public.rag_chunks using gin(metadata);

create index if not exists rag_chunks_embedding_hnsw
on public.rag_chunks using hnsw (embedding vector_cosine_ops);

create index if not exists rag_chunks_content_fts
on public.rag_chunks using gin (to_tsvector('simple', content));
