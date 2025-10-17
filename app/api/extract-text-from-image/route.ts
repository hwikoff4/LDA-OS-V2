export async function POST(req: Request) {
  try {
    const { image, fileName, mimeType } = await req.json()

    if (!image) {
      return Response.json({ error: "No image provided" }, { status: 400 })
    }

    console.log(`[v0] Processing image text extraction from: ${fileName}, Type: ${mimeType}`)

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please extract all text content from this image. Include any text that appears in the image, whether it's printed text, handwritten text, signs, labels, or any other readable content. Preserve the structure and formatting as much as possible. If there is no readable text in the image, please respond with 'No readable text found in this image.'",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 4000,
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
      console.error("[v0] OpenAI Vision API error:", errorMessage)
      throw new Error(`OpenAI Vision API error: ${errorMessage}`)
    }

    const data = await response.json()
    const extractedText = data.choices[0]?.message?.content || "No text could be extracted from this image."

    console.log(`[v0] Image text extraction completed, extracted length: ${extractedText.length} characters`)

    return Response.json({
      extractedText,
      fileName,
      mimeType,
    })
  } catch (error) {
    console.error("[v0] Image text extraction error:", error)
    return Response.json(
      {
        error: "Failed to extract text from image",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
