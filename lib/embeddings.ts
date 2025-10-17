// Generate embeddings using OpenAI's text-embedding-ada-002 model
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    console.warn("⚠️ Invalid text provided for embedding generation")
    return []
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OpenAI API key not configured for embedding generation")
    throw new Error("OpenAI API key not configured")
  }

  try {
    console.log(`🔢 Generating embedding for text: "${text.substring(0, 100)}..."`)

    // Clean the text
    const cleanText = text
      .replace(/\n+/g, " ") // Replace multiple newlines with single space
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .trim()

    if (cleanText.length === 0) {
      console.warn("⚠️ Text is empty after cleaning")
      return []
    }

    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "text-embedding-ada-002",
        input: cleanText,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ OpenAI Embeddings API error: ${response.status} - ${errorText}`)
      throw new Error(`OpenAI Embeddings API error: ${response.status}`)
    }

    const data = await response.json()

    if (!data.data || !data.data[0] || !data.data[0].embedding) {
      console.error("❌ Invalid embedding response from OpenAI")
      throw new Error("Invalid embedding response")
    }

    const embedding = data.data[0].embedding
    console.log(`✅ Generated embedding with ${embedding.length} dimensions`)

    return embedding
  } catch (error) {
    console.error("❌ Error generating embedding:", error)
    throw error
  }
}

// Generate embeddings for multiple texts in batch
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (!texts || !Array.isArray(texts) || texts.length === 0) {
    console.warn("⚠️ Invalid texts array provided for batch embedding generation")
    return []
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OpenAI API key not configured for embedding generation")
    throw new Error("OpenAI API key not configured")
  }

  try {
    console.log(`🔢 Generating embeddings for ${texts.length} texts`)

    // Clean all texts
    const cleanTexts = texts
      .map((text) => text.replace(/\n+/g, " ").replace(/\s+/g, " ").trim())
      .filter((text) => text.length > 0)

    if (cleanTexts.length === 0) {
      console.warn("⚠️ No valid texts after cleaning")
      return []
    }

    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "text-embedding-ada-002",
        input: cleanTexts,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ OpenAI Embeddings API error: ${response.status} - ${errorText}`)
      throw new Error(`OpenAI Embeddings API error: ${response.status}`)
    }

    const data = await response.json()

    if (!data.data || !Array.isArray(data.data)) {
      console.error("❌ Invalid batch embedding response from OpenAI")
      throw new Error("Invalid batch embedding response")
    }

    const embeddings = data.data.map((item: any) => item.embedding)
    console.log(`✅ Generated ${embeddings.length} embeddings`)

    return embeddings
  } catch (error) {
    console.error("❌ Error generating batch embeddings:", error)
    throw error
  }
}

// Calculate cosine similarity between two embeddings
export function calculateSimilarity(embedding1: number[], embedding2: number[]): number {
  if (!embedding1 || !embedding2 || embedding1.length !== embedding2.length) {
    return 0
  }

  let dotProduct = 0
  let norm1 = 0
  let norm2 = 0

  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i]
    norm1 += embedding1[i] * embedding1[i]
    norm2 += embedding2[i] * embedding2[i]
  }

  if (norm1 === 0 || norm2 === 0) {
    return 0
  }

  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
}
