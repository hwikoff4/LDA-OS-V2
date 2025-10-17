"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Database, Upload, RefreshCw } from "lucide-react"
import Link from "next/link"
import { KnowledgeBaseUploader } from "@/components/knowledge-base-uploader"
import { getGPTConfigs, type GPTConfig } from "@/lib/gpt-configs"
import { useToast } from "@/hooks/use-toast"

export function KnowledgeBaseManager() {
  const [gptConfigs, setGptConfigs] = useState<GPTConfig[]>([])
  const [selectedGPT, setSelectedGPT] = useState<GPTConfig | null>(null)
  const [indexing, setIndexing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const configs = getGPTConfigs()
    setGptConfigs(configs)
    // Select the first GPT with knowledge base enabled
    const gptWithKB = configs.find((gpt) => gpt.knowledgeBase?.enabled)
    if (gptWithKB) {
      setSelectedGPT(gptWithKB)
    }
  }, [])

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

  const gptStats = gptConfigs.map((gpt) => ({
    ...gpt,
    fileCount: gpt.knowledgeBase?.files?.length || 0,
    totalSize: gpt.knowledgeBase?.files?.reduce((sum, file) => sum + file.size, 0) || 0,
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <Link href="/admin">
              <Button variant="outline" size="icon">
                <ArrowLeft size={20} />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Knowledge Base Manager</h1>
              <p className="text-sm text-gray-600">Upload and manage knowledge base files for your GPTs</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleIndexAll}
              disabled={indexing}
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
          </div>
        </div>
      </header>

      <main className="p-6">
        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-white border border-gray-200">
              <TabsTrigger value="overview" className="data-[state=active]:bg-lda-red data-[state=active]:text-white">
                Overview
              </TabsTrigger>
              <TabsTrigger value="upload" className="data-[state=active]:bg-lda-red data-[state=active]:text-white">
                Upload Files
              </TabsTrigger>
              <TabsTrigger value="search" className="data-[state=active]:bg-lda-red data-[state=active]:text-white">
                Search & Test
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {gptStats.map((gpt) => (
                  <Card key={gpt.id} className="bg-white border border-gray-200">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{gpt.name}</CardTitle>
                        {gpt.knowledgeBase?.enabled ? (
                          <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                        ) : (
                          <Badge variant="outline">Disabled</Badge>
                        )}
                      </div>
                      <CardDescription>{gpt.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Files:</span>
                          <span className="font-medium">{gpt.fileCount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Total Size:</span>
                          <span className="font-medium">{(gpt.totalSize / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Status:</span>
                          <span className={gpt.knowledgeBase?.enabled ? "text-green-600" : "text-gray-500"}>
                            {gpt.knowledgeBase?.enabled ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="upload" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="bg-white border border-gray-200">
                  <CardHeader>
                    <CardTitle>Select GPT</CardTitle>
                    <CardDescription>Choose which GPT to upload files for</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {gptConfigs.map((gpt) => (
                      <Button
                        key={gpt.id}
                        variant={selectedGPT?.id === gpt.id ? "default" : "outline"}
                        className={`w-full justify-start ${
                          selectedGPT?.id === gpt.id ? "bg-lda-red hover:bg-lda-red-dark text-white" : ""
                        }`}
                        onClick={() => setSelectedGPT(gpt)}
                      >
                        {gpt.name}
                        {gpt.knowledgeBase?.enabled && (
                          <Badge variant="secondary" className="ml-auto">
                            {gpt.knowledgeBase.files?.length || 0} files
                          </Badge>
                        )}
                      </Button>
                    ))}
                  </CardContent>
                </Card>

                <div className="lg:col-span-2">
                  {selectedGPT ? (
                    <KnowledgeBaseUploader
                      gptId={selectedGPT.id}
                      onUploadComplete={() => {
                        // Refresh GPT configs
                        setGptConfigs(getGPTConfigs())
                      }}
                    />
                  ) : (
                    <Card className="bg-white border border-gray-200">
                      <CardContent className="flex items-center justify-center h-64">
                        <div className="text-center">
                          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <p className="text-gray-600">Select a GPT to upload files</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="search">
              <Card className="bg-white border border-gray-200">
                <CardHeader>
                  <CardTitle>Search & Test Knowledge Base</CardTitle>
                  <CardDescription>Test your knowledge base search functionality</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Search and testing interface would go here</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
