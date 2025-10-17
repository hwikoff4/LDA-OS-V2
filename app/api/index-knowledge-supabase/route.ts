import { generateEmbedding } from "@/lib/embeddings"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(req: Request) {
  try {
    const { gptId, files, title, category, subcategory } = await req.json()

    console.log("[v0] 📥 Received indexing request for GPT:", gptId)
    console.log("[v0] 📄 Files to process:", files?.length || 0)

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "Supabase configuration missing" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    if (files && files.length > 0) {
      const supabase = createClient(supabaseUrl, supabaseKey)
      let totalChunksIndexed = 0

      for (const file of files) {
        console.log(`[v0] 📝 Processing file: ${file.name}`)

        const chunks = [file.content] // Store as single chunk
        console.log(`[v0] 📊 Storing as ${chunks.length} chunk (entire file)`)

        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i]

          // Generate embedding for the chunk
          let embedding: number[] | null = null
          try {
            embedding = await generateEmbedding(chunk)
            console.log(`[v0] ✅ Generated embedding for chunk ${i + 1}/${chunks.length}`)
          } catch (embeddingError) {
            console.error(`[v0] ⚠️ Failed to generate embedding for chunk ${i + 1}:`, embeddingError)
          }

          // Insert chunk into knowledge_chunks table
          const { error } = await supabase.from("knowledge_chunks").insert({
            gpt_id: gptId,
            content: chunk,
            embedding: embedding,
            category: category || null,
            subcategory: subcategory || null,
            metadata: {
              filename: file.name,
              title: title || file.name,
              source: "file_upload",
              uploadedAt: file.uploadedAt || new Date().toISOString(),
              fileType: file.type,
              fileSize: file.size,
              processing_method: file.processing_method,
            },
          })

          if (error) {
            console.error(`[v0] ❌ Failed to insert chunk ${i + 1}:`, error)
          } else {
            totalChunksIndexed++
            console.log(`[v0] ✅ Inserted chunk ${i + 1}/${chunks.length}`)
          }
        }
      }

      console.log(`[v0] 🎉 Successfully indexed ${totalChunksIndexed} chunks`)

      return new Response(
        JSON.stringify({
          success: true,
          message: `Indexed ${files.length} file(s) into ${totalChunksIndexed} chunks`,
          indexedCount: totalChunksIndexed,
        }),
        {
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Fallback for legacy calls without files
    return new Response(
      JSON.stringify({
        success: true,
        message: "No files provided to index",
        indexedCount: 0,
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error("[v0] ❌ Indexing error:", error)
    return new Response(
      JSON.stringify({
        error: "Failed to index knowledge base",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
