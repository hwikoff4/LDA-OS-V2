/*
  # Create GPTs and Knowledge Base Tables

  1. New Tables
    - `gpts`
      - `id` (text, primary key) - GPT identifier
      - `name` (text) - GPT name
      - `description` (text) - GPT description
      - `business_category` (text, nullable) - Business category
      - `gpt_type` (text) - Type: conversational or form-based
      - `icon` (text) - Icon identifier
      - `status` (text) - Status: draft, active, or archived
      - `system_prompt` (text) - System prompt for the GPT
      - `additional_instructions` (text, nullable) - Additional instructions
      - `featured` (boolean) - Whether featured on dashboard
      - `tags` (text[]) - Array of tags
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

    - `gpt_example_questions`
      - `id` (uuid, primary key) - Question ID
      - `gpt_id` (text, foreign key) - Reference to gpts table
      - `title` (text) - Question title
      - `question` (text) - Question text
      - `display_order` (integer) - Display order
      - `created_at` (timestamptz) - Creation timestamp

    - `gpt_form_fields`
      - `id` (text, primary key) - Field identifier
      - `gpt_id` (text, foreign key) - Reference to gpts table
      - `label` (text) - Field label
      - `field_type` (text) - Field type: text, textarea, select, number, email
      - `placeholder` (text) - Placeholder text
      - `required` (boolean) - Whether field is required
      - `display_order` (integer) - Display order
      - `created_at` (timestamptz) - Creation timestamp

    - `gpt_form_field_options`
      - `id` (uuid, primary key) - Option ID
      - `field_id` (text, foreign key) - Reference to gpt_form_fields table
      - `option_value` (text) - Option value
      - `display_order` (integer) - Display order
      - `created_at` (timestamptz) - Creation timestamp

    - `knowledge_base_documents`
      - `id` (uuid, primary key) - Document ID
      - `name` (text) - Document name
      - `content` (text) - Document content
      - `size` (integer) - File size in bytes
      - `type` (text) - MIME type
      - `uploaded_at` (timestamptz) - Upload timestamp
      - `embedding` (vector(1536)) - OpenAI embedding vector
      - `metadata` (jsonb, nullable) - Additional metadata

    - `chat_sessions`
      - `id` (uuid, primary key) - Session ID
      - `gpt_id` (text, nullable) - Reference to gpts table
      - `title` (text, nullable) - Session title
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

    - `chat_messages`
      - `id` (uuid, primary key) - Message ID
      - `session_id` (uuid, foreign key) - Reference to chat_sessions table
      - `role` (text) - Message role: user, assistant, system
      - `content` (text) - Message content
      - `created_at` (timestamptz) - Creation timestamp

  2. Security
    - Enable RLS on all tables
    - Add policies for public access (no auth required for MVP)
*/

-- Enable vector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create gpts table
CREATE TABLE IF NOT EXISTS gpts (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  business_category text,
  gpt_type text NOT NULL CHECK (gpt_type IN ('conversational', 'form-based')),
  icon text NOT NULL DEFAULT 'MessageSquare',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  system_prompt text NOT NULL,
  additional_instructions text,
  featured boolean NOT NULL DEFAULT false,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create gpt_example_questions table
CREATE TABLE IF NOT EXISTS gpt_example_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gpt_id text NOT NULL REFERENCES gpts(id) ON DELETE CASCADE,
  title text NOT NULL,
  question text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create gpt_form_fields table
CREATE TABLE IF NOT EXISTS gpt_form_fields (
  id text PRIMARY KEY,
  gpt_id text NOT NULL REFERENCES gpts(id) ON DELETE CASCADE,
  label text NOT NULL,
  field_type text NOT NULL CHECK (field_type IN ('text', 'textarea', 'select', 'number', 'email')),
  placeholder text DEFAULT '',
  required boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create gpt_form_field_options table
CREATE TABLE IF NOT EXISTS gpt_form_field_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id text NOT NULL REFERENCES gpt_form_fields(id) ON DELETE CASCADE,
  option_value text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create knowledge_base_documents table
CREATE TABLE IF NOT EXISTS knowledge_base_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  content text NOT NULL,
  size integer NOT NULL DEFAULT 0,
  type text NOT NULL DEFAULT 'text/plain',
  uploaded_at timestamptz DEFAULT now(),
  embedding vector(1536),
  metadata jsonb
);

-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gpt_id text REFERENCES gpts(id) ON DELETE SET NULL,
  title text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_gpt_example_questions_gpt_id ON gpt_example_questions(gpt_id);
CREATE INDEX IF NOT EXISTS idx_gpt_form_fields_gpt_id ON gpt_form_fields(gpt_id);
CREATE INDEX IF NOT EXISTS idx_gpt_form_field_options_field_id ON gpt_form_field_options(field_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_gpt_id ON chat_sessions(gpt_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_documents_embedding ON knowledge_base_documents USING ivfflat (embedding vector_cosine_ops);

-- Enable Row Level Security
ALTER TABLE gpts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gpt_example_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gpt_form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE gpt_form_field_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth required for MVP)
CREATE POLICY "Public can read gpts"
  ON gpts FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public can insert gpts"
  ON gpts FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Public can update gpts"
  ON gpts FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete gpts"
  ON gpts FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "Public can read example questions"
  ON gpt_example_questions FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public can insert example questions"
  ON gpt_example_questions FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Public can update example questions"
  ON gpt_example_questions FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete example questions"
  ON gpt_example_questions FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "Public can read form fields"
  ON gpt_form_fields FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public can insert form fields"
  ON gpt_form_fields FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Public can update form fields"
  ON gpt_form_fields FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete form fields"
  ON gpt_form_fields FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "Public can read field options"
  ON gpt_form_field_options FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public can insert field options"
  ON gpt_form_field_options FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Public can update field options"
  ON gpt_form_field_options FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete field options"
  ON gpt_form_field_options FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "Public can read knowledge base documents"
  ON knowledge_base_documents FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public can insert knowledge base documents"
  ON knowledge_base_documents FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Public can update knowledge base documents"
  ON knowledge_base_documents FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete knowledge base documents"
  ON knowledge_base_documents FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "Public can read chat sessions"
  ON chat_sessions FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public can insert chat sessions"
  ON chat_sessions FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Public can update chat sessions"
  ON chat_sessions FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete chat sessions"
  ON chat_sessions FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "Public can read chat messages"
  ON chat_messages FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public can insert chat messages"
  ON chat_messages FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Public can update chat messages"
  ON chat_messages FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete chat messages"
  ON chat_messages FOR DELETE
  TO anon
  USING (true);