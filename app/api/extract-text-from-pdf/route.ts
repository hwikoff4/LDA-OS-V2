import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] 📄 PDF text extraction API called")

    let pdf: any
    try {
      pdf = (await import("pdf-parse")).default
      console.log("[v0] ✅ pdf-parse module loaded successfully")
    } catch (importError) {
      console.error("[v0] ❌ Failed to import pdf-parse:", importError)
      return NextResponse.json(
        {
          error: "PDF parsing library not available",
          details: "The pdf-parse module could not be loaded. Please ensure it's installed.",
        },
        { status: 500 },
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      console.log("[v0] ❌ No file provided")
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log("[v0] 📂 Processing file:", file.name, "Size:", file.size)

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    console.log("[v0] 🔍 Parsing PDF with pdf-parse...")

    // Extract text from PDF
    const data = await pdf(buffer)

    console.log("[v0] ✅ PDF parsed successfully")
    console.log("[v0] 📊 Pages:", data.numpages)
    console.log("[v0] 📝 Text length:", data.text.length)

    // Clean up the extracted text
    const cleanedText = data.text
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .replace(/\n\s*\n/g, "\n\n") // Normalize line breaks
      .trim()

    console.log("[v0] 🧹 Text cleaned, final length:", cleanedText.length)

    if (!cleanedText || cleanedText.length < 10) {
      console.log("[v0] ⚠️ No readable text found in PDF")
      return NextResponse.json({
        text: "",
        pages: data.numpages,
        warning: "No readable text found. This might be a scanned PDF. Try using image-based extraction instead.",
      })
    }

    return NextResponse.json({
      text: cleanedText,
      pages: data.numpages,
      info: data.info,
    })
  } catch (error) {
    console.error("[v0] ❌ Error extracting text from PDF:", error)
    return NextResponse.json(
      {
        error: "Failed to extract text from PDF",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
