"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ArrowLeft, MessageSquare, FileText, HelpCircle, Upload, Plus, Trash2, GripVertical } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import { type GPTConfig, getGPTConfigs, saveGPTConfigs } from "@/lib/gpt-configs"

interface FormField {
  id: string
  label: string
  type: "text" | "textarea" | "select" | "number" | "email"
  placeholder: string
  required: boolean
  options?: string[] // For select fields
}

export function CreateGPTForm() {
  const { toast } = useToast()
  const router = useRouter()
  const [currentTab, setCurrentTab] = useState("basic")
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    type: "conversational",
    icon: "",
    status: "draft",
    systemPrompt: "",
    instructions: "",
    formFields: [] as FormField[],
    knowledgeBase: "",
  })

  const [editingField, setEditingField] = useState<string | null>(null)

  const categories = ["Core business", "Operations and Team", "Marketing and Client Experience"]

  const icons = [
    "MessageSquare",
    "Bot",
    "Code",
    "BookOpen",
    "Briefcase",
    "Lightbulb",
    "TrendingUp",
    "Users",
    "Settings",
    "Zap",
  ]

  const gptTypes = [
    {
      id: "conversational",
      title: "Conversational Agent",
      description: "A chat-based interface for natural conversations with the AI",
      icon: MessageSquare,
    },
    {
      id: "form-based",
      title: "Form-Based Tool",
      description: "A structured form that collects specific inputs for the AI",
      icon: FileText,
    },
  ]

  const fieldTypes = [
    { value: "text", label: "Short Text" },
    { value: "textarea", label: "Long Text" },
    { value: "select", label: "Dropdown" },
    { value: "number", label: "Number" },
    { value: "email", label: "Email" },
  ]

  const addFormField = () => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      label: "",
      type: "text",
      placeholder: "",
      required: true,
      options: [],
    }
    setFormData({
      ...formData,
      formFields: [...formData.formFields, newField],
    })
    setEditingField(newField.id)
  }

  const updateFormField = (fieldId: string, updates: Partial<FormField>) => {
    setFormData({
      ...formData,
      formFields: formData.formFields.map((field) => (field.id === fieldId ? { ...field, ...updates } : field)),
    })
  }

  const deleteFormField = (fieldId: string) => {
    setFormData({
      ...formData,
      formFields: formData.formFields.filter((field) => field.id !== fieldId),
    })
  }

  const addSelectOption = (fieldId: string) => {
    const field = formData.formFields.find((f) => f.id === fieldId)
    if (field) {
      updateFormField(fieldId, {
        options: [...(field.options || []), ""],
      })
    }
  }

  const updateSelectOption = (fieldId: string, optionIndex: number, value: string) => {
    const field = formData.formFields.find((f) => f.id === fieldId)
    if (field && field.options) {
      const newOptions = [...field.options]
      newOptions[optionIndex] = value
      updateFormField(fieldId, { options: newOptions })
    }
  }

  const deleteSelectOption = (fieldId: string, optionIndex: number) => {
    const field = formData.formFields.find((f) => f.id === fieldId)
    if (field && field.options) {
      updateFormField(fieldId, {
        options: field.options.filter((_, index) => index !== optionIndex),
      })
    }
  }

  const handleSave = (isDraft = true) => {
    // Validate required fields
    if (!formData.title || !formData.description || !formData.category || !formData.icon) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in GPT Title, Description, Business Category, and Icon",
        variant: "destructive",
      })
      return
    }

    // Validate form fields if it's a form-based GPT
    if (formData.type === "form-based" && formData.formFields.length > 0) {
      const invalidFields = formData.formFields.filter((field) => !field.label || !field.type)
      if (invalidFields.length > 0) {
        toast({
          title: "Invalid Form Fields",
          description: "All form fields must have a label and type",
          variant: "destructive",
        })
        return
      }

      // Validate select fields have options
      const selectFieldsWithoutOptions = formData.formFields.filter(
        (field) => field.type === "select" && (!field.options || field.options.length === 0),
      )
      if (selectFieldsWithoutOptions.length > 0) {
        toast({
          title: "Invalid Dropdown Fields",
          description: "Dropdown fields must have at least one option",
          variant: "destructive",
        })
        return
      }
    }

    try {
      // Generate a unique ID from the title
      const baseId = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
        .replace(/\s+/g, "-") // Replace spaces with hyphens
        .replace(/-+/g, "-") // Replace multiple hyphens with single
        .trim()

      // Check if ID already exists and make it unique
      const existingConfigs = getGPTConfigs()
      let uniqueId = baseId
      let counter = 1
      while (existingConfigs.some((config) => config.id === uniqueId)) {
        uniqueId = `${baseId}-${counter}`
        counter++
      }

      // Create the new GPT configuration
      const newGPT: GPTConfig = {
        id: uniqueId,
        name: formData.title,
        description: formData.description,
        systemPrompt:
          formData.systemPrompt ||
          `You are ${formData.title}, a helpful AI assistant for Legacy Decks Academy. ${formData.instructions || ""}`.trim(),
        icon: formData.icon,
        tags: [formData.category],
        category: formData.category as any,
        featured: false,
        exampleQuestions: [], // Can be added later in admin
      }

      // Add form fields if it's a form-based GPT
      if (formData.type === "form-based" && formData.formFields.length > 0) {
        newGPT.formFields = formData.formFields
      }

      // Add knowledge base configuration if enabled
      if (formData.knowledgeBase) {
        newGPT.knowledgeBase = {
          enabled: true,
          files: [],
          instructions: formData.instructions || "",
        }
      }

      // Save to localStorage
      const updatedConfigs = [...existingConfigs, newGPT]
      saveGPTConfigs(updatedConfigs)

      console.log("[v0] Successfully saved GPT:", newGPT.id)

      // Show success message
      toast({
        title: "Success!",
        description: `${formData.title} has been ${isDraft ? "saved as draft" : "created"} successfully`,
      })

      // Navigate back to admin page after a short delay
      setTimeout(() => {
        router.push("/admin")
      }, 1000)
    } catch (error) {
      console.error("[v0] Error saving GPT:", error)
      toast({
        title: "Error",
        description: "Failed to save GPT. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <Link href="/admin">
              <Button variant="outline" size="icon" className="border-gray-300 bg-transparent">
                <ArrowLeft size={20} />
              </Button>
            </Link>
            <div className="flex items-center space-x-3">
              <Image src="/logo.png" alt="Legacy Decks Academy" width={32} height={32} className="rounded" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Create New GPT</h1>
                <p className="text-sm text-gray-600">Build a new AI tool for the GPT Library</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => handleSave(true)} className="border-gray-300">
              Save as Draft
            </Button>
            <Button onClick={() => handleSave(false)} className="bg-lda-red hover:bg-lda-red-dark text-white">
              Create GPT
            </Button>
          </div>
        </div>
      </header>

      <main className="p-6">
        <div className="max-w-4xl mx-auto">
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-white border border-gray-200">
              <TabsTrigger value="basic" className="data-[state=active]:bg-lda-red data-[state=active]:text-white">
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="prompts" className="data-[state=active]:bg-lda-red data-[state=active]:text-white">
                Prompts & Instructions
              </TabsTrigger>
              <TabsTrigger
                value="form"
                className="data-[state=active]:bg-lda-red data-[state=active]:text-white"
                disabled={formData.type !== "form-based"}
              >
                Form Structure
              </TabsTrigger>
              <TabsTrigger value="knowledge" className="data-[state=active]:bg-lda-red data-[state=active]:text-white">
                Knowledge Base
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Card className="bg-white border border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900">Basic Information</CardTitle>
                    <CardDescription className="text-gray-600">Set up the basic details for your GPT</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="title" className="text-gray-700 font-medium">
                          GPT Title *
                        </Label>
                        <Input
                          id="title"
                          placeholder="e.g., Customer Journey Mapper"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className="border-gray-300 focus:border-lda-red focus:ring-lda-red"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category" className="text-gray-700 font-medium">
                          Business Category *
                        </Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => setFormData({ ...formData, category: value })}
                        >
                          <SelectTrigger className="border-gray-300 focus:border-lda-red focus:ring-lda-red">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-gray-700 font-medium">
                        Description *
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="Describe what this GPT does and how it helps users..."
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="border-gray-300 focus:border-lda-red focus:ring-lda-red"
                      />
                    </div>

                    <div className="space-y-4">
                      <Label className="text-gray-700 font-medium">GPT Type *</Label>
                      <RadioGroup
                        value={formData.type}
                        onValueChange={(value) => setFormData({ ...formData, type: value })}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {gptTypes.map((type) => (
                            <div
                              key={type.id}
                              className="flex items-center space-x-2 border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                            >
                              <RadioGroupItem value={type.id} id={type.id} className="border-gray-300" />
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <type.icon size={20} className="text-gray-600" />
                                  <Label htmlFor={type.id} className="font-medium text-gray-900">
                                    {type.title}
                                  </Label>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="icon" className="text-gray-700 font-medium">
                          Icon *
                        </Label>
                        <Select
                          value={formData.icon}
                          onValueChange={(value) => setFormData({ ...formData, icon: value })}
                        >
                          <SelectTrigger className="border-gray-300 focus:border-lda-red focus:ring-lda-red">
                            <SelectValue placeholder="Select icon" />
                          </SelectTrigger>
                          <SelectContent>
                            {icons.map((icon) => (
                              <SelectItem key={icon} value={icon}>
                                {icon}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="status" className="text-gray-700 font-medium">
                          Status
                        </Label>
                        <Select
                          value={formData.status}
                          onValueChange={(value) => setFormData({ ...formData, status: value })}
                        >
                          <SelectTrigger className="border-gray-300 focus:border-lda-red focus:ring-lda-red">
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
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="prompts" className="space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Card className="bg-white border border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900">System Prompt & Instructions</CardTitle>
                    <CardDescription className="text-gray-600">
                      Define how your GPT should behave and respond
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="systemPrompt" className="text-gray-700 font-medium">
                        System Prompt
                      </Label>
                      <Textarea
                        id="systemPrompt"
                        placeholder="You are a helpful AI assistant that..."
                        rows={8}
                        className="font-mono text-sm border-gray-300 focus:border-lda-red focus:ring-lda-red"
                        value={formData.systemPrompt}
                        onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                      />
                      <p className="text-sm text-gray-600">
                        This defines the core personality and behavior of your GPT
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instructions" className="text-gray-700 font-medium">
                        Additional Instructions
                      </Label>
                      <Textarea
                        id="instructions"
                        placeholder="Additional guidelines, examples, or specific instructions..."
                        rows={4}
                        value={formData.instructions}
                        onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                        className="border-gray-300 focus:border-lda-red focus:ring-lda-red"
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="form">
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">Form Structure</CardTitle>
                  <CardDescription className="text-gray-600">
                    Configure input fields that users will fill out before starting the conversation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Form Fields List */}
                  <div className="space-y-4">
                    {formData.formFields.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                        <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-sm font-medium text-gray-900 mb-2">No form fields yet</h3>
                        <p className="text-sm text-gray-500 mb-4">
                          Add fields to collect information from users before they start chatting
                        </p>
                        <Button onClick={addFormField} className="bg-lda-red hover:bg-lda-red-dark text-white">
                          <Plus className="mr-2 h-4 w-4" />
                          Add First Field
                        </Button>
                      </div>
                    ) : (
                      <>
                        {formData.formFields.map((field, index) => (
                          <Card key={field.id} className="border border-gray-200">
                            <CardContent className="pt-6">
                              <div className="space-y-4">
                                {/* Field Header */}
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center space-x-2">
                                    <GripVertical className="h-5 w-5 text-gray-400" />
                                    <span className="text-sm font-medium text-gray-700">Field {index + 1}</span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteFormField(field.id)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>

                                {/* Field Configuration */}
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
                                      onValueChange={(value: any) => updateFormField(field.id, { type: value })}
                                    >
                                      <SelectTrigger className="border-gray-300 focus:border-lda-red focus:ring-lda-red">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {fieldTypes.map((type) => (
                                          <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-gray-700 font-medium">Placeholder Text</Label>
                                  <Input
                                    placeholder="e.g., Enter your budget range..."
                                    value={field.placeholder}
                                    onChange={(e) => updateFormField(field.id, { placeholder: e.target.value })}
                                    className="border-gray-300 focus:border-lda-red focus:ring-lda-red"
                                  />
                                </div>

                                {/* Select Options */}
                                {field.type === "select" && (
                                  <div className="space-y-2">
                                    <Label className="text-gray-700 font-medium">Dropdown Options</Label>
                                    <div className="space-y-2">
                                      {field.options?.map((option, optionIndex) => (
                                        <div key={optionIndex} className="flex items-center space-x-2">
                                          <Input
                                            placeholder={`Option ${optionIndex + 1}`}
                                            value={option}
                                            onChange={(e) => updateSelectOption(field.id, optionIndex, e.target.value)}
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

                                <div className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id={`required-${field.id}`}
                                    checked={field.required}
                                    onChange={(e) => updateFormField(field.id, { required: e.target.checked })}
                                    className="rounded border-gray-300 text-lda-red focus:ring-lda-red"
                                  />
                                  <Label htmlFor={`required-${field.id}`} className="text-gray-700 font-medium">
                                    Required field
                                  </Label>
                                </div>
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

                  {/* Form Preview */}
                  {formData.formFields.length > 0 && (
                    <div className="mt-8">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4">Form Preview</h3>
                      <Card className="border border-gray-300 bg-gray-50">
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            {formData.formFields.map((field) => (
                              <div key={field.id} className="space-y-2">
                                <Label className="text-gray-700 font-medium">
                                  {field.label}
                                  {field.required && <span className="text-red-500 ml-1">*</span>}
                                </Label>
                                {field.type === "text" && (
                                  <Input
                                    placeholder={field.placeholder}
                                    disabled
                                    className="bg-white border-gray-300"
                                  />
                                )}
                                {field.type === "textarea" && (
                                  <Textarea
                                    placeholder={field.placeholder}
                                    disabled
                                    rows={3}
                                    className="bg-white border-gray-300"
                                  />
                                )}
                                {field.type === "select" && (
                                  <Select disabled>
                                    <SelectTrigger className="bg-white border-gray-300">
                                      <SelectValue placeholder={field.placeholder || "Select an option"} />
                                    </SelectTrigger>
                                  </Select>
                                )}
                                {field.type === "number" && (
                                  <Input
                                    type="number"
                                    placeholder={field.placeholder}
                                    disabled
                                    className="bg-white border-gray-300"
                                  />
                                )}
                                {field.type === "email" && (
                                  <Input
                                    type="email"
                                    placeholder={field.placeholder}
                                    disabled
                                    className="bg-white border-gray-300"
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Help Text */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <HelpCircle className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">How Form-Based GPTs Work</h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <ul className="list-disc list-inside space-y-1">
                            <li>Users fill out these fields before starting the conversation</li>
                            <li>Their responses are automatically included in the initial message to the GPT</li>
                            <li>This ensures the GPT has all necessary context from the start</li>
                            <li>Great for structured workflows like planning, assessments, or data collection</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="knowledge" className="space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Card className="bg-white border border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900">Knowledge Base</CardTitle>
                    <CardDescription className="text-gray-600">
                      Upload documents and resources for your GPT to reference
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="enableKB"
                          checked={formData.knowledgeBase ? true : false}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              knowledgeBase: e.target.checked ? "enabled" : "",
                            })
                          }
                          className="rounded border-gray-300 text-lda-red focus:ring-lda-red"
                        />
                        <Label htmlFor="enableKB" className="text-gray-700 font-medium">
                          Enable Knowledge Base for this GPT
                        </Label>
                      </div>

                      {formData.knowledgeBase && (
                        <>
                          <div className="space-y-2">
                            <Label className="text-gray-700 font-medium">Knowledge Base Instructions</Label>
                            <Textarea
                              placeholder="How should the AI use the uploaded files? Any specific guidelines..."
                              rows={3}
                              className="border-gray-300 focus:border-lda-red focus:ring-lda-red"
                            />
                            <p className="text-sm text-gray-600">
                              Provide instructions on how the AI should utilize the knowledge base files
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-gray-700 font-medium">Upload Documents</Label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-lda-red transition-colors">
                              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-900 mb-2">
                                  Click to upload or drag and drop
                                </p>
                                <p className="text-xs text-gray-500">PDF, TXT, MD, DOCX files up to 10MB each</p>
                              </div>
                              <input
                                type="file"
                                multiple
                                accept=".pdf,.txt,.md,.docx"
                                className="hidden"
                                id="file-upload"
                              />
                              <Label
                                htmlFor="file-upload"
                                className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                              >
                                Select Files
                              </Label>
                            </div>
                          </div>

                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex">
                              <div className="flex-shrink-0">
                                <HelpCircle className="h-5 w-5 text-blue-400" />
                              </div>
                              <div className="ml-3">
                                <h3 className="text-sm font-medium text-blue-800">Knowledge Base Tips</h3>
                                <div className="mt-2 text-sm text-blue-700">
                                  <ul className="list-disc list-inside space-y-1">
                                    <li>Upload relevant documentation, guides, or reference materials</li>
                                    <li>The AI will use these files to provide more accurate responses</li>
                                    <li>Ensure files contain clear, well-structured information</li>
                                    <li>You can upload multiple files for comprehensive knowledge coverage</li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
