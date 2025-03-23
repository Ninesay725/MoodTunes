import { NextResponse } from "next/server"
import { getServerSupabaseClient } from "@/lib/supabase/server"

const AVATAR_BUCKET = "avatars"

export async function POST() {
  try {
    const supabase = getServerSupabaseClient()

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

      return NextResponse.json({ message: "Bucket created successfully" })
    }

    return NextResponse.json({ message: "Bucket already exists" })
  } catch (error) {
    console.error("Error in storage setup:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

