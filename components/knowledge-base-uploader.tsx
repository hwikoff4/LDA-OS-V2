"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Upload, FileText, Trash2, Globe } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface KnowledgeFile {
  id: string
  filename: string
  content: string
  category?: string
  subcategory?: string
  uploadedAt: string
  processedViaWebhook?: boolean
}

interface KnowledgeBaseUploaderProps {
  gptId: string
  onFilesChange?: (files: KnowledgeFile[]) => void
}

const CATEGORIES = ["Financial", "Sales", "Production", "Hiring", "Marketing", "Internal"]

const SUBCATEGORIES: Record<string, string[]> = {
  Financial: [
    "Financial software",
    "Job costing",
    "Markup and margin",
    "Monthly financial meeting",
    "Operation budget",
    "Profit first",
  ],
  Sales: ["Lead generation", "Sales process", "Customer management", "Pricing strategy", "Sales training"],
  Production: [
    "Quality control",
    "Process optimization",
    "Equipment management",
    "Safety protocols",
    "Workflow management",
  ],
  Hiring: ["Recruitment process", "Interview guidelines", "Onboarding", "Performance evaluation", "Training programs"],
  Marketing: ["Campaign management", "Brand guidelines", "Content strategy", "Social media", "Market research"],
  Internal: ["Planning", "Team management", "Communication", "Documentation", "Process improvement"],
}

function KnowledgeBaseUploader({ gptId, onFilesChange }: KnowledgeBaseUploaderProps) {
  const [files, setFiles] = useState<KnowledgeFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [manualContent, setManualContent] = useState("")
  const [manualTitle, setManualTitle] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("")
  const { toast } = useToast()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files
    if (!uploadedFiles || uploadedFiles.length === 0) return

    setIsUploading(true)

    try {
      for (const file of Array.from(uploadedFiles)) {
        console.log(`📁 Processing file: ${file.name}`)

        let content = ""
        let processedViaWebhook = false

        // Try webhook processing first
        try {
          console.log("🌐 Attempting webhook processing...")
          const formData = new FormData()
          formData.append("file", file)
          formData.append("gptId", gptId)
          formData.append("filename", file.name)
          formData.append("fileSize", file.size.toString())
          formData.append("fileType", file.type)
          formData.append("uploadTimestamp", new Date().toISOString())

          const webhookResponse = await fetch("https://hook.us2.make.com/your-webhook-url", {
            method: "POST",
            body: formData,
          })

          if (webhookResponse.ok) {
            const webhookResult = await webhookResponse.json()
            content = webhookResult.cleanedContent || ""
            processedViaWebhook = true
            console.log("✅ Webhook processing successful")
          } else {
            throw new Error("Webhook processing failed")
          }
        } catch (webhookError) {
          console.log("⚠️ Webhook processing failed, falling back to local processing")

          // Fallback to local processing
          if (file.type === "text/plain" || file.name.endsWith(".txt")) {
            content = await file.text()
          } else if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
            // For PDF files, we'll need to handle them server-side
            const formData = new FormData()
            formData.append("file", file)
            formData.append("gptId", gptId)
            formData.append("category", selectedCategory)
            formData.append("subcategory", selectedSubcategory)

            const response = await fetch("/api/index-knowledge-supabase", {
              method: "POST",
              body: formData,
            })

            if (response.ok) {
              const result = await response.json()
              console.log("✅ File processed successfully:", result)

              const newFile: KnowledgeFile = {
                id: Date.now().toString(),
                filename: file.name,
                content: result.content || "PDF content processed",
                category: selectedCategory,
                subcategory: selectedSubcategory,
                uploadedAt: new Date().toISOString(),
                processedViaWebhook,
              }

              setFiles((prev) => [...prev, newFile])
              continue
            } else {
              throw new Error("Server processing failed")
            }
          } else {
            content = await file.text()
          }
        }

        // Store the processed content
        if (content) {
          const response = await fetch("/api/index-knowledge-supabase", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              gptId,
              content,
              filename: file.name,
              category: selectedCategory,
              subcategory: selectedSubcategory,
              processedViaWebhook,
            }),
          })

          if (response.ok) {
            const result = await response.json()
            console.log("✅ Content indexed successfully:", result)

            const newFile: KnowledgeFile = {
              id: Date.now().toString(),
              filename: file.name,
              content: content.substring(0, 200) + "...",
              category: selectedCategory,
              subcategory: selectedSubcategory,
              uploadedAt: new Date().toISOString(),
              processedViaWebhook,
            }

            setFiles((prev) => [...prev, newFile])
          } else {
            throw new Error("Failed to index content")
          }
        }
      }

      toast({
        title: "Files uploaded successfully",
        description: `${uploadedFiles.length} file(s) have been processed and added to the knowledge base.`,
      })
    } catch (error) {
      console.error("❌ Upload error:", error)
      toast({
        title: "Upload failed",
        description: "There was an error processing your files. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      // Reset form
      setSelectedCategory("")
      setSelectedSubcategory("")
    }

    onFilesChange?.(files)
  }

  const handleManualAdd = async () => {
    if (!manualContent.trim() || !manualTitle.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both title and content.",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      const response = await fetch("/api/index-knowledge-supabase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gptId,
          content: manualContent,
          filename: manualTitle,
          category: selectedCategory,
          subcategory: selectedSubcategory,
          processedViaWebhook: false,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log("✅ Manual content indexed successfully:", result)

        const newFile: KnowledgeFile = {
          id: Date.now().toString(),
          filename: manualTitle,
          content: manualContent.substring(0, 200) + "...",
          category: selectedCategory,
          subcategory: selectedSubcategory,
          uploadedAt: new Date().toISOString(),
          processedViaWebhook: false,
        }

        setFiles((prev) => [...prev, newFile])
        setManualContent("")
        setManualTitle("")
        setSelectedCategory("")
        setSelectedSubcategory("")

        toast({
          title: "Content added successfully",
          description: "Your manual content has been added to the knowledge base.",
        })
      } else {
        throw new Error("Failed to index manual content")
      }
    } catch (error) {
      console.error("❌ Manual add error:", error)
      toast({
        title: "Failed to add content",
        description: "There was an error adding your content. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }

    onFilesChange?.(files)
  }

  const handleDeleteFile = async (fileId: string) => {
    try {
      const fileToDelete = files.find((f) => f.id === fileId)
      if (!fileToDelete) return

      // Here you would typically call an API to delete from Supabase
      // For now, we'll just remove from local state
      setFiles((prev) => prev.filter((f) => f.id !== fileId))

      toast({
        title: "File deleted",
        description: `${fileToDelete.filename} has been removed from the knowledge base.`,
      })
    } catch (error) {
      console.error("❌ Delete error:", error)
      toast({
        title: "Delete failed",
        description: "There was an error deleting the file. Please try again.",
        variant: "destructive",
      })
    }

    onFilesChange?.(files)
  }

  return (
    <div className="space-y-6">
      {/* Category Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Content Classification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="subcategory">Subcategory</Label>
              <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory} disabled={!selectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subcategory" />
                </SelectTrigger>
                <SelectContent>
                  {selectedCategory &&
                    SUBCATEGORIES[selectedCategory]?.map((subcategory) => (
                      <SelectItem key={subcategory} value={subcategory}>
                        {subcategory}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Files</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="file-upload">Choose files to upload</Label>
              <Input
                id="file-upload"
                type="file"
                multiple
                accept=".txt,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                disabled={isUploading || !selectedCategory}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Supported formats: TXT, PDF, DOC, DOCX. Please select a category first.
              </p>
            </div>
            <Button disabled={isUploading || !selectedCategory} className="w-full">
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? "Processing..." : "Upload Files"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Manual Content Entry */}
      <Card>
        <CardHeader>
          <CardTitle>Add Manual Content</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="manual-title">Title</Label>
              <Input
                id="manual-title"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                placeholder="Enter content title"
                disabled={isUploading || !selectedCategory}
              />
            </div>
            <div>
              <Label htmlFor="manual-content">Content</Label>
              <Textarea
                id="manual-content"
                value={manualContent}
                onChange={(e) => setManualContent(e.target.value)}
                placeholder="Enter your content here..."
                rows={6}
                disabled={isUploading || !selectedCategory}
              />
            </div>
            <Button
              onClick={handleManualAdd}
              disabled={isUploading || !manualContent.trim() || !manualTitle.trim() || !selectedCategory}
              className="w-full"
            >
              <FileText className="w-4 h-4 mr-2" />
              {isUploading ? "Adding..." : "Add Content"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Files List */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Knowledge Base Files ({files.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {files.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span className="font-medium">{file.filename}</span>
                      {file.processedViaWebhook && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          <Globe className="w-3 h-3" />
                          Webhook
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      {file.category && (
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                          {file.category}
                          {file.subcategory && ` > ${file.subcategory}`}
                        </span>
                      )}
                      <span>Added {new Date(file.uploadedAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{file.content}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteFile(file.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Webhook Integration Info */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Globe className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Webhook Integration Active</h4>
              <p className="text-sm text-blue-700 mt-1">
                Files are automatically sent to Make.com for processing and cleaning before being stored in your
                knowledge base. If webhook processing fails, the system will fall back to local processing.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export { KnowledgeBaseUploader }
