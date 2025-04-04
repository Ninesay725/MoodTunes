"use server"

import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

// Create a Supabase client for server actions
const getServerActionClient = () => {
  const cookieStore = cookies()

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "", {
    auth: {
      persistSession: false,
    },
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })
}

export async function deleteUserAccount(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getServerActionClient()

    // 1. First, check if the user has any storage objects
    const { data: avatarBucketData, error: avatarBucketError } = await supabase.storage.from("avatars").list(userId)

    if (avatarBucketError && !avatarBucketError.message.includes("bucket not found")) {
      console.error("Error checking avatar bucket:", avatarBucketError)
      return { success: false, error: "Failed to check user storage" }
    }

    // 2. Check mood images bucket
    const { data: moodBucketData, error: moodBucketError } = await supabase.storage.from("mood-images").list(userId)

    if (moodBucketError && !moodBucketError.message.includes("bucket not found")) {
      console.error("Error checking mood images bucket:", moodBucketError)
      return { success: false, error: "Failed to check user storage" }
    }

    // 3. Delete all user's files from avatar bucket if they exist
    if (avatarBucketData && avatarBucketData.length > 0) {
      const avatarFilePaths = avatarBucketData.map((file) => `${userId}/${file.name}`)
      const { error: deleteAvatarError } = await supabase.storage.from("avatars").remove(avatarFilePaths)

      if (deleteAvatarError) {
        console.error("Error deleting avatar files:", deleteAvatarError)
        return { success: false, error: "Failed to delete user files" }
      }
    }

    // 4. Delete all user's files from mood-images bucket if they exist
    if (moodBucketData && moodBucketData.length > 0) {
      const moodFilePaths = moodBucketData.map((file) => `${userId}/${file.name}`)
      const { error: deleteMoodError } = await supabase.storage.from("mood-images").remove(moodFilePaths)

      if (deleteMoodError) {
        console.error("Error deleting mood image files:", deleteMoodError)
        return { success: false, error: "Failed to delete user files" }
      }
    }

    // 5. Delete user's mood entries
    const { error: deleteMoodEntriesError } = await supabase.from("mood_entries").delete().eq("user_id", userId)

    if (deleteMoodEntriesError) {
      console.error("Error deleting mood entries:", deleteMoodEntriesError)
      // Continue with deletion even if this fails, as it might be a cascade delete
    }

    // 6. Delete user's preferences
    const { error: deletePreferencesError } = await supabase.from("user_preferences").delete().eq("user_id", userId)

    if (deletePreferencesError) {
      console.error("Error deleting user preferences:", deletePreferencesError)
      // Continue with deletion even if this fails, as it might be a cascade delete
    }

    // 7. Delete user's profile
    const { error: deleteProfileError } = await supabase.from("profiles").delete().eq("id", userId)

    if (deleteProfileError) {
      console.error("Error deleting profile:", deleteProfileError)
      // Continue with deletion even if this fails, as it might be a cascade delete
    }

    // 8. Finally, delete the user from auth.users
    // Changed from soft delete (true) to hard delete (false)
    const { error: deleteUserError } = await supabase.auth.admin.deleteUser(userId, false)

    if (deleteUserError) {
      console.error("Error deleting user:", deleteUserError)
      return { success: false, error: deleteUserError.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Error in deleteUserAccount:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}

