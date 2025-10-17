export async function POST(req: Request) {
  try {
    const { text, fileName } = await req.json()

    if (!text) {
      return Response.json({ error: "No text provided" }, { status: 400 })
    }

    console.log(`[v0] Processing extracted text from: ${fileName}, Length: ${text.length} characters`)

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `Please clean and format the following text that was extracted from a PDF. Remove any formatting artifacts, fix spacing issues, and ensure the text flows naturally while preserving all the original content and meaning. IMPORTANT: Do not truncate or summarize the text - preserve the complete content:\n\n${text}`,
          },
        ],
      }),
    })

    if (!response.ok) {
      let errorMessage = "Unknown API error"
      try {
        const errorData = await response.json()
        errorMessage = errorData.error?.message || errorMessage
      } catch {
        try {
          errorMessage = await response.text()
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
      }
      console.error("[v0] OpenAI API error:", errorMessage)
      throw new Error(`OpenAI API error: ${errorMessage}`)
    }

    const data = await response.json()
    const processedText = data.choices[0]?.message?.content || text

    console.log(`[v0] Text processing completed, final length: ${processedText.length} characters`)

    const wasTruncated = data.choices[0]?.finish_reason === "length"
    if (wasTruncated) {
      console.log(`[v0] Warning: Text may have been truncated due to token limits`)
    }

    return Response.json({
      processedText,
      originalLength: text.length,
      processedLength: processedText.length,
      wasTruncated,
    })
  } catch (error) {
    console.error("[v0] Text processing error:", error)
    return Response.json(
      {
        error: "Failed to process text",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
