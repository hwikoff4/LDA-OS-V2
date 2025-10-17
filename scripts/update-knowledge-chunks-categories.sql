-- Add category and subcategory columns to knowledge_chunks table
-- This will add the columns after gpt_id and before content

-- First, add the category column
ALTER TABLE knowledge_chunks 
ADD COLUMN category TEXT;

-- Add the subcategory column
ALTER TABLE knowledge_chunks 
ADD COLUMN subcategory TEXT;

-- Add comments to document the column purposes
COMMENT ON COLUMN knowledge_chunks.category IS 'Main category for knowledge chunk (e.g., Financial, Sales, Production, Hiring, Marketing, Internal)';
COMMENT ON COLUMN knowledge_chunks.subcategory IS 'Subcategory for more specific classification (e.g., Financial software, Job costing, Markup and margin, etc.)';

-- Create indexes for better query performance on categories
CREATE INDEX idx_knowledge_chunks_category ON knowledge_chunks(category);
CREATE INDEX idx_knowledge_chunks_subcategory ON knowledge_chunks(subcategory);
CREATE INDEX idx_knowledge_chunks_gpt_category ON knowledge_chunks(gpt_id, category);

-- Optional: Create a composite index for filtering by GPT ID and category together
CREATE INDEX idx_knowledge_chunks_gpt_category_sub ON knowledge_chunks(gpt_id, category, subcategory);

-- Example update statements to set categories for existing data
-- (You'll need to customize these based on your actual content)

-- Update existing records with Financial category based on content keywords
UPDATE knowledge_chunks 
SET category = 'Financial', 
    subcategory = 'Operation budget'
WHERE content ILIKE '%budget%' OR content ILIKE '%financial%' OR content ILIKE '%profit%';

-- Update records with sprint/planning content to Internal category
UPDATE knowledge_chunks 
SET category = 'Internal', 
    subcategory = 'Planning'
WHERE content ILIKE '%sprint%' OR content ILIKE '%plan%' OR content ILIKE '%planning%';

-- You can add more UPDATE statements based on your content patterns
-- UPDATE knowledge_chunks 
-- SET category = 'Sales', 
--     subcategory = 'Markup and margin'
-- WHERE content ILIKE '%markup%' OR content ILIKE '%margin%' OR content ILIKE '%pricing%';

-- UPDATE knowledge_chunks 
-- SET category = 'Production', 
--     subcategory = 'Job costing'
-- WHERE content ILIKE '%job cost%' OR content ILIKE '%costing%' OR content ILIKE '%production cost%';

-- UPDATE knowledge_chunks 
-- SET category = 'Marketing', 
--     subcategory = 'Campaign management'
-- WHERE content ILIKE '%marketing%' OR content ILIKE '%campaign%' OR content ILIKE '%advertising%';

-- UPDATE knowledge_chunks 
-- SET category = 'Hiring', 
--     subcategory = 'Recruitment process'
-- WHERE content ILIKE '%hiring%' OR content ILIKE '%recruitment%' OR content ILIKE '%interview%';

-- Verify the changes
SELECT 
    id,
    gpt_id,
    category,
    subcategory,
    LEFT(content, 100) as content_preview,
    metadata,
    created_at
FROM knowledge_chunks 
ORDER BY created_at DESC;
