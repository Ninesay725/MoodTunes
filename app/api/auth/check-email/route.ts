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

    console.log("DEBUG - Email being checked:", email)

    // Get all users since the filter doesn't seem to be working correctly
    const { data, error } = await supabase.auth.admin.listUsers()

    if (error) {
      console.error("Error checking email:", error)
      return NextResponse.json({ error: "Failed to check email" }, { status: 500 })
    }

    // Manually check for an exact email match
    const matchingUser = data?.users?.find((user) => user.email?.toLowerCase() === email.toLowerCase())

    // Debug logs
    console.log("DEBUG - Total users in database:", data?.users?.length || 0)
    console.log("DEBUG - Email being checked:", email)
    console.log("DEBUG - Email match found:", !!matchingUser)

    if (matchingUser) {
      console.log("DEBUG - Matching user:", {
        id: matchingUser.id,
        email: matchingUser.email,
        emailConfirmed: matchingUser.email_confirmed_at,
      })
    }

    // Only return true if we find an exact match
    return NextResponse.json({ exists: !!matchingUser })
  } catch (error) {
    console.error("Error in check-email API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

