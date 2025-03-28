import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Create a Supabase client with service role key for admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )

    // Check if the email exists in auth.users
    const { data, error } = await supabase.auth.admin.listUsers({
      filter: {
        email: email,
      },
    })

    if (error) {
      console.error("Error checking email:", error)
      return NextResponse.json({ error: "Failed to check email" }, { status: 500 })
    }

    // If users array has any entries, the email exists
    const exists = data.users && data.users.length > 0

    return NextResponse.json({ exists })
  } catch (error) {
    console.error("Error in check-email API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

