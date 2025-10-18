/*
  # Create knowledge_chunks table for AI knowledge base

  1. New Tables
    - `knowledge_chunks`
      - `id` (bigserial, primary key) - Auto-incrementing unique identifier
      - `gpt_id` (text, not null) - Reference to the GPT this knowledge belongs to
      - `content` (text, not null) - The actual knowledge content/text chunk
      - `embedding` (vector(1536)) - OpenAI embedding vector for semantic search
      - `category` (text) - Optional category for organizing knowledge
      - `subcategory` (text) - Optional subcategory for finer organization
      - `metadata` (jsonb, default '{}') - Additional metadata (filename, source, etc.)
      - `created_at` (timestamptz, default now()) - When the chunk was created

  2. Indexes
    - Embedding index using IVFFlat for fast similarity search
    - GPT ID index for faster filtering by GPT
    - Category index for category-based filtering

  3. Security
    - Enable RLS on `knowledge_chunks` table
    - Add policy to allow all operations (can be restricted later based on auth)

  4. Functions
    - `match_knowledge_chunks` - Vector similarity search function that finds semantically similar content
      - Parameters: query_embedding, gpt_id_param, match_threshold, match_count
      - Returns: content, category, subcategory, metadata, similarity score

  5. Notes
    - Uses pgvector extension for vector similarity search
    - Embedding dimension is 1536 (OpenAI text-embedding-ada-002 model)
    - IVFFlat index with 100 lists for efficient approximate nearest neighbor search
    - Cosine similarity is used for measuring embedding similarity
*/

-- Enable the pgvector extension to work with embedding vectors
CREATE EXTENSION IF NOT EXISTS vector;

-- Create a table to store knowledge base chunks
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id bigserial PRIMARY KEY,
  gpt_id text NOT NULL,
  content text NOT NULL,
  embedding vector(1536),
  category text,
  subcategory text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create an index on the embedding column for faster similarity search
CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_idx ON knowledge_chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create an index on gpt_id for faster filtering
CREATE INDEX IF NOT EXISTS knowledge_chunks_gpt_id_idx ON knowledge_chunks (gpt_id);

-- Create an index on category for faster category filtering
CREATE INDEX IF NOT EXISTS knowledge_chunks_category_idx ON knowledge_chunks (category);

-- Enable Row Level Security
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for now
CREATE POLICY "Allow all operations on knowledge_chunks" ON knowledge_chunks
FOR ALL USING (true);

-- Create a function to search for similar chunks
CREATE OR REPLACE FUNCTION match_knowledge_chunks (
  query_embedding vector(1536),
  gpt_id_param text,
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  content text,
  category text,
  subcategory text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    knowledge_chunks.content,
    knowledge_chunks.category,
    knowledge_chunks.subcategory,
    knowledge_chunks.metadata,
    1 - (knowledge_chunks.embedding <=> query_embedding) as similarity
  FROM knowledge_chunks
  WHERE knowledge_chunks.gpt_id = gpt_id_param
    AND knowledge_chunks.embedding IS NOT NULL
    AND 1 - (knowledge_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY knowledge_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION match_knowledge_chunks TO anon, authenticated;