"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { type GPTConfig, getGPTConfigs, saveGPTConfigs } from "@/lib/gpt-configs"
import { useToast } from "@/hooks/use-toast"

export function AdminPanel() {
  const [gptConfigs, setGptConfigs] = useState<GPTConfig[]>([])
  const [selectedGPT, setSelectedGPT] = useState<GPTConfig | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setGptConfigs(getGPTConfigs())
  }, [])

  const handleSave = () => {
    if (selectedGPT) {
      const updatedConfigs = gptConfigs.map((config) => (config.id === selectedGPT.id ? selectedGPT : config))
      setGptConfigs(updatedConfigs)
      saveGPTConfigs(updatedConfigs)
      setIsEditing(false)
      toast({
        title: "Success",
        description: "GPT configuration saved successfully",
      })
    }
  }

  const handleAddNew = () => {
    const newGPT: GPTConfig = {
      id: `custom-${Date.now()}`,
      name: "New GPT",
      description: "A new custom GPT assistant",
      systemPrompt: "You are a helpful AI assistant.",
      icon: "MessageSquare",
      tags: ["Custom"],
      featured: false,
    }
    const updatedConfigs = [...gptConfigs, newGPT]
    setGptConfigs(updatedConfigs)
    setSelectedGPT(newGPT)
    setIsEditing(true)
  }

  const handleDelete = (id: string) => {
    if (id === "elite-chat") {
      toast({
        title: "Error",
        description: "Cannot delete the main Elite Chat GPT",
        variant: "destructive",
      })
      return
    }
    const updatedConfigs = gptConfigs.filter((config) => config.id !== id)
    setGptConfigs(updatedConfigs)
    saveGPTConfigs(updatedConfigs)
    if (selectedGPT?.id === id) {
      setSelectedGPT(null)
      setIsEditing(false)
    }
    toast({
      title: "Success",
      description: "GPT configuration deleted successfully",
    })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="outline" size="icon">
                <ArrowLeft size={20} />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">GPT Admin Panel</h1>
          </div>
          <Button onClick={handleAddNew}>
            <Plus size={16} className="mr-2" />
            Add New GPT
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* GPT List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>GPT Configurations</CardTitle>
                <CardDescription>Select a GPT to edit its configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {gptConfigs.map((gpt) => (
                  <div
                    key={gpt.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedGPT?.id === gpt.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                    }`}
                    onClick={() => {
                      setSelectedGPT(gpt)
                      setIsEditing(false)
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{gpt.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">{gpt.description}</p>
                      </div>
                      {gpt.featured && <Badge variant="secondary">Featured</Badge>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* GPT Editor */}
          <div className="lg:col-span-2">
            {selectedGPT ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Edit {selectedGPT.name}</CardTitle>
                      <CardDescription>Configure the GPT settings and system prompt</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      {selectedGPT.id !== "elite-chat" && (
                        <Button variant="destructive" size="icon" onClick={() => handleDelete(selectedGPT.id)}>
                          <Trash2 size={16} />
                        </Button>
                      )}
                      {isEditing ? (
                        <Button onClick={handleSave}>
                          <Save size={16} className="mr-2" />
                          Save
                        </Button>
                      ) : (
                        <Button onClick={() => setIsEditing(true)}>Edit</Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={selectedGPT.name}
                        onChange={(e) => setSelectedGPT({ ...selectedGPT, name: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="icon">Icon</Label>
                      <Input
                        id="icon"
                        value={selectedGPT.icon}
                        onChange={(e) => setSelectedGPT({ ...selectedGPT, icon: e.target.value })}
                        disabled={!isEditing}
                        placeholder="MessageSquare, Code, BookOpen, etc."
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={selectedGPT.description}
                      onChange={(e) => setSelectedGPT({ ...selectedGPT, description: e.target.value })}
                      disabled={!isEditing}
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      value={selectedGPT.tags.join(", ")}
                      onChange={(e) =>
                        setSelectedGPT({
                          ...selectedGPT,
                          tags: e.target.value.split(",").map((tag) => tag.trim()),
                        })
                      }
                      disabled={!isEditing}
                    />
                  </div>

                  <div>
                    <Label htmlFor="systemPrompt">System Prompt</Label>
                    <Textarea
                      id="systemPrompt"
                      value={selectedGPT.systemPrompt}
                      onChange={(e) => setSelectedGPT({ ...selectedGPT, systemPrompt: e.target.value })}
                      disabled={!isEditing}
                      rows={8}
                      className="font-mono text-sm"
                    />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <p className="text-muted-foreground">Select a GPT configuration to edit</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
