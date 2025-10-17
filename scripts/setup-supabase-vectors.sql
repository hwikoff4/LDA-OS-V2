-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create a table to store knowledge base chunks
create table if not exists knowledge_chunks (
  id bigserial primary key,
  gpt_id text not null,
  content text not null,
  embedding vector(1536),
  metadata jsonb not null default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create an index on the embedding column for faster similarity search
create index if not exists knowledge_chunks_embedding_idx on knowledge_chunks 
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- Create an index on gpt_id for faster filtering
create index if not exists knowledge_chunks_gpt_id_idx on knowledge_chunks (gpt_id);

-- Enable Row Level Security
alter table knowledge_chunks enable row level security;

-- Create a policy that allows all operations for now (you can restrict this later)
create policy "Allow all operations on knowledge_chunks" on knowledge_chunks
for all using (true);

-- Create a function to search for similar chunks
create or replace function match_knowledge_chunks (
  query_embedding vector(1536),
  gpt_id text,
  match_threshold float,
  match_count int
)
returns table (
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    knowledge_chunks.content,
    knowledge_chunks.metadata,
    1 - (knowledge_chunks.embedding <=> query_embedding) as similarity
  from knowledge_chunks
  where knowledge_chunks.gpt_id = match_knowledge_chunks.gpt_id
    and 1 - (knowledge_chunks.embedding <=> query_embedding) > match_threshold
  order by knowledge_chunks.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Grant execute permission on the function
grant execute on function match_knowledge_chunks to anon, authenticated;
