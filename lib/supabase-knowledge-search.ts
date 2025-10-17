import { createClient } from "@supabase/supabase-js"
import { generateEmbedding } from "./embeddings"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export interface KnowledgeChunk {
  id: string
  gpt_id: string
  category?: string
  subcategory?: string
  content: string
  embedding?: number[]
  metadata?: any
  created_at: string
}

export interface SearchResult {
  content: string
  similarity: number
  source: string
  category?: string
  subcategory?: string
  metadata?: any
}

let supabase: any = null

function getSupabaseClient() {
  if (!supabase && supabaseUrl && supabaseKey) {
    try {
      supabase = createClient(supabaseUrl, supabaseKey)
      console.log("✅ Supabase client initialized successfully")
    } catch (error) {
      console.error("❌ Failed to initialize Supabase client:", error)
      return null
    }
  }
  return supabase
}

export async function indexKnowledgeBaseSupabase(gptId: string, content?: string, metadata?: any): Promise<boolean> {
  console.log(`📝 Indexing knowledge base for GPT: ${gptId}`)

  const client = getSupabaseClient()
  if (!client) {
    console.error("❌ Supabase not configured, cannot index knowledge base")
    return false
  }

  try {
    // If content is provided, index it directly
    if (content) {
      console.log(`📄 Indexing content: ${content.substring(0, 100)}...`)

      // Generate embedding for the content
      let embedding: number[] | null = null
      try {
        embedding = await generateEmbedding(content)
        console.log(`✅ Generated embedding with ${embedding?.length || 0} dimensions`)
      } catch (embeddingError) {
        console.error("⚠️ Failed to generate embedding:", embeddingError)
        // Continue without embedding - we can still store the content
      }

      // Insert into knowledge_chunks table
      const { data, error } = await client
        .from("knowledge_chunks")
        .insert({
          gpt_id: gptId,
          content: content,
          embedding: embedding,
          category: metadata?.category,
          subcategory: metadata?.subcategory,
          metadata: {
            filename: metadata?.filename || "Manual Entry",
            source: metadata?.source || "direct",
            uploadedAt: new Date().toISOString(),
            ...metadata,
          },
        })
        .select()

      if (error) {
        console.error("❌ Failed to insert knowledge chunk:", error)
        return false
      }

      console.log(`✅ Successfully indexed content for GPT: ${gptId}`)
      return true
    }

    // If no content provided, this might be a batch indexing operation
    console.log(`✅ Indexing operation completed for GPT: ${gptId}`)
    return true
  } catch (error) {
    console.error("❌ Error indexing knowledge base:", error)
    return false
  }
}

export async function searchKnowledgeBaseSupabase(
  query: string,
  gptId: string,
  category?: string,
  subcategory?: string,
): Promise<SearchResult[]> {
  console.log(`🔍 === KNOWLEDGE BASE SEARCH STARTING ===`)
  console.log(`🔍 GPT ID: ${gptId}`)
  console.log(`🔍 Query: "${query}"`)
  if (category) console.log(`📂 Category filter: ${category}`)
  if (subcategory) console.log(`📁 Subcategory filter: ${subcategory}`)

  const client = getSupabaseClient()
  if (!client) {
    console.log("❌ Supabase not configured, skipping knowledge base search")
    return []
  }

  try {
    let supabaseQuery = client
      .from("knowledge_chunks")
      .select("id, gpt_id, category, subcategory, content, embedding, metadata, created_at")
      .ilike("gpt_id", `%${gptId}%`)

    if (category) {
      supabaseQuery = supabaseQuery.eq("category", category)
    }
    if (subcategory) {
      supabaseQuery = supabaseQuery.eq("subcategory", subcategory)
    }

    const { data: chunks, error } = await supabaseQuery

    if (error) {
      console.error("❌ Supabase query error:", error)
      return []
    }

    if (!chunks || chunks.length === 0) {
      console.log(`❌ No knowledge chunks found for GPT: ${gptId}`)
      if (category || subcategory) {
        console.log("🔄 Retrying without category filters...")
        return searchKnowledgeBaseSupabase(query, gptId)
      }
      return []
    }

    console.log(`✅ Found ${chunks.length} total knowledge chunks for GPT: ${gptId}`)

    // Log sample content for debugging
    console.log(`📄 Sample chunks:`)
    chunks.slice(0, 3).forEach((chunk, index) => {
      console.log(`   Chunk ${index + 1}:`)
      console.log(`      Category: ${chunk.category || "None"}`)
      console.log(`      Subcategory: ${chunk.subcategory || "None"}`)
      console.log(`      Content preview: ${chunk.content?.substring(0, 100)}...`)
      console.log(`      Has embedding: ${chunk.embedding ? "Yes" : "No"}`)
      console.log(`      Source: ${chunk.metadata?.filename || chunk.metadata?.source || "Unknown"}`)
    })

    // Try vector search first if embeddings exist
    const chunksWithEmbeddings = chunks.filter(
      (chunk) => chunk.embedding && Array.isArray(chunk.embedding) && chunk.embedding.length > 0,
    )

    if (chunksWithEmbeddings.length > 0) {
      console.log(`🔍 Attempting vector search with ${chunksWithEmbeddings.length} chunks with embeddings`)
      try {
        const queryEmbedding = await generateEmbedding(query)
        if (queryEmbedding && queryEmbedding.length > 0) {
          const vectorResults = await performVectorSearch(client, gptId, queryEmbedding, category, subcategory)
          if (vectorResults.length > 0) {
            console.log(`✅ Vector search found ${vectorResults.length} results`)
            return vectorResults
          }
        }
      } catch (embeddingError) {
        console.error("⚠️ Vector search failed, falling back to text search:", embeddingError)
      }
    } else {
      console.log(`ℹ️ No chunks with embeddings found, using text search`)
    }

    console.log("🔍 Performing enhanced text search")
    return performEnhancedTextSearch(chunks, query)
  } catch (error) {
    console.error("❌ Knowledge base search error:", error)
    return []
  }
}

async function performVectorSearch(
  client: any,
  gptId: string,
  queryEmbedding: number[],
  category?: string,
  subcategory?: string,
): Promise<SearchResult[]> {
  try {
    const rpcQuery = client.rpc("match_knowledge_chunks", {
      query_embedding: queryEmbedding,
      gpt_id_param: gptId,
      match_threshold: 0.5,
      match_count: 10,
    })

    const { data: matches, error } = await rpcQuery

    if (error) {
      console.error("❌ Vector search RPC error:", error)
      return []
    }

    if (!matches || matches.length === 0) {
      console.log("❌ No vector search matches found")
      return []
    }

    // Filter by category/subcategory if specified
    let filteredMatches = matches
    if (category) {
      filteredMatches = filteredMatches.filter((match: any) => match.category === category)
    }
    if (subcategory) {
      filteredMatches = filteredMatches.filter((match: any) => match.subcategory === subcategory)
    }

    console.log(`✅ Vector search found ${filteredMatches.length} relevant matches`)

    return filteredMatches.map((match: any) => ({
      content: match.content || "",
      similarity: Math.round((match.similarity || 0) * 100),
      source: match.metadata?.filename || "Unknown source",
      category: match.category,
      subcategory: match.subcategory,
    }))
  } catch (error) {
    console.error("❌ Vector search error:", error)
    return []
  }
}

function performEnhancedTextSearch(chunks: KnowledgeChunk[], query: string): SearchResult[] {
  console.log("🔍 === ENHANCED TEXT SEARCH ===")
  console.log(`🔍 Searching ${chunks.length} chunks for: "${query}"`)

  const queryLower = query.toLowerCase().trim()

  const searchTerms = queryLower
    .split(/\s+/)
    .filter((term) => term.length > 0)
    .map((term) => term.replace(/[^\w]/g, "")) // Remove punctuation
    .filter((term) => term.length > 0)
    // Remove common question words but keep important terms
    .filter(
      (term) =>
        !["what", "when", "where", "who", "why", "how", "is", "are", "the", "a", "an", "does", "do"].includes(term),
    )

  console.log(`🔍 Search terms extracted: [${searchTerms.join(", ")}]`)

  const scoredChunks = chunks.map((chunk) => {
    const content = (chunk.content || "").toLowerCase()
    const metadataStr = JSON.stringify(chunk.metadata || {}).toLowerCase()
    const category = (chunk.category || "").toLowerCase()
    const subcategory = (chunk.subcategory || "").toLowerCase()
    const source = (chunk.metadata?.filename || chunk.metadata?.source || "").toLowerCase()

    let score = 0
    const matchDetails: string[] = []

    if (content.includes(queryLower)) {
      score += 300
      matchDetails.push(`EXACT_PHRASE`)
      console.log(`   ✅ EXACT PHRASE MATCH in content (+300)`)
    }

    if (metadataStr.includes(queryLower)) {
      score += 200
      matchDetails.push(`EXACT_IN_METADATA`)
      console.log(`   ✅ EXACT PHRASE MATCH in metadata (+200)`)
    }

    searchTerms.forEach((term) => {
      // Content matches - 100 points per occurrence
      const contentMatches = (content.match(new RegExp(`\\b${term}\\b`, "gi")) || []).length
      if (contentMatches > 0) {
        const termScore = contentMatches * 100
        score += termScore
        matchDetails.push(`${term}:content(${contentMatches})`)
        console.log(`   ✅ Term "${term}" found ${contentMatches}x in content (+${termScore})`)
      }

      // Metadata matches - 80 points per occurrence
      const metadataMatches = (metadataStr.match(new RegExp(`\\b${term}\\b`, "gi")) || []).length
      if (metadataMatches > 0) {
        const termScore = metadataMatches * 80
        score += termScore
        matchDetails.push(`${term}:metadata(${metadataMatches})`)
        console.log(`   ✅ Term "${term}" found ${metadataMatches}x in metadata (+${termScore})`)
      }

      // Source/filename matches - 60 points
      if (source.includes(term)) {
        score += 60
        matchDetails.push(`${term}:source`)
        console.log(`   ✅ Term "${term}" found in source (+60)`)
      }

      // Category matches - 50 points
      if (category.includes(term)) {
        score += 50
        matchDetails.push(`${term}:category`)
        console.log(`   ✅ Term "${term}" found in category (+50)`)
      }

      // Subcategory matches - 40 points
      if (subcategory.includes(term)) {
        score += 40
        matchDetails.push(`${term}:subcategory`)
        console.log(`   ✅ Term "${term}" found in subcategory (+40)`)
      }
    })

    searchTerms.forEach((term) => {
      if (term.length <= 5) {
        // Short terms like "CRM", "API", "rep", etc.
        const partialMatches = (content.match(new RegExp(term, "gi")) || []).length
        if (partialMatches > 0) {
          const partialScore = partialMatches * 50
          score += partialScore
          matchDetails.push(`${term}:partial(${partialMatches})`)
          console.log(`   ✅ Partial match for "${term}" found ${partialMatches}x (+${partialScore})`)
        }
      }
    })

    const questionPatterns = [
      {
        pattern: /what.*purpose|purpose.*ai|ai.*assistant/i,
        keywords: ["purpose", "ai", "assistant", "goal", "objective"],
      },
      {
        pattern: /what.*crm|crm.*use|crm.*system/i,
        keywords: ["crm", "buildertrend", "customer", "management", "system"],
      },
      {
        pattern: /after.*contract|contract.*signed|post.*contract/i,
        keywords: ["contract", "signed", "after", "next", "steps", "process"],
      },
      {
        pattern: /outside.*service.*area|service.*area.*outside/i,
        keywords: ["service", "area", "outside", "territory", "region"],
      },
      { pattern: /what.*rep.*do|rep.*should/i, keywords: ["rep", "representative", "should", "do", "action"] },
    ]

    questionPatterns.forEach(({ pattern, keywords }) => {
      if (pattern.test(queryLower)) {
        keywords.forEach((keyword) => {
          if (content.includes(keyword)) {
            score += 75
            matchDetails.push(`semantic:${keyword}`)
            console.log(`   ✅ Semantic match for "${keyword}" (+75)`)
          }
        })
      }
    })

    // 4. BONUS POINTS
    // Has category - 15 points
    if (chunk.category) {
      score += 15
      matchDetails.push(`has_category`)
    }

    // Has metadata - 10 points
    if (chunk.metadata && Object.keys(chunk.metadata).length > 0) {
      score += 10
      matchDetails.push(`has_metadata`)
    }

    // Log scoring details for chunks with any matches
    if (score > 0) {
      console.log(`📊 Chunk scored ${score} points:`)
      console.log(`   Content: "${chunk.content?.substring(0, 150)}..."`)
      console.log(`   Source: ${chunk.metadata?.filename || chunk.metadata?.source || "Unknown"}`)
      console.log(`   Category: ${chunk.category || "None"}`)
      console.log(`   Matches: ${matchDetails.join(", ")}`)
    }

    return {
      chunk,
      score,
      matchDetails,
    }
  })

  const relevantChunks = scoredChunks
    .filter((item) => item.score >= 5)
    .sort((a, b) => b.score - a.score)
    .slice(0, 15)

  console.log(`✅ Found ${relevantChunks.length} relevant chunks via text search`)

  if (relevantChunks.length > 0) {
    console.log(`📊 Top results:`)
    relevantChunks.slice(0, 10).forEach((item, index) => {
      console.log(`   ${index + 1}. Score: ${item.score}, Source: ${item.chunk.metadata?.filename || "Unknown"}`)
    })
  } else {
    console.log(`⚠️ No chunks met the minimum score threshold of 5 points`)
  }

  return relevantChunks.map((item) => {
    const normalizedScore = Math.min(Math.max(Math.round((item.score / 300) * 100), 35), 100)

    return {
      content: item.chunk.content || "",
      similarity: normalizedScore,
      source: item.chunk.metadata?.filename || item.chunk.metadata?.source || "Unknown source",
      category: item.chunk.category,
      subcategory: item.chunk.subcategory,
      metadata: item.chunk.metadata,
    }
  })
}

// Helper function to search by category
export async function searchByCategory(gptId: string, category: string, subcategory?: string): Promise<SearchResult[]> {
  console.log(`🔍 Searching by category: ${category}${subcategory ? ` > ${subcategory}` : ""}`)

  const client = getSupabaseClient()
  if (!client) return []

  try {
    let query = client
      .from("knowledge_chunks")
      .select("id, gpt_id, category, subcategory, content, metadata, created_at")
      .eq("gpt_id", gptId)
      .eq("category", category)

    if (subcategory) {
      query = query.eq("subcategory", subcategory)
    }

    const { data: chunks, error } = await query

    if (error || !chunks) {
      console.error("❌ Category search error:", error)
      return []
    }

    console.log(`✅ Found ${chunks.length} chunks in category: ${category}`)

    return chunks.map((chunk) => ({
      content: chunk.content || "",
      similarity: 100, // Perfect match for category search
      source: chunk.metadata?.filename || chunk.metadata?.source || "Unknown source",
      category: chunk.category,
      subcategory: chunk.subcategory,
      metadata: chunk.metadata,
    }))
  } catch (error) {
    console.error("❌ Category search error:", error)
    return []
  }
}
