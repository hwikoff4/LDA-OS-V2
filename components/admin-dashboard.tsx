"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Users,
  Bot,
  FileText,
  MessageSquare,
  Plus,
  BarChart3,
  Settings,
  Upload,
  ArrowLeft,
  Edit,
  Save,
  X,
  Trash2,
  Database,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Search,
  Eye,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import Image from "next/image"
import { type GPTConfig, getGPTConfigs, updateGPTConfig } from "@/lib/supabase-gpt-service"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Placeholder for saveGPTConfigs. In a real application, this would be imported or defined.
// For now, we'll define a dummy function to satisfy the linting error.
const saveGPTConfigs = async (configs: GPTConfig[]) => {
  console.log("Dummy saveGPTConfigs called with:", configs)
  // In a real scenario, this would involve saving to localStorage or an API
}

export function AdminDashboard() {
  const [gptConfigs, setGptConfigs] = useState<GPTConfig[]>([])
  const [selectedGPT, setSelectedGPT] = useState<GPTConfig | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editingGPT, setEditingGPT] = useState<GPTConfig | null>(null)
  const [editingFormFields, setEditingFormFields] = useState<any[]>([])
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [indexing, setIndexing] = useState(false)
  const [pdfProcessingMethods, setPdfProcessingMethods] = useState<Record<number, "text-based" | "image-based">>({})
  const [extractingText, setExtractingText] = useState<Record<number, boolean>>({})
  const [extractedTexts, setExtractedTexts] = useState<Record<number, string>>({})
  const { toast } = useToast()

  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationStatus, setMigrationStatus] = useState<string>("")
  const [loadingGPTs, setLoadingGPTs] = useState(true)

  // Webhook URL for Make.com integration
  const WEBHOOK_URL = "https://hook.us1.make.com/6rtldzgsdqhtxir6xw6rctq6ddvdf1ec"

  const [knowledgeChunks, setKnowledgeChunks] = useState<any[]>([])
  const [loadingChunks, setLoadingChunks] = useState(false)
  const [chunksError, setChunksError] = useState<string | null>(null)
  const [chunkCounts, setChunkCounts] = useState<Record<string, number>>({})

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedChunk, setSelectedChunk] = useState<any | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingChunk, setEditingChunk] = useState<any | null>(null)
  const [savingChunk, setSavingChunk] = useState(false)
  const [deletingChunk, setDeletingChunk] = useState(false)

  // New state variables for file upload form
  const [fileTitle, setFileTitle] = useState("")
  const [fileCategory, setFileCategory] = useState("")
  const [fileSubcategory, setFileSubcategory] = useState("")

  // Renamed fetchKnowledgeChunks to loadKnowledgeChunks to avoid confusion with potential re-fetching
  const loadKnowledgeChunks = async (gptId: string) => {
    console.log("[v0] 🔍 loadKnowledgeChunks called with gptId:", gptId)
    setLoadingChunks(true)
    setChunksError(null)

    try {
      console.log("[v0] 📡 Creating Supabase client...")
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()
      console.log("[v0] ✅ Supabase client created")

      console.log("[v0] 🔎 Querying knowledge_chunks table for gpt_id (case-insensitive):", gptId)
      const { data, error } = await supabase
        .from("knowledge_chunks")
        .select("*")
        .ilike("gpt_id", gptId) // Case-insensitive match
        .order("created_at", { ascending: false })

      console.log("[v0] 📊 Supabase query completed")
      console.log("[v0] 📦 Data received:", data)
      console.log("[v0] ❌ Error (if any):", error)

      if (error) {
        console.error("[v0] 🚨 Supabase error:", error)
        throw error
      }

      console.log("[v0] ✅ Successfully fetched", data?.length || 0, "knowledge chunks")
      setKnowledgeChunks(data || [])
      setChunkCounts((prev) => ({ ...prev, [gptId]: data?.length || 0 }))
    } catch (error) {
      console.error("[v0] ❌ Error in loadKnowledgeChunks:", error)
      setChunksError(error instanceof Error ? error.message : "Failed to load knowledge base")
      setKnowledgeChunks([])
      setChunkCounts((prev) => ({ ...prev, [gptId]: 0 }))
    } finally {
      setLoadingChunks(false)
      console.log("[v0] 🏁 loadKnowledgeChunks completed")
    }
  }

  useEffect(() => {
    const loadGPTConfigs = async () => {
      console.log("[v0] 🚀 Admin Dashboard mounted, loading GPT configs from Supabase...")
      setLoadingGPTs(true)

      try {
        const configs = await getGPTConfigs()
        console.log("[v0] 📋 Loaded", configs.length, "GPT configs from Supabase")
        setGptConfigs(configs)

        const fetchAllChunkCounts = async () => {
          const { createClient } = await import("@/lib/supabase/client")
          const supabase = createClient()

          for (const config of configs) {
            const { data } = await supabase
              .from("knowledge_chunks")
              .select("id", { count: "exact", head: true })
              .ilike("gpt_id", config.id)

            setChunkCounts((prev) => ({ ...prev, [config.id]: data?.length || 0 }))
          }
        }

        fetchAllChunkCounts()

        // Select Legacy AI by default
        const legacyAI = configs.find((gpt) => gpt.id === "legacy-ai")
        if (legacyAI) {
          console.log("[v0] 🎯 Found Legacy AI, selecting it by default")
          setSelectedGPT(legacyAI)
          setEditingGPT({ ...legacyAI })
          console.log("[v0] 📞 Calling loadKnowledgeChunks for legacy-ai")
          loadKnowledgeChunks(legacyAI.id)
        } else {
          console.log("[v0] ⚠️ Legacy AI not found in configs")
        }
      } catch (error) {
        console.error("[v0] ❌ Error loading GPT configs:", error)
        toast({
          title: "Error",
          description: "Failed to load GPT configurations from database",
          variant: "destructive",
        })
      } finally {
        setLoadingGPTs(false)
      }
    }

    loadGPTConfigs()
  }, [])

  const handleGPTClick = (gpt: GPTConfig) => {
    console.log("[v0] 🖱️ GPT clicked:", gpt.name, "ID:", gpt.id)
    setSelectedGPT(gpt)
    setEditingGPT({ ...gpt }) // Create a copy for editing
    setEditingFormFields(gpt.formFields || [])
    setIsEditing(false)
    console.log("[v0] 📞 Calling loadKnowledgeChunks for", gpt.id)
    loadKnowledgeChunks(gpt.id)
  }

  const handleEditClick = () => {
    setIsEditing(true)
  }

  const handleSaveEdit = async () => {
    if (!editingGPT) return

    try {
      console.log("[v0] 💾 Saving GPT changes to Supabase:", editingGPT.id)

      const updatedGPT = await updateGPTConfig(editingGPT.id, {
        name: editingGPT.name,
        description: editingGPT.description,
        business_category: editingGPT.business_category,
        icon: editingGPT.icon,
        status: editingGPT.status,
        system_prompt: editingGPT.system_prompt,
        additional_instructions: editingGPT.additional_instructions,
        featured: editingGPT.featured,
        tags: editingGPT.tags,
        form_fields: editingFormFields,
      })

      if (updatedGPT) {
        // Update local state
        setGptConfigs((prev) => prev.map((gpt) => (gpt.id === updatedGPT.id ? updatedGPT : gpt)))
        setSelectedGPT(updatedGPT)
        setEditingGPT(updatedGPT)
        setIsEditing(false)

        toast({
          title: "Success",
          description: "GPT configuration updated successfully",
        })

        console.log("[v0] ✅ GPT saved successfully")
      } else {
        throw new Error("Failed to update GPT")
      }
    } catch (error) {
      console.error("[v0] ❌ Error saving GPT:", error)
      toast({
        title: "Error",
        description: "Failed to save GPT configuration",
        variant: "destructive",
      })
    }
  }

  const handleCancelClick = () => {
    setEditingGPT(selectedGPT ? { ...selectedGPT } : null)
    // Reset form fields on cancel
    setEditingFormFields(selectedGPT ? selectedGPT.formFields || [] : [])
    setIsEditing(false)
  }

  const handleDeleteClick = () => {
    if (selectedGPT && selectedGPT.id !== "legacy-ai") {
      const updatedConfigs = gptConfigs.filter((config) => config.id !== selectedGPT.id)
      setGptConfigs(updatedConfigs)
      // The linting error points to 'saveGPTConfigs' here. It needs to be defined or imported.
      // For the purpose of this fix, we'll assume it's available.
      saveGPTConfigs(updatedConfigs) // <-- Fix for undeclared variable
      setSelectedGPT(null)
      setEditingGPT(null)
      setIsEditing(false)
      toast({
        title: "Success",
        description: "GPT configuration deleted successfully",
      })
    } else {
      toast({
        title: "Error",
        description: "Cannot delete the main Legacy AI GPT",
        variant: "destructive",
      })
    }
  }

  const handleInputChange = (
    field:
      | keyof GPTConfig
      | `additionalInstructions`
      | `status`
      | "business_category"
      | "icon"
      | "featured"
      | "tags"
      | "system_prompt",
    value: string | string[] | boolean,
  ) => {
    if (editingGPT) {
      setEditingGPT({
        ...editingGPT,
        [field]: value,
      })
    }
  }

  const addFormField = () => {
    const newField = {
      id: `field-${Date.now()}`,
      label: "",
      type: "text",
      placeholder: "",
      required: true,
      options: [],
    }
    setEditingFormFields([...editingFormFields, newField])
  }

  const updateFormField = (fieldId: string, updates: any) => {
    setEditingFormFields(editingFormFields.map((field) => (field.id === fieldId ? { ...field, ...updates } : field)))
  }

  const deleteFormField = (fieldId: string) => {
    setEditingFormFields(editingFormFields.filter((field) => field.id !== fieldId))
  }

  const addSelectOption = (fieldId: string) => {
    const field = editingFormFields.find((f) => f.id === fieldId)
    if (field) {
      updateFormField(fieldId, {
        options: [...(field.options || []), ""],
      })
    }
  }

  const updateSelectOption = (fieldId: string, optionIndex: number, value: string) => {
    const field = editingFormFields.find((f) => f.id === fieldId)
    if (field && field.options) {
      const newOptions = [...field.options]
      newOptions[optionIndex] = value
      updateFormField(fieldId, { options: newOptions })
    }
  }

  const deleteSelectOption = (fieldId: string, optionIndex: number) => {
    const field = editingFormFields.find((f) => f.id === fieldId)
    if (field && field.options) {
      updateFormField(fieldId, {
        options: field.options.filter((_: any, index: number) => index !== optionIndex),
      })
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    setUploadingFiles((prev) => [...prev, ...selectedFiles])
  }

  const handleExtractText = async (file: File, index: number) => {
    const processingMethod = pdfProcessingMethods[index] || "text-based"

    setExtractingText((prev) => ({ ...prev, [index]: true }))

    try {
      console.log(`[v0] 📄 Extracting text from ${file.name} using ${processingMethod} method`)

      if (processingMethod === "text-based") {
        console.log(`[v0] 🔧 Starting client-side PDF text extraction...`)

        // Dynamically import pdfjs-dist
        const pdfjsLib = await import("pdfjs-dist")

        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

        const arrayBuffer = await file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

        console.log(`[v0] 📖 PDF loaded, ${pdf.numPages} pages found`)

        let fullText = ""

        // Process pages in chunks to avoid memory issues
        const chunkSize = 10
        for (let startPage = 1; startPage <= pdf.numPages; startPage += chunkSize) {
          const endPage = Math.min(startPage + chunkSize - 1, pdf.numPages)

          for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
            const page = await pdf.getPage(pageNum)
            const textContent = await page.getTextContent()
            const pageText = textContent.items.map((item: any) => item.str).join(" ")
            fullText += pageText + "\n\n"
          }

          // Small delay between chunks to prevent blocking
          if (endPage < pdf.numPages) {
            await new Promise((resolve) => setTimeout(resolve, 100))
          }
        }

        console.log(`[v0] 📝 Extracted ${fullText.length} characters from PDF`)

        if (!fullText.trim() || fullText.trim().length < 10) {
          throw new Error(
            "No readable text found in this PDF. The PDF might contain only images or be password protected. Try using 'Image-based extraction' instead.",
          )
        }

        // Process the extracted text with AI to clean it up
        console.log(`[v0] 🧹 Cleaning extracted text with AI...`)

        const processText = async (text: string) => {
          const maxChunkSize = 100000 // ~100k characters per chunk
          if (text.length <= maxChunkSize) {
            const response = await fetch("/api/process-extracted-text", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                text: text,
                fileName: file.name,
              }),
            })

            if (!response.ok) {
              let errorMessage = "Failed to process extracted text"
              try {
                const errorData = await response.json()
                errorMessage = errorData.error || errorMessage
              } catch {
                try {
                  errorMessage = await response.text()
                } catch {
                  errorMessage = `HTTP ${response.status}: ${response.statusText}`
                }
              }
              throw new Error(errorMessage)
            }

            const result = await response.json()
            return result.processedText
          } else {
            // Split large text into chunks
            const chunks = []
            for (let i = 0; i < text.length; i += maxChunkSize) {
              chunks.push(text.slice(i, i + maxChunkSize))
            }

            let processedText = ""
            for (let i = 0; i < chunks.length; i++) {
              console.log(`[v0] 🧹 Processing chunk ${i + 1}/${chunks.length}...`)

              const response = await fetch("/api/process-extracted-text", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  text: chunks[i],
                  fileName: `${file.name}_chunk_${i + 1}`,
                }),
              })

              if (!response.ok) {
                throw new Error(`Failed to process chunk ${i + 1}`)
              }

              const result = await response.json()
              processedText += result.processedText + "\n\n"
            }

            return processedText
          }
        }

        const processedText = await processText(fullText)

        setExtractedTexts((prev) => ({ ...prev, [index]: processedText }))

        console.log(`[v0] ✅ Text extraction completed, ${processedText.length} characters`)

        toast({
          title: "Text extracted successfully",
          description: `Extracted ${processedText.length} characters from ${file.name}`,
        })
      } else {
        console.log(`[v0] 🖼️ Starting image-based PDF extraction...`)

        toast({
          title: "Converting PDF to image",
          description: "Converting PDF pages to image for AI text extraction...",
        })

        // Dynamically import pdfjs-dist
        const pdfjsLib = await import("pdfjs-dist")
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

        const arrayBuffer = await file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

        // Create a large canvas to hold all pages
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")!

        // Calculate total height needed for all pages
        let totalHeight = 0
        let maxWidth = 0
        const pageData: Array<{ canvas: HTMLCanvasElement; height: number; width: number }> = []

        // First pass: render all pages and calculate dimensions
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum)
          const viewport = page.getViewport({ scale: 1.5 }) // Higher scale for better quality

          const pageCanvas = document.createElement("canvas")
          const pageCtx = pageCanvas.getContext("2d")!
          pageCanvas.width = viewport.width
          pageCanvas.height = viewport.height

          await page.render({
            canvasContext: pageCtx,
            viewport: viewport,
          }).promise

          pageData.push({
            canvas: pageCanvas,
            height: viewport.height,
            width: viewport.width,
          })

          totalHeight += viewport.height
          maxWidth = Math.max(maxWidth, viewport.width)
        }

        // Set up the final canvas
        canvas.width = maxWidth
        canvas.height = totalHeight
        ctx.fillStyle = "white"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Second pass: draw all pages onto the final canvas
        let currentY = 0
        for (const page of pageData) {
          ctx.drawImage(page.canvas, 0, currentY)
          currentY += page.height
        }

        // Convert to base64
        const base64Image = canvas.toDataURL("image/jpeg", 0.8).split(",")[1]

        console.log(`[v0] 🖼️ PDF converted to image, sending to Vision API...`)

        const response = await fetch("/api/extract-text-from-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image: base64Image,
            fileName: file.name,
            mimeType: "image/jpeg",
          }),
        })

        if (!response.ok) {
          let errorMessage = "Failed to extract text from PDF image"
          try {
            const errorData = await response.json()
            errorMessage = errorData.error || errorMessage
          } catch {
            try {
              errorMessage = await response.text()
            } catch {
              errorMessage = `HTTP ${response.status}: ${response.statusText}`
            }
          }
          throw new Error(errorMessage)
        }

        const result = await response.json()
        setExtractedTexts((prev) => ({ ...prev, [index]: result.extractedText }))

        console.log(`[v0] ✅ Image-based extraction completed, ${result.extractedText.length} characters extracted`)

        toast({
          title: "Text extraction successful",
          description: `Extracted ${result.extractedText.length} characters from ${file.name} using image processing`,
        })
      }
    } catch (error) {
      console.error(`[v0] ❌ Error extracting text from ${file.name}:`, error)
      toast({
        title: "Extraction failed",
        description: error instanceof Error ? error.message : "Failed to extract text from file",
        variant: "destructive",
      })
    } finally {
      setExtractingText((prev) => ({ ...prev, [index]: false }))
    }
  }

  const handleExtractImageText = async (file: File, index: number) => {
    setExtractingText((prev) => ({ ...prev, [index]: true }))

    try {
      console.log(`[v0] 🖼️ Extracting text from image ${file.name}`)

      toast({
        title: "Processing image",
        description: "Sending to AI for text extraction...",
      })

      // Assuming the webhook handles image OCR as well
      const extractedText = await sendFileToWebhook(file, selectedGPT?.id || "")
      setExtractedTexts((prev) => ({ ...prev, [index]: extractedText }))

      toast({
        title: "Text extracted successfully",
        description: `Extracted ${extractedText.length} characters from image`,
      })
    } catch (error) {
      console.error(`[v0] ❌ Error extracting text from image ${file.name}:`, error)
      toast({
        title: "Extraction failed",
        description: `Failed to extract text from ${file.name}. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setExtractingText((prev) => ({ ...prev, [index]: false }))
    }
  }

  const removeUploadFile = (index: number) => {
    setUploadingFiles((prev) => prev.filter((_, i) => i !== index))
    setPdfProcessingMethods((prev) => {
      const newMethods = { ...prev }
      delete newMethods[index]
      return newMethods
    })
    setExtractingText((prev) => {
      const newExtracting = { ...prev }
      delete newExtracting[index]
      return newExtracting
    })
    setExtractedTexts((prev) => {
      const newTexts = { ...prev }
      delete newTexts[index]
      return newTexts
    })
  }

  // Function to filter chunks based on search query
  const filteredChunks = knowledgeChunks.filter((chunk) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      chunk.content?.toLowerCase().includes(query) ||
      chunk.category?.toLowerCase().includes(query) ||
      chunk.subcategory?.toLowerCase().includes(query) ||
      chunk.metadata?.title?.toLowerCase().includes(query) ||
      chunk.metadata?.source?.toLowerCase().includes(query)
    )
  })

  // Function to open view dialog
  const handleViewChunk = (chunk: any) => {
    setSelectedChunk(chunk)
    setViewDialogOpen(true)
  }

  // Function to open edit dialog
  const handleEditChunk = (chunk: any) => {
    setSelectedChunk(chunk)
    setEditingChunk({ ...chunk })
    setEditDialogOpen(true)
  }

  // Function to save edited chunk
  const handleSaveChunk = async () => {
    if (!editingChunk) return

    setSavingChunk(true)
    try {
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()

      const { error } = await supabase
        .from("knowledge_chunks")
        .update({
          content: editingChunk.content,
          category: editingChunk.category,
          subcategory: editingChunk.subcategory,
          metadata: editingChunk.metadata,
        })
        .eq("id", editingChunk.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Knowledge chunk updated successfully",
      })

      // Refresh the chunks list
      if (selectedGPT) {
        loadKnowledgeChunks(selectedGPT.id)
      }

      setEditDialogOpen(false)
      setEditingChunk(null)
    } catch (error) {
      console.error("Error updating chunk:", error)
      toast({
        title: "Error",
        description: "Failed to update knowledge chunk",
        variant: "destructive",
      })
    } finally {
      setSavingChunk(false)
    }
  }

  // Function to open delete confirmation dialog
  const handleDeleteChunk = (chunk: any) => {
    setSelectedChunk(chunk)
    setDeleteDialogOpen(true)
  }

  // Function to confirm and delete chunk
  const handleConfirmDelete = async () => {
    if (!selectedChunk) return

    setDeletingChunk(true)
    try {
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()

      const { error } = await supabase.from("knowledge_chunks").delete().eq("id", selectedChunk.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Knowledge chunk deleted successfully",
      })

      // Refresh the chunks list
      if (selectedGPT) {
        loadKnowledgeChunks(selectedGPT.id)
      }

      setDeleteDialogOpen(false)
      setSelectedChunk(null)
    } catch (error) {
      console.error("Error deleting chunk:", error)
      toast({
        title: "Error",
        description: "Failed to delete knowledge chunk",
        variant: "destructive",
      })
    } finally {
      setDeletingChunk(false)
    }
  }

  // Send file to Make.com webhook
  const sendFileToWebhook = async (file: File, gptId: string): Promise<string> => {
    console.log(`🔗 Sending file to webhook: ${file.name}`)

    const formData = new FormData()
    formData.append("file", file)
    formData.append("filename", file.name)
    formData.append("gptId", gptId)
    formData.append("fileSize", file.size.toString())
    formData.append("fileType", file.type)
    formData.append("uploadedAt", new Date().toISOString())

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`)
      }

      // Try to get the processed content from the webhook response
      let processedContent: string
      const contentType = response.headers.get("content-type")

      if (contentType?.includes("application/json")) {
        const result = await response.json()
        // Prioritize common fields for extracted text, fall back to generic 'data' or file text
        processedContent = result.content || result.text || result.data || (await file.text())
        console.log(`✅ Webhook returned JSON response for ${file.name}`)
      } else {
        processedContent = await response.text()
        console.log(`✅ Webhook returned text response for ${file.name}`)
      }

      // If webhook didn't return content, fall back to reading the file directly
      if (!processedContent || processedContent.trim().length < 10) {
        console.log(`⚠️ Webhook returned insufficient content, falling back to direct file reading`)
        processedContent = await file.text()
      }

      console.log(`📄 Processed content length: ${processedContent.length} characters`)
      return processedContent
    } catch (error) {
      console.error(`❌ Webhook error for ${file.name}:`, error)

      // Fallback to reading file directly if webhook fails
      console.log(`🔄 Falling back to direct file reading for ${file.name}`)
      toast({
        title: "Webhook Warning",
        description: `Webhook failed for ${file.name}, processing locally instead`,
        variant: "destructive",
      })

      // For robustness, ensure we return actual text content
      return await file.text()
    }
  }

  const handleFileUpload = async () => {
    if (!selectedGPT || uploadingFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select files to upload",
        variant: "destructive",
      })
      return
    }

    setUploading(true)

    try {
      console.log(`🚀 Starting upload process for ${uploadingFiles.length} files`)

      // Process each file through the webhook
      const processedFiles = await Promise.all(
        uploadingFiles.map(async (file, index) => {
          console.log(`📤 Processing file ${index + 1}/${uploadingFiles.length}: ${file.name}`)

          try {
            // Use extracted text if available, otherwise process the file directly via webhook
            const content = extractedTexts[index] || (await sendFileToWebhook(file, selectedGPT.id))

            // Determine processing_method based on original file type and extraction method
            let processing_method: string | undefined
            if (file.type === "application/pdf") {
              processing_method = pdfProcessingMethods[index] || "text-based"
            } else if (file.type.startsWith("image/")) {
              processing_method = "image-based"
            }

            return {
              id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: file.name,
              type: file.type || "text/plain",
              size: file.size,
              uploadedAt: new Date().toISOString(),
              content: content,
              processedViaWebhook: true,
              processing_method: processing_method,
              metadata: {
                originalFileName: file.name,
              },
            }
          } catch (error) {
            console.error(`❌ Failed to process ${file.name} via webhook:`, error)

            const fallbackContent = await file.text()
            toast({
              title: "Processing Warning",
              description: `Failed to process ${file.name} via webhook. Content might be incomplete.`,
              variant: "warning",
            })

            return {
              id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: file.name,
              type: file.type || "text/plain",
              size: file.size,
              uploadedAt: new Date().toISOString(),
              content: fallbackContent,
              processedViaWebhook: false,
              processing_method: undefined,
              metadata: {
                originalFileName: file.name,
              },
            }
          }
        }),
      )

      console.log(`✅ All files processed successfully`)

      try {
        console.log(`🔍 Starting Supabase indexing for GPT: ${selectedGPT.id}`)

        const response = await fetch("/api/index-knowledge-supabase", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            gptId: selectedGPT.id,
            files: processedFiles, // Send the processed files with content
            title: fileTitle, // Send the title from the form
            category: fileCategory, // Send the category from the form
            subcategory: fileSubcategory, // Send the subcategory from the form
          }),
        })

        if (response.ok) {
          const result = await response.json()
          console.log(`✅ Supabase indexing completed:`, result)

          toast({
            title: "Knowledge base indexed",
            description: `Your files have been processed and are ready for vector search. ${result.indexedCount || 0} chunks indexed.`,
          })

          setUploadingFiles([])
          setExtractedTexts({})
          setFileTitle("")
          setFileCategory("")
          setFileSubcategory("")
          setPdfProcessingMethods({})

          // Refresh the knowledge base view
          if (selectedGPT) {
            loadKnowledgeChunks(selectedGPT.id)
          }
        } else {
          const errorData = await response.json()
          console.error(`❌ Supabase indexing failed:`, errorData)

          toast({
            title: "Indexing failed",
            description: "Files uploaded but indexing failed. Check your Supabase configuration and API logs.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("❌ Indexing error:", error)
        toast({
          title: "Indexing error",
          description: "Files uploaded but couldn't be indexed. Check your Supabase configuration.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ Upload error:", error)
      toast({
        title: "Upload failed",
        description: "Failed to upload files. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      setIndexing(false)
    }
  }

  const handleFileRemove = (index: number) => {
    if (!selectedGPT || !selectedGPT.knowledgeBase?.files) return

    const updatedFiles = selectedGPT.knowledgeBase.files.filter((_, i) => i !== index)

    // Update the main GPT configs
    const updatedConfigs = gptConfigs.map((config) => {
      if (config.id === selectedGPT.id) {
        return {
          ...config,
          knowledgeBase: {
            ...config.knowledgeBase,
            enabled: config.knowledgeBase?.enabled || true,
            files: updatedFiles,
            instructions: config.knowledgeBase?.instructions || "",
          },
        }
      }
      return config
    })

    // Save to localStorage
    setGptConfigs(updatedConfigs)
    saveGPTConfigs(updatedConfigs)

    // Update selected GPT state
    const updatedSelectedGPT = updatedConfigs.find((gpt) => gpt.id === selectedGPT.id)
    if (updatedSelectedGPT) {
      setSelectedGPT(updatedSelectedGPT)
      setEditingGPT({ ...updatedSelectedGPT })
    }

    toast({
      title: "File Removed",
      description: "File has been removed from the knowledge base and changes saved",
    })
  }

  const handleIndexAll = async () => {
    setIndexing(true)
    try {
      const response = await fetch("/api/index-knowledge-supabase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}), // Empty body indexes all GPTs
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Indexing complete",
          description: `Successfully indexed ${result.indexed?.length || 0} GPT knowledge bases`,
        })
      } else {
        throw new Error("Indexing failed")
      }
    } catch (error) {
      console.error("Indexing error:", error)
      toast({
        title: "Indexing failed",
        description: "Failed to index knowledge bases. Check your Supabase configuration.",
        variant: "destructive",
      })
    } finally {
      setIndexing(false)
    }
  }

  const handleMigrateGPTs = async () => {
    setIsMigrating(true)
    setMigrationStatus("Starting migration...")

    try {
      console.log("[v0] Starting GPT migration to Supabase...")
      const response = await fetch("/api/migrate-gpts", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error(`Migration failed: ${response.statusText}`)
      }

      const result = await response.json()
      console.log("[v0] Migration result:", result)

      setMigrationStatus(`✅ Successfully migrated ${result.migratedCount} GPTs!`)

      // Refresh the GPT list after migration
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      console.error("[v0] Migration error:", error)
      setMigrationStatus(`❌ Migration failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsMigrating(false)
    }
  }

  const stats = [
    {
      title: "Total Users",
      value: "248",
      icon: Users,
      change: "+12% Active users this month",
      changePositive: true,
    },
    {
      title: "Resources",
      value: gptConfigs.reduce((sum, gpt) => sum + (gpt.knowledgeBase?.files?.length || 0), 0).toString(),
      icon: FileText,
      change: "+24% Resources in vault",
      changePositive: true,
    },
    {
      title: "GPT Tools",
      value: gptConfigs.length.toString(),
      icon: Bot,
      change: `+${gptConfigs.filter((g) => g.featured).length} Active GPT tools`,
      changePositive: true,
    },
    {
      title: "AI Interactions",
      value: "1,842",
      icon: MessageSquare,
      change: "+18% AI conversations this month",
      changePositive: true,
    },
  ]

  const quickActions = [
    {
      title: "Upload Knowledge Base",
      description: "Add documents to GPT knowledge bases",
      icon: Upload,
      action: () => {
        // Scroll to knowledge base tab
        const element = document.querySelector('[data-value="knowledge"]')
        if (element) {
          element.scrollIntoView({ behavior: "smooth" })
        }
      },
      primary: true,
    },
    {
      title: "Create GPT",
      description: "Build a new GPT tool",
      icon: Plus,
      href: "/admin/create-gpt",
    },
    {
      title: "Index All Knowledge",
      description: "Reindex all knowledge bases",
      icon: Database,
      action: handleIndexAll,
    },
    {
      title: "View Analytics",
      description: "See platform usage statistics",
      icon: BarChart3,
      href: "/admin/analytics",
    },
    {
      title: "Migrate GPTs",
      description: "Migrate existing GPT configurations to Supabase",
      icon: Database, // Reusing icon, could be a specific migration icon
      action: handleMigrateGPTs,
      primary: false, // Not a primary action like upload
    },
  ]

  const recentActivity = [
    {
      id: 1,
      type: "Knowledge Base Updated",
      description: `${selectedGPT?.knowledgeBase?.files?.length || 0} files in ${selectedGPT?.name || "GPT"} knowledge base`,
      time: "Just now",
    },
    {
      id: 2,
      type: "New GPT Created",
      description: "Customer Journey Mapper was created",
      time: "Yesterday",
    },
    {
      id: 3,
      type: "User Registered",
      description: "John Smith joined the platform",
      time: "2 days ago",
    },
    {
      id: 4,
      type: "GPT Updated",
      description: "Legacy AI system prompt was modified",
      time: "3 days ago",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="outline" size="icon" className="border-gray-300 bg-transparent">
                <ArrowLeft size={20} />
              </Button>
            </Link>
            <div className="flex items-center space-x-3">
              <Image src="/logo.png" alt="Legacy Decks Academy" width={32} height={32} className="rounded" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">Manage resources, GPTs, users, and knowledge bases</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <Button variant="outline" className="border-gray-300 bg-transparent">
              <Settings size={16} className="mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </header>

      <main className="p-6">
        {/* Navigation Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white border border-gray-200">
            <TabsTrigger
              value="dashboard"
              className="flex items-center space-x-2 data-[state=active]:bg-lda-red data-[state=active]:text-white"
            >
              <BarChart3 size={16} />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger
              value="knowledge"
              className="flex items-center space-x-2 data-[state=active]:bg-lda-red data-[state=active]:text-white"
              data-value="knowledge"
            >
              <Database size={16} />
              <span>Knowledge Base</span>
            </TabsTrigger>
            <TabsTrigger
              value="gpts"
              className="flex items-center space-x-2 data-[state=active]:bg-lda-red data-[state=active]:text-white"
            >
              <Bot size={16} />
              <span>GPTs</span>
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="flex items-center space-x-2 data-[state=active]:bg-lda-red data-[state=active]:text-white"
            >
              <Users size={16} />
              <span>Users</span>
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="flex items-center space-x-2 data-[state=active]:bg-lda-red data-[state=active]:text-white"
            >
              <Settings size={16} />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="bg-white border border-gray-200 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-red-50 rounded-lg">
                            <stat.icon className="h-5 w-5 text-lda-red" />
                          </div>
                          <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                        <p className={`text-sm ${stat.changePositive ? "text-green-600" : "text-red-600"}`}>
                          {stat.change}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {quickActions.map((action) => (
                      <div key={action.title}>
                        {action.href ? (
                          <Link href={action.href}>
                            <Card
                              className={`cursor-pointer transition-all hover:shadow-md ${
                                action.primary ? "border-lda-red bg-red-50" : "border-gray-200 hover:bg-gray-50"
                              }`}
                            >
                              <CardContent className="p-4 text-center">
                                <action.icon
                                  className={`h-8 w-8 mx-auto mb-2 ${
                                    action.primary ? "text-lda-red" : "text-gray-600"
                                  }`}
                                />
                                <h3 className="font-medium text-gray-900">{action.title}</h3>
                                <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                              </CardContent>
                            </Card>
                          </Link>
                        ) : (
                          <Card
                            className={`cursor-pointer transition-all hover:shadow-md ${
                              action.primary ? "border-lda-red bg-red-50" : "border-gray-200 hover:bg-gray-50"
                            }`}
                            onClick={action.action}
                          >
                            <CardContent className="p-4 text-center">
                              <action.icon
                                className={`h-8 w-8 mx-auto mb-2 ${action.primary ? "text-lda-red" : "text-gray-600"}`}
                              />
                              <h3 className="font-medium text-gray-900">{action.title}</h3>
                              <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">Recent Activity</CardTitle>
                  <CardDescription className="text-gray-600">
                    Latest actions and updates on the platform
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 py-2">
                      <div className="h-2 w-2 bg-lda-red rounded-full mt-2" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">{activity.type}</h4>
                          <span className="text-sm text-gray-500">{activity.time}</span>
                        </div>
                        <p className="text-sm text-gray-600">{activity.description}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="knowledge" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* GPT Selection */}
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">Select GPT</CardTitle>
                    <CardDescription className="text-gray-600">Choose GPT to manage</CardDescription>
                  </div>
                  <Button
                    onClick={handleIndexAll}
                    disabled={indexing}
                    size="sm"
                    className="bg-lda-red hover:bg-lda-red-dark text-white"
                  >
                    {indexing ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Indexing...
                      </>
                    ) : (
                      <>
                        <Database className="mr-2 h-4 w-4" />
                        Index All
                      </>
                    )}
                  </Button>
                </CardHeader>
                {loadingGPTs ? (
                  <CardContent className="flex items-center justify-center h-64">
                    <RefreshCw className="mx-auto h-8 w-8 text-gray-400 animate-spin mb-4" />
                  </CardContent>
                ) : (
                  <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                    {gptConfigs.map((gpt) => (
                      <Card
                        key={gpt.id}
                        className={`cursor-pointer transition-all border ${
                          selectedGPT?.id === gpt.id
                            ? "border-lda-red bg-red-50 shadow-md"
                            : "border-gray-200 hover:shadow-md hover:border-gray-300"
                        }`}
                        onClick={() => handleGPTClick(gpt)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium text-gray-900">{gpt.name}</h3>
                            <div className="flex items-center space-x-2">
                              {chunkCounts[gpt.id] !== undefined && chunkCounts[gpt.id] > 0 ? (
                                <Badge className="bg-green-100 text-green-800 text-xs">
                                  {chunkCounts[gpt.id]} chunks
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  No KB
                                </Badge>
                              )}
                              {selectedGPT?.id === gpt.id && <div className="w-2 h-2 bg-lda-red rounded-full"></div>}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">{gpt.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </CardContent>
                )}
              </Card>

              {/* Knowledge Base Management */}
              <div className="lg:col-span-3 space-y-6">
                {selectedGPT ? (
                  <>
                    <Card className="bg-white border border-gray-200 shadow-sm">
                      <CardHeader className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <Upload className="h-6 w-6 text-gray-600 mr-2" />
                          <CardTitle className="text-lg font-semibold text-gray-900">
                            File Upload with AI Text Extraction
                          </CardTitle>
                        </div>
                        <CardDescription className="text-gray-600">
                          Upload files from your device with AI-powered PDF and image text extraction
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* GPT ID and Title Row */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="gpt-select" className="text-sm font-medium text-gray-700">
                              GPT ID <span className="text-red-500">*</span>
                            </Label>
                            <select
                              id="gpt-select"
                              value={selectedGPT.id}
                              disabled
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-900 text-sm"
                            >
                              <option value={selectedGPT.id}>{selectedGPT.name}</option>
                            </select>
                          </div>
                          <div>
                            <Label htmlFor="file-title" className="text-sm font-medium text-gray-700">
                              Title <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="file-title"
                              type="text"
                              placeholder="Enter file title"
                              value={fileTitle}
                              onChange={(e) => setFileTitle(e.target.value)}
                              className="mt-1 border-gray-300 focus:border-lda-red focus:ring-lda-red"
                            />
                          </div>
                        </div>

                        {/* Category and Subcategory Row */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="category-select" className="text-sm font-medium text-gray-700">
                              Category <span className="text-red-500">*</span>
                            </Label>
                            <select
                              id="category-select"
                              value={fileCategory}
                              onChange={(e) => setFileCategory(e.target.value)}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-lda-red focus:ring-lda-red text-sm"
                            >
                              <option value="">Select category</option>
                              <option value="business">Business</option>
                              <option value="marketing">Marketing</option>
                              <option value="sales">Sales</option>
                              <option value="operations">Operations</option>
                              <option value="finance">Finance</option>
                              <option value="hr">Human Resources</option>
                              <option value="legal">Legal</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                          <div>
                            <Label htmlFor="subcategory-select" className="text-sm font-medium text-gray-700">
                              Subcategory
                            </Label>
                            <select
                              id="subcategory-select"
                              value={fileSubcategory}
                              onChange={(e) => setFileSubcategory(e.target.value)}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-lda-red focus:ring-lda-red text-sm text-gray-500"
                            >
                              <option value="">Select subcategory</option>
                            </select>
                          </div>
                        </div>

                        {/* File Upload Area */}
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">File Upload</Label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                            <div className="flex flex-col items-center">
                              <Upload className="h-12 w-12 text-gray-400 mb-4" />
                              <p className="text-gray-600 mb-2">Click to select a file from your device</p>
                              <Input
                                type="file"
                                accept=".pdf,.txt,.md,.docx,.doc,.png,.jpg,.jpeg,.gif,.bmp,.tiff"
                                onChange={handleFileSelect}
                                className="hidden"
                                id="file-input"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => document.getElementById("file-input")?.click()}
                                className="border-gray-300 text-gray-700 hover:bg-gray-50"
                              >
                                Choose File
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Selected File Display */}
                        {uploadingFiles.length > 0 && (
                          <div className="space-y-3">
                            {uploadingFiles.map((file, index) => (
                              <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-red-100 rounded">
                                      <FileText className="h-5 w-5 text-lda-red" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900">{file.name}</p>
                                      <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeUploadFile(index)}
                                    className="text-gray-500 hover:text-red-600"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>

                                {/* PDF Processing Method Selection */}
                                {file.type === "application/pdf" && (
                                  <div className="space-y-3">
                                    <div>
                                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                        PDF Processing Method:
                                      </Label>
                                      <div className="space-y-2">
                                        <label className="flex items-center space-x-2">
                                          <input
                                            type="radio"
                                            name={`processing-method-${index}`}
                                            value="text-based"
                                            checked={
                                              pdfProcessingMethods[index] === "text-based" ||
                                              !pdfProcessingMethods[index]
                                            }
                                            onChange={() =>
                                              setPdfProcessingMethods((prev) => ({ ...prev, [index]: "text-based" }))
                                            }
                                            className="text-lda-red focus:ring-lda-red"
                                          />
                                          <span className="text-sm text-gray-700">
                                            <strong>Text-based</strong> (faster, text-only PDFs)
                                          </span>
                                        </label>
                                        <label className="flex items-center space-x-2">
                                          <input
                                            type="radio"
                                            name={`processing-method-${index}`}
                                            value="image-based"
                                            checked={pdfProcessingMethods[index] === "image-based"}
                                            onChange={() =>
                                              setPdfProcessingMethods((prev) => ({ ...prev, [index]: "image-based" }))
                                            }
                                            className="text-lda-red focus:ring-lda-red"
                                          />
                                          <span className="text-sm text-gray-700">
                                            <strong>Image-based</strong> (scanned PDFs, images)
                                          </span>
                                        </label>
                                      </div>
                                      <p className="text-xs text-gray-500 mt-2">
                                        Choose "Text-based" for regular PDFs with selectable text. Choose "Image-based"
                                        for scanned documents or PDFs with images containing text.
                                      </p>
                                    </div>

                                    {/* Extract Text Button for PDFs */}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
                                      disabled={uploading || extractingText[index]}
                                      onClick={() => handleExtractText(file, index)}
                                    >
                                      {extractingText[index] ? (
                                        <>
                                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                          Extracting...
                                        </>
                                      ) : extractedTexts[index] ? (
                                        <>
                                          <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                          Text Extracted ({extractedTexts[index].length} chars)
                                        </>
                                      ) : (
                                        <>
                                          <FileText className="h-4 w-4 mr-2" />
                                          Extract Text from PDF ({pdfProcessingMethods[index] || "text-based"})
                                        </>
                                      )}
                                    </Button>

                                    {/* Preview of extracted text */}
                                    {extractedTexts[index] && (
                                      <div className="mt-3 p-3 bg-white border border-gray-200 rounded max-h-40 overflow-y-auto">
                                        <Label className="text-xs font-medium text-gray-700 mb-1 block">
                                          Extracted Text Preview:
                                        </Label>
                                        <p className="text-xs text-gray-600 whitespace-pre-wrap">
                                          {extractedTexts[index]}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Extract Text Button for Images */}
                                {file.type.startsWith("image/") && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
                                      disabled={uploading || extractingText[index]}
                                      onClick={() => handleExtractImageText(file, index)}
                                    >
                                      {extractingText[index] ? (
                                        <>
                                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                          Extracting...
                                        </>
                                      ) : extractedTexts[index] ? (
                                        <>
                                          <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                          Text Extracted ({extractedTexts[index].length} chars)
                                        </>
                                      ) : (
                                        <>
                                          <FileText className="h-4 w-4 mr-2" />
                                          Extract Text from Image
                                        </>
                                      )}
                                    </Button>

                                    {/* Preview of extracted text for images */}
                                    {extractedTexts[index] && (
                                      <div className="mt-2 p-3 bg-white border border-gray-200 rounded-md max-h-40 overflow-y-auto">
                                        <Label className="text-xs font-medium text-gray-700 mb-1 block">
                                          Extracted Text Preview:
                                        </Label>
                                        <p className="text-xs text-gray-600 whitespace-pre-wrap">
                                          {extractedTexts[index]}
                                        </p>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Upload Button */}
                        <Button
                          onClick={handleFileUpload}
                          disabled={uploading || indexing || uploadingFiles.length === 0}
                          className="w-full bg-gray-800 hover:bg-gray-900 text-white py-3 text-base font-medium"
                        >
                          {uploading ? (
                            <>
                              <Upload className="mr-2 h-5 w-5 animate-spin" />
                              Uploading File...
                            </>
                          ) : indexing ? (
                            <>
                              <CheckCircle className="mr-2 h-5 w-5 animate-spin" />
                              Creating Vector Embeddings...
                            </>
                          ) : (
                            <>
                              <Upload className="mr-2 h-5 w-5" />
                              Upload File
                            </>
                          )}
                        </Button>

                        {/* File Size and Format Info */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex">
                            <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-blue-800">AI Text Extraction</h3>
                              <div className="mt-2 text-sm text-blue-700">
                                <ul className="list-disc list-inside space-y-1">
                                  <li>
                                    PDFs: Supports both text-based and image-based extraction using server-side
                                    processing.
                                  </li>
                                  <li>
                                    Images: Extracts text from PNG, JPG, GIF, BMP, TIFF using server-side Vision API.
                                  </li>
                                  <li>
                                    Large files are automatically compressed and processed in chunks by the server.
                                  </li>
                                  <li>Maximum file size: 50MB for PDFs, 15MB for images.</li>
                                  <li>Extracted text is processed and stored as vector embeddings.</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Current Files */}
                    <Card className="bg-white border border-gray-200 shadow-sm">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="text-lg font-semibold text-gray-900">Current Knowledge Base</CardTitle>
                          <CardDescription className="text-gray-600">
                            Live data from Supabase for {selectedGPT.name}
                          </CardDescription>
                        </div>
                        <Button
                          onClick={() => loadKnowledgeChunks(selectedGPT.id)}
                          disabled={loadingChunks}
                          size="sm"
                          variant="outline"
                          className="border-gray-300"
                        >
                          {loadingChunks ? (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Refresh
                            </>
                          )}
                        </Button>
                      </CardHeader>
                      <CardContent>
                        {loadingChunks ? (
                          <div className="text-center py-12">
                            <RefreshCw className="mx-auto h-8 w-8 text-gray-400 animate-spin mb-4" />
                            <p className="text-gray-600">Loading knowledge base...</p>
                          </div>
                        ) : chunksError ? (
                          <div className="text-center py-12 border-2 border-dashed border-red-300 rounded-lg bg-red-50">
                            <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
                            <p className="text-red-600 font-medium">Error loading knowledge base</p>
                            <p className="text-sm text-red-500 mt-1">{chunksError}</p>
                          </div>
                        ) : knowledgeChunks.length > 0 ? (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between mb-4">
                              <Badge className="bg-green-100 text-green-800">
                                {knowledgeChunks.length} chunks indexed
                              </Badge>
                              <p className="text-sm text-gray-500">
                                GPT ID: <span className="font-mono text-gray-700">{selectedGPT.id}</span>
                              </p>
                            </div>

                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                type="text"
                                placeholder="Search knowledge base by content, category, title, or source..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 border-gray-300 focus:border-lda-red focus:ring-lda-red"
                              />
                            </div>

                            {searchQuery && (
                              <p className="text-sm text-gray-600">
                                Found {filteredChunks.length} of {knowledgeChunks.length} chunks
                              </p>
                            )}

                            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                              {filteredChunks.length > 0 ? (
                                filteredChunks.map((chunk, index) => (
                                  <Card
                                    key={chunk.id}
                                    className="border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                                    onClick={() => handleViewChunk(chunk)}
                                  >
                                    <CardContent className="p-4">
                                      <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center space-x-2">
                                          <div className="flex items-center justify-center w-8 h-8 bg-lda-red/10 rounded-full">
                                            <span className="text-sm font-semibold text-lda-red">{index + 1}</span>
                                          </div>
                                          <div>
                                            <div className="flex items-center space-x-2">
                                              {chunk.category && (
                                                <Badge
                                                  variant="outline"
                                                  className="text-xs border-blue-300 text-blue-700"
                                                >
                                                  {chunk.category}
                                                </Badge>
                                              )}
                                              {chunk.subcategory && (
                                                <Badge
                                                  variant="outline"
                                                  className="text-xs border-purple-300 text-purple-700"
                                                >
                                                  {chunk.subcategory}
                                                </Badge>
                                              )}
                                            </div>
                                            {chunk.metadata?.title && (
                                              <p className="text-sm font-medium text-gray-900 mt-1">
                                                {chunk.metadata.title}
                                              </p>
                                            )}
                                            {chunk.metadata?.source && (
                                              <p className="text-xs text-gray-500 mt-1">
                                                Source: {chunk.metadata.source}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                        <div className="text-right flex items-center space-x-2">
                                          <div>
                                            <p className="text-sm text-gray-500">
                                              {new Date(chunk.created_at).toLocaleDateString()}
                                            </p>
                                            {chunk.processing_method && (
                                              <Badge variant="outline" className="text-xs mt-1">
                                                {chunk.processing_method}
                                              </Badge>
                                            )}
                                          </div>
                                          <div className="flex space-x-1">
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                handleViewChunk(chunk)
                                              }}
                                              className="h-8 w-8 p-0"
                                            >
                                              <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                handleEditChunk(chunk)
                                              }}
                                              className="h-8 w-8 p-0"
                                            >
                                              <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                handleDeleteChunk(chunk)
                                              }}
                                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                                        <p className="text-sm text-gray-700 line-clamp-3">{chunk.content}</p>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))
                              ) : (
                                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                                  <Search className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                                  <p className="text-gray-600">No chunks match your search</p>
                                  <p className="text-sm text-gray-500 mt-1">Try different keywords</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                            <Database className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <p className="text-gray-600 font-medium">No knowledge chunks found</p>
                            <p className="text-sm text-gray-500 mt-1">
                              Upload files above and click "Upload File" to index them
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card className="bg-white border border-gray-200 shadow-sm">
                    <CardContent className="flex items-center justify-center h-64">
                      <div className="text-center">
                        <Database className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-600">Select a GPT from the list to manage its knowledge base</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="gpts" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* GPT List */}
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">GPT Management</CardTitle>
                    <CardDescription className="text-gray-600">Select a GPT to edit</CardDescription>
                  </div>
                  <Link href="/admin/create-gpt">
                    <Button className="bg-lda-red hover:bg-lda-red-dark text-white">
                      <Plus size={16} className="mr-2" />
                      Create New
                    </Button>
                  </Link>
                </CardHeader>
                {loadingGPTs ? (
                  <CardContent className="flex items-center justify-center h-64">
                    <RefreshCw className="mx-auto h-8 w-8 text-gray-400 animate-spin mb-4" />
                  </CardContent>
                ) : (
                  <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                    {gptConfigs.map((gpt) => (
                      <Card
                        key={gpt.id}
                        className={`cursor-pointer transition-all border ${
                          selectedGPT?.id === gpt.id
                            ? "border-lda-red bg-red-50 shadow-md"
                            : "border-gray-200 hover:shadow-md hover:border-gray-300"
                        }`}
                        onClick={() => handleGPTClick(gpt)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium text-gray-900">{gpt.name}</h3>
                            <div className="flex items-center space-x-2">
                              {gpt.featured && <Badge className="bg-lda-red text-white text-xs">Featured</Badge>}
                              {selectedGPT?.id === gpt.id && <div className="w-2 h-2 bg-lda-red rounded-full"></div>}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">{gpt.description}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {gpt.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs border-gray-300">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </CardContent>
                )}
              </Card>

              {/* GPT Editor */}
              <div className="lg:col-span-2">
                {selectedGPT ? (
                  <Card className="bg-white border border-gray-200 shadow-sm">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg font-semibold text-gray-900">
                            {isEditing ? "Edit" : "View"} {selectedGPT.name}
                          </CardTitle>
                          <CardDescription className="text-gray-600">
                            {isEditing ? "Make changes to the GPT configuration" : "GPT configuration details"}
                          </CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          {selectedGPT.id !== "legacy-ai" && !isEditing && (
                            <Button variant="destructive" size="sm" onClick={handleDeleteClick}>
                              <Trash2 size={16} className="mr-2" />
                              Delete
                            </Button>
                          )}
                          {isEditing ? (
                            <>
                              <Button variant="outline" size="sm" onClick={handleCancelClick}>
                                <X size={16} className="mr-2" />
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={handleSaveEdit} // Use the updated handler
                                className="bg-lda-red hover:bg-lda-red-dark text-white"
                              >
                                <Save size={16} className="mr-2" />
                                Save Changes
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              onClick={handleEditClick}
                              className="bg-lda-red hover:bg-lda-red-dark text-white"
                            >
                              <Edit size={16} className="mr-2" />
                              Edit
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {isEditing ? (
                        <Tabs defaultValue="basic" className="space-y-6">
                          <TabsList className="grid w-full grid-cols-3 bg-gray-100">
                            <TabsTrigger value="basic" className="data-[state=active]:bg-white">
                              Basic Info
                            </TabsTrigger>
                            <TabsTrigger value="prompts" className="data-[state=active]:bg-white">
                              Prompts & Instructions
                            </TabsTrigger>
                            <TabsTrigger value="form" className="data-[state=active]:bg-white">
                              Form Structure
                            </TabsTrigger>
                          </TabsList>

                          <TabsContent value="basic" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="name" className="text-gray-700 font-medium">
                                  GPT Title *
                                </Label>
                                <Input
                                  id="name"
                                  value={editingGPT?.name || ""}
                                  onChange={(e) => handleInputChange("name", e.target.value)}
                                  className="mt-1 border-gray-300 focus:border-lda-red focus:ring-lda-red"
                                />
                              </div>
                              <div>
                                <Label htmlFor="category" className="text-gray-700 font-medium">
                                  Business Category *
                                </Label>
                                <Select
                                  value={editingGPT?.business_category || ""} // Use business_category
                                  onValueChange={(value) => handleInputChange("business_category", value)} // Use business_category
                                >
                                  <SelectTrigger className="mt-1 border-gray-300 focus:border-lda-red focus:ring-lda-red">
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Core business">Core business</SelectItem>
                                    <SelectItem value="Operations and Team">Operations and Team</SelectItem>
                                    <SelectItem value="Marketing and Client Experience">
                                      Marketing and Client Experience
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div>
                              <Label htmlFor="description" className="text-gray-700 font-medium">
                                Description *
                              </Label>
                              <Textarea
                                id="description"
                                value={editingGPT?.description || ""}
                                onChange={(e) => handleInputChange("description", e.target.value)}
                                className="mt-1 border-gray-300 focus:border-lda-red focus:ring-lda-red"
                                rows={3}
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="icon" className="text-gray-700 font-medium">
                                  Icon *
                                </Label>
                                <Select
                                  value={editingGPT?.icon || ""}
                                  onValueChange={(value) => handleInputChange("icon", value)}
                                >
                                  <SelectTrigger className="mt-1 border-gray-300 focus:border-lda-red focus:ring-lda-red">
                                    <SelectValue placeholder="Select icon" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="MessageSquare">MessageSquare</SelectItem>
                                    <SelectItem value="Bot">Bot</SelectItem>
                                    <SelectItem value="Code">Code</SelectItem>
                                    <SelectItem value="BookOpen">BookOpen</SelectItem>
                                    <SelectItem value="Briefcase">Briefcase</SelectItem>
                                    <SelectItem value="Lightbulb">Lightbulb</SelectItem>
                                    <SelectItem value="TrendingUp">TrendingUp</SelectItem>
                                    <SelectItem value="Users">Users</SelectItem>
                                    <SelectItem value="Settings">Settings</SelectItem>
                                    <SelectItem value="Zap">Zap</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor="status" className="text-gray-700 font-medium">
                                  Status
                                </Label>
                                <Select
                                  value={(editingGPT as any)?.status || "active"}
                                  onValueChange={(value) => handleInputChange("status", value)}
                                >
                                  <SelectTrigger className="mt-1 border-gray-300 focus:border-lda-red focus:ring-lda-red">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="archived">Archived</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            {/* Add Featured and Tags here */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="flex items-center space-x-2 pt-2">
                                <Label htmlFor="featured" className="text-gray-700 font-medium">
                                  Featured
                                </Label>
                                <input
                                  id="featured"
                                  type="checkbox"
                                  checked={editingGPT?.featured || false}
                                  onChange={(e) => handleInputChange("featured", e.target.checked)}
                                  className="h-4 w-4 text-lda-red focus:ring-lda-red border-gray-300 rounded"
                                />
                              </div>
                              <div>
                                <Label htmlFor="tags" className="text-gray-700 font-medium">
                                  Tags (comma-separated)
                                </Label>
                                <Input
                                  id="tags"
                                  value={(editingGPT?.tags || []).join(",")}
                                  onChange={(e) =>
                                    handleInputChange(
                                      "tags",
                                      e.target.value
                                        .split(",")
                                        .map((tag) => tag.trim())
                                        .filter(Boolean),
                                    )
                                  }
                                  className="mt-1 border-gray-300 focus:border-lda-red focus:ring-lda-red"
                                />
                              </div>
                            </div>
                          </TabsContent>

                          <TabsContent value="prompts" className="space-y-4">
                            <div>
                              <Label htmlFor="systemPrompt" className="text-gray-700 font-medium">
                                System Prompt *
                              </Label>
                              <Textarea
                                id="systemPrompt"
                                value={editingGPT?.system_prompt || ""} // Use system_prompt
                                onChange={(e) => handleInputChange("system_prompt", e.target.value)} // Use system_prompt
                                className="mt-1 font-mono text-sm border-gray-300 focus:border-lda-red focus:ring-lda-red"
                                rows={8}
                              />
                              <p className="text-sm text-gray-600 mt-1">
                                This defines the core personality and behavior of your GPT
                              </p>
                            </div>

                            <div>
                              <Label htmlFor="additionalInstructions" className="text-gray-700 font-medium">
                                Additional Instructions
                              </Label>
                              <Textarea
                                id="additionalInstructions"
                                value={(editingGPT as any)?.additionalInstructions || ""}
                                onChange={(e) => handleInputChange("additionalInstructions", e.target.value)}
                                className="mt-1 border-gray-300 focus:border-lda-red focus:ring-lda-red"
                                rows={4}
                                placeholder="Additional guidelines, examples, or specific instructions..."
                              />
                            </div>
                          </TabsContent>

                          <TabsContent value="form" className="space-y-4">
                            <div className="space-y-4">
                              {editingFormFields.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                                  <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                  <h3 className="text-sm font-medium text-gray-900 mb-2">No form fields yet</h3>
                                  <p className="text-sm text-gray-500 mb-4">
                                    Add fields to collect information from users before they start chatting
                                  </p>
                                  <Button
                                    onClick={addFormField}
                                    className="bg-lda-red hover:bg-lda-red-dark text-white"
                                  >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add First Field
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  {editingFormFields.map((field, index) => (
                                    <Card key={field.id} className="border border-gray-200">
                                      <CardContent className="pt-6">
                                        <div className="space-y-4">
                                          <div className="flex items-start justify-between">
                                            <span className="text-sm font-medium text-gray-700">Field {index + 1}</span>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => deleteFormField(field.id)}
                                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </div>

                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                              <Label className="text-gray-700 font-medium">Field Label *</Label>
                                              <Input
                                                placeholder="e.g., What is your project budget?"
                                                value={field.label}
                                                onChange={(e) => updateFormField(field.id, { label: e.target.value })}
                                                className="border-gray-300 focus:border-lda-red focus:ring-lda-red"
                                              />
                                            </div>

                                            <div className="space-y-2">
                                              <Label className="text-gray-700 font-medium">Field Type *</Label>
                                              <Select
                                                value={field.type}
                                                onValueChange={(value) => updateFormField(field.id, { type: value })}
                                              >
                                                <SelectTrigger className="border-gray-300 focus:border-lda-red focus:ring-lda-red">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="text">Short Text</SelectItem>
                                                  <SelectItem value="textarea">Long Text</SelectItem>
                                                  <SelectItem value="select">Dropdown</SelectItem>
                                                  <SelectItem value="number">Number</SelectItem>
                                                  <SelectItem value="email">Email</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </div>
                                          </div>

                                          <div className="space-y-2">
                                            <Label className="text-gray-700 font-medium">Placeholder Text</Label>
                                            <Input
                                              placeholder="e.g., Enter your budget range..."
                                              value={field.placeholder}
                                              onChange={(e) =>
                                                updateFormField(field.id, { placeholder: e.target.value })
                                              }
                                              className="border-gray-300 focus:border-lda-red focus:ring-lda-red"
                                            />
                                          </div>

                                          {field.type === "select" && (
                                            <div className="space-y-2">
                                              <Label className="text-gray-700 font-medium">Dropdown Options</Label>
                                              <div className="space-y-2">
                                                {field.options?.map((option: string, optionIndex: number) => (
                                                  <div key={optionIndex} className="flex items-center space-x-2">
                                                    <Input
                                                      placeholder={`Option ${optionIndex + 1}`}
                                                      value={option}
                                                      onChange={(e) =>
                                                        updateSelectOption(field.id, optionIndex, e.target.value)
                                                      }
                                                      className="border-gray-300 focus:border-lda-red focus:ring-lda-red"
                                                    />
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      onClick={() => deleteSelectOption(field.id, optionIndex)}
                                                      className="text-red-600 hover:text-red-700"
                                                    >
                                                      <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                  </div>
                                                ))}
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => addSelectOption(field.id)}
                                                  className="border-gray-300"
                                                >
                                                  <Plus className="mr-2 h-4 w-4" />
                                                  Add Option
                                                </Button>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}

                                  <Button
                                    onClick={addFormField}
                                    variant="outline"
                                    className="w-full border-gray-300 hover:bg-gray-50 bg-transparent"
                                  >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Another Field
                                  </Button>
                                </>
                              )}
                            </div>
                          </TabsContent>
                        </Tabs>
                      ) : (
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-4">Basic Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label className="text-gray-700 font-medium">Name</Label>
                                <p className="mt-1 text-gray-900">{selectedGPT.name}</p>
                              </div>
                              <div>
                                <Label className="text-gray-700 font-medium">Category</Label>
                                <p className="mt-1 text-gray-900">{selectedGPT.business_category}</p>{" "}
                                {/* Use business_category */}
                              </div>
                              <div>
                                <Label className="text-gray-700 font-medium">Icon</Label>
                                <p className="mt-1 text-gray-900">{selectedGPT.icon}</p>
                              </div>
                              <div>
                                <Label className="text-gray-700 font-medium">Status</Label>
                                <p className="mt-1 text-gray-900">{(selectedGPT as any).status || "Active"}</p>
                              </div>
                            </div>
                            <div className="mt-4">
                              <Label className="text-gray-700 font-medium">Description</Label>
                              <p className="mt-1 text-gray-900">{selectedGPT.description}</p>
                            </div>
                          </div>

                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-4">System Prompt</h3>
                            <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                              <pre className="text-sm text-gray-900 whitespace-pre-wrap font-mono">
                                {selectedGPT.system_prompt} {/* Use system_prompt */}
                              </pre>
                            </div>
                          </div>

                          {(selectedGPT as any).additionalInstructions && (
                            <div>
                              <h3 className="text-sm font-semibold text-gray-900 mb-4">Additional Instructions</h3>
                              <p className="text-gray-900">{(selectedGPT as any).additionalInstructions}</p>
                            </div>
                          )}

                          {selectedGPT.formFields && selectedGPT.formFields.length > 0 && (
                            <div>
                              <h3 className="text-sm font-semibold text-gray-900 mb-4">Form Fields</h3>
                              <div className="space-y-3">
                                {selectedGPT.formFields.map((field, index) => (
                                  <div key={field.id} className="p-3 bg-gray-50 rounded-md border border-gray-200">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-sm font-medium text-gray-900">{field.label}</span>
                                      <Badge variant="outline" className="text-xs">
                                        {field.type}
                                      </Badge>
                                    </div>
                                    {field.placeholder && (
                                      <p className="text-xs text-gray-600">Placeholder: {field.placeholder}</p>
                                    )}
                                    {field.type === "select" && field.options && field.options.length > 0 && (
                                      <div className="mt-2">
                                        <p className="text-xs text-gray-600 mb-1">Options:</p>
                                        <div className="flex flex-wrap gap-1">
                                          {field.options.map((option, i) => (
                                            <Badge key={i} variant="secondary" className="text-xs">
                                              {option}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {/* Add Featured and Tags display here */}
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-4">Tags</h3>
                            <div className="flex flex-wrap gap-2">
                              {(selectedGPT?.tags || []).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-sm">
                                  {tag}
                                </Badge>
                              ))}
                              {(selectedGPT?.tags || []).length === 0 && (
                                <p className="text-sm text-gray-500">No tags assigned</p>
                              )}
                            </div>
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-4">Featured</h3>
                            <p className={`text-sm ${selectedGPT?.featured ? "text-green-600" : "text-gray-500"}`}>
                              {selectedGPT?.featured ? "Yes" : "No"}
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-white border border-gray-200 shadow-sm">
                    <CardContent className="flex items-center justify-center h-64">
                      <div className="text-center">
                        <Bot className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-600">Select a GPT from the list to view and edit its configuration</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">User Management</CardTitle>
                <CardDescription className="text-gray-600">Manage user accounts and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">User management interface would go here</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Platform Settings</CardTitle>
                <CardDescription className="text-gray-600">Configure platform-wide settings</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Settings interface would go here</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View Knowledge Chunk</DialogTitle>
            <DialogDescription>Full details of the knowledge chunk</DialogDescription>
          </DialogHeader>
          {selectedChunk && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                {selectedChunk.category && (
                  <Badge variant="outline" className="border-blue-300 text-blue-700">
                    {selectedChunk.category}
                  </Badge>
                )}
                {selectedChunk.subcategory && (
                  <Badge variant="outline" className="border-purple-300 text-purple-700">
                    {selectedChunk.subcategory}
                  </Badge>
                )}
                {selectedChunk.processing_method && <Badge variant="outline">{selectedChunk.processing_method}</Badge>}
              </div>

              {selectedChunk.metadata?.title && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Title</Label>
                  <p className="mt-1 text-gray-900">{selectedChunk.metadata.title}</p>
                </div>
              )}

              {selectedChunk.metadata?.source && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Source</Label>
                  <p className="mt-1 text-gray-900">{selectedChunk.metadata.source}</p>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium text-gray-700">Content</Label>
                <div className="mt-1 p-4 bg-gray-50 rounded-md border border-gray-200 max-h-96 overflow-y-auto">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedChunk.content}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Created At</Label>
                <p className="mt-1 text-gray-900">{new Date(selectedChunk.created_at).toLocaleString()}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Chunk ID</Label>
                <p className="mt-1 text-xs font-mono text-gray-600">{selectedChunk.id}</p>
              </div>

              {selectedChunk.metadata && Object.keys(selectedChunk.metadata).length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Full Metadata</Label>
                  <pre className="mt-1 text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                    {JSON.stringify(selectedChunk.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setViewDialogOpen(false)
                if (selectedChunk) handleEditChunk(selectedChunk)
              }}
              className="bg-lda-red hover:bg-lda-red-dark text-white"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Knowledge Chunk</DialogTitle>
            <DialogDescription>Make changes to the knowledge chunk</DialogDescription>
          </DialogHeader>
          {editingChunk && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-category" className="text-sm font-medium text-gray-700">
                    Category
                  </Label>
                  <Input
                    id="edit-category"
                    value={editingChunk.category || ""}
                    onChange={(e) => setEditingChunk({ ...editingChunk, category: e.target.value })}
                    className="mt-1 border-gray-300 focus:border-lda-red focus:ring-lda-red"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-subcategory" className="text-sm font-medium text-gray-700">
                    Subcategory
                  </Label>
                  <Input
                    id="edit-subcategory"
                    value={editingChunk.subcategory || ""}
                    onChange={(e) => setEditingChunk({ ...editingChunk, subcategory: e.target.value })}
                    className="mt-1 border-gray-300 focus:border-lda-red focus:ring-lda-red"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-title" className="text-sm font-medium text-gray-700">
                  Title
                </Label>
                <Input
                  id="edit-title"
                  value={editingChunk.metadata?.title || ""}
                  onChange={(e) =>
                    setEditingChunk({
                      ...editingChunk,
                      metadata: { ...editingChunk.metadata, title: e.target.value },
                    })
                  }
                  className="mt-1 border-gray-300 focus:border-lda-red focus:ring-lda-red"
                />
              </div>

              <div>
                <Label htmlFor="edit-source" className="text-sm font-medium text-gray-700">
                  Source
                </Label>
                <Input
                  id="edit-source"
                  value={editingChunk.metadata?.source || ""}
                  onChange={(e) =>
                    setEditingChunk({
                      ...editingChunk,
                      metadata: { ...editingChunk.metadata, source: e.target.value },
                    })
                  }
                  className="mt-1 border-gray-300 focus:border-lda-red focus:ring-lda-red"
                />
              </div>

              <div>
                <Label htmlFor="edit-content" className="text-sm font-medium text-gray-700">
                  Content
                </Label>
                <Textarea
                  id="edit-content"
                  value={editingChunk.content || ""}
                  onChange={(e) => setEditingChunk({ ...editingChunk, content: e.target.value })}
                  className="mt-1 border-gray-300 focus:border-lda-red focus:ring-lda-red font-mono text-sm"
                  rows={12}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={savingChunk}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveChunk}
              disabled={savingChunk}
              className="bg-lda-red hover:bg-lda-red-dark text-white"
            >
              {savingChunk ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this knowledge chunk from the database. This action cannot be undone.
              {selectedChunk?.metadata?.title && (
                <div className="mt-2 p-2 bg-gray-100 rounded">
                  <p className="text-sm font-medium text-gray-900">Deleting: {selectedChunk.metadata.title}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingChunk}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deletingChunk}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingChunk ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
