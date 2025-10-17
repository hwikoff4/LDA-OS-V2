import { NextResponse } from "next/server"
import { migrateGPTsToSupabase } from "@/lib/migrate-gpts-to-supabase"

export async function POST() {
  try {
    const result = await migrateGPTsToSupabase()
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Migration failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
