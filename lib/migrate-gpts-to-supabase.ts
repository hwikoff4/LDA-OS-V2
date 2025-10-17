import { createBrowserClient } from "@supabase/ssr"
import { defaultGPTConfigs } from "./gpt-configs"

export async function migrateGPTsToSupabase() {
  try {
    console.log("[v0] Starting GPT migration to Supabase...")
    console.log(`[v0] Found ${defaultGPTConfigs.length} GPTs to migrate`)

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    // Check if GPTs already exist
    const { data: existingGPTs } = await supabase.from("gpts").select("id")

    if (existingGPTs && existingGPTs.length > 0) {
      console.log(`[v0] Found ${existingGPTs.length} existing GPTs in database`)

      // Find which GPTs are missing
      const existingIds = new Set(existingGPTs.map((g) => g.id))
      const missingGPTs = defaultGPTConfigs.filter((gpt) => !existingIds.has(gpt.id))

      if (missingGPTs.length === 0) {
        console.log("[v0] All GPTs already migrated")
        return {
          success: true,
          message: "All GPTs already exist in database",
          count: existingGPTs.length,
        }
      }

      console.log(`[v0] Found ${missingGPTs.length} GPTs to migrate`)
      // Continue with migrating only missing GPTs
      return await migrateBatch(supabase, missingGPTs, existingGPTs.length)
    }

    // Migrate all GPTs
    return await migrateBatch(supabase, defaultGPTConfigs, 0)
  } catch (error) {
    console.error("[v0] Migration failed:", error)
    return {
      success: false,
      message: "Migration failed",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

async function migrateBatch(supabase: any, gptsToMigrate: any[], existingCount: number) {
  let successCount = 0
  let errorCount = 0
  const errors: string[] = []

  for (const gpt of gptsToMigrate) {
    try {
      // Insert GPT
      const { error: gptError } = await supabase.from("gpts").insert({
        id: gpt.id,
        name: gpt.name,
        description: gpt.description,
        business_category: gpt.category,
        gpt_type: gpt.formFields && gpt.formFields.length > 0 ? "form-based" : "conversational",
        icon: gpt.icon,
        status: "active",
        system_prompt: gpt.systemPrompt,
        additional_instructions: gpt.knowledgeBase?.instructions,
        featured: gpt.featured,
        tags: gpt.tags,
      })

      if (gptError) {
        console.error(`[v0] ❌ Error creating GPT ${gpt.name}:`, gptError)
        errorCount++
        errors.push(`${gpt.name}: ${gptError.message}`)
        continue
      }

      // Insert example questions if provided
      if (gpt.exampleQuestions && gpt.exampleQuestions.length > 0) {
        const questions = gpt.exampleQuestions.map((q: any, index: number) => ({
          gpt_id: gpt.id,
          title: q.title,
          question: q.question,
          display_order: index,
        }))

        const { error: questionsError } = await supabase.from("gpt_example_questions").insert(questions)

        if (questionsError) {
          console.error(`[v0] ⚠️ Error creating example questions for ${gpt.name}:`, questionsError)
        }
      }

      // Insert form fields if provided
      if (gpt.formFields && gpt.formFields.length > 0) {
        const fields = gpt.formFields.map((f: any, index: number) => ({
          id: f.id,
          gpt_id: gpt.id,
          label: f.label,
          field_type: f.type,
          placeholder: f.placeholder,
          required: f.required,
          display_order: index,
        }))

        const { error: fieldsError } = await supabase.from("gpt_form_fields").insert(fields)

        if (fieldsError) {
          console.error(`[v0] ⚠️ Error creating form fields for ${gpt.name}:`, fieldsError)
        }

        // Insert field options
        for (const field of gpt.formFields) {
          if (field.options && field.options.length > 0) {
            const options = field.options.map((opt: string, index: number) => ({
              field_id: field.id,
              option_value: opt,
              display_order: index,
            }))

            const { error: optionsError } = await supabase.from("gpt_form_field_options").insert(options)

            if (optionsError) {
              console.error(`[v0] ⚠️ Error creating field options for ${gpt.name}:`, optionsError)
            }
          }
        }
      }

      successCount++
      console.log(`[v0] ✅ Migrated: ${gpt.name}`)

      // Add a small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100))
    } catch (error) {
      errorCount++
      const errorMsg = error instanceof Error ? error.message : "Unknown error"
      errors.push(`${gpt.name}: ${errorMsg}`)
      console.error(`[v0] ❌ Error migrating ${gpt.name}:`, error)
    }
  }

  console.log(`[v0] Migration complete: ${successCount} success, ${errorCount} errors`)

  if (errors.length > 0) {
    console.log("[v0] Errors:", errors)
  }

  return {
    success: errorCount === 0,
    message: `Migrated ${successCount} GPTs successfully${errorCount > 0 ? ` (${errorCount} errors)` : ""}`,
    count: existingCount + successCount,
    successCount,
    errorCount,
    errors: errors.length > 0 ? errors : undefined,
  }
}
