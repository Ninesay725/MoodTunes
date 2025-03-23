import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const AVATAR_BUCKET = "avatars"

export async function POST() {
  try {
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

    // Check if the bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      console.error("Error listing buckets:", listError)
      return NextResponse.json({ error: "Failed to list buckets" }, { status: 500 })
    }

    // If bucket doesn't exist, create it
    if (!buckets?.find((bucket) => bucket.name === AVATAR_BUCKET)) {
      const { error } = await supabase.storage.createBucket(AVATAR_BUCKET, {
        public: true,
        fileSizeLimit: 1024 * 1024 * 2, // 2MB
        allowedMimeTypes: ["image/png", "image/jpeg", "image/gif", "image/webp"],
      })

      if (error) {
        console.error("Error creating avatar bucket:", error)
        return NextResponse.json({ error: "Failed to create bucket" }, { status: 500 })
      }

      // Set up public bucket policy
      const { error: policyError } = await supabase.storage.from(AVATAR_BUCKET).createSignedUrl("dummy.txt", 1)

      if (policyError && !policyError.message.includes("not found")) {
        console.error("Error setting bucket policy:", policyError)
      }

      return NextResponse.json({ message: "Bucket created successfully" })
    }

    return NextResponse.json({ message: "Bucket already exists" })
  } catch (error) {
    console.error("Error in storage setup:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

