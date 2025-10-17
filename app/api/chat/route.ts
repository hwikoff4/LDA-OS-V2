import { getGPTConfig } from "@/lib/gpt-configs"
import { searchKnowledgeBaseSupabase } from "@/lib/supabase-knowledge-search"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages, gptId } = await req.json()

    console.log(`🤖 === CHAT API REQUEST ===`)
    console.log(`🤖 GPT ID: ${gptId}`)
    console.log(`🤖 Messages count: ${messages?.length || 0}`)

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error("❌ OpenAI API key not configured")
      return new Response(JSON.stringify({ error: "OpenAI API key not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Get GPT configuration
    const gptConfig = getGPTConfig(gptId || "legacy-ai")
    if (!gptConfig) {
      console.error(`❌ GPT configuration not found for: ${gptId}`)
      return new Response(JSON.stringify({ error: "GPT configuration not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }

    console.log(`📋 Using GPT config: ${gptConfig.name}`)
    console.log(`📋 Knowledge base enabled: ${gptConfig.knowledgeBase?.enabled || false}`)

    // Get the latest user message for knowledge base search
    const latestUserMessage =
      messages && Array.isArray(messages) && messages.length > 0 ? messages[messages.length - 1]?.content || "" : ""

    console.log(`💬 Latest user message: "${latestUserMessage}"`)

    // Use the system prompt from GPT config
    let systemPrompt = gptConfig.systemPrompt || "You are a helpful AI assistant."
    console.log(`📝 Base system prompt length: ${systemPrompt.length} characters`)

    systemPrompt += "\n\n=== CRITICAL INSTRUCTIONS ===\n"
    systemPrompt +=
      "1. You MUST ONLY use information from your knowledge base when answering questions about Legacy Decks Academy.\n"
    systemPrompt +=
      "2. If you do not find relevant information in your knowledge base, you MUST respond with: 'I don't have specific information about that in my knowledge base. Please contact a Legacy Decks Academy representative for accurate information.'\n"
    systemPrompt +=
      "3. NEVER make assumptions or provide generic information when asked specific questions about Legacy Decks Academy.\n"
    systemPrompt +=
      "4. NEVER hallucinate or invent information that is not explicitly provided in your knowledge base.\n"
    systemPrompt += "5. When you use knowledge base information, ALWAYS cite the source document.\n"
    systemPrompt += "=== END CRITICAL INSTRUCTIONS ===\n"

    let hasRelevantKnowledge = false

    // Add knowledge base context using vector search if available
    if (gptConfig.knowledgeBase?.enabled && latestUserMessage && latestUserMessage.trim().length > 0) {
      try {
        console.log(`🔍 === KNOWLEDGE BASE SEARCH STARTING ===`)
        console.log(`🔍 Searching for: "${latestUserMessage}"`)
        console.log(`🔍 GPT ID: ${gptConfig.id}`)

        // Search the vector database for relevant content
        const searchResults = await searchKnowledgeBaseSupabase(latestUserMessage, gptConfig.id)

        console.log(`🔍 Search completed. Results count: ${searchResults?.length || 0}`)

        if (searchResults && Array.isArray(searchResults) && searchResults.length > 0) {
          console.log(`✅ Found ${searchResults.length} relevant knowledge base results`)

          // Log details about each result
          searchResults.forEach((result, index) => {
            console.log(`📄 Result ${index + 1}:`)
            console.log(`   - Source: ${result.metadata?.source || result.source || "Unknown"}`)
            console.log(`   - Similarity: ${((result.similarity || 0) * 100).toFixed(1)}%`)
            console.log(`   - Content preview: "${result.content?.substring(0, 200)}..."`)
          })

          const relevantResults = searchResults.filter((result) => (result.similarity || 0) >= 20)

          if (relevantResults.length > 0) {
            console.log(`✅ Found ${relevantResults.length} results above relevance threshold`)
            hasRelevantKnowledge = true

            const knowledgeContext = relevantResults
              .filter((result) => result && result.content) // Filter out invalid results
              .map(
                (result, index) =>
                  `[Knowledge Base Source ${index + 1}: ${result.metadata?.source || result.source || "Unknown Document"} - Relevance: ${((result.similarity || 0) * 100).toFixed(1)}%]\n${result.content}`,
              )
              .join("\n\n")

            if (knowledgeContext.trim().length > 0) {
              systemPrompt += "\n\n=== KNOWLEDGE BASE CONTENT ===\n"
              systemPrompt +=
                "The following content is from your verified knowledge base. You MUST use ONLY this information to answer questions about Legacy Decks Academy. Do NOT add any information that is not explicitly stated below.\n\n"
              systemPrompt += knowledgeContext
              systemPrompt += "\n\n=== END KNOWLEDGE BASE CONTENT ===\n"
              systemPrompt +=
                "\nIMPORTANT: Base your response EXCLUSIVELY on the knowledge base content above. If the answer is not in the knowledge base content, say so explicitly. Always cite the source document when using knowledge base information."

              console.log(`📚 Added knowledge base context to system prompt`)
              console.log(`📚 Final system prompt length: ${systemPrompt.length} characters`)
              console.log(`📚 Knowledge context length: ${knowledgeContext.length} characters`)
            }
          } else {
            console.log("⚠️ No results met the relevance threshold (20%)")
          }
        } else {
          console.log("ℹ️ No relevant knowledge base content found")
        }

        if (!hasRelevantKnowledge) {
          systemPrompt += "\n\n=== NO RELEVANT KNOWLEDGE FOUND ===\n"
          systemPrompt +=
            "Your knowledge base search did not return relevant information for this query. You MUST respond with: 'I don't have specific information about that in my knowledge base. Please contact a Legacy Decks Academy representative for accurate information.'\n"
          systemPrompt += "Do NOT provide generic or assumed information.\n"
          systemPrompt += "=== END ===\n"
          console.log("⚠️ Added 'no knowledge found' instruction to system prompt")
        }
      } catch (error) {
        console.warn("⚠️ Failed to search knowledge base, continuing without it:", error)
        systemPrompt += "\n\n=== KNOWLEDGE BASE UNAVAILABLE ===\n"
        systemPrompt +=
          "Your knowledge base is currently unavailable. For questions about Legacy Decks Academy, you MUST respond with: 'I'm unable to access my knowledge base at the moment. Please contact a Legacy Decks Academy representative for accurate information.'\n"
        systemPrompt += "=== END ===\n"
      }
    } else {
      console.log(`ℹ️ Knowledge base search skipped:`)
      console.log(`   - Enabled: ${gptConfig.knowledgeBase?.enabled || false}`)
      console.log(`   - Has message: ${!!latestUserMessage}`)
      console.log(`   - Message length: ${latestUserMessage?.length || 0}`)
    }

    // Validate and prepare messages for OpenAI API
    const validMessages = Array.isArray(messages) ? messages.filter((msg) => msg && msg.role && msg.content) : []

    if (validMessages.length === 0) {
      console.error("❌ No valid messages provided")
      return new Response(JSON.stringify({ error: "No valid messages provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const openaiMessages = [
      { role: "system", content: systemPrompt },
      ...validMessages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
    ]

    console.log(`🚀 Calling OpenAI API with ${openaiMessages.length} messages...`)

    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: openaiMessages,
        temperature: 0.7,
        max_tokens: 2000,
        stream: true,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ OpenAI API error:", response.status, errorText)
      return new Response(JSON.stringify({ error: `OpenAI API error: ${response.status}` }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    console.log("✅ OpenAI API response received, processing stream...")

    // Create a readable stream that processes OpenAI's streaming response
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const readableStream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        if (!reader) {
          controller.close()
          return
        }

        try {
          let buffer = ""

          while (true) {
            const { done, value } = await reader.read()

            if (done) {
              controller.close()
              break
            }

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split("\n")

            // Keep the last incomplete line in the buffer
            buffer = lines.pop() || ""

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6).trim()

                if (data === "[DONE]") {
                  controller.close()
                  return
                }

                try {
                  const parsed = JSON.parse(data)
                  const content = parsed.choices?.[0]?.delta?.content

                  if (content) {
                    // Send content directly as text chunks
                    controller.enqueue(encoder.encode(content))
                  }
                } catch (e) {
                  // Skip invalid JSON
                  console.warn("⚠️ Failed to parse streaming chunk:", data)
                }
              }
            }
          }
        } catch (error) {
          console.error("❌ Stream processing error:", error)
          controller.error(error)
        }
      },
    })

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("❌ Chat API error:", error)
    return new Response(
      JSON.stringify({
        error: "Failed to process chat request",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
