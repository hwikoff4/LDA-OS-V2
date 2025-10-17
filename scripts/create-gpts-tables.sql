-- Create GPTs table to store all GPT configurations
CREATE TABLE IF NOT EXISTS gpts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  business_category TEXT,
  gpt_type TEXT NOT NULL DEFAULT 'conversational', -- 'conversational' or 'form-based'
  icon TEXT NOT NULL DEFAULT 'MessageSquare',
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'active', 'archived'
  system_prompt TEXT NOT NULL,
  additional_instructions TEXT,
  featured BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create example questions table (one-to-many with gpts)
CREATE TABLE IF NOT EXISTS gpt_example_questions (
  id BIGSERIAL PRIMARY KEY,
  gpt_id TEXT NOT NULL REFERENCES gpts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  question TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create form fields table (one-to-many with gpts)
CREATE TABLE IF NOT EXISTS gpt_form_fields (
  id TEXT PRIMARY KEY,
  gpt_id TEXT NOT NULL REFERENCES gpts(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  field_type TEXT NOT NULL, -- 'text', 'textarea', 'select', 'number', 'email'
  placeholder TEXT,
  required BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create form field options table (one-to-many with gpt_form_fields)
CREATE TABLE IF NOT EXISTS gpt_form_field_options (
  id BIGSERIAL PRIMARY KEY,
  field_id TEXT NOT NULL REFERENCES gpt_form_fields(id) ON DELETE CASCADE,
  option_value TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS gpts_status_idx ON gpts(status);
CREATE INDEX IF NOT EXISTS gpts_featured_idx ON gpts(featured);
CREATE INDEX IF NOT EXISTS gpts_business_category_idx ON gpts(business_category);
CREATE INDEX IF NOT EXISTS gpt_example_questions_gpt_id_idx ON gpt_example_questions(gpt_id);
CREATE INDEX IF NOT EXISTS gpt_form_fields_gpt_id_idx ON gpt_form_fields(gpt_id);
CREATE INDEX IF NOT EXISTS gpt_form_field_options_field_id_idx ON gpt_form_field_options(field_id);

-- Enable Row Level Security
ALTER TABLE gpts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gpt_example_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gpt_form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE gpt_form_field_options ENABLE ROW LEVEL SECURITY;

-- Create policies that allow all operations for now (you can restrict this later)
CREATE POLICY "Allow all operations on gpts" ON gpts FOR ALL USING (true);
CREATE POLICY "Allow all operations on gpt_example_questions" ON gpt_example_questions FOR ALL USING (true);
CREATE POLICY "Allow all operations on gpt_form_fields" ON gpt_form_fields FOR ALL USING (true);
CREATE POLICY "Allow all operations on gpt_form_field_options" ON gpt_form_field_options FOR ALL USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_gpts_updated_at BEFORE UPDATE ON gpts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
