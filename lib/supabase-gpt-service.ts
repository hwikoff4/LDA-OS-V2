import { createBrowserClient } from "@supabase/ssr"

export interface GPTConfig {
  id: string
  name: string
  description: string
  business_category?: string
  gpt_type: "conversational" | "form-based"
  icon: string
  status: "draft" | "active" | "archived"
  system_prompt: string
  additional_instructions?: string
  featured: boolean
  tags: string[]
  created_at?: string
  updated_at?: string
  example_questions?: Array<{ title: string; question: string }>
  form_fields?: FormField[]
}

export interface FormField {
  id: string
  label: string
  field_type: "text" | "textarea" | "select" | "number" | "email"
  placeholder: string
  required: boolean
  options?: string[]
}

// Create Supabase client (singleton pattern)
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  }
  return supabaseClient
}

/**
 * Fetch all GPTs from Supabase
 */
export async function getGPTConfigs(): Promise<GPTConfig[]> {
  try {
    const supabase = getSupabaseClient()

    // Fetch GPTs
    const { data: gpts, error: gptsError } = await supabase
      .from("gpts")
      .select("*")
      .order("created_at", { ascending: false })

    if (gptsError) {
      console.error("[v0] Error fetching GPTs:", gptsError)
      return []
    }

    if (!gpts || gpts.length === 0) {
      console.log("[v0] No GPTs found in database")
      return []
    }

    // Fetch related data for each GPT
    const gptsWithRelations = await Promise.all(
      gpts.map(async (gpt) => {
        // Fetch example questions
        const { data: questions } = await supabase
          .from("gpt_example_questions")
          .select("title, question")
          .eq("gpt_id", gpt.id)
          .order("display_order", { ascending: true })

        // Fetch form fields
        const { data: fields } = await supabase
          .from("gpt_form_fields")
          .select("*")
          .eq("gpt_id", gpt.id)
          .order("display_order", { ascending: true })

        // Fetch options for each field
        const formFields = await Promise.all(
          (fields || []).map(async (field) => {
            const { data: options } = await supabase
              .from("gpt_form_field_options")
              .select("option_value")
              .eq("field_id", field.id)
              .order("display_order", { ascending: true })

            return {
              id: field.id,
              label: field.label,
              field_type: field.field_type as FormField["field_type"],
              placeholder: field.placeholder || "",
              required: field.required,
              options: options?.map((o) => o.option_value) || [],
            }
          }),
        )

        return {
          id: gpt.id,
          name: gpt.name,
          description: gpt.description,
          business_category: gpt.business_category,
          gpt_type: gpt.gpt_type,
          icon: gpt.icon,
          status: gpt.status,
          system_prompt: gpt.system_prompt,
          additional_instructions: gpt.additional_instructions,
          featured: gpt.featured,
          tags: gpt.tags || [],
          created_at: gpt.created_at,
          updated_at: gpt.updated_at,
          example_questions: questions || [],
          form_fields: formFields.length > 0 ? formFields : undefined,
        } as GPTConfig
      }),
    )

    console.log(`[v0] Fetched ${gptsWithRelations.length} GPTs from database`)
    return gptsWithRelations
  } catch (error) {
    console.error("[v0] Error in getGPTConfigs:", error)
    return []
  }
}

/**
 * Fetch a single GPT by ID
 */
export async function getGPTConfig(id: string): Promise<GPTConfig | null> {
  try {
    const configs = await getGPTConfigs()
    return configs.find((config) => config.id === id) || null
  } catch (error) {
    console.error(`[v0] Error fetching GPT ${id}:`, error)
    return null
  }
}

/**
 * Create a new GPT in Supabase
 */
export async function createGPTConfig(config: Omit<GPTConfig, "created_at" | "updated_at">): Promise<GPTConfig | null> {
  try {
    const supabase = getSupabaseClient()

    // Insert GPT
    const { data: gpt, error: gptError } = await supabase
      .from("gpts")
      .insert({
        id: config.id,
        name: config.name,
        description: config.description,
        business_category: config.business_category,
        gpt_type: config.gpt_type,
        icon: config.icon,
        status: config.status,
        system_prompt: config.system_prompt,
        additional_instructions: config.additional_instructions,
        featured: config.featured,
        tags: config.tags,
      })
      .select()
      .single()

    if (gptError) {
      console.error("[v0] Error creating GPT:", gptError)
      return null
    }

    // Insert example questions if provided
    if (config.example_questions && config.example_questions.length > 0) {
      const questions = config.example_questions.map((q, index) => ({
        gpt_id: config.id,
        title: q.title,
        question: q.question,
        display_order: index,
      }))

      const { error: questionsError } = await supabase.from("gpt_example_questions").insert(questions)

      if (questionsError) {
        console.error("[v0] Error creating example questions:", questionsError)
      }
    }

    // Insert form fields if provided
    if (config.form_fields && config.form_fields.length > 0) {
      const fields = config.form_fields.map((f, index) => ({
        id: f.id,
        gpt_id: config.id,
        label: f.label,
        field_type: f.field_type,
        placeholder: f.placeholder,
        required: f.required,
        display_order: index,
      }))

      const { error: fieldsError } = await supabase.from("gpt_form_fields").insert(fields)

      if (fieldsError) {
        console.error("[v0] Error creating form fields:", fieldsError)
      }

      // Insert field options
      for (const field of config.form_fields) {
        if (field.options && field.options.length > 0) {
          const options = field.options.map((opt, index) => ({
            field_id: field.id,
            option_value: opt,
            display_order: index,
          }))

          const { error: optionsError } = await supabase.from("gpt_form_field_options").insert(options)

          if (optionsError) {
            console.error("[v0] Error creating field options:", optionsError)
          }
        }
      }
    }

    console.log(`[v0] Created GPT: ${config.id}`)
    return await getGPTConfig(config.id)
  } catch (error) {
    console.error("[v0] Error in createGPTConfig:", error)
    return null
  }
}

/**
 * Update an existing GPT in Supabase
 */
export async function updateGPTConfig(id: string, updates: Partial<GPTConfig>): Promise<GPTConfig | null> {
  try {
    const supabase = getSupabaseClient()

    // Update GPT
    const { error: gptError } = await supabase
      .from("gpts")
      .update({
        name: updates.name,
        description: updates.description,
        business_category: updates.business_category,
        gpt_type: updates.gpt_type,
        icon: updates.icon,
        status: updates.status,
        system_prompt: updates.system_prompt,
        additional_instructions: updates.additional_instructions,
        featured: updates.featured,
        tags: updates.tags,
      })
      .eq("id", id)

    if (gptError) {
      console.error("[v0] Error updating GPT:", gptError)
      return null
    }

    // Update example questions if provided
    if (updates.example_questions) {
      // Delete existing questions
      await supabase.from("gpt_example_questions").delete().eq("gpt_id", id)

      // Insert new questions
      if (updates.example_questions.length > 0) {
        const questions = updates.example_questions.map((q, index) => ({
          gpt_id: id,
          title: q.title,
          question: q.question,
          display_order: index,
        }))

        await supabase.from("gpt_example_questions").insert(questions)
      }
    }

    // Update form fields if provided
    if (updates.form_fields) {
      // Delete existing fields and their options (cascade will handle options)
      await supabase.from("gpt_form_fields").delete().eq("gpt_id", id)

      // Insert new fields
      if (updates.form_fields.length > 0) {
        const fields = updates.form_fields.map((f, index) => ({
          id: f.id,
          gpt_id: id,
          label: f.label,
          field_type: f.field_type,
          placeholder: f.placeholder,
          required: f.required,
          display_order: index,
        }))

        await supabase.from("gpt_form_fields").insert(fields)

        // Insert field options
        for (const field of updates.form_fields) {
          if (field.options && field.options.length > 0) {
            const options = field.options.map((opt, index) => ({
              field_id: field.id,
              option_value: opt,
              display_order: index,
            }))

            await supabase.from("gpt_form_field_options").insert(options)
          }
        }
      }
    }

    console.log(`[v0] Updated GPT: ${id}`)
    return await getGPTConfig(id)
  } catch (error) {
    console.error("[v0] Error in updateGPTConfig:", error)
    return null
  }
}

/**
 * Delete a GPT from Supabase
 */
export async function deleteGPTConfig(id: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()

    const { error } = await supabase.from("gpts").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting GPT:", error)
      return false
    }

    console.log(`[v0] Deleted GPT: ${id}`)
    return true
  } catch (error) {
    console.error("[v0] Error in deleteGPTConfig:", error)
    return false
  }
}
