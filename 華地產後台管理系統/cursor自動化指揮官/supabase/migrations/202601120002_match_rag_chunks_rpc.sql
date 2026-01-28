create or replace function public.match_rag_chunks(
  query_embedding vector(1536),
  match_count int default 8,
  stack_filter text default null,
  env_strategy_filter text default null,
  min_similarity float default 0.2
)
returns table (
  id uuid,
  document_id uuid,
  chunk_index int,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    c.id,
    c.document_id,
    c.chunk_index,
    c.content,
    c.metadata,
    (1 - (c.embedding <=> query_embedding))::float as similarity
  from public.rag_chunks c
  where c.embedding is not null
    and (stack_filter is null or c.metadata->>'stack' = stack_filter)
    and (env_strategy_filter is null or c.metadata->>'env_strategy' = env_strategy_filter)
    and (1 - (c.embedding <=> query_embedding)) >= min_similarity
  order by c.embedding <=> query_embedding
  limit match_count;
$$;
