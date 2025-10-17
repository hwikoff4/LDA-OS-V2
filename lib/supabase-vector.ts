import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database schema for knowledge base
export interface KnowledgeChunk {
  id: string
  gpt_id: string
  content: string
  embedding: number[]
  metadata: {
    source: string
    chunk_index: number
    file_id: string
  }
  created_at: string
}

// Initialize the vector extension and tables
export async function initializeVectorDatabase() {
  try {
    // Enable pgvector extension
    await supabase.rpc("enable_pgvector")

    // Create knowledge_chunks table with vector column
    const { error } = await supabase.rpc("create_knowledge_table")

    if (error) {
      console.error("Error initializing vector database:", error)
      throw error
    }

    console.log("Vector database initialized successfully")
  } catch (error) {
    console.error("Failed to initialize vector database:", error)
    throw error
  }
}

// Clean text content to handle Unicode issues
function cleanTextContent(text: string): string {
  try {
    // Remove or replace problematic Unicode characters
    return text
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove control characters
      .replace(/[\u2000-\u206F]/g, " ") // Replace general punctuation with spaces
      .replace(/[\u2070-\u209F]/g, "") // Remove superscripts/subscripts
      .replace(/[\uFFF0-\uFFFF]/g, "") // Remove specials
      .replace(/\\/g, "\\\\") // Escape backslashes
      .replace(/"/g, '\\"') // Escape quotes
      .replace(/\n/g, "\\n") // Escape newlines
      .replace(/\r/g, "\\r") // Escape carriage returns
      .replace(/\t/g, "\\t") // Escape tabs
      .trim()
  } catch (error) {
    console.error("Error cleaning text content:", error)
    // Return a safe fallback
    return text.replace(/[^\x20-\x7E]/g, "").trim()
  }
}

// Store document chunks with embeddings
export async function storeKnowledgeChunks(chunks: Omit<KnowledgeChunk, "id" | "created_at">[]) {
  try {
    // Clean and validate chunks before storing
    const cleanedChunks = chunks
      .map((chunk, index) => {
        try {
          return {
            gpt_id: chunk.gpt_id,
            content: cleanTextContent(chunk.content),
            embedding: chunk.embedding,
            metadata: {
              source: cleanTextContent(chunk.metadata.source),
              chunk_index: chunk.metadata.chunk_index,
              file_id: chunk.metadata.file_id,
            },
          }
        } catch (error) {
          console.error(`Error processing chunk ${index}:`, error)
          // Return a safe fallback chunk
          return {
            gpt_id: chunk.gpt_id,
            content: "Content processing error",
            embedding: chunk.embedding,
            metadata: {
              source: "unknown",
              chunk_index: chunk.metadata.chunk_index,
              file_id: chunk.metadata.file_id,
            },
          }
        }
      })
      .filter((chunk) => chunk.content.length > 0) // Remove empty chunks

    if (cleanedChunks.length === 0) {
      console.warn("No valid chunks to store after cleaning")
      return []
    }

    console.log(`Storing ${cleanedChunks.length} cleaned chunks...`)

    const { data, error } = await supabase.from("knowledge_chunks").insert(cleanedChunks).select()

    if (error) {
      console.error("Supabase insert error:", error)
      throw error
    }

    console.log(`Successfully stored ${data?.length || 0} chunks`)
    return data
  } catch (error) {
    console.error("Error storing knowledge chunks:", error)
    throw error
  }
}

// Search for similar content using vector similarity
export async function searchKnowledgeBase(queryEmbedding: number[], gptId: string, limit = 5, threshold = 0.7) {
  try {
    const { data, error } = await supabase.rpc("search_knowledge_chunks", {
      query_embedding: queryEmbedding,
      gpt_id: gptId,
      match_threshold: threshold,
      match_count: limit,
    })

    if (error) {
      console.error("Search error:", error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Error searching knowledge base:", error)
    return []
  }
}

// Delete all chunks for a specific GPT
export async function deleteGPTKnowledgeBase(gptId: string) {
  try {
    const { error } = await supabase.from("knowledge_chunks").delete().eq("gpt_id", gptId)

    if (error) {
      console.error("Delete error:", error)
      throw error
    }

    console.log(`Deleted knowledge base for GPT: ${gptId}`)
  } catch (error) {
    console.error("Error deleting knowledge base:", error)
    throw error
  }
}
